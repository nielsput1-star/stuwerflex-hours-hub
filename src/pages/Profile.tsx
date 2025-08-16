import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Profile = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [firstName, setFirstName] = useState(profile?.first_name || '');
  const [lastName, setLastName] = useState(profile?.last_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!profile) return;
    
    setLoading(true);
    
    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: firstName,
        last_name: lastName,
        phone: phone
      })
      .eq('id', profile.id);
    
    if (error) {
      toast({
        title: "Fout",
        description: "Kon profiel niet bijwerken",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Profiel bijgewerkt",
        description: "Je profiel is succesvol bijgewerkt"
      });
    }
    
    setLoading(false);
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      admin: 'Beheerder',
      manager: 'Manager',
      employee: 'Werknemer'
    };
    return labels[role as keyof typeof labels] || role;
  };

  const getRoleColor = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      manager: 'bg-blue-100 text-blue-800',
      employee: 'bg-green-100 text-green-800'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (!profile) {
    return <div>Laden...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mijn Profiel</h1>
        <p className="text-muted-foreground">Beheer je persoonlijke informatie</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Persoonlijke Informatie</CardTitle>
            <CardDescription>Je basis profiel informatie</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="firstName">Voornaam</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="lastName">Achternaam</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="phone">Telefoonnummer</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="06-12345678"
              />
            </div>
            
            <Button onClick={handleSave} disabled={loading} className="w-full">
              {loading ? 'Bezig...' : 'Opslaan'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Informatie</CardTitle>
            <CardDescription>Je account details (alleen-lezen)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input value={profile.email} disabled />
            </div>
            
            <div className="grid gap-2">
              <Label>Personeelsnummer</Label>
              <Input value={profile.employee_number || 'Niet toegewezen'} disabled />
            </div>
            
            <div className="grid gap-2">
              <Label>Rol</Label>
              <div>
                <Badge className={getRoleColor(profile.role)}>
                  {getRoleLabel(profile.role)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;