import { Event, EventType, LunarPhase } from '../backend';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Calendar } from 'lucide-react';
import { useRemoveEvent } from '../hooks/useQueries';
import { toast } from 'sonner';
import { useState } from 'react';
import EventDialog from './EventDialog';
import { ScrollArea } from '@/components/ui/scroll-area';

const eventTypeColors: Record<string, string> = {
  [JSON.stringify(EventType.ritual)]: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
  [JSON.stringify(EventType.reminder)]: 'bg-purple-500/30 text-purple-200 border-purple-400/40',
  [JSON.stringify(EventType.milestone)]: 'bg-amber-600/20 text-amber-400 border-amber-500/40',
};

const eventTypeLabels: Record<string, string> = {
  [JSON.stringify(EventType.ritual)]: 'Ritual',
  [JSON.stringify(EventType.reminder)]: 'Reminder',
  [JSON.stringify(EventType.milestone)]: 'Milestone',
};

const phaseEmojis: Record<string, string> = {
  [JSON.stringify(LunarPhase.newMoon)]: '🌑',
  [JSON.stringify(LunarPhase.waxingCrescent)]: '🌒',
  [JSON.stringify(LunarPhase.firstQuarter)]: '🌓',
  [JSON.stringify(LunarPhase.waxingGibbous)]: '🌔',
  [JSON.stringify(LunarPhase.fullMoon)]: '🌕',
  [JSON.stringify(LunarPhase.waningGibbous)]: '🌖',
  [JSON.stringify(LunarPhase.lastQuarter)]: '🌗',
  [JSON.stringify(LunarPhase.waningCrescent)]: '🌘',
};

const phaseNames: Record<string, string> = {
  [JSON.stringify(LunarPhase.newMoon)]: 'New Moon',
  [JSON.stringify(LunarPhase.waxingCrescent)]: 'Waxing Crescent',
  [JSON.stringify(LunarPhase.firstQuarter)]: 'First Quarter',
  [JSON.stringify(LunarPhase.waxingGibbous)]: 'Waxing Gibbous',
  [JSON.stringify(LunarPhase.fullMoon)]: 'Full Moon',
  [JSON.stringify(LunarPhase.waningGibbous)]: 'Waning Gibbous',
  [JSON.stringify(LunarPhase.lastQuarter)]: 'Last Quarter',
  [JSON.stringify(LunarPhase.waningCrescent)]: 'Waning Crescent',
};

interface EventListProps {
  events: Event[];
}

export default function EventList({ events }: EventListProps) {
  const removeMutation = useRemoveEvent();
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  const handleDelete = async (eventId: string) => {
    try {
      await removeMutation.mutateAsync(eventId);
      toast.success('Event deleted successfully');
    } catch {
      toast.error('Failed to delete event');
    }
  };

  return (
    <>
      <ScrollArea className="h-[500px] pr-4">
        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="p-4 rounded-lg border border-purple-700/40 bg-[#14002b]/40 hover:bg-[#14002b]/60 transition-colors space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-semibold text-white">{event.title}</h4>
                    <Badge variant="outline" className={eventTypeColors[JSON.stringify(event.eventType)] ?? ''}>
                      {eventTypeLabels[JSON.stringify(event.eventType)] ?? 'Event'}
                    </Badge>
                  </div>
                  {event.description && (
                    <p className="text-sm text-purple-200">{event.description}</p>
                  )}
                </div>
                <div className="flex items-center space-x-1 ml-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingEvent(event)}
                    className="h-8 w-8 text-purple-200 hover:text-amber-400 hover:bg-purple-700/50"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(event.id)}
                    disabled={removeMutation.isPending}
                    className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2 text-purple-300">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(Number(event.date / BigInt(1_000_000))).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xl">{phaseEmojis[JSON.stringify(event.associatedPhase)] ?? '🌑'}</span>
                  <span className="text-xs text-purple-300">
                    {phaseNames[JSON.stringify(event.associatedPhase)] ?? ''}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {editingEvent && (
        <EventDialog
          open={!!editingEvent}
          onOpenChange={(open) => !open && setEditingEvent(null)}
          event={editingEvent}
        />
      )}
    </>
  );
}
