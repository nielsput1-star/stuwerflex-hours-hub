import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FolderOpen, Plus, Calendar as CalendarIcon, Users, DollarSign, Clock, Target, BarChart3, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { format, differenceInDays, isAfter, isBefore } from 'date-fns';
import { nl } from 'date-fns/locale';

interface Project {
  id: string;
  name: string;
  description?: string;
  departmentId?: string;
  managerId?: string;
  startDate?: string;
  endDate?: string;
  status: 'active' | 'completed' | 'on_hold';
  budget?: number;
  createdAt: string;
  updatedAt: string;
  department?: {
    name: string;
  };
  manager?: {
    firstName: string;
    lastName: string;
  };
  tasks?: any[];
  workHours?: any[];
}

interface Department {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  profile: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

const ProjectManagement = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedManager, setSelectedManager] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [budget, setBudget] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const { user } = useAuth();
  const { toast } = useToast();

  // Data queries
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['/api/departments'],
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
  });

  // Mutations
  const createProjectMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      departmentId?: string;
      managerId?: string;
      startDate?: Date;
      endDate?: Date;
      budget?: number;
    }) => {
      return apiRequest('/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          startDate: data.startDate ? format(data.startDate, 'yyyy-MM-dd') : undefined,
          endDate: data.endDate ? format(data.endDate, 'yyyy-MM-dd') : undefined,
          status: 'active',
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Project Aangemaakt",
        description: "Het nieuwe project is succesvol aangemaakt.",
      });
    },
    onError: () => {
      toast({
        title: "Fout",
        description: "Er ging iets mis bij het aanmaken van het project.",
        variant: "destructive",
      });
    },
  });

  const updateProjectStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest(`/api/projects/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({
        title: "Project Bijgewerkt",
        description: "De projectstatus is bijgewerkt.",
      });
    },
  });

  const resetForm = () => {
    setProjectName('');
    setProjectDescription('');
    setSelectedDepartment('');
    setSelectedManager('');
    setStartDate(undefined);
    setEndDate(undefined);
    setBudget('');
  };

  const handleCreateProject = () => {
    if (!projectName.trim()) {
      toast({
        title: "Onvolledige Gegevens",
        description: "Projectnaam is verplicht.",
        variant: "destructive",
      });
      return;
    }

    createProjectMutation.mutate({
      name: projectName,
      description: projectDescription || undefined,
      departmentId: selectedDepartment || undefined,
      managerId: selectedManager || undefined,
      startDate: startDate,
      endDate: endDate,
      budget: budget ? parseFloat(budget) : undefined,
    });
  };

  // Filter projects
  const filteredProjects = projects.filter(project => {
    return filterStatus === 'all' || project.status === filterStatus;
  });

  // Calculate project statistics
  const projectStats = {
    total: projects.length,
    active: projects.filter(p => p.status === 'active').length,
    completed: projects.filter(p => p.status === 'completed').length,
    onHold: projects.filter(p => p.status === 'on_hold').length,
    totalBudget: projects.reduce((sum, p) => sum + (p.budget || 0), 0),
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Actief</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Voltooid</Badge>;
      case 'on_hold':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">On Hold</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getProjectProgress = (project: Project) => {
    // Calculate progress based on tasks completion or time elapsed
    if (project.startDate && project.endDate) {
      const start = new Date(project.startDate);
      const end = new Date(project.endDate);
      const now = new Date();
      
      if (isBefore(now, start)) return 0;
      if (isAfter(now, end)) return 100;
      
      const total = differenceInDays(end, start);
      const elapsed = differenceInDays(now, start);
      return Math.round((elapsed / total) * 100);
    }
    
    // If no dates, base on task completion
    if (project.tasks && project.tasks.length > 0) {
      const completed = project.tasks.filter((task: any) => task.status === 'completed').length;
      return Math.round((completed / project.tasks.length) * 100);
    }
    
    return 0;
  };

  return (
    <div className="space-y-6" data-testid="project-management">
      <div>
        <h1 className="text-3xl font-bold text-primary mb-2" data-testid="page-title">
          Projectbeheer
        </h1>
        <p className="text-muted-foreground">Beheer je projecten, deadlines en budgetten</p>
      </div>

      {/* Project Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Totale Projecten</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="total-projects">
              {projectStats.total}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Actief</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="active-projects">
              {projectStats.active}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Voltooid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400" data-testid="completed-projects">
              {projectStats.completed}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">On Hold</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400" data-testid="onhold-projects">
              {projectStats.onHold}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Totaal Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400" data-testid="total-budget">
              €{projectStats.totalBudget.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <TabsList>
            <TabsTrigger value="list" data-testid="tab-list">Projectlijst</TabsTrigger>
            <TabsTrigger value="kanban" data-testid="tab-kanban">Kanban Board</TabsTrigger>
            <TabsTrigger value="calendar" data-testid="tab-calendar">Kalender</TabsTrigger>
          </TabsList>

          <div className="flex gap-4">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]" data-testid="filter-status">
                <SelectValue placeholder="Alle statussen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle statussen</SelectItem>
                <SelectItem value="active">Actief</SelectItem>
                <SelectItem value="completed">Voltooid</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
              </SelectContent>
            </Select>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-new-project">
                  <Plus className="h-4 w-4 mr-2" />
                  Nieuw Project
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Nieuw Project Aanmaken</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="project-name">Projectnaam *</Label>
                    <Input
                      id="project-name"
                      placeholder="Voer de projectnaam in"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      data-testid="input-project-name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="project-description">Beschrijving</Label>
                    <Textarea
                      id="project-description"
                      placeholder="Beschrijf het project..."
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                      data-testid="input-project-description"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="department">Afdeling</Label>
                      <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                        <SelectTrigger data-testid="select-department">
                          <SelectValue placeholder="Selecteer afdeling" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="manager">Projectmanager</Label>
                      <Select value={selectedManager} onValueChange={setSelectedManager}>
                        <SelectTrigger data-testid="select-manager">
                          <SelectValue placeholder="Selecteer manager" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.map((emp) => (
                            <SelectItem key={emp.profile.id} value={emp.profile.id}>
                              {emp.profile.firstName} {emp.profile.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start-date">Startdatum</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal" data-testid="date-start">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? format(startDate, 'dd/MM/yyyy', { locale: nl }) : 'Selecteer startdatum'}
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

                    <div>
                      <Label htmlFor="end-date">Einddatum</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal" data-testid="date-end">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? format(endDate, 'dd/MM/yyyy', { locale: nl }) : 'Selecteer einddatum'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            disabled={(date) => startDate ? isBefore(date, startDate) : false}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="budget">Budget (€)</Label>
                    <Input
                      id="budget"
                      type="number"
                      placeholder="0.00"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      data-testid="input-budget"
                    />
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Annuleren
                    </Button>
                    <Button 
                      onClick={handleCreateProject}
                      disabled={createProjectMutation.isPending}
                      data-testid="button-create-project"
                    >
                      Project Aanmaken
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Projecten</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Afdeling</TableHead>
                      <TableHead>Manager</TableHead>
                      <TableHead>Periode</TableHead>
                      <TableHead>Voortgang</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Acties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProjects.map((project) => {
                      const progress = getProjectProgress(project);
                      
                      return (
                        <TableRow key={project.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{project.name}</div>
                              {project.description && (
                                <div className="text-sm text-muted-foreground max-w-xs truncate">
                                  {project.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {project.department?.name || '-'}
                          </TableCell>
                          <TableCell>
                            {project.manager ? 
                              `${project.manager.firstName} ${project.manager.lastName}` : 
                              '-'
                            }
                          </TableCell>
                          <TableCell>
                            {project.startDate && project.endDate ? (
                              <div className="text-sm">
                                <div>{format(new Date(project.startDate), 'dd/MM/yy', { locale: nl })}</div>
                                <div className="text-muted-foreground">tot</div>
                                <div>{format(new Date(project.endDate), 'dd/MM/yy', { locale: nl })}</div>
                              </div>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Progress value={progress} className="w-16" />
                              <div className="text-xs text-muted-foreground">{progress}%</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {project.budget ? `€${project.budget.toLocaleString()}` : '-'}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(project.status)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {project.status === 'active' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateProjectStatusMutation.mutate({ id: project.id, status: 'completed' })}
                                    data-testid={`button-complete-${project.id}`}
                                  >
                                    <CheckCircle2 className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateProjectStatusMutation.mutate({ id: project.id, status: 'on_hold' })}
                                    data-testid={`button-hold-${project.id}`}
                                  >
                                    <AlertTriangle className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                              {project.status === 'on_hold' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateProjectStatusMutation.mutate({ id: project.id, status: 'active' })}
                                  data-testid={`button-resume-${project.id}`}
                                >
                                  <Target className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filteredProjects.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          Geen projecten gevonden
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kanban" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Active Projects */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <Target className="h-5 w-5" />
                  Actief ({projectStats.active})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {projects.filter(p => p.status === 'active').map(project => (
                  <Card key={project.id} className="p-4 bg-green-50 dark:bg-green-900/20">
                    <div className="space-y-2">
                      <div className="font-medium">{project.name}</div>
                      {project.description && (
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {project.description}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs">
                        <span>{project.department?.name}</span>
                        <Progress value={getProjectProgress(project)} className="w-16" />
                      </div>
                    </div>
                  </Card>
                ))}
                {projectStats.active === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Geen actieve projecten
                  </div>
                )}
              </CardContent>
            </Card>

            {/* On Hold Projects */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                  <AlertTriangle className="h-5 w-5" />
                  On Hold ({projectStats.onHold})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {projects.filter(p => p.status === 'on_hold').map(project => (
                  <Card key={project.id} className="p-4 bg-yellow-50 dark:bg-yellow-900/20">
                    <div className="space-y-2">
                      <div className="font-medium">{project.name}</div>
                      {project.description && (
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {project.description}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs">
                        <span>{project.department?.name}</span>
                        <Progress value={getProjectProgress(project)} className="w-16" />
                      </div>
                    </div>
                  </Card>
                ))}
                {projectStats.onHold === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Geen projecten on hold
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Completed Projects */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <CheckCircle2 className="h-5 w-5" />
                  Voltooid ({projectStats.completed})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {projects.filter(p => p.status === 'completed').map(project => (
                  <Card key={project.id} className="p-4 bg-blue-50 dark:bg-blue-900/20">
                    <div className="space-y-2">
                      <div className="font-medium">{project.name}</div>
                      {project.description && (
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {project.description}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs">
                        <span>{project.department?.name}</span>
                        <div className="text-green-600 dark:text-green-400 font-semibold">✓ 100%</div>
                      </div>
                    </div>
                  </Card>
                ))}
                {projectStats.completed === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Geen voltooide projecten
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Project Kalender
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-16 text-muted-foreground">
                <CalendarIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Project Kalenderweergave</h3>
                <p>Hier komt een kalenderweergave van alle projecten met hun start- en einddatums.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectManagement;