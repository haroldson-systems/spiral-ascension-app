import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Event, EventType, LunarPhase } from '../backend';
import { useAddEvent, useUpdateEvent } from '../hooks/useQueries';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: Event;
  initialTitle?: string;
}

const phaseOptions = [
  { value: LunarPhase.newMoon, label: '🌑 New Moon' },
  { value: LunarPhase.waxingCrescent, label: '🌒 Waxing Crescent' },
  { value: LunarPhase.firstQuarter, label: '🌓 First Quarter' },
  { value: LunarPhase.waxingGibbous, label: '🌔 Waxing Gibbous' },
  { value: LunarPhase.fullMoon, label: '🌕 Full Moon' },
  { value: LunarPhase.waningGibbous, label: '🌖 Waning Gibbous' },
  { value: LunarPhase.lastQuarter, label: '🌗 Last Quarter' },
  { value: LunarPhase.waningCrescent, label: '🌘 Waning Crescent' },
];

const eventTypeOptions = [
  { value: EventType.ritual, label: 'Ritual' },
  { value: EventType.reminder, label: 'Reminder' },
  { value: EventType.milestone, label: 'Milestone' },
];

function phaseValue(p: typeof LunarPhase.newMoon): string {
  return JSON.stringify(p);
}
function eventTypeValue(e: typeof EventType.ritual): string {
  return JSON.stringify(e);
}

function newEventId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // RFC 4122 v4 fallback for older WebViews without crypto.randomUUID.
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export default function EventDialog({ open, onOpenChange, event, initialTitle }: EventDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState<typeof EventType.ritual>(EventType.reminder);
  const [associatedPhase, setAssociatedPhase] = useState<typeof LunarPhase.newMoon>(LunarPhase.newMoon);
  const [date, setDate] = useState('');

  const addMutation = useAddEvent();
  const updateMutation = useUpdateEvent();

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description);
      setEventType(event.eventType);
      setAssociatedPhase(event.associatedPhase);
      const eventDate = new Date(Number(event.date / BigInt(1_000_000)));
      setDate(eventDate.toISOString().split('T')[0]);
    } else {
      setTitle(initialTitle ?? '');
      setDescription('');
      setEventType(EventType.reminder);
      setAssociatedPhase(LunarPhase.newMoon);
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [event, open, initialTitle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    const eventDate = new Date(date);
    const dateNanos = BigInt(eventDate.getTime()) * BigInt(1_000_000);

    const eventData: Event = {
      // `moonsync_events.id` is a Postgres uuid column: a non-UUID id (the old
      // `event_<timestamp>_<random>` format) is rejected by the database and the
      // event is never saved.
      id: event?.id || newEventId(),
      title: title.trim(),
      description: description.trim(),
      eventType,
      associatedPhase,
      date: dateNanos,
    };

    try {
      if (event) {
        await updateMutation.mutateAsync(eventData);
        toast.success('Event updated successfully');
      } else {
        await addMutation.mutateAsync(eventData);
        toast.success('Event created successfully');
      }
      onOpenChange(false);
    } catch (error) {
      const detail = error instanceof Error && error.message ? error.message : undefined;
      toast.error(event ? 'Failed to update event' : 'Failed to create event', {
        description: detail,
      });
    }
  };

  const isLoading = addMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{event ? 'Edit Event' : 'Create New Event'}</DialogTitle>
            <DialogDescription>
              {event
                ? 'Update your event details below.'
                : 'Add a new ritual, reminder, or milestone aligned with lunar cycles.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter event title"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter event description (optional)"
                rows={3}
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="eventType">Type</Label>
                <Select
                  value={eventTypeValue(eventType)}
                  onValueChange={(value) => setEventType(JSON.parse(value) as typeof EventType.ritual)}
                  disabled={isLoading}
                >
                  <SelectTrigger id="eventType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypeOptions.map((option) => (
                      <SelectItem key={eventTypeValue(option.value)} value={eventTypeValue(option.value)}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phase">Associated Lunar Phase</Label>
              <Select
                value={phaseValue(associatedPhase)}
                onValueChange={(value) => setAssociatedPhase(JSON.parse(value) as typeof LunarPhase.newMoon)}
                disabled={isLoading}
              >
                <SelectTrigger id="phase">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {phaseOptions.map((option) => (
                    <SelectItem key={phaseValue(option.value)} value={phaseValue(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {event ? 'Update Event' : 'Create Event'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
