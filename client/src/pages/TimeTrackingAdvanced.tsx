import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Clock, Play, Square, Pause, Calendar as CalendarIcon, Timer, BarChart3, Target, Coffee, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, isToday, differenceInMinutes, addMinutes } from 'date-fns';
import { nl } from 'date-fns/locale';
import type { Task, WorkHour, TimeSession, Project } from '@shared/schema';

interface TimerState {
  isRunning: boolean;
  startTime: Date | null;
  elapsedTime: number;
  taskId: string | null;
  sessionId: string | null;
  isPaused: boolean;
  pausedTime: number;
  breakMinutes: number;
}

interface WeekSummary {
  totalHours: number;
  overtimeHours: number;
  tasksCompleted: number;
  avgHoursPerDay: number;
}

const TimeTrackingAdvanced = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [timer, setTimer] = useState<TimerState>({
    isRunning: false,
    startTime: null,
    elapsedTime: 0,
    taskId: null,
    sessionId: null,
    isPaused: false,
    pausedTime: 0,
    breakMinutes: 0,
  });
  const [notes, setNotes] = useState('');
  const [quickNotes, setQuickNotes] = useState('');
  const [breakDuration, setBreakDuration] = useState(15);
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Real-time timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (timer.isRunning && !timer.isPaused && timer.startTime) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = differenceInMinutes(now, timer.startTime!) + timer.elapsedTime;
        setTimer(prev => ({ ...prev, elapsedTime: elapsed }));
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer.isRunning, timer.isPaused, timer.startTime, timer.elapsedTime]);

  // Data fetching
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  const { data: activeSessions = [] } = useQuery<TimeSession[]>({
    queryKey: ['/api/time-sessions', 'active'],
  });

  const { data: weeklyHours = [] } = useQuery<WorkHour[]>({
    queryKey: ['/api/work-hours', 'weekly', format(selectedWeek, 'yyyy-MM-dd')],
  });

  const { data: todayAttendance } = useQuery({
    queryKey: ['/api/attendance', 'today'],
  });

  // Mutations
  const startSessionMutation = useMutation({
    mutationFn: async (data: { taskId: string; notes?: string }) => {
      return apiRequest('/api/time-sessions', {
        method: 'POST',
        body: JSON.stringify({
          taskId: data.taskId,
          startTime: new Date().toISOString(),
          notes: data.notes,
          isActive: true,
        }),
      });
    },
    onSuccess: (session) => {
      setTimer({
        isRunning: true,
        startTime: new Date(),
        elapsedTime: 0,
        taskId: session.taskId,
        sessionId: session.id,
        isPaused: false,
        pausedTime: 0,
        breakMinutes: 0,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/time-sessions'] });
      toast({
        title: "Timer Gestart",
        description: "Tijdregistratie is actief",
      });
    },
  });

  const stopSessionMutation = useMutation({
    mutationFn: async () => {
      if (!timer.sessionId) return;
      
      const totalMinutes = timer.elapsedTime + timer.pausedTime;
      const totalHours = totalMinutes / 60;
      
      return apiRequest(`/api/time-sessions/${timer.sessionId}/stop`, {
        method: 'POST',
        body: JSON.stringify({
          endTime: new Date().toISOString(),
          totalHours: totalHours.toFixed(2),
          notes: notes,
          breakTimeMinutes: timer.breakMinutes,
        }),
      });
    },
    onSuccess: () => {
      const totalHours = (timer.elapsedTime + timer.pausedTime) / 60;
      setTimer({
        isRunning: false,
        startTime: null,
        elapsedTime: 0,
        taskId: null,
        sessionId: null,
        isPaused: false,
        pausedTime: 0,
        breakMinutes: 0,
      });
      setNotes('');
      queryClient.invalidateQueries({ queryKey: ['/api/time-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/work-hours'] });
      toast({
        title: "Timer Gestopt",
        description: `${totalHours.toFixed(2)} uur geregistreerd`,
      });
    },
  });

  const pauseSession = () => {
    if (timer.isRunning && !timer.isPaused) {
      setTimer(prev => ({
        ...prev,
        isPaused: true,
        pausedTime: prev.pausedTime + prev.elapsedTime,
        elapsedTime: 0,
      }));
      toast({
        title: "Timer Gepauzeerd",
        description: "Je kunt de timer weer hervatten",
      });
    }
  };

  const resumeSession = () => {
    if (timer.isPaused) {
      setTimer(prev => ({
        ...prev,
        isPaused: false,
        startTime: new Date(),
      }));
      toast({
        title: "Timer Hervat",
        description: "Tijdregistratie loopt weer",
      });
    }
  };

  const startBreak = () => {
    const breakStart = new Date();
    setTimer(prev => ({ ...prev, breakMinutes: prev.breakMinutes + breakDuration }));
    
    toast({
      title: "Pauze Gestart",
      description: `${breakDuration} minuten pauze ingepland`,
    });
  };

  // Week navigation
  const previousWeek = () => setSelectedWeek(subWeeks(selectedWeek, 1));
  const nextWeek = () => setSelectedWeek(addWeeks(selectedWeek, 1));
  const currentWeek = () => setSelectedWeek(new Date());

  // Calculate weekly summary
  const weekSummary: WeekSummary = {
    totalHours: weeklyHours.reduce((total, hour) => total + (parseFloat(hour.totalHours || '0')), 0),
    overtimeHours: Math.max(0, weeklyHours.reduce((total, hour) => total + (parseFloat(hour.totalHours || '0')), 0) - 40),
    tasksCompleted: weeklyHours.filter(hour => hour.status === 'completed').length,
    avgHoursPerDay: weeklyHours.reduce((total, hour) => total + (parseFloat(hour.totalHours || '0')), 0) / 7,
  };

  // Format time display
  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const getCurrentTaskName = () => {
    if (!timer.taskId) return '';
    const task = tasks.find(t => t.id === timer.taskId);
    return task?.name || '';
  };

  return (
    <div className="space-y-6" data-testid="time-tracking-advanced">
      <div>
        <h1 className="text-3xl font-bold text-primary mb-2" data-testid="page-title">
          Geavanceerde Tijdregistratie
        </h1>
        <p className="text-muted-foreground">Complete tijdregistratie met real-time tracking, pauzes en rapportage</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Timer Section */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5" />
              {timer.isRunning ? 'Actieve Timer' : 'Timer Starten'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {timer.isRunning ? (
              <div className="space-y-4">
                {/* Active timer display */}
                <div className="text-center p-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg">
                  <div className="text-4xl font-mono font-bold text-green-600 dark:text-green-400 mb-2" data-testid="timer-display">
                    {formatTime(timer.elapsedTime + timer.pausedTime)}
                  </div>
                  <div className="text-lg font-medium text-gray-700 dark:text-gray-300" data-testid="current-task">
                    {getCurrentTaskName()}
                  </div>
                  {timer.isPaused && (
                    <Badge variant="secondary" className="mt-2">
                      <Pause className="h-3 w-3 mr-1" />
                      Gepauzeerd
                    </Badge>
                  )}
                  {timer.breakMinutes > 0 && (
                    <div className="text-sm text-muted-foreground mt-2">
                      Pauzetijd: {timer.breakMinutes} minuten
                    </div>
                  )}
                </div>

                {/* Timer controls */}
                <div className="flex justify-center gap-3">
                  {timer.isPaused ? (
                    <Button onClick={resumeSession} className="bg-green-600 hover:bg-green-700" data-testid="button-resume">
                      <Play className="h-4 w-4 mr-2" />
                      Hervatten
                    </Button>
                  ) : (
                    <Button onClick={pauseSession} variant="outline" data-testid="button-pause">
                      <Pause className="h-4 w-4 mr-2" />
                      Pauzeren
                    </Button>
                  )}
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" data-testid="button-break">
                        <Coffee className="h-4 w-4 mr-2" />
                        Pauze
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Pauze Nemen</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="break-duration">Pauze duur (minuten)</Label>
                          <Input
                            id="break-duration"
                            type="number"
                            value={breakDuration}
                            onChange={(e) => setBreakDuration(parseInt(e.target.value))}
                            min="5"
                            max="60"
                          />
                        </div>
                        <Button onClick={startBreak} className="w-full" data-testid="button-start-break">
                          Pauze Starten
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button 
                    onClick={() => stopSessionMutation.mutate()} 
                    variant="destructive"
                    disabled={stopSessionMutation.isPending}
                    data-testid="button-stop"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Stoppen
                  </Button>
                </div>

                {/* Quick notes */}
                <div className="space-y-2">
                  <Label htmlFor="quick-notes">Snelle notities</Label>
                  <Textarea
                    id="quick-notes"
                    placeholder="Voeg snel notities toe tijdens het werken..."
                    value={quickNotes}
                    onChange={(e) => setQuickNotes(e.target.value)}
                    data-testid="input-quick-notes"
                  />
                </div>

                {/* Final notes for when stopping */}
                <div className="space-y-2">
                  <Label htmlFor="final-notes">Eindnotities</Label>
                  <Textarea
                    id="final-notes"
                    placeholder="Voeg eindnotities toe voor deze sessie..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    data-testid="input-final-notes"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Start new timer */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="task-select">Selecteer Taak</Label>
                    <Select onValueChange={(value) => setTimer(prev => ({ ...prev, taskId: value }))}>
                      <SelectTrigger data-testid="select-task">
                        <SelectValue placeholder="Kies een taak om te tracken..." />
                      </SelectTrigger>
                      <SelectContent>
                        {tasks.map((task) => (
                          <SelectItem key={task.id} value={task.id}>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {task.type}
                              </Badge>
                              {task.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="start-notes">Startnotities (optioneel)</Label>
                    <Textarea
                      id="start-notes"
                      placeholder="Beschrijf wat je gaat doen..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      data-testid="input-start-notes"
                    />
                  </div>

                  <Button 
                    onClick={() => {
                      if (timer.taskId) {
                        startSessionMutation.mutate({ taskId: timer.taskId, notes });
                      }
                    }}
                    disabled={!timer.taskId || startSessionMutation.isPending}
                    className="w-full bg-green-600 hover:bg-green-700"
                    data-testid="button-start-timer"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Timer Starten
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Summary & Quick Stats */}
        <div className="space-y-6">
          {/* Today's attendance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Vandaag
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Ingeklokt om:</span>
                  <span className="font-mono">
                    {todayAttendance?.clockIn ? format(new Date(todayAttendance.clockIn), 'HH:mm') : '--:--'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Uitkloktijd:</span>
                  <span className="font-mono">
                    {todayAttendance?.clockOut ? format(new Date(todayAttendance.clockOut), 'HH:mm') : '--:--'}
                  </span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Totaal:</span>
                  <span className="font-mono">
                    {todayAttendance?.totalHours ? `${parseFloat(todayAttendance.totalHours).toFixed(2)}h` : '0.00h'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active sessions */}
          {activeSessions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  Actieve Sessies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {activeSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                      <div className="text-sm">
                        {tasks.find(t => t.id === session.taskId)?.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(session.startTime), 'HH:mm')}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Weekly Overview */}
      <Tabs defaultValue="week" className="space-y-4">
        <TabsList>
          <TabsTrigger value="week" data-testid="tab-week">Week Overzicht</TabsTrigger>
          <TabsTrigger value="reports" data-testid="tab-reports">Rapporten</TabsTrigger>
          <TabsTrigger value="settings" data-testid="tab-settings">Instellingen</TabsTrigger>
        </TabsList>

        <TabsContent value="week" className="space-y-4">
          {/* Week navigation */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Week van {format(startOfWeek(selectedWeek, { locale: nl }), 'dd MMM', { locale: nl })} - {format(endOfWeek(selectedWeek, { locale: nl }), 'dd MMM yyyy', { locale: nl })}
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={previousWeek} data-testid="button-prev-week">
                    Vorige
                  </Button>
                  <Button variant="outline" size="sm" onClick={currentWeek} data-testid="button-current-week">
                    Huidige
                  </Button>
                  <Button variant="outline" size="sm" onClick={nextWeek} data-testid="button-next-week">
                    Volgende
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Weekly stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400" data-testid="total-hours">
                    {weekSummary.totalHours.toFixed(1)}h
                  </div>
                  <div className="text-sm text-muted-foreground">Totaal Uren</div>
                </div>
                <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400" data-testid="overtime-hours">
                    {weekSummary.overtimeHours.toFixed(1)}h
                  </div>
                  <div className="text-sm text-muted-foreground">Overuren</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="tasks-completed">
                    {weekSummary.tasksCompleted}
                  </div>
                  <div className="text-sm text-muted-foreground">Taken Voltooid</div>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400" data-testid="avg-hours-per-day">
                    {weekSummary.avgHoursPerDay.toFixed(1)}h
                  </div>
                  <div className="text-sm text-muted-foreground">Gem. per Dag</div>
                </div>
              </div>

              {/* Weekly hours table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Datum</TableHead>
                      <TableHead>Taak</TableHead>
                      <TableHead>Start</TableHead>
                      <TableHead>Einde</TableHead>
                      <TableHead>Uren</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notities</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {weeklyHours.map((hour) => (
                      <TableRow key={hour.id}>
                        <TableCell>
                          {format(new Date(hour.startTime), 'dd/MM', { locale: nl })}
                          {isToday(new Date(hour.startTime)) && (
                            <Badge variant="secondary" className="ml-2">Vandaag</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {tasks.find(t => t.id === hour.taskId)?.name || 'Onbekende taak'}
                        </TableCell>
                        <TableCell className="font-mono">
                          {format(new Date(hour.startTime), 'HH:mm')}
                        </TableCell>
                        <TableCell className="font-mono">
                          {hour.endTime ? format(new Date(hour.endTime), 'HH:mm') : '--:--'}
                        </TableCell>
                        <TableCell className="font-mono">
                          {hour.totalHours ? `${parseFloat(hour.totalHours).toFixed(2)}h` : '0.00h'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            hour.status === 'completed' ? 'default' :
                            hour.status === 'approved' ? 'secondary' :
                            hour.status === 'in_progress' ? 'destructive' : 'outline'
                          }>
                            {hour.status === 'completed' ? 'Voltooid' :
                             hour.status === 'approved' ? 'Goedgekeurd' :
                             hour.status === 'in_progress' ? 'Bezig' : 'Wachtend'}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {hour.notes || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Gedetailleerde Rapporten
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Hier komen gedetailleerde rapporten met grafieken en analyses van je werkuren.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-24 flex-col gap-2">
                  <BarChart3 className="h-6 w-6" />
                  Uren per Taak
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2">
                  <Target className="h-6 w-6" />
                  Productiviteit
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2">
                  <CalendarIcon className="h-6 w-6" />
                  Maandrapport
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2">
                  <Clock className="h-6 w-6" />
                  Overuren Analyse
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Timer Instellingen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="default-break">Standaard pauze duur (minuten)</Label>
                <Input
                  id="default-break"
                  type="number"
                  value={breakDuration}
                  onChange={(e) => setBreakDuration(parseInt(e.target.value))}
                  min="5"
                  max="60"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Automatische pauzes</Label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" />
                    <span>Herinner me om elke 2 uur een pauze te nemen</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" />
                    <span>Automatisch stoppen na 8 uur werk</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TimeTrackingAdvanced;