import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Clock, Calendar, Settings, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const AdminDashboard = () => {
  // Demo data - will be replaced with real Supabase data
  const [employees] = useState([
    { id: 1, full_name: "Jan Jansen", email: "jan@stuwflex.nl", is_available: true },
    { id: 2, full_name: "Marie de Vries", email: "marie@stuwflex.nl", is_available: false },
    { id: 3, full_name: "Peter Bakker", email: "peter@stuwflex.nl", is_available: true },
  ]);
  
  const [workHours] = useState([
    { id: 1, profiles: { full_name: "Jan Jansen" }, date: "2024-08-15", hours: 8, task_type: "Orders picken", status: "approved" },
    { id: 2, profiles: { full_name: "Marie de Vries" }, date: "2024-08-14", hours: 6, task_type: "EPT rijden", status: "pending" },
    { id: 3, profiles: { full_name: "Peter Bakker" }, date: "2024-08-14", hours: 7, task_type: "Containers lossen", status: "approved" },
  ]);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = () => {
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