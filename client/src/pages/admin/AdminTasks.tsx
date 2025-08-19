import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ListTodo, Plus, Edit, Clock, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

interface Task {
  id: string;
  name: string;
  description: string | null;
  type: string;
  estimated_hours: number | null;
  is_active: boolean;
  departments: { name: string } | null;
  created_at: string;
}

interface Department {
  id: string;
  name: string;
}

const AdminTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('orders_picken');
  const [departmentId, setDepartmentId] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [isActive, setIsActive] = useState(true);

  const { toast } = useToast();

  useEffect(() => {
    fetchTasks();
    fetchDepartments();
  }, []);

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        departments (name)
      `)
      .order('name');
    
    if (error) {
      console.error('Error fetching tasks:', error);
    } else {
      setTasks(data || []);
    }
    setLoading(false);
  };

  const fetchDepartments = async () => {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching departments:', error);
    } else {
      setDepartments(data || []);
    }
  };

  const handleAdd = async () => {
    if (!name.trim()) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          type: type as Database['public']['Enums']['task_type'],
          department_id: departmentId || null,
          estimated_hours: estimatedHours ? parseFloat(estimatedHours) : null,
          is_active: isActive,
        });

      if (error) {
        toast({
          title: "Fout",
          description: "Kon taak niet toevoegen",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Taak toegevoegd",
          description: `${name} is succesvol toegevoegd`,
        });
        resetForm();
        setIsAddDialogOpen(false);
        fetchTasks();
      }
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleEdit = async () => {
    if (!selectedTask || !name.trim()) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          name: name.trim(),
          description: description.trim() || null,
          type: type as Database['public']['Enums']['task_type'],
          department_id: departmentId || null,
          estimated_hours: estimatedHours ? parseFloat(estimatedHours) : null,
          is_active: isActive,
        })
        .eq('id', selectedTask.id);

      if (error) {
        toast({
          title: "Fout",
          description: "Kon taak niet bijwerken",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Taak bijgewerkt",
          description: `${name} is succesvol bijgewerkt`,
        });
        resetForm();
        setIsEditDialogOpen(false);
        setSelectedTask(null);
        fetchTasks();
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const openEditDialog = (task: Task) => {
    setSelectedTask(task);
    setName(task.name);
    setDescription(task.description || '');
    setType(task.type);
    setDepartmentId(task.departments ? '' : ''); // Would need department_id from task
    setEstimatedHours(task.estimated_hours ? task.estimated_hours.toString() : '');
    setIsActive(task.is_active);
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setType('orders_picken');
    setDepartmentId('');
    setEstimatedHours('');
    setIsActive(true);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'orders_picken': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'ept_rijden': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'combi_truck': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'containers_lossen': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'magazijn_schoonmaken': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'inventaris': return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'orders_picken': return 'Orders picken';
      case 'ept_rijden': return 'EPT rijden';
      case 'combi_truck': return 'Combi truck';
      case 'containers_lossen': return 'Containers lossen';
      case 'magazijn_schoonmaken': return 'Magazijn schoonmaken';
      case 'inventaris': return 'Inventaris';
      default: return type;
    }
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
          <h1 className="text-3xl font-bold text-primary mb-2">Taken Beheer</h1>
          <p className="text-muted-foreground">Beheer alle taken</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nieuwe Taak
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nieuwe Taak Toevoegen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Naam</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Naam van de taak"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Beschrijving</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Beschrijving van de taak"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="orders_picken">Orders picken</SelectItem>
                    <SelectItem value="ept_rijden">EPT rijden</SelectItem>
                    <SelectItem value="combi_truck">Combi truck</SelectItem>
                    <SelectItem value="containers_lossen">Containers lossen</SelectItem>
                    <SelectItem value="magazijn_schoonmaken">Magazijn schoonmaken</SelectItem>
                    <SelectItem value="inventaris">Inventaris</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Afdeling</Label>
                <Select value={departmentId} onValueChange={setDepartmentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer afdeling (optioneel)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Geen afdeling</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimated-hours">Geschatte uren</Label>
                <Input
                  id="estimated-hours"
                  type="number"
                  step="0.5"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                  placeholder="Geschatte tijd in uren"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
                <Label htmlFor="active">Actief</Label>
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
            <DialogTitle>Taak Bewerken</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Naam</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Naam van de taak"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Beschrijving</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Beschrijving van de taak"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-type">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="orders_picken">Orders picken</SelectItem>
                  <SelectItem value="ept_rijden">EPT rijden</SelectItem>
                  <SelectItem value="combi_truck">Combi truck</SelectItem>
                  <SelectItem value="containers_lossen">Containers lossen</SelectItem>
                  <SelectItem value="magazijn_schoonmaken">Magazijn schoonmaken</SelectItem>
                  <SelectItem value="inventaris">Inventaris</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-department">Afdeling</Label>
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer afdeling (optioneel)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Geen afdeling</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-estimated-hours">Geschatte uren</Label>
              <Input
                id="edit-estimated-hours"
                type="number"
                step="0.5"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                placeholder="Geschatte tijd in uren"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="edit-active">Actief</Label>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleEdit} disabled={!name.trim()} className="flex-1">
                Opslaan
              </Button>
              <Button variant="outline" onClick={() => {
                resetForm();
                setIsEditDialogOpen(false);
                setSelectedTask(null);
              }}>
                Annuleren
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-muted-foreground">Nog geen taken aangemaakt</p>
          </div>
        ) : (
          tasks.map((task) => (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ListTodo className="h-5 w-5" />
                    {task.name}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge className={getTypeColor(task.type)}>
                      {getTypeName(task.type)}
                    </Badge>
                    <Badge variant={task.is_active ? 'default' : 'secondary'}>
                      {task.is_active ? 'Actief' : 'Inactief'}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditDialog(task)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {task.description && (
                  <p className="text-sm text-muted-foreground">
                    {task.description}
                  </p>
                )}
                
                <div className="space-y-2">
                  {task.departments && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>{task.departments.name}</span>
                    </div>
                  )}
                  
                  {task.estimated_hours && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{task.estimated_hours} uur geschat</span>
                    </div>
                  )}
                </div>
                
                <div className="text-xs text-muted-foreground">
                  Aangemaakt: {new Date(task.created_at).toLocaleDateString('nl-NL')}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminTasks;