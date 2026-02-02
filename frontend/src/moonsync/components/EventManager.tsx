import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { useEvents } from '../hooks/useQueries';
import EventList from './EventList';
import EventDialog from './EventDialog';

export default function EventManager() {
  const { data: events, isLoading } = useEvents();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <Card className="border-purple-700/50 bg-purple-900/60 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Your Events</CardTitle>
              <CardDescription className="text-purple-200">
                Rituals, reminders, and milestones aligned with lunar cycles
              </CardDescription>
            </div>
            <Button
              onClick={() => setIsDialogOpen(true)}
              size="sm"
              className="rounded-full bg-amber-500 hover:bg-amber-400 text-purple-950 font-medium"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
            </div>
          ) : events && events.length > 0 ? (
            <EventList events={events} />
          ) : (
            <div className="py-12 text-center space-y-4">
              <div className="text-6xl">📅</div>
              <div className="space-y-2">
                <p className="text-purple-200">No events yet</p>
                <p className="text-sm text-purple-300">
                  Create your first event to start tracking with lunar cycles
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <EventDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </>
  );
}
