import { useQuery } from '@tanstack/react-query';
import { fetchSiteSettings } from '@/lib/siteSettingsApi';

export function useSiteSettings() {
  return useQuery({
    queryKey: ['siteSettings'],
    queryFn: fetchSiteSettings,
    retry: 1,
    refetchOnWindowFocus: true,
    refetchInterval: 10000,
  });
}
