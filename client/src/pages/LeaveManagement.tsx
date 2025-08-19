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
import { CalendarDays, Plus, Check, X, Clock, Plane, Stethoscope, User, Coffee } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { format, differenceInDays, addDays, isBefore, isAfter } from 'date-fns';
import { nl } from 'date-fns/locale';

interface LeaveRequest {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  comments?: string;
  createdAt: string;
  employee?: {
    profile?: {
      firstName: string;
      lastName: string;
    };
  };
}

const leaveTypes = [
  { value: 'vacation', label: 'Vakantie', icon: Plane, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  { value: 'sick', label: 'Ziek', icon: Stethoscope, color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  { value: 'personal', label: 'Persoonlijk', icon: User, color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  { value: 'comp_time', label: 'Compensatieverlof', icon: Clock, color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  { value: 'unpaid', label: 'Onbetaald verlof', icon: Coffee, color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' },
];

const LeaveManagement = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(addDays(new Date(), 1));
  const [reason, setReason] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  const { user } = useAuth();
  const { toast } = useToast();

  // Calculate days between dates
  const calculateDays = () => {
    if (startDate && endDate) {
      return Math.max(1, differenceInDays(endDate, startDate) + 1);
    }
    return 1;
  };

  // Data queries
  const { data: leaveRequests = [] } = useQuery<LeaveRequest[]>({
    queryKey: ['/api/leave-requests'],
  });

  const { data: leaveBalance } = useQuery({
    queryKey: ['/api/leave-balance'],
  });

  const { data: teamLeaveRequests = [] } = useQuery<LeaveRequest[]>({
    queryKey: ['/api/leave-requests', 'team'],
    enabled: user?.role === 'admin' || user?.role === 'manager',
  });

  // Mutations
  const createLeaveRequestMutation = useMutation({
    mutationFn: async (data: {
      type: string;
      startDate: Date;
      endDate: Date;
      days: number;
      reason: string;
    }) => {
      return apiRequest('/api/leave-requests', {
        method: 'POST',
        body: JSON.stringify({
          type: data.type,
          startDate: format(data.startDate, 'yyyy-MM-dd'),
          endDate: format(data.endDate, 'yyyy-MM-dd'),
          days: data.days,
          reason: data.reason,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leave-requests'] });
      setIsDialogOpen(false);
      setSelectedType('');
      setStartDate(new Date());
      setEndDate(addDays(new Date(), 1));
      setReason('');
      toast({
        title: "Verlofaanvraag Ingediend",
        description: "Je verlofaanvraag is succesvol ingediend en wacht op goedkeuring.",
      });
    },
    onError: () => {
      toast({
        title: "Fout",
        description: "Er ging iets mis bij het indienen van je verlofaanvraag.",
        variant: "destructive",
      });
    },
  });

  const approveLeaveRequestMutation = useMutation({
    mutationFn: async ({ id, comments }: { id: string; comments?: string }) => {
      return apiRequest(`/api/leave-requests/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ comments }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leave-requests'] });
      toast({
        title: "Verlofaanvraag Goedgekeurd",
        description: "De verlofaanvraag is goedgekeurd.",
      });
    },
  });

  const rejectLeaveRequestMutation = useMutation({
    mutationFn: async ({ id, comments }: { id: string; comments?: string }) => {
      return apiRequest(`/api/leave-requests/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ comments }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leave-requests'] });
      toast({
        title: "Verlofaanvraag Afgewezen",
        description: "De verlofaanvraag is afgewezen.",
      });
    },
  });

  const handleSubmitRequest = () => {
    if (!selectedType || !startDate || !endDate) {
      toast({
        title: "Onvolledige Gegevens",
        description: "Vul alle vereiste velden in.",
        variant: "destructive",
      });
      return;
    }

    if (isBefore(startDate, new Date()) || isAfter(startDate, endDate)) {
      toast({
        title: "Ongeldige Datums",
        description: "Controleer je start- en einddatum.",
        variant: "destructive",
      });
      return;
    }

    createLeaveRequestMutation.mutate({
      type: selectedType,
      startDate,
      endDate,
      days: calculateDays(),
      reason,
    });
  };

  // Filter requests
  const filteredRequests = leaveRequests.filter(request => {
    const statusMatch = filterStatus === 'all' || request.status === filterStatus;
    const typeMatch = filterType === 'all' || request.type === filterType;
    return statusMatch && typeMatch;
  });

  const getLeaveTypeInfo = (type: string) => {
    return leaveTypes.find(lt => lt.value === type) || leaveTypes[0];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Goedgekeurd</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Afgewezen</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Wachtend</Badge>;
    }
  };

  return (
    <div className="space-y-6" data-testid="leave-management">
      <div>
        <h1 className="text-3xl font-bold text-primary mb-2" data-testid="page-title">
          Verlofbeheer
        </h1>
        <p className="text-muted-foreground">Beheer je verlofaanvragen en bekijk je verlofsaldo</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Leave Balance Cards */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vakantiedagen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400" data-testid="vacation-balance">
              {leaveBalance?.vacation || 25}
            </div>
            <p className="text-xs text-muted-foreground">Resterende dagen</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ziektedagen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400" data-testid="sick-balance">
              {leaveBalance?.sick || 10}
            </div>
            <p className="text-xs text-muted-foreground">Gebruikte dagen</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Persoonlijk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400" data-testid="personal-balance">
              {leaveBalance?.personal || 5}
            </div>
            <p className="text-xs text-muted-foreground">Resterende dagen</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Compensatie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="comp-balance">
              {leaveBalance?.compTime || 0}
            </div>
            <p className="text-xs text-muted-foreground">Beschikbare uren</p>
          </CardContent>
        </Card>
      </div>

      {/* New Request and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-4">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]" data-testid="filter-status">
              <SelectValue placeholder="Alle statussen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle statussen</SelectItem>
              <SelectItem value="pending">Wachtend</SelectItem>
              <SelectItem value="approved">Goedgekeurd</SelectItem>
              <SelectItem value="rejected">Afgewezen</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[150px]" data-testid="filter-type">
              <SelectValue placeholder="Alle types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle types</SelectItem>
              {leaveTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-request">
              <Plus className="h-4 w-4 mr-2" />
              Nieuwe Aanvraag
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Nieuwe Verlofaanvraag</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="leave-type">Type Verlof</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger data-testid="select-leave-type">
                    <SelectValue placeholder="Selecteer type verlof" />
                  </SelectTrigger>
                  <SelectContent>
                    {leaveTypes.map(type => {
                      const Icon = type.icon;
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-date">Startdatum</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal" data-testid="date-start">
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, 'dd/MM/yyyy', { locale: nl }) : 'Selecteer datum'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        disabled={(date) => isBefore(date, new Date())}
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
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, 'dd/MM/yyyy', { locale: nl }) : 'Selecteer datum'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        disabled={(date) => !startDate || isBefore(date, startDate)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">
                  Aantal dagen: <span className="font-semibold text-foreground">{calculateDays()}</span>
                </Label>
              </div>

              <div>
                <Label htmlFor="reason">Reden (optioneel)</Label>
                <Textarea
                  id="reason"
                  placeholder="Beschrijf de reden voor je verlofaanvraag..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  data-testid="input-reason"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuleren
                </Button>
                <Button 
                  onClick={handleSubmitRequest}
                  disabled={createLeaveRequestMutation.isPending}
                  data-testid="button-submit-request"
                >
                  Aanvraag Indienen
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Mijn Verlofaanvragen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Periode</TableHead>
                  <TableHead>Dagen</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ingediend</TableHead>
                  <TableHead>Reden</TableHead>
                  {(user?.role === 'admin' || user?.role === 'manager') && (
                    <TableHead>Acties</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => {
                  const typeInfo = getLeaveTypeInfo(request.type);
                  const Icon = typeInfo.icon;
                  
                  return (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <Badge className={typeInfo.color}>
                            {typeInfo.label}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{format(new Date(request.startDate), 'dd/MM/yyyy', { locale: nl })}</div>
                          <div className="text-muted-foreground">tot</div>
                          <div>{format(new Date(request.endDate), 'dd/MM/yyyy', { locale: nl })}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">{request.days}</span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(request.status)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(request.createdAt), 'dd/MM/yyyy', { locale: nl })}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {request.reason || '-'}
                      </TableCell>
                      {(user?.role === 'admin' || user?.role === 'manager') && request.status === 'pending' && (
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-600 hover:bg-green-50"
                              onClick={() => approveLeaveRequestMutation.mutate({ id: request.id })}
                              data-testid={`button-approve-${request.id}`}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-600 hover:bg-red-50"
                              onClick={() => rejectLeaveRequestMutation.mutate({ id: request.id })}
                              data-testid={`button-reject-${request.id}`}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
                {filteredRequests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Geen verlofaanvragen gevonden
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Team Requests for Managers/Admins */}
      {(user?.role === 'admin' || user?.role === 'manager') && (
        <Card>
          <CardHeader>
            <CardTitle>Team Verlofaanvragen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medewerker</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Periode</TableHead>
                    <TableHead>Dagen</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamLeaveRequests.filter(r => r.status === 'pending').map((request) => {
                    const typeInfo = getLeaveTypeInfo(request.type);
                    const Icon = typeInfo.icon;
                    
                    return (
                      <TableRow key={request.id}>
                        <TableCell>
                          {request.employee?.profile ? 
                            `${request.employee.profile.firstName} ${request.employee.profile.lastName}` : 
                            'Onbekende medewerker'
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <Badge className={typeInfo.color}>
                              {typeInfo.label}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {format(new Date(request.startDate), 'dd/MM', { locale: nl })} - {format(new Date(request.endDate), 'dd/MM', { locale: nl })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">{request.days}</span>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(request.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-600 hover:bg-green-50"
                              onClick={() => approveLeaveRequestMutation.mutate({ id: request.id })}
                              data-testid={`button-team-approve-${request.id}`}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Goedkeuren
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-600 hover:bg-red-50"
                              onClick={() => rejectLeaveRequestMutation.mutate({ id: request.id })}
                              data-testid={`button-team-reject-${request.id}`}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Afwijzen
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {teamLeaveRequests.filter(r => r.status === 'pending').length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Geen openstaande team verlofaanvragen
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LeaveManagement;