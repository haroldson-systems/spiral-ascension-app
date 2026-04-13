import { useQuery } from '@tanstack/react-query';
import { fetchPracticeVariants, fetchPractices } from '@/lib/practicesApi';
import {
  practices as fallbackPractices,
  practiceVariants as fallbackVariants,
  legacyPracticeImages,
} from '@/data/practices';

const curatedDirectChildrenParents = new Set([
  'breathwork-compendium',
  'resonance-gate',
]);

function mergeById<T extends { id: string }>(fallback: T[], api: T[]) {
  const fallbackIds = new Set(fallback.map((item) => item.id));
  const apiById = new Map(api.map((item) => [item.id, item]));

  const merged = fallback.map((item) => ({
    ...item,
    ...(apiById.get(item.id) ?? {}),
  }));

  for (const item of api) {
    if (fallbackIds.has(item.id)) continue;
    merged.push(item);
  }

  return merged;
}

function normalizePractices(practices: typeof fallbackPractices) {
  return practices.map((practice) => ({
    ...practice,
    image:
      practice.image.startsWith('/img/')
        ? legacyPracticeImages[practice.id] ?? practice.image
        : practice.image,
  }));
}

function normalizeVariants(
  variants: typeof fallbackVariants,
  practices: ReturnType<typeof normalizePractices>
) {
  const practiceImageMap = new Map(practices.map((practice) => [practice.id, practice.image]));
  const variantMap = new Map(variants.map((variant) => [variant.id, variant]));

  const resolveVariantImage = (variantId: string, seen = new Set<string>()): string => {
    const variant = variantMap.get(variantId);
    if (!variant) return '';
    if (!variant.image.startsWith('/img/')) return variant.image;
    if (seen.has(variantId)) return variant.image;

    seen.add(variantId);

    const parentVariant = variantMap.get(variant.parentId);
    if (parentVariant) {
      return resolveVariantImage(parentVariant.id, seen) || variant.image;
    }

    return practiceImageMap.get(variant.parentId) ?? variant.image;
  };

  return variants.map((variant) => ({
    ...variant,
    image: resolveVariantImage(variant.id),
  }));
}

export function usePracticesData() {
  const practicesQuery = useQuery({
    queryKey: ['practices'],
    queryFn: async () => {
      try {
        return await fetchPractices();
      } catch {
        return fallbackPractices;
      }
    },
    initialData: fallbackPractices,
  });

  const variantsQuery = useQuery({
    queryKey: ['practiceVariants'],
    queryFn: async () => {
      try {
        return await fetchPracticeVariants();
      } catch {
        return fallbackVariants;
      }
    },
    initialData: fallbackVariants,
  });

  const mergedPractices = mergeById(
    fallbackPractices,
    practicesQuery.data ?? fallbackPractices
  );
  const mergedVariants = mergeById(
    fallbackVariants,
    (variantsQuery.data ?? fallbackVariants).filter(
      (variant) =>
        fallbackVariants.some((fallback) => fallback.id === variant.id) ||
        !curatedDirectChildrenParents.has(variant.parentId)
    )
  );

  const practices = normalizePractices(mergedPractices);
  const variants = normalizeVariants(mergedVariants, practices);

  return {
    practices,
    variants,
    isLoading: practicesQuery.isLoading || variantsQuery.isLoading,
    refetchPractices: practicesQuery.refetch,
    refetchVariants: variantsQuery.refetch,
  };
}
