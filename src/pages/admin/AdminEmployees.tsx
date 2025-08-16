import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Employee {
  id: string;
  profile_id: string;
  hire_date: string;
  hourly_rate: number;
  status: string;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    employee_number: string;
  };
}

const AdminEmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'employee',
    hourlyRate: '',
    status: 'active'
  });
  const { toast } = useToast();

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    const { data } = await supabase
      .from('employees')
      .select(`
        *,
        profiles:profile_id (
          first_name,
          last_name,
          email,
          role,
          employee_number
        )
      `)
      .order('hire_date', { ascending: false });
    
    setEmployees(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedEmployee) {
      // Update existing employee
      const { error } = await supabase
        .from('employees')
        .update({
          hourly_rate: parseFloat(formData.hourlyRate),
          status: formData.status
        })
        .eq('id', selectedEmployee.id);
      
      if (error) {
        toast({
          title: "Fout",
          description: "Kon werknemer niet bijwerken",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Werknemer bijgewerkt",
          description: "Werknemergegevens zijn bijgewerkt"
        });
        loadEmployees();
        setSelectedEmployee(null);
      }
    } else {
      // Add new employee - this would require admin to create auth user first
      toast({
        title: "Niet geïmplementeerd",
        description: "Nieuwe werknemers moeten zich eerst registreren",
        variant: "destructive"
      });
    }
    
    setShowAddDialog(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      role: 'employee',
      hourlyRate: '',
      status: 'active'
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800',
      on_leave: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      active: 'Actief',
      inactive: 'Inactief',
      on_leave: 'Verlof'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      admin: 'Beheerder',
      manager: 'Manager',
      employee: 'Werknemer'
    };
    return labels[role as keyof typeof labels] || role;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Werknemers Beheer</h1>
          <p className="text-muted-foreground">Beheer alle werknemers en hun gegevens</p>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Werknemer Toevoegen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedEmployee ? 'Werknemer Bewerken' : 'Nieuwe Werknemer'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="hourlyRate">Uurloon (€)</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  step="0.01"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({...formData, hourlyRate: e.target.value})}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Actief</SelectItem>
                    <SelectItem value="inactive">Inactief</SelectItem>
                    <SelectItem value="on_leave">Verlof</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button type="submit" className="w-full">
                {selectedEmployee ? 'Bijwerken' : 'Toevoegen'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Werknemers Overzicht</CardTitle>
          <CardDescription>Alle geregistreerde werknemers</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Naam</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Personeelsnummer</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Uurloon</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map(employee => (
                <TableRow key={employee.id}>
                  <TableCell>
                    {employee.profiles.first_name} {employee.profiles.last_name}
                  </TableCell>
                  <TableCell>{employee.profiles.email}</TableCell>
                  <TableCell>{employee.profiles.employee_number}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getRoleLabel(employee.profiles.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>€{employee.hourly_rate?.toFixed(2) || 'Niet ingesteld'}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(employee.status)}>
                      {getStatusLabel(employee.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedEmployee(employee);
                        setFormData({
                          email: employee.profiles.email,
                          firstName: employee.profiles.first_name,
                          lastName: employee.profiles.last_name,
                          role: employee.profiles.role,
                          hourlyRate: employee.hourly_rate?.toString() || '',
                          status: employee.status
                        });
                        setShowAddDialog(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {employees.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Geen werknemers gevonden</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminEmployees;