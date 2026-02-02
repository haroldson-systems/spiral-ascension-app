import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Event, CycleType, isThirteenMonth } from '../backend';

const CYCLE_PREFERENCE_KEY = 'moonsync-cycle-preference';

function getStoredCyclePreference(): typeof CycleType.twelveMonth | typeof CycleType.thirteenMonth {
  if (typeof window === 'undefined') return CycleType.twelveMonth;
  try {
    const stored = localStorage.getItem(CYCLE_PREFERENCE_KEY);
    return stored === '13' ? CycleType.thirteenMonth : CycleType.twelveMonth;
  } catch {
    return CycleType.twelveMonth;
  }
}

function setStoredCyclePreference(cycleType: CycleType): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CYCLE_PREFERENCE_KEY, isThirteenMonth(cycleType) ? '13' : '12');
  } catch {
    /* ignore */
  }
}

function getDefaultPreference() {
  return { cycleType: getStoredCyclePreference() } as const;
}

export function useCyclePreference() {
  return useQuery({
    queryKey: ['moonsync', 'cyclePreference'],
    queryFn: async () => getDefaultPreference(),
    enabled: true,
  });
}

export function useSetCyclePreference() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (cycleType: CycleType) => {
      setStoredCyclePreference(cycleType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moonsync', 'cyclePreference'] });
    },
  });
}

export function useLunarPhases(cycleType?: CycleType) {
  return useQuery({
    queryKey: ['moonsync', 'lunarPhases', cycleType],
    queryFn: async () => {
      if (!cycleType) return [];
      return [];
    },
    enabled: !!cycleType,
    staleTime: 0,
  });
}

export function useEvents() {
  return useQuery({
    queryKey: ['moonsync', 'events'],
    queryFn: async (): Promise<Event[]> => [],
    enabled: true,
  });
}

export function useAddEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_event: Event) => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moonsync', 'events'] });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_event: Event) => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moonsync', 'events'] });
    },
  });
}

export function useRemoveEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_eventId: string) => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moonsync', 'events'] });
    },
  });
}

export function useRecalculateEvents() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moonsync', 'events'] });
      queryClient.invalidateQueries({ queryKey: ['moonsync', 'lunarPhases'] });
    },
  });
}
