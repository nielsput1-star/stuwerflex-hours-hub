import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, Calendar, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  role: string;
  employee_number: string | null;
  created_at: string;
}

interface EmployeeData {
  hire_date: string;
  status: string;
  hourly_rate: number | null;
  departments: { name: string } | null;
}

const Profile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [employee, setEmployee] = useState<EmployeeData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return;
      }

      setProfile(profileData);
      setFirstName(profileData.first_name);
      setLastName(profileData.last_name);
      setPhone(profileData.phone || '');

      // Fetch employee data
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select(`
          hire_date,
          status,
          hourly_rate,
          departments (name)
        `)
        .eq('profile_id', profileData.id)
        .single();

      if (!employeeError && employeeData) {
        setEmployee(employeeData);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          phone: phone || null,
        })
        .eq('id', profile.id);

      if (error) {
        toast({
          title: "Fout",
          description: "Kon profiel niet bijwerken",
          variant: "destructive",
        });
      } else {
        setIsEditing(false);
        fetchProfile();
        toast({
          title: "Profiel bijgewerkt",
          description: "Je gegevens zijn succesvol opgeslagen",
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleCancel = () => {
    setFirstName(profile?.first_name || '');
    setLastName(profile?.last_name || '');
    setPhone(profile?.phone || '');
    setIsEditing(false);
  };

  const getRoleColor = (role: string) => {
    return role === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 
           'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
  };

  const getRoleName = (role: string) => {
    return role === 'admin' ? 'Administrator' : 'Medewerker';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Profiel niet gevonden</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary mb-2">Profiel</h1>
        <p className="text-muted-foreground">Beheer je persoonlijke gegevens</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Persoonlijke Gegevens
            </CardTitle>
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                Bewerken
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first-name">Voornaam</Label>
                    <Input
                      id="first-name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last-name">Achternaam</Label>
                    <Input
                      id="last-name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefoon</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Optioneel"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSave}>Opslaan</Button>
                  <Button variant="outline" onClick={handleCancel}>Annuleren</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.first_name} {profile.last_name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.email}</span>
                </div>
                {profile.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Badge className={getRoleColor(profile.role)}>
                    {getRoleName(profile.role)}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Employment Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Werkgegevens
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile.employee_number && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">Personeelsnummer:</span>
                <span className="text-sm">{profile.employee_number}</span>
              </div>
            )}
            {employee && (
              <>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    In dienst sinds: {new Date(employee.hire_date).toLocaleDateString('nl-NL')}
                  </span>
                </div>
                {employee.departments && (
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Afdeling: {employee.departments.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                    {employee.status === 'active' ? 'Actief' : 'Inactief'}
                  </Badge>
                </div>
                {employee.hourly_rate && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">Uurtarief:</span>
                    <span className="text-sm">€{employee.hourly_rate.toFixed(2)}</span>
                  </div>
                )}
              </>
            )}
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                Lid sinds: {new Date(profile.created_at).toLocaleDateString('nl-NL')}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;