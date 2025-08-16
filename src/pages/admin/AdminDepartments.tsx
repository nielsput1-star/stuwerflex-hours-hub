import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Department {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

const AdminDepartments = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    const { data } = await supabase
      .from('departments')
      .select('*')
      .order('name');
    
    setDepartments(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedDepartment) {
      // Update existing department
      const { error } = await supabase
        .from('departments')
        .update({
          name: formData.name,
          description: formData.description
        })
        .eq('id', selectedDepartment.id);
      
      if (error) {
        toast({
          title: "Fout",
          description: "Kon afdeling niet bijwerken",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Afdeling bijgewerkt",
          description: "Afdelingsgegevens zijn bijgewerkt"
        });
      }
    } else {
      // Add new department
      const { error } = await supabase
        .from('departments')
        .insert({
          name: formData.name,
          description: formData.description
        });
      
      if (error) {
        toast({
          title: "Fout",
          description: "Kon afdeling niet toevoegen",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Afdeling toegevoegd",
          description: "Nieuwe afdeling is toegevoegd"
        });
      }
    }
    
    loadDepartments();
    setShowAddDialog(false);
    setSelectedDepartment(null);
    resetForm();
  };

  const handleDelete = async (department: Department) => {
    if (!confirm(`Weet je zeker dat je "${department.name}" wilt verwijderen?`)) {
      return;
    }
    
    const { error } = await supabase
      .from('departments')
      .delete()
      .eq('id', department.id);
    
    if (error) {
      toast({
        title: "Fout",
        description: "Kon afdeling niet verwijderen",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Afdeling verwijderd",
        description: "Afdeling is succesvol verwijderd"
      });
      loadDepartments();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: ''
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Afdelingen Beheer</h1>
          <p className="text-muted-foreground">Beheer alle afdelingen in het magazijn</p>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setSelectedDepartment(null);
              resetForm();
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Afdeling Toevoegen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedDepartment ? 'Afdeling Bewerken' : 'Nieuwe Afdeling'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Naam</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Beschrijving</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>
              
              <Button type="submit" className="w-full">
                {selectedDepartment ? 'Bijwerken' : 'Toevoegen'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Afdelingen Overzicht</CardTitle>
          <CardDescription>Alle afdelingen in het magazijn</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Naam</TableHead>
                <TableHead>Beschrijving</TableHead>
                <TableHead>Aangemaakt</TableHead>
                <TableHead>Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map(department => (
                <TableRow key={department.id}>
                  <TableCell className="font-medium">{department.name}</TableCell>
                  <TableCell>{department.description || 'Geen beschrijving'}</TableCell>
                  <TableCell>
                    {new Date(department.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedDepartment(department);
                          setFormData({
                            name: department.name,
                            description: department.description || ''
                          });
                          setShowAddDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(department)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {departments.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Geen afdelingen gevonden</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDepartments;