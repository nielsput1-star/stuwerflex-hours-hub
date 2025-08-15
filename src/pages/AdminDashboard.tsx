import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Clock, Calendar, Settings, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const AdminDashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [workHours, setWorkHours] = useState<any[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdmin();
    loadEmployees();
    loadWorkHours();
  }, []);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profile?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    
    setUser(user);
  };

  const loadEmployees = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'employee');
    
    setEmployees(data || []);
  };

  const loadWorkHours = async () => {
    const { data } = await supabase
      .from('work_hours')
      .select(`
        *,
        profiles!work_hours_user_id_fkey(full_name)
      `)
      .order('date', { ascending: false })
      .limit(10);
    
    setWorkHours(data || []);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
    toast({
      title: "Uitgelogd",
      description: "Tot ziens!",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-primary">Stuwflex</h1>
            <Badge variant="default">Admin Dashboard</Badge>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Instellingen
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Uitloggen
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Totaal Werknemers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{employees.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Uren Deze Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {workHours.reduce((total, hour) => total + (hour.hours || 0), 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Beschikbare Werknemers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{employees.filter(e => e.is_available).length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Work Hours */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Recente Uren</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Werknemer</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead>Uren</TableHead>
                  <TableHead>Taak</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workHours.map((hour) => (
                  <TableRow key={hour.id}>
                    <TableCell>{hour.profiles?.full_name || 'Onbekend'}</TableCell>
                    <TableCell>{new Date(hour.date).toLocaleDateString('nl-NL')}</TableCell>
                    <TableCell>{hour.hours}u</TableCell>
                    <TableCell>{hour.task_type}</TableCell>
                    <TableCell>
                      <Badge variant={hour.status === 'approved' ? 'default' : 'secondary'}>
                        {hour.status === 'approved' ? 'Goedgekeurd' : 'In behandeling'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Employee Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Werknemers Overzicht</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Naam</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>{employee.full_name || 'Naam niet ingesteld'}</TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>
                      <Badge variant={employee.is_available ? 'default' : 'secondary'}>
                        {employee.is_available ? 'Beschikbaar' : 'Niet beschikbaar'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        Bekijken
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;