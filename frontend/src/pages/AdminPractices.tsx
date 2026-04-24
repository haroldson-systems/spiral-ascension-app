import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Practice, PracticeVariant, practices as fallbackPractices, practiceVariants as fallbackVariants } from '@/data/practices';
import { SpiralModule, spiralChapters as fallbackModules } from '@/data/spiralChapters';
import RichTextEditor from '@/components/RichTextEditor';
import { bulkUpsertPractices, bulkUpsertPracticeVariants, deletePractice, deletePracticeVariant, upsertPractice, upsertPracticeVariant } from '@/lib/practicesApi';
import { bulkUpsertSpiralModules, deleteSpiralModule, upsertSpiralModule } from '@/lib/spiralApi';
import { updateSiteSettings } from '@/lib/siteSettingsApi';
import { getStoredAdminToken, saveStoredAdminToken } from '@/lib/adminApi';
import { homeSectionHref } from '@/lib/homeNavigation';
import { extractSortDateFromTags, mergeTagsWithSortDate } from '@/lib/practiceVariantMeta';
import { usePracticesData } from '@/hooks/usePracticesData';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useSpiralData } from '@/hooks/useSpiralData';

const emptyPractice: Practice = {
  id: '',
  title: '',
  subtitle: '',
  category: '',
  duration: '',
  level: '',
  image: '',
  description: '',
};

const emptyVariant: PracticeVariant = {
  id: '',
  parentId: '',
  title: '',
  sortDate: '',
  category: '',
  duration: '',
  level: '',
  image: '',
  description: '',
  startLabel: 'Start',
  subtitle: '',
  body: '',
  kind: '',
  creator: '',
  externalUrl: '',
  tags: [],
  mediaUrl: '',
  audioUrl: '',
  mediaType: undefined,
  supportState: '',
  frequency: '',
  credit: '',
  sourceUrl: '',
};

const emptyModule: SpiralModule = {
  id: '',
  title: '',
  subtitle: '',
  image: '',
  image_feminine: '',
  image_masculine: '',
  description: '',
  tier: undefined,
};

const FIELD_NOTES_PRACTICE_ID = 'field-notes';
const AUTO_FIELD_NOTE_ID_PATTERN = /^fn-\d{4}-\d{2}(?:-[a-z0-9]+(?:-[a-z0-9]+)*)?$/;

function slugifyVariantIdSegment(value: string) {
  return value
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function buildNextFieldNoteId(
  variants: PracticeVariant[],
  title = '',
  selectedVariantId?: string | null
) {
  const currentYear = new Date().getFullYear();
  const highestSequence = variants.reduce((maxValue, variant) => {
    if (variant.parentId !== FIELD_NOTES_PRACTICE_ID || variant.id === selectedVariantId) {
      return maxValue;
    }

    const match = variant.id.match(/^fn-(\d{4})-(\d{2})(?:-|$)/);
    if (!match) return maxValue;

    const [, yearPart, sequencePart] = match;
    if (Number(yearPart) !== currentYear) return maxValue;

    return Math.max(maxValue, Number(sequencePart));
  }, 0);

  const nextSequence = String(highestSequence + 1).padStart(2, '0');
  const slug = slugifyVariantIdSegment(title);

  return slug
    ? `fn-${currentYear}-${nextSequence}-${slug}`
    : `fn-${currentYear}-${nextSequence}`;
}

function normalizePracticeForm(practice: Practice): Practice {
  return {
    ...practice,
    subtitle: practice.subtitle ?? '',
  };
}

function normalizeVariantForm(
  variant: PracticeVariant,
  fallbackParentId?: string | null
): PracticeVariant {
  return {
    ...variant,
    parentId: variant.parentId ?? fallbackParentId ?? '',
    sortDate: variant.sortDate ?? extractSortDateFromTags(variant.tags) ?? '',
    subtitle: variant.subtitle ?? '',
    body: variant.body ?? '',
    kind: variant.kind ?? '',
    creator: variant.creator ?? '',
    externalUrl: variant.externalUrl ?? '',
    tags: variant.tags ?? [],
    mediaUrl: variant.mediaUrl ?? '',
    audioUrl: variant.audioUrl ?? '',
    mediaType: variant.mediaType,
    supportState: variant.supportState ?? '',
    frequency: variant.frequency ?? '',
    credit: variant.credit ?? '',
    sourceUrl: variant.sourceUrl ?? '',
  };
}

function normalizeModuleForm(module: SpiralModule): SpiralModule {
  return {
    ...module,
    subtitle: module.subtitle ?? '',
    image: module.image ?? '',
    image_feminine: module.image_feminine ?? '',
    image_masculine: module.image_masculine ?? '',
  };
}

export default function AdminPractices() {
  const { practices, variants, refetchPractices, refetchVariants } = usePracticesData();
  const { modules, refetchModules } = useSpiralData();
  const siteSettingsQuery = useSiteSettings();
  const [selectedPracticeId, setSelectedPracticeId] = useState<string | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [practiceForm, setPracticeForm] = useState<Practice>(emptyPractice);
  const [variantForm, setVariantForm] = useState<PracticeVariant>(emptyVariant);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [moduleForm, setModuleForm] = useState<SpiralModule>(emptyModule);
  const [adminToken, setAdminToken] = useState('');
  const [isUpdatingMaintenance, setIsUpdatingMaintenance] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const previousPracticeIdRef = useRef<string | null>(null);
  const previousVariantIdRef = useRef<string | null>(null);
  const previousModuleIdRef = useRef<string | null>(null);

  useEffect(() => {
    try {
      const stored = getStoredAdminToken();
      if (stored) setAdminToken(stored);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (previousPracticeIdRef.current === selectedPracticeId) {
      return;
    }
    previousPracticeIdRef.current = selectedPracticeId;
    const practice = practices.find((item) => item.id === selectedPracticeId);
    if (practice) {
      setPracticeForm(normalizePracticeForm(practice));
    } else {
      setPracticeForm(emptyPractice);
    }
    previousVariantIdRef.current = null;
    setSelectedVariantId(null);
    setVariantForm({
      ...emptyVariant,
      parentId: selectedPracticeId ?? '',
      id:
        selectedPracticeId === FIELD_NOTES_PRACTICE_ID
          ? buildNextFieldNoteId(variants)
          : '',
    });
  }, [selectedPracticeId, practices]);

  useEffect(() => {
    if (previousVariantIdRef.current === selectedVariantId) {
      return;
    }
    previousVariantIdRef.current = selectedVariantId;
    const variant = variants.find((item) => item.id === selectedVariantId);
    if (variant) {
      setVariantForm(normalizeVariantForm(variant, selectedPracticeId));
    } else {
      setVariantForm({
        ...emptyVariant,
        parentId: selectedPracticeId ?? '',
        id:
          selectedPracticeId === FIELD_NOTES_PRACTICE_ID
            ? buildNextFieldNoteId(variants)
            : '',
      });
    }
  }, [selectedPracticeId, selectedVariantId, variants]);

  useEffect(() => {
    if (previousModuleIdRef.current === selectedModuleId) {
      return;
    }
    previousModuleIdRef.current = selectedModuleId;
    const module = modules.find((item) => item.id === selectedModuleId);
    if (module) {
      setModuleForm(normalizeModuleForm(module));
    } else {
      setModuleForm(emptyModule);
    }
  }, [selectedModuleId, modules]);

  const filteredVariants = useMemo(
    () => variants.filter((item) => item.parentId === selectedPracticeId),
    [variants, selectedPracticeId]
  );

  const handleSelectVariant = (variantId: string) => {
    const variant = variants.find((item) => item.id === variantId);
    setSelectedVariantId(variantId);
    if (!variant) return;
    setVariantForm(normalizeVariantForm(variant, selectedPracticeId));
  };

  const handleCreateVariant = () => {
    setSelectedVariantId(null);
    setVariantForm({
      ...emptyVariant,
      parentId: selectedPracticeId ?? '',
      id:
        selectedPracticeId === FIELD_NOTES_PRACTICE_ID
          ? buildNextFieldNoteId(variants)
          : '',
    });
  };

  const handleVariantTitleChange = (title: string) => {
    setVariantForm((current) => {
      const nextForm = { ...current, title };

      if (selectedVariantId || selectedPracticeId !== FIELD_NOTES_PRACTICE_ID) {
        return nextForm;
      }

      if (current.id && !AUTO_FIELD_NOTE_ID_PATTERN.test(current.id)) {
        return nextForm;
      }

      nextForm.id = buildNextFieldNoteId(variants, title);
      return nextForm;
    });
  };

  const setStatus = (message: string) => {
    setStatusMessage(message);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleSaveToken = () => {
    try {
      saveStoredAdminToken(adminToken.trim());
      setStatus('Admin token saved.');
    } catch {
      setStatus('Unable to store token in browser.');
    }
  };

  const handleToggleMaintenance = async () => {
    try {
      setIsUpdatingMaintenance(true);
      const nextValue = !siteSettingsQuery.data?.maintenanceMode;
      await updateSiteSettings({ maintenanceMode: nextValue });
      await siteSettingsQuery.refetch();
      setStatus(nextValue ? 'Maintenance mode enabled.' : 'Maintenance mode disabled.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to update maintenance mode.');
    } finally {
      setIsUpdatingMaintenance(false);
    }
  };

  const handleSavePractice = async () => {
    if (!practiceForm.id || !practiceForm.title) {
      setStatus('Practice requires an id and title.');
      return;
    }
    try {
      await upsertPractice({ ...practiceForm, subtitle: practiceForm.subtitle?.trim() || undefined });
      await refetchPractices();
      setSelectedPracticeId(practiceForm.id);
      setStatus('Practice saved.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to save practice.');
    }
  };

  const handleDeletePractice = async () => {
    if (!selectedPracticeId) return;
    try {
      await deletePractice(selectedPracticeId);
      await refetchPractices();
      await refetchVariants();
      setSelectedPracticeId(null);
      setStatus('Practice deleted.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to delete practice.');
    }
  };

  const handleSaveVariant = async () => {
    if (!selectedPracticeId) {
      setStatus('Select a parent practice first.');
      return;
    }
    if (!variantForm.id || !variantForm.title) {
      setStatus('Variant requires an id and title.');
      return;
    }
    const payload: PracticeVariant = {
      ...variantForm,
      parentId: selectedPracticeId,
      sortDate: variantForm.sortDate?.trim() || undefined,
      subtitle: variantForm.subtitle?.trim() || undefined,
      body: variantForm.body?.trim() || undefined,
      kind: variantForm.kind?.trim() || undefined,
      creator: variantForm.creator?.trim() || undefined,
      externalUrl: variantForm.externalUrl?.trim() || undefined,
      mediaUrl: variantForm.mediaUrl?.trim() || undefined,
      audioUrl: variantForm.audioUrl?.trim() || undefined,
      mediaType: variantForm.mediaType?.trim() || undefined,
      supportState: variantForm.supportState?.trim() || undefined,
      frequency: variantForm.frequency?.trim() || undefined,
      credit: variantForm.credit?.trim() || undefined,
      sourceUrl: variantForm.sourceUrl?.trim() || undefined,
      tags: mergeTagsWithSortDate(
        variantForm.tags && variantForm.tags.length > 0 ? variantForm.tags : undefined,
        variantForm.sortDate
      ),
    };
    try {
      await upsertPracticeVariant(payload);
      await refetchVariants();
      setSelectedVariantId(variantForm.id);
      setStatus('Variant saved.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to save variant.');
    }
  };

  const handleDeleteVariant = async () => {
    if (!selectedVariantId) return;
    try {
      await deletePracticeVariant(selectedVariantId);
      await refetchVariants();
      setSelectedVariantId(null);
      setVariantForm(emptyVariant);
      setStatus('Variant deleted.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to delete variant.');
    }
  };

  const handleSeedDefaults = async () => {
    try {
      await bulkUpsertPractices(fallbackPractices);
      await bulkUpsertPracticeVariants(fallbackVariants);
      await refetchPractices();
      await refetchVariants();
      await bulkUpsertSpiralModules(fallbackModules);
      await refetchModules();
      setStatus('Defaults seeded to the database.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to seed defaults.');
    }
  };

  const handleSaveModule = async () => {
    if (!moduleForm.id || !moduleForm.title) {
      setStatus('Module requires an id and title.');
      return;
    }
    const payload: SpiralModule = {
      ...moduleForm,
      subtitle: moduleForm.subtitle?.trim() || undefined,
      image: moduleForm.image?.trim() || undefined,
      image_feminine: moduleForm.image_feminine?.trim() || undefined,
      image_masculine: moduleForm.image_masculine?.trim() || undefined,
      tier: moduleForm.tier === undefined || moduleForm.tier === null ? undefined : Number(moduleForm.tier),
    };
    try {
      await upsertSpiralModule(payload);
      await refetchModules();
      setSelectedModuleId(moduleForm.id);
      setStatus('Spiral module saved.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to save spiral module.');
    }
  };

  const handleDeleteModule = async () => {
    if (!selectedModuleId) return;
    try {
      await deleteSpiralModule(selectedModuleId);
      await refetchModules();
      setSelectedModuleId(null);
      setStatus('Spiral module deleted.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to delete spiral module.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a0b2e] via-[#3a2563] to-[#1a0b2e] text-white">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Control Room</h1>
            <p className="text-purple-200">Edit practices, variants, and card copy without code changes.</p>
          </div>
          <Link
            to={homeSectionHref('spiral')}
            className="inline-flex items-center justify-center rounded-lg border border-purple-500/40 px-4 py-2 text-sm font-semibold text-purple-100 transition hover:bg-purple-900/50"
          >
            Back to App
          </Link>
        </header>

        <section className="rounded-2xl border border-purple-700/40 bg-purple-950/60 p-6 space-y-4">
          <h2 className="text-lg font-semibold">Admin Access</h2>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <input
              type="password"
              value={adminToken}
              onChange={(event) => setAdminToken(event.target.value)}
              placeholder="Admin token"
              className="flex-1 rounded-lg bg-purple-900/60 border border-purple-700/50 px-4 py-2 text-sm"
            />
            <button
              type="button"
              onClick={handleSaveToken}
              className="px-4 py-2 rounded-lg bg-amber-500 text-purple-950 font-semibold hover:bg-amber-400"
            >
              Save Token
            </button>
            <button
              type="button"
              onClick={handleSeedDefaults}
              className="px-4 py-2 rounded-lg bg-purple-700 text-white font-semibold hover:bg-purple-600"
            >
              Seed Defaults
            </button>
          </div>
          <div className="rounded-xl border border-purple-700/40 bg-purple-900/40 p-4 space-y-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <h3 className="font-semibold text-white">Site Access</h3>
                <p className="text-sm text-purple-200">
                  Public visitors will see the maintenance page while <code>/admin</code> stays open.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    siteSettingsQuery.data?.maintenanceMode
                      ? 'bg-amber-500/20 text-amber-200'
                      : 'bg-emerald-500/20 text-emerald-200'
                  }`}
                >
                  {siteSettingsQuery.data?.maintenanceMode ? 'Maintenance On' : 'Site Live'}
                </span>
                <button
                  type="button"
                  onClick={handleToggleMaintenance}
                  disabled={isUpdatingMaintenance || siteSettingsQuery.isPending}
                  className="px-4 py-2 rounded-lg bg-purple-700 text-white font-semibold hover:bg-purple-600 disabled:opacity-60"
                >
                  {isUpdatingMaintenance
                    ? 'Saving...'
                    : siteSettingsQuery.data?.maintenanceMode
                      ? 'Turn Off Maintenance'
                      : 'Turn On Maintenance'}
                </button>
              </div>
            </div>
            {siteSettingsQuery.isError && (
              <p className="text-sm text-amber-200">Site access controls are currently unavailable.</p>
            )}
          </div>
          {statusMessage && <p className="text-sm text-amber-200">{statusMessage}</p>}
        </section>

        <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="rounded-2xl border border-purple-700/40 bg-purple-950/60 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Practices</h2>
              <button
                type="button"
                onClick={() => setSelectedPracticeId(null)}
                className="text-xs text-purple-200 hover:text-white"
              >
                New
              </button>
            </div>
            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-2">
              {practices.map((practice) => (
                <button
                  key={practice.id}
                  type="button"
                  onClick={() => setSelectedPracticeId(practice.id)}
                  className={`w-full text-left rounded-lg border px-3 py-2 text-sm transition ${
                    selectedPracticeId === practice.id
                      ? 'border-amber-400/60 bg-purple-800/70'
                      : 'border-purple-700/40 bg-purple-900/40 hover:bg-purple-900/70'
                  }`}
                >
                  <div className="font-semibold">{practice.title}</div>
                  <div className="text-xs text-purple-300">{practice.id}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-purple-700/40 bg-purple-950/60 p-6 space-y-4">
              <h2 className="font-semibold">Practice Details</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm text-purple-200">
                  ID
                  <input
                    value={practiceForm.id}
                    onChange={(event) => setPracticeForm({ ...practiceForm, id: event.target.value })}
                    className="mt-1 w-full rounded-lg bg-purple-900/60 border border-purple-700/50 px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-sm text-purple-200">
                  Title
                  <input
                    value={practiceForm.title}
                    onChange={(event) => setPracticeForm({ ...practiceForm, title: event.target.value })}
                    className="mt-1 w-full rounded-lg bg-purple-900/60 border border-purple-700/50 px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-sm text-purple-200 md:col-span-2">
                  Subtitle
                  <input
                    value={practiceForm.subtitle ?? ''}
                    onChange={(event) => setPracticeForm({ ...practiceForm, subtitle: event.target.value })}
                    className="mt-1 w-full rounded-lg bg-purple-900/60 border border-purple-700/50 px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-sm text-purple-200">
                  Category
                  <input
                    value={practiceForm.category}
                    onChange={(event) => setPracticeForm({ ...practiceForm, category: event.target.value })}
                    className="mt-1 w-full rounded-lg bg-purple-900/60 border border-purple-700/50 px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-sm text-purple-200">
                  Duration
                  <input
                    value={practiceForm.duration}
                    onChange={(event) => setPracticeForm({ ...practiceForm, duration: event.target.value })}
                    className="mt-1 w-full rounded-lg bg-purple-900/60 border border-purple-700/50 px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-sm text-purple-200">
                  Level
                  <input
                    value={practiceForm.level}
                    onChange={(event) => setPracticeForm({ ...practiceForm, level: event.target.value })}
                    className="mt-1 w-full rounded-lg bg-purple-900/60 border border-purple-700/50 px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-sm text-purple-200 md:col-span-2">
                  Image URL
                  <input
                    value={practiceForm.image}
                    onChange={(event) => setPracticeForm({ ...practiceForm, image: event.target.value })}
                    className="mt-1 w-full rounded-lg bg-purple-900/60 border border-purple-700/50 px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-sm text-purple-200 md:col-span-2">
                  Description
                  <textarea
                    value={practiceForm.description}
                    onChange={(event) => setPracticeForm({ ...practiceForm, description: event.target.value })}
                    className="mt-1 w-full rounded-lg bg-purple-900/60 border border-purple-700/50 px-3 py-2 text-sm min-h-[90px]"
                  />
                </label>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleSavePractice}
                  className="px-4 py-2 rounded-lg bg-amber-500 text-purple-950 font-semibold hover:bg-amber-400"
                >
                  Save Practice
                </button>
                {selectedPracticeId && (
                  <button
                    type="button"
                    onClick={handleDeletePractice}
                    className="px-4 py-2 rounded-lg bg-red-500/80 text-white font-semibold hover:bg-red-500"
                  >
                    Delete Practice
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-purple-700/40 bg-purple-950/60 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Variants</h2>
                <button
                  type="button"
                  onClick={handleCreateVariant}
                  className="text-xs text-purple-200 hover:text-white"
                >
                  New
                </button>
              </div>

              {selectedPracticeId ? (
                <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {filteredVariants.map((variant) => (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => handleSelectVariant(variant.id)}
                        className={`w-full text-left rounded-lg border px-3 py-2 text-xs transition ${
                          selectedVariantId === variant.id
                            ? 'border-amber-400/60 bg-purple-800/70'
                            : 'border-purple-700/40 bg-purple-900/40 hover:bg-purple-900/70'
                        }`}
                      >
                        <div className="font-semibold">{variant.title}</div>
                        <div className="text-purple-300">{variant.id}</div>
                      </button>
                    ))}
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="text-sm text-purple-200">
                      ID
                      <input
                        value={variantForm.id}
                        onChange={(event) => setVariantForm({ ...variantForm, id: event.target.value })}
                        className="mt-1 w-full rounded-lg bg-purple-900/60 border border-purple-700/50 px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="text-sm text-purple-200">
                      Title
                      <input
                        value={variantForm.title}
                        onChange={(event) => handleVariantTitleChange(event.target.value)}
                        className="mt-1 w-full rounded-lg bg-purple-900/60 border border-purple-700/50 px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="text-sm text-purple-200">
                      Sort / Publish Date
                      <input
                        type="datetime-local"
                        value={variantForm.sortDate ?? ''}
                        onChange={(event) => setVariantForm({ ...variantForm, sortDate: event.target.value })}
                        className="mt-1 w-full rounded-lg bg-purple-900/60 border border-purple-700/50 px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="text-sm text-purple-200 md:col-span-2">
                      Subtitle
                      <input
                        value={variantForm.subtitle ?? ''}
                        onChange={(event) => setVariantForm({ ...variantForm, subtitle: event.target.value })}
                        className="mt-1 w-full rounded-lg bg-purple-900/60 border border-purple-700/50 px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="text-sm text-purple-200">
                      Category
                      <input
                        value={variantForm.category}
                        onChange={(event) => setVariantForm({ ...variantForm, category: event.target.value })}
                        className="mt-1 w-full rounded-lg bg-purple-900/60 border border-purple-700/50 px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="text-sm text-purple-200">
                      Duration
                      <input
                        value={variantForm.duration}
                        onChange={(event) => setVariantForm({ ...variantForm, duration: event.target.value })}
                        className="mt-1 w-full rounded-lg bg-purple-900/60 border border-purple-700/50 px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="text-sm text-purple-200">
                      Level
                      <input
                        value={variantForm.level}
                        onChange={(event) => setVariantForm({ ...variantForm, level: event.target.value })}
                        className="mt-1 w-full rounded-lg bg-purple-900/60 border border-purple-700/50 px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="text-sm text-purple-200">
                      Start Label
                      <input
                        value={variantForm.startLabel}
                        onChange={(event) => setVariantForm({ ...variantForm, startLabel: event.target.value })}
                        className="mt-1 w-full rounded-lg bg-purple-900/60 border border-purple-700/50 px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="text-sm text-purple-200">
                      Kind
                      <input
                        value={variantForm.kind ?? ''}
                        onChange={(event) => setVariantForm({ ...variantForm, kind: event.target.value })}
                        className="mt-1 w-full rounded-lg bg-purple-900/60 border border-purple-700/50 px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="text-sm text-purple-200">
                      Creator
                      <input
                        value={variantForm.creator ?? ''}
                        onChange={(event) => setVariantForm({ ...variantForm, creator: event.target.value })}
                        className="mt-1 w-full rounded-lg bg-purple-900/60 border border-purple-700/50 px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="text-sm text-purple-200">
                      Media Type
                      <input
                        value={variantForm.mediaType ?? ''}
                        onChange={(event) => setVariantForm({ ...variantForm, mediaType: event.target.value })}
                        placeholder="video or audio"
                        className="mt-1 w-full rounded-lg bg-purple-900/60 border border-purple-700/50 px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="text-sm text-purple-200">
                      Frequency
                      <input
                        value={variantForm.frequency ?? ''}
                        onChange={(event) => setVariantForm({ ...variantForm, frequency: event.target.value })}
                        className="mt-1 w-full rounded-lg bg-purple-900/60 border border-purple-700/50 px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="text-sm text-purple-200 md:col-span-2">
                      Support State
                      <input
                        value={variantForm.supportState ?? ''}
                        onChange={(event) => setVariantForm({ ...variantForm, supportState: event.target.value })}
                        className="mt-1 w-full rounded-lg bg-purple-900/60 border border-purple-700/50 px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="text-sm text-purple-200 md:col-span-2">
                      External URL
                      <input
                        value={variantForm.externalUrl ?? ''}
                        onChange={(event) => setVariantForm({ ...variantForm, externalUrl: event.target.value })}
                        className="mt-1 w-full rounded-lg bg-purple-900/60 border border-purple-700/50 px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="text-sm text-purple-200 md:col-span-2">
                      Credit
                      <input
                        value={variantForm.credit ?? ''}
                        onChange={(event) => setVariantForm({ ...variantForm, credit: event.target.value })}
                        className="mt-1 w-full rounded-lg bg-purple-900/60 border border-purple-700/50 px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="text-sm text-purple-200 md:col-span-2">
                      Source URL
                      <input
                        value={variantForm.sourceUrl ?? ''}
                        onChange={(event) => setVariantForm({ ...variantForm, sourceUrl: event.target.value })}
                        className="mt-1 w-full rounded-lg bg-purple-900/60 border border-purple-700/50 px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="text-sm text-purple-200 md:col-span-2">
                      Tags (comma-separated)
                      <input
                        value={(variantForm.tags ?? []).join(', ')}
                        onChange={(event) =>
                          setVariantForm({
                            ...variantForm,
                            tags: event.target.value
                              .split(',')
                              .map((tag) => tag.trim())
                              .filter(Boolean),
                          })
                        }
                        className="mt-1 w-full rounded-lg bg-purple-900/60 border border-purple-700/50 px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="text-sm text-purple-200 md:col-span-2">
                      Image URL
                      <input
                        value={variantForm.image}
                        onChange={(event) => setVariantForm({ ...variantForm, image: event.target.value })}
                        className="mt-1 w-full rounded-lg bg-purple-900/60 border border-purple-700/50 px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="text-sm text-purple-200 md:col-span-2">
                      Media URL
                      <input
                        value={variantForm.mediaUrl ?? ''}
                        onChange={(event) => setVariantForm({ ...variantForm, mediaUrl: event.target.value })}
                        className="mt-1 w-full rounded-lg bg-purple-900/60 border border-purple-700/50 px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="text-sm text-purple-200 md:col-span-2">
                      Audio URL
                      <input
                        value={variantForm.audioUrl ?? ''}
                        onChange={(event) => setVariantForm({ ...variantForm, audioUrl: event.target.value })}
                        className="mt-1 w-full rounded-lg bg-purple-900/60 border border-purple-700/50 px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="text-sm text-purple-200 md:col-span-2">
                      Description
                      <textarea
                        value={variantForm.description}
                        onChange={(event) => setVariantForm({ ...variantForm, description: event.target.value })}
                        className="mt-1 w-full rounded-lg bg-purple-900/60 border border-purple-700/50 px-3 py-2 text-sm min-h-[90px]"
                      />
                    </label>
                    <label className="text-sm text-purple-200 md:col-span-2">
                      Body / Long Content
                      <div className="mt-1 space-y-3">
                        <RichTextEditor
                          value={variantForm.body ?? ''}
                          onChange={(value) => setVariantForm({ ...variantForm, body: value })}
                          placeholder="Write visually here. Paste from Docs, add links, or insert image/video embeds."
                        />
                        <p className="text-xs text-purple-300">
                          Use the toolbar for headings, links, lists, images, and video. Media URL and Audio URL still control the dedicated media section below the entry.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-purple-300">Select a practice to manage variants.</p>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleSaveVariant}
                  className="px-4 py-2 rounded-lg bg-amber-500 text-purple-950 font-semibold hover:bg-amber-400"
                >
                  Save Variant
                </button>
                {selectedVariantId && (
                  <button
                    type="button"
                    onClick={handleDeleteVariant}
                    className="px-4 py-2 rounded-lg bg-red-500/80 text-white font-semibold hover:bg-red-500"
                  >
                    Delete Variant
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="rounded-2xl border border-purple-700/40 bg-purple-950/60 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Spiral Modules</h2>
              <button
                type="button"
                onClick={() => setSelectedModuleId(null)}
                className="text-xs text-purple-200 hover:text-white"
              >
                New
              </button>
            </div>
            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-2">
              {modules.map((module) => (
                <button
                  key={module.id}
                  type="button"
                  onClick={() => setSelectedModuleId(module.id)}
                  className={`w-full text-left rounded-lg border px-3 py-2 text-sm transition ${
                    selectedModuleId === module.id
                      ? 'border-amber-400/60 bg-purple-800/70'
                      : 'border-purple-700/40 bg-purple-900/40 hover:bg-purple-900/70'
                  }`}
                >
                  <div className="font-semibold">{module.title}</div>
                  <div className="text-xs text-purple-300">{module.id}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-purple-700/40 bg-purple-950/60 p-6 space-y-4">
            <h2 className="font-semibold">Spiral Module Details</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm text-purple-200">
                ID
                <input
                  value={moduleForm.id}
                  onChange={(event) => setModuleForm({ ...moduleForm, id: event.target.value })}
                  className="mt-1 w-full rounded-lg bg-purple-900/60 border border-purple-700/50 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm text-purple-200">
                Title
                <input
                  value={moduleForm.title}
                  onChange={(event) => setModuleForm({ ...moduleForm, title: event.target.value })}
                  className="mt-1 w-full rounded-lg bg-purple-900/60 border border-purple-700/50 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm text-purple-200 md:col-span-2">
                Subtitle
                <input
                  value={moduleForm.subtitle ?? ''}
                  onChange={(event) => setModuleForm({ ...moduleForm, subtitle: event.target.value })}
                  className="mt-1 w-full rounded-lg bg-purple-900/60 border border-purple-700/50 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm text-purple-200">
                Tier (optional)
                <input
                  value={moduleForm.tier ?? ''}
                  onChange={(event) =>
                    setModuleForm({
                      ...moduleForm,
                      tier: event.target.value === '' ? undefined : Number(event.target.value),
                    })
                  }
                  className="mt-1 w-full rounded-lg bg-purple-900/60 border border-purple-700/50 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm text-purple-200">
                Image URL
                <input
                  value={moduleForm.image ?? ''}
                  onChange={(event) => setModuleForm({ ...moduleForm, image: event.target.value })}
                  className="mt-1 w-full rounded-lg bg-purple-900/60 border border-purple-700/50 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm text-purple-200 md:col-span-2">
                Feminine Image URL
                <input
                  value={moduleForm.image_feminine ?? ''}
                  onChange={(event) => setModuleForm({ ...moduleForm, image_feminine: event.target.value })}
                  className="mt-1 w-full rounded-lg bg-purple-900/60 border border-purple-700/50 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm text-purple-200 md:col-span-2">
                Masculine Image URL
                <input
                  value={moduleForm.image_masculine ?? ''}
                  onChange={(event) => setModuleForm({ ...moduleForm, image_masculine: event.target.value })}
                  className="mt-1 w-full rounded-lg bg-purple-900/60 border border-purple-700/50 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm text-purple-200 md:col-span-2">
                Description
                <textarea
                  value={moduleForm.description}
                  onChange={(event) => setModuleForm({ ...moduleForm, description: event.target.value })}
                  className="mt-1 w-full rounded-lg bg-purple-900/60 border border-purple-700/50 px-3 py-2 text-sm min-h-[90px]"
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSaveModule}
                className="px-4 py-2 rounded-lg bg-amber-500 text-purple-950 font-semibold hover:bg-amber-400"
              >
                Save Module
              </button>
              {selectedModuleId && (
                <button
                  type="button"
                  onClick={handleDeleteModule}
                  className="px-4 py-2 rounded-lg bg-red-500/80 text-white font-semibold hover:bg-red-500"
                >
                  Delete Module
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
