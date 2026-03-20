import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Event, CycleType, isThirteenMonth } from '../backend';
import { fetchCyclePreference, updateCyclePreference, fetchEvents, createEvent, updateEvent, removeEvent, fetchLunarPhases } from '../api';
import { lunarPhaseFromKey } from '../backend';

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
    queryFn: async () => {
      try {
        const cycle = await fetchCyclePreference();
        return { cycleType: cycle === '13' ? CycleType.thirteenMonth : CycleType.twelveMonth };
      } catch {
        return getDefaultPreference();
      }
    },
    enabled: true,
  });
}

export function useSetCyclePreference() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (cycleType: CycleType) => {
      try {
        await updateCyclePreference(isThirteenMonth(cycleType) ? '13' : '12');
      } finally {
        setStoredCyclePreference(cycleType);
      }
    },
    onMutate: async (cycleType) => {
      await queryClient.cancelQueries({ queryKey: ['moonsync', 'cyclePreference'] });
      const previous = queryClient.getQueryData<{ cycleType: CycleType }>(['moonsync', 'cyclePreference']);
      queryClient.setQueryData(['moonsync', 'cyclePreference'], { cycleType });
      return { previous };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moonsync', 'cyclePreference'] });
    },
    onError: (_error, _cycleType, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['moonsync', 'cyclePreference'], context.previous);
      }
    },
  });
}

export function useLunarPhases(cycleType?: CycleType) {
  return useQuery({
    queryKey: ['moonsync', 'lunarPhases', cycleType],
    queryFn: async () => {
      if (!cycleType) return [];
      const year = new Date().getFullYear();
      try {
        const phases = await fetchLunarPhases(year);
        return phases.map((phase) => ({
          phase: lunarPhaseFromKey(phase.phase),
          startDate: BigInt(phase.startAtMs) * BigInt(1_000_000),
          endDate: BigInt(phase.endAtMs) * BigInt(1_000_000),
        }));
      } catch {
        return [];
      }
    },
    enabled: !!cycleType,
    staleTime: 0,
  });
}

export function useEvents() {
  return useQuery({
    queryKey: ['moonsync', 'events'],
    queryFn: async (): Promise<Event[]> => {
      try {
        return await fetchEvents();
      } catch {
        return [];
      }
    },
    enabled: true,
  });
}

export function useAddEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (event: Event) => {
      await createEvent(event);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moonsync', 'events'] });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (event: Event) => {
      await updateEvent(event);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moonsync', 'events'] });
    },
  });
}

export function useRemoveEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (eventId: string) => {
      await removeEvent(eventId);
    },
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
