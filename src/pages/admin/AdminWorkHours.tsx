import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Clock, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface WorkHour {
  id: string;
  start_time: string;
  end_time: string | null;
  total_hours: number | null;
  status: string;
  notes: string | null;
  employees: {
    profiles: {
      first_name: string;
      last_name: string;
    };
  };
  tasks: {
    name: string;
  };
}

const AdminWorkHours = () => {
  const [workHours, setWorkHours] = useState<WorkHour[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkHours();
  }, []);

  const fetchWorkHours = async () => {
    const { data, error } = await supabase
      .from('work_hours')
      .select(`
        *,
        employees (
          profiles (
            first_name,
            last_name
          )
        ),
        tasks (name)
      `)
      .order('start_time', { ascending: false })
      .limit(50);
    
    if (error) {
      console.error('Error fetching work hours:', error);
    } else {
      setWorkHours(data || []);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary mb-2">Uren Overzicht</h1>
        <p className="text-muted-foreground">Overzicht van alle geregistreerde uren</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recente Uren Registraties
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medewerker</TableHead>
                <TableHead>Taak</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>Eind</TableHead>
                <TableHead>Totaal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notities</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workHours.map((hour) => (
                <TableRow key={hour.id}>
                  <TableCell>
                    {hour.employees.profiles.first_name} {hour.employees.profiles.last_name}
                  </TableCell>
                  <TableCell>{hour.tasks.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      {new Date(hour.start_time).toLocaleString('nl-NL')}
                    </div>
                  </TableCell>
                  <TableCell>
                    {hour.end_time ? new Date(hour.end_time).toLocaleString('nl-NL') : '-'}
                  </TableCell>
                  <TableCell>
                    {hour.total_hours ? `${hour.total_hours.toFixed(2)}h` : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={hour.status === 'completed' ? 'default' : 'outline'}>
                      {hour.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{hour.notes || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminWorkHours;