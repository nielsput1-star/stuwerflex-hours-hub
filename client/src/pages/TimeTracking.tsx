import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Play, Square, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface Task {
  id: string;
  name: string;
  description: string | null;
  type: string;
}

interface WorkSession {
  id: string;
  taskId: string;
  startTime: string;
  endTime: string | null;
  totalHours: number | null;
  notes: string | null;
  status: string;
  task?: { name: string };
}

const TimeTracking = () => {
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [breakMinutes, setBreakMinutes] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [currentSession, setCurrentSession] = useState<WorkSession | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
  });

  const { data: workSessions = [] } = useQuery<WorkSession[]>({
    queryKey: ['/api/work-hours'],
  });

  const startTrackingMutation = useMutation({
    mutationFn: async (data: { taskId: string; notes?: string }) => {
      return apiRequest('/api/work-hours', {
        method: 'POST',
        body: JSON.stringify({
          taskId: data.taskId,
          startTime: new Date().toISOString(),
          notes: data.notes || null,
          status: 'in_progress',
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/work-hours'] });
      setIsTracking(true);
      toast({
        title: "Time Tracking Started",
        description: "Successfully started tracking time for this task.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start time tracking.",
        variant: "destructive",
      });
    },
  });

  const startTracking = () => {
    if (!selectedTaskId) return;
    startTrackingMutation.mutate({ taskId: selectedTaskId, notes });
  };

  const stopTracking = () => {
    setIsTracking(false);
    setCurrentSession(null);
    setSelectedTaskId('');
    setNotes('');
    toast({
      title: "Time Tracking Stopped",
      description: "Work session completed successfully",
    });
  };

  const formatDuration = (start: string, end?: string | null) => {
    const startTime = new Date(start);
    const endTime = end ? new Date(end) : new Date();
    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    return `${duration.toFixed(2)} uur`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary mb-2">Uren Registreren</h1>
        <p className="text-muted-foreground">Registreer je werktijd voor verschillende taken</p>
      </div>

      {/* Current Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {isTracking ? 'Actieve Tijdregistratie' : 'Nieuwe Tijdregistratie'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isTracking && currentSession ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <div>
                  <p className="font-medium">Timer loopt</p>
                  <p className="text-sm text-muted-foreground">
                    Gestart: {new Date(currentSession.start_time).toLocaleTimeString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Duur: {formatDuration(currentSession.start_time)}
                  </p>
                </div>
              </div>
              <Button onClick={stopTracking} variant="destructive" className="w-full">
                <Square className="h-4 w-4 mr-2" />
                Stop Tijdregistratie
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="task">Taak</Label>
                <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer een taak" />
                  </SelectTrigger>
                  <SelectContent>
                    {tasks.map((task) => (
                      <SelectItem key={task.id} value={task.id}>
                        {task.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notities (optioneel)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Extra informatie over het werk..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="break">Pauze tijd (minuten)</Label>
                <Input
                  id="break"
                  type="number"
                  value={breakMinutes}
                  onChange={(e) => setBreakMinutes(Number(e.target.value))}
                  min="0"
                />
              </div>

              <Button 
                onClick={startTracking} 
                disabled={!selectedTaskId}
                className="w-full"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Tijdregistratie
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Recente Registraties</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workSessions.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Nog geen tijdregistraties
              </p>
            ) : (
              workSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">{session.tasks.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(session.start_time).toLocaleDateString()} - {new Date(session.start_time).toLocaleTimeString()}
                    </p>
                    {session.notes && (
                      <p className="text-sm text-muted-foreground italic">{session.notes}</p>
                    )}
                  </div>
                  <div className="text-right space-y-1">
                    <Badge variant={session.status === 'completed' ? 'default' : session.status === 'approved' ? 'secondary' : 'outline'}>
                      {session.status === 'completed' ? 'Voltooid' : 
                       session.status === 'approved' ? 'Goedgekeurd' : 
                       session.status === 'in_progress' ? 'Bezig' : 'Wachtend'}
                    </Badge>
                    <p className="text-sm font-medium">
                      {session.total_hours ? `${session.total_hours.toFixed(2)} uur` : formatDuration(session.start_time, session.end_time)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TimeTracking;