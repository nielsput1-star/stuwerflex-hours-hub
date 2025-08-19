import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Building2, Plus, Users, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Department {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  employee_count?: number;
}

const AdminDepartments = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const { toast } = useToast();

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching departments:', error);
    } else {
      // Get employee count for each department
      const departmentsWithCount = await Promise.all(
        (data || []).map(async (dept) => {
          const { count } = await supabase
            .from('employees')
            .select('*', { count: 'exact', head: true })
            .eq('department_id', dept.id);
          
          return { ...dept, employee_count: count || 0 };
        })
      );
      
      setDepartments(departmentsWithCount);
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!name.trim()) return;

    try {
      const { error } = await supabase
        .from('departments')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
        });

      if (error) {
        toast({
          title: "Fout",
          description: "Kon afdeling niet toevoegen",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Afdeling toegevoegd",
          description: `${name} is succesvol toegevoegd`,
        });
        resetForm();
        setIsAddDialogOpen(false);
        fetchDepartments();
      }
    } catch (error) {
      console.error('Error adding department:', error);
    }
  };

  const handleEdit = async () => {
    if (!selectedDepartment || !name.trim()) return;

    try {
      const { error } = await supabase
        .from('departments')
        .update({
          name: name.trim(),
          description: description.trim() || null,
        })
        .eq('id', selectedDepartment.id);

      if (error) {
        toast({
          title: "Fout",
          description: "Kon afdeling niet bijwerken",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Afdeling bijgewerkt",
          description: `${name} is succesvol bijgewerkt`,
        });
        resetForm();
        setIsEditDialogOpen(false);
        setSelectedDepartment(null);
        fetchDepartments();
      }
    } catch (error) {
      console.error('Error updating department:', error);
    }
  };

  const openEditDialog = (department: Department) => {
    setSelectedDepartment(department);
    setName(department.name);
    setDescription(department.description || '');
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setName('');
    setDescription('');
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">Afdelingen</h1>
          <p className="text-muted-foreground">Beheer alle afdelingen</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nieuwe Afdeling
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nieuwe Afdeling Toevoegen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Naam</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Naam van de afdeling"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Beschrijving</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Beschrijving van de afdeling (optioneel)"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAdd} disabled={!name.trim()} className="flex-1">
                  Toevoegen
                </Button>
                <Button variant="outline" onClick={() => {
                  resetForm();
                  setIsAddDialogOpen(false);
                }}>
                  Annuleren
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Afdeling Bewerken</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Naam</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Naam van de afdeling"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Beschrijving</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Beschrijving van de afdeling (optioneel)"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleEdit} disabled={!name.trim()} className="flex-1">
                Opslaan
              </Button>
              <Button variant="outline" onClick={() => {
                resetForm();
                setIsEditDialogOpen(false);
                setSelectedDepartment(null);
              }}>
                Annuleren
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-muted-foreground">Nog geen afdelingen aangemaakt</p>
          </div>
        ) : (
          departments.map((department) => (
            <Card key={department.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {department.name}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditDialog(department)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {department.description && (
                  <p className="text-sm text-muted-foreground">
                    {department.description}
                  </p>
                )}
                
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {department.employee_count} medewerker{department.employee_count !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  Aangemaakt: {new Date(department.created_at).toLocaleDateString('nl-NL')}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminDepartments;