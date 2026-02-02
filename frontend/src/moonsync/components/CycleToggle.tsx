import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useCyclePreference, useSetCyclePreference, useRecalculateEvents } from '../hooks/useQueries';
import { CycleType } from '../backend';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function CycleToggle() {
  const { data: preference, isLoading } = useCyclePreference();
  const setCycleMutation = useSetCyclePreference();
  const recalculateMutation = useRecalculateEvents();

  const is13Month = preference?.cycleType === CycleType.thirteenMonth;
  const isProcessing = setCycleMutation.isPending || recalculateMutation.isPending;

  const handleToggle = async (checked: boolean) => {
    const newCycleType = checked ? CycleType.thirteenMonth : CycleType.twelveMonth;

    try {
      await setCycleMutation.mutateAsync(newCycleType);
      await recalculateMutation.mutateAsync();
      toast.success(
        `Switched to ${checked ? '13-month' : '12-month'} cycle`,
        { description: 'All lunar phases and events have been recalculated.' }
      );
    } catch {
      toast.error('Failed to switch cycle', { description: 'Please try again.' });
    }
  };

  if (isLoading) {
    return (
      <Card className="border-purple-700/50 bg-purple-900/60">
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-purple-700/50 bg-purple-900/60 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-white">
          <span>Lunar Cycle Type</span>
          {isProcessing && <Loader2 className="h-4 w-4 animate-spin text-amber-400" />}
        </CardTitle>
        <CardDescription className="text-purple-200">
          Toggle between 12-month and 13-month lunar cycles. All events and phases will be automatically recalculated.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between space-x-4 p-4 rounded-lg bg-background/50">
          <div className="flex-1">
            <Label htmlFor="cycle-toggle" className="text-base font-medium text-white cursor-pointer">
              {is13Month ? '13-Month Cycle' : '12-Month Cycle'}
            </Label>
            <p className="text-sm text-purple-300 mt-1">
              {is13Month
                ? 'Extended lunar year with 13 complete moon cycles'
                : 'Traditional lunar year with 12 complete moon cycles'}
            </p>
          </div>
          <Switch
            id="cycle-toggle"
            checked={is13Month}
            onCheckedChange={handleToggle}
            disabled={isProcessing}
            className="data-[state=checked]:bg-amber-500"
          />
        </div>
      </CardContent>
    </Card>
  );
}
