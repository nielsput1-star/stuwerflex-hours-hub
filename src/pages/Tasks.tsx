import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface Task {
  id: string;
  name: string;
  type: string;
  description: string;
  estimated_hours: number;
  is_active: boolean;
}

const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('is_active', true)
      .order('name');
    setTasks(data || []);
  };

  const getTaskTypeLabel = (type: string) => {
    const labels = {
      orders_picken: 'Orders Picken',
      ept_rijden: 'EPT Rijden',
      combi_truck: 'Combi Truck',
      containers_lossen: 'Containers Lossen',
      magazijn_schoonmaken: 'Magazijn Schoonmaken',
      inventaris: 'Inventaris'
    };
    return labels[type as keyof typeof labels] || type;
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
      <div>
        <h1 className="text-3xl font-bold">Beschikbare Taken</h1>
        <p className="text-muted-foreground">Overzicht van alle beschikbare taken in het magazijn</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tasks.map(task => (
          <Card key={task.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{task.name}</CardTitle>
                <Badge className={getTaskTypeColor(task.type)}>
                  {getTaskTypeLabel(task.type)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                {task.description}
              </CardDescription>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Geschatte tijd:</span>
                <span className="font-medium">{task.estimated_hours} uur</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {tasks.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">Geen taken beschikbaar</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Tasks;