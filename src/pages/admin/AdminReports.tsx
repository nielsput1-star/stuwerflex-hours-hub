import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, TrendingUp, Users, Clock, Package } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface ReportData {
  totalEmployees: number;
  totalHours: number;
  totalTasks: number;
  productivityByTask: { task: string; hours: number; count: number }[];
  employeeStats: { name: string; hours: number; tasks: number }[];
  dailyHours: { date: string; hours: number }[];
}

const AdminReports = () => {
  const [reportData, setReportData] = useState<ReportData>({
    totalEmployees: 0,
    totalHours: 0,
    totalTasks: 0,
    productivityByTask: [],
    employeeStats: [],
    dailyHours: []
  });
  const [startDate, setStartDate] = useState<Date | undefined>(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    generateReport();
  }, [startDate, endDate]);

  const generateReport = async () => {
    setLoading(true);
    
    try {
      // Get total employees
      const { count: employeeCount } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get work hours data
      let workHoursQuery = supabase
        .from('work_hours')
        .select(`
          *,
          employee:employees!inner(
            profiles:profile_id!inner(
              first_name,
              last_name
            )
          ),
          task:tasks!inner(
            name,
            type
          )
        `)
        .eq('status', 'completed');

      if (startDate) {
        workHoursQuery = workHoursQuery.gte('start_time', startDate.toISOString().split('T')[0]);
      }
      
      if (endDate) {
        const endDateStr = new Date(endDate.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        workHoursQuery = workHoursQuery.lt('start_time', endDateStr);
      }

      const { data: workHours } = await workHoursQuery;

      // Calculate total hours
      const totalHours = workHours?.reduce((total, workHour) => {
        if (workHour.end_time) {
          const duration = new Date(workHour.end_time).getTime() - new Date(workHour.start_time).getTime();
          return total + (duration / (1000 * 60 * 60));
        }
        return total;
      }, 0) || 0;

      // Get active tasks count
      const { count: taskCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Calculate productivity by task
      const taskStats = workHours?.reduce((acc: any, workHour) => {
        const taskName = workHour.task.name;
        if (!acc[taskName]) {
          acc[taskName] = { task: taskName, hours: 0, count: 0 };
        }
        
        if (workHour.end_time) {
          const duration = new Date(workHour.end_time).getTime() - new Date(workHour.start_time).getTime();
          acc[taskName].hours += duration / (1000 * 60 * 60);
        }
        acc[taskName].count += 1;
        
        return acc;
      }, {}) || {};

      // Calculate employee stats
      const employeeStats = workHours?.reduce((acc: any, workHour) => {
        const employeeName = `${workHour.employee.profiles.first_name} ${workHour.employee.profiles.last_name}`;
        if (!acc[employeeName]) {
          acc[employeeName] = { name: employeeName, hours: 0, tasks: 0 };
        }
        
        if (workHour.end_time) {
          const duration = new Date(workHour.end_time).getTime() - new Date(workHour.start_time).getTime();
          acc[employeeName].hours += duration / (1000 * 60 * 60);
        }
        acc[employeeName].tasks += 1;
        
        return acc;
      }, {}) || {};

      // Calculate daily hours
      const dailyStats = workHours?.reduce((acc: any, workHour) => {
        const date = workHour.start_time.split('T')[0];
        if (!acc[date]) {
          acc[date] = { date, hours: 0 };
        }
        
        if (workHour.end_time) {
          const duration = new Date(workHour.end_time).getTime() - new Date(workHour.start_time).getTime();
          acc[date].hours += duration / (1000 * 60 * 60);
        }
        
        return acc;
      }, {}) || {};

      setReportData({
        totalEmployees: employeeCount || 0,
        totalHours: totalHours,
        totalTasks: taskCount || 0,
        productivityByTask: Object.values(taskStats).sort((a: any, b: any) => b.hours - a.hours),
        employeeStats: Object.values(employeeStats).sort((a: any, b: any) => b.hours - a.hours),
        dailyHours: Object.values(dailyStats).sort((a: any, b: any) => a.date.localeCompare(b.date))
      });

    } catch (error) {
      console.error('Error generating report:', error);
    }
    
    setLoading(false);
  };

  const exportReport = () => {
    const csvContent = [
      ['Rapport Periode', `${startDate ? format(startDate, 'yyyy-MM-dd') : ''} tot ${endDate ? format(endDate, 'yyyy-MM-dd') : ''}`],
      [''],
      ['Overzicht'],
      ['Totaal Werknemers', reportData.totalEmployees],
      ['Totaal Uren', reportData.totalHours.toFixed(2)],
      ['Totaal Taken', reportData.totalTasks],
      [''],
      ['Productiviteit per Taak'],
      ['Taak', 'Uren', 'Aantal Sessies'],
      ...reportData.productivityByTask.map(task => [task.task, task.hours.toFixed(2), task.count]),
      [''],
      ['Werknemer Statistieken'],
      ['Werknemer', 'Uren', 'Aantal Taken'],
      ...reportData.employeeStats.map(emp => [emp.name, emp.hours.toFixed(2), emp.tasks])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stuwflex-rapport-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rapporten</h1>
          <p className="text-muted-foreground">Prestatie overzichten en statistieken</p>
        </div>
        
        <Button onClick={exportReport}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="text-sm font-medium">Startdatum</label>
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
          <label className="text-sm font-medium">Einddatum</label>
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
        
        <Button onClick={generateReport} disabled={loading}>
          {loading ? 'Genereren...' : 'Rapport Genereren'}
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totaal Werknemers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.totalEmployees}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totaal Uren</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.totalHours.toFixed(1)}u</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actieve Taken</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.totalTasks}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gemiddeld per Dag</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reportData.dailyHours.length > 0 
                ? (reportData.totalHours / reportData.dailyHours.length).toFixed(1)
                : '0'
              }u
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Productivity by Task */}
        <Card>
          <CardHeader>
            <CardTitle>Productiviteit per Taak</CardTitle>
            <CardDescription>Overzicht van tijd besteed per taaktype</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.productivityByTask.map((task, index) => (
                <div key={task.task} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{task.task}</div>
                    <div className="text-sm text-muted-foreground">
                      {task.count} sessies
                    </div>
                  </div>
                  <Badge variant="outline">
                    {task.hours.toFixed(1)}u
                  </Badge>
                </div>
              ))}
              
              {reportData.productivityByTask.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Geen data beschikbaar
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Employee Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Top Werknemers</CardTitle>
            <CardDescription>Meest actieve werknemers in de periode</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.employeeStats.slice(0, 10).map((employee, index) => (
                <div key={employee.name} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{employee.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {employee.tasks} taken voltooid
                    </div>
                  </div>
                  <Badge variant="outline">
                    {employee.hours.toFixed(1)}u
                  </Badge>
                </div>
              ))}
              
              {reportData.employeeStats.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Geen data beschikbaar
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminReports;