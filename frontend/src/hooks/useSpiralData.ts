import { useQuery } from '@tanstack/react-query';
import { fetchSpiralModules } from '@/lib/spiralApi';
import { spiralChapters as fallbackModules } from '@/data/spiralChapters';

export function useSpiralData() {
  const modulesQuery = useQuery({
    queryKey: ['spiralModules'],
    queryFn: async () => {
      try {
        const data = await fetchSpiralModules();
        return data?.length ? data : fallbackModules;
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
