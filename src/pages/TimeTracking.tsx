import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Play, Pause, Square, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Task {
  id: string;
  name: string;
  type: string;
  description: string;
  estimated_hours: number;
}

interface WorkSession {
  id: string;
  task_id: string;
  start_time: string;
  end_time: string | null;
  status: 'in_progress' | 'completed' | 'paused';
  notes: string;
  task: Task;
}

const TimeTracking = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [workSessions, setWorkSessions] = useState<WorkSession[]>([]);
  const [selectedTask, setSelectedTask] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [currentSession, setCurrentSession] = useState<WorkSession | null>(null);
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadTasks();
    loadWorkSessions();
  }, []);

  const loadTasks = async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('is_active', true);
    setTasks(data || []);
  };

  const loadWorkSessions = async () => {
    if (!profile) return;
    
    const { data } = await supabase
      .from('work_hours')
      .select(`
        *,
        task:tasks(*)
      `)
      .eq('employee_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(10);
    
    setWorkSessions(data || []);
    
    // Check for active session
    const activeSession = data?.find(session => session.status === 'in_progress');
    setCurrentSession(activeSession || null);
  };

  const startWork = async () => {
    if (!selectedTask || !profile) return;
    
    setLoading(true);
    
    // First get employee record
    const { data: employee } = await supabase
      .from('employees')
      .select('id')
      .eq('profile_id', profile.id)
      .single();
    
    if (!employee) {
      toast({
        title: "Fout",
        description: "Geen werknemersprofiel gevonden",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }
    
    const { data, error } = await supabase
      .from('work_hours')
      .insert({
        employee_id: employee.id,
        task_id: selectedTask,
        start_time: new Date().toISOString(),
        status: 'in_progress',
        notes: notes
      })
      .select(`
        *,
        task:tasks(*)
      `)
      .single();
    
    if (error) {
      toast({
        title: "Fout",
        description: "Kon werk niet starten",
        variant: "destructive"
      });
    } else {
      setCurrentSession(data);
      setNotes('');
      toast({
        title: "Werk gestart",
        description: `Timer gestart voor ${data.task.name}`
      });
      loadWorkSessions();
    }
    
    setLoading(false);
  };

  const stopWork = async () => {
    if (!currentSession) return;
    
    setLoading(true);
    
    const { error } = await supabase
      .from('work_hours')
      .update({
        end_time: new Date().toISOString(),
        status: 'completed'
      })
      .eq('id', currentSession.id);
    
    if (error) {
      toast({
        title: "Fout",
        description: "Kon werk niet stoppen",
        variant: "destructive"
      });
    } else {
      setCurrentSession(null);
      toast({
        title: "Werk gestopt",
        description: "Timer gestopt en uren geregistreerd"
      });
      loadWorkSessions();
    }
    
    setLoading(false);
  };

  const formatDuration = (startTime: string, endTime?: string | null) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}u ${minutes}m`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Uren Registreren</h1>
        <p className="text-muted-foreground">Start en stop je werktijd voor verschillende taken</p>
      </div>

      {/* Current Session */}
      {currentSession && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Actieve Sessie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{currentSession.task.name}</h3>
                <p className="text-sm text-muted-foreground">
                  Gestart: {new Date(currentSession.start_time).toLocaleTimeString()}
                </p>
                <p className="text-sm">
                  Looptijd: {formatDuration(currentSession.start_time)}
                </p>
              </div>
              <Button onClick={stopWork} disabled={loading} variant="destructive">
                <Square className="h-4 w-4 mr-2" />
                Stop
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Start New Session */}
      {!currentSession && (
        <Card>
          <CardHeader>
            <CardTitle>Nieuwe Sessie Starten</CardTitle>
            <CardDescription>Selecteer een taak en start je werktijd</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Taak</label>
              <Select value={selectedTask} onValueChange={setSelectedTask}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer een taak" />
                </SelectTrigger>
                <SelectContent>
                  {tasks.map(task => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.name} ({task.estimated_hours}u)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Notities (optioneel)</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Voeg notities toe..."
                rows={3}
              />
            </div>
            
            <Button 
              onClick={startWork} 
              disabled={!selectedTask || loading}
              className="w-full"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Werken
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Recente Sessies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workSessions.map(session => (
              <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">{session.task.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {new Date(session.start_time).toLocaleDateString()} - 
                    {formatDuration(session.start_time, session.end_time)}
                  </p>
                  {session.notes && (
                    <p className="text-sm text-muted-foreground mt-1">{session.notes}</p>
                  )}
                </div>
                <Badge variant={session.status === 'completed' ? 'default' : 'secondary'}>
                  {session.status === 'completed' ? 'Voltooid' : 'Bezig'}
                </Badge>
              </div>
            ))}
            
            {workSessions.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Nog geen sessies geregistreerd
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TimeTracking;