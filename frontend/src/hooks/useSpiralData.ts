import { useQuery } from '@tanstack/react-query';
import { fetchSpiralModules } from '@/lib/spiralApi';
import { spiralChapters as fallbackModules } from '@/data/spiralChapters';

function isValidApiTier(t: unknown): t is number {
  return typeof t === 'number' && Number.isInteger(t) && t >= 1 && t <= 3;
}

function mergeModulesWithFallback(data: typeof fallbackModules) {
  const byId = new Map(data.map((module) => [module.id, module]));

  const merged = fallbackModules.map((fallbackModule) => {
    const apiModule = byId.get(fallbackModule.id);
    if (!apiModule) return fallbackModule;
    return {
      ...fallbackModule,
      ...apiModule,
      tier: isValidApiTier(apiModule.tier) ? apiModule.tier : fallbackModule.tier,
    };
  });

  for (const module of data) {
    if (!fallbackModules.some((fallback) => fallback.id === module.id)) {
      merged.push(module);
    }
  }

  return merged;
}

export function useSpiralData() {
  const modulesQuery = useQuery({
    queryKey: ['spiralModules'],
    queryFn: async () => {
      try {
        const data = await fetchSpiralModules();
        return data?.length ? mergeModulesWithFallback(data) : fallbackModules;
      } catch {
        return fallbackModules;
      }
    },
    initialData: fallbackModules,
  });

  return {
    modules: modulesQuery.data ?? fallbackModules,
    isLoading: modulesQuery.isLoading,
    refetchModules: modulesQuery.refetch,
  };
}
