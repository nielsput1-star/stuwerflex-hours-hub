import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Task {
  id: string;
  name: string;
  type: string;
  description: string;
  estimated_hours: number;
  is_active: boolean;
  created_at: string;
}

const AdminTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'orders_picken',
    description: '',
    estimatedHours: '',
    isActive: true
  });
  const { toast } = useToast();

  const taskTypes = [
    { value: 'orders_picken', label: 'Orders Picken' },
    { value: 'ept_rijden', label: 'EPT Rijden' },
    { value: 'combi_truck', label: 'Combi Truck' },
    { value: 'containers_lossen', label: 'Containers Lossen' },
    { value: 'magazijn_schoonmaken', label: 'Magazijn Schoonmaken' },
    { value: 'inventaris', label: 'Inventaris' }
  ];

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .order('name');
    
    setTasks(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const taskData = {
      name: formData.name,
      type: formData.type as any,
      description: formData.description,
      estimated_hours: parseFloat(formData.estimatedHours),
      is_active: formData.isActive
    };
    
    if (selectedTask) {
      // Update existing task
      const { error } = await supabase
        .from('tasks')
        .update(taskData)
        .eq('id', selectedTask.id);
      
      if (error) {
        toast({
          title: "Fout",
          description: "Kon taak niet bijwerken",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Taak bijgewerkt",
          description: "Taakgegevens zijn bijgewerkt"
        });
      }
    } else {
      // Add new task
      const { error } = await supabase
        .from('tasks')
        .insert(taskData);
      
      if (error) {
        toast({
          title: "Fout",
          description: "Kon taak niet toevoegen",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Taak toegevoegd",
          description: "Nieuwe taak is toegevoegd"
        });
      }
    }
    
    loadTasks();
    setShowAddDialog(false);
    setSelectedTask(null);
    resetForm();
  };

  const handleDelete = async (task: Task) => {
    if (!confirm(`Weet je zeker dat je "${task.name}" wilt verwijderen?`)) {
      return;
    }
    
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', task.id);
    
    if (error) {
      toast({
        title: "Fout",
        description: "Kon taak niet verwijderen",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Taak verwijderd",
        description: "Taak is succesvol verwijderd"
      });
      loadTasks();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'orders_picken',
      description: '',
      estimatedHours: '',
      isActive: true
    });
  };

  const getTaskTypeLabel = (type: string) => {
    const taskType = taskTypes.find(t => t.value === type);
    return taskType ? taskType.label : type;
  };

  const getTaskTypeColor = (type: string) => {
    const colors = {
      orders_picken: 'bg-blue-100 text-blue-800',
      ept_rijden: 'bg-green-100 text-green-800',
      combi_truck: 'bg-yellow-100 text-yellow-800',
      containers_lossen: 'bg-red-100 text-red-800',
      magazijn_schoonmaken: 'bg-purple-100 text-purple-800',
      inventaris: 'bg-orange-100 text-orange-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Taken Beheer</h1>
          <p className="text-muted-foreground">Beheer alle taken in het magazijn</p>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setSelectedTask(null);
              resetForm();
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Taak Toevoegen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedTask ? 'Taak Bewerken' : 'Nieuwe Taak'}
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
                <Label htmlFor="type">Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {taskTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              
              <div className="grid gap-2">
                <Label htmlFor="estimatedHours">Geschatte uren</Label>
                <Input
                  id="estimatedHours"
                  type="number"
                  step="0.5"
                  value={formData.estimatedHours}
                  onChange={(e) => setFormData({...formData, estimatedHours: e.target.value})}
                  required
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                />
                <Label htmlFor="isActive">Actief</Label>
              </div>
              
              <Button type="submit" className="w-full">
                {selectedTask ? 'Bijwerken' : 'Toevoegen'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Taken Overzicht</CardTitle>
          <CardDescription>Alle taken in het systeem</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Naam</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Beschrijving</TableHead>
                <TableHead>Geschatte Uren</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map(task => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.name}</TableCell>
                  <TableCell>
                    <Badge className={getTaskTypeColor(task.type)}>
                      {getTaskTypeLabel(task.type)}
                    </Badge>
                  </TableCell>
                  <TableCell>{task.description || 'Geen beschrijving'}</TableCell>
                  <TableCell>{task.estimated_hours} uur</TableCell>
                  <TableCell>
                    <Badge variant={task.is_active ? 'default' : 'secondary'}>
                      {task.is_active ? 'Actief' : 'Inactief'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTask(task);
                          setFormData({
                            name: task.name,
                            type: task.type,
                            description: task.description || '',
                            estimatedHours: task.estimated_hours.toString(),
                            isActive: task.is_active
                          });
                          setShowAddDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(task)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {tasks.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Geen taken gevonden</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTasks;