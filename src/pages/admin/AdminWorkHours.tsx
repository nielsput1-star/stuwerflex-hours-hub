import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface WorkHour {
  id: string;
  start_time: string;
  end_time: string | null;
  total_hours: number | null;
  status: string;
  notes: string;
  employee: {
    profiles: {
      first_name: string;
      last_name: string;
      employee_number: string;
    };
  };
  task: {
    name: string;
    type: string;
  };
}

const AdminWorkHours = () => {
  const [workHours, setWorkHours] = useState<WorkHour[]>([]);
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadWorkHours();
  }, [startDate, endDate]);

  const loadWorkHours = async () => {
    setLoading(true);
    
    let query = supabase
      .from('work_hours')
      .select(`
        *,
        employee:employees!inner(
          profiles:profile_id!inner(
            first_name,
            last_name,
            employee_number
          )
        ),
        task:tasks!inner(
          name,
          type
        )
      `)
      .order('start_time', { ascending: false });

    if (startDate) {
      query = query.gte('start_time', startDate.toISOString().split('T')[0]);
    }
    
    if (endDate) {
      const endDateStr = new Date(endDate.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      query = query.lt('start_time', endDateStr);
    }

    const { data } = await query;
    setWorkHours(data || []);
    setLoading(false);
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      in_progress: 'Bezig',
      completed: 'Voltooid',
      paused: 'Gepauzeerd'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatDuration = (startTime: string, endTime?: string | null) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}u ${minutes}m`;
  };

  const getTotalHours = () => {
    return workHours.reduce((total, workHour) => {
      if (workHour.total_hours) {
        return total + workHour.total_hours;
      }
      if (workHour.end_time) {
        const duration = new Date(workHour.end_time).getTime() - new Date(workHour.start_time).getTime();
        return total + (duration / (1000 * 60 * 60));
      }
      return total;
    }, 0);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Uren Overzicht</h1>
        <p className="text-muted-foreground">Overzicht van alle geregistreerde werkuren</p>
      </div>

      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <Label>Startdatum</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : "Selecteer datum"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="flex-1">
          <Label>Einddatum</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : "Selecteer datum"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <Button onClick={loadWorkHours} disabled={loading}>
          {loading ? 'Laden...' : 'Filter'}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totaal Uren</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTotalHours().toFixed(1)}u</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aantal Sessies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workHours.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actieve Sessies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workHours.filter(w => w.status === 'in_progress').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Werkuren Details</CardTitle>
          <CardDescription>Alle geregistreerde werkuren in de geselecteerde periode</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Werknemer</TableHead>
                <TableHead>Taak</TableHead>
                <TableHead>Starttijd</TableHead>
                <TableHead>Eindtijd</TableHead>
                <TableHead>Duur</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notities</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workHours.map(workHour => (
                <TableRow key={workHour.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {workHour.employee.profiles.first_name} {workHour.employee.profiles.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {workHour.employee.profiles.employee_number}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{workHour.task.name}</TableCell>
                  <TableCell>
                    {new Date(workHour.start_time).toLocaleDateString()} {new Date(workHour.start_time).toLocaleTimeString()}
                  </TableCell>
                  <TableCell>
                    {workHour.end_time 
                      ? `${new Date(workHour.end_time).toLocaleDateString()} ${new Date(workHour.end_time).toLocaleTimeString()}`
                      : 'Nog bezig'
                    }
                  </TableCell>
                  <TableCell>
                    {formatDuration(workHour.start_time, workHour.end_time)}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(workHour.status)}>
                      {getStatusLabel(workHour.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>{workHour.notes || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {workHours.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Geen werkuren gevonden in de geselecteerde periode</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminWorkHours;