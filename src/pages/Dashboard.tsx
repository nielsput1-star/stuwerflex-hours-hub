import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const [user] = useState({ email: "werknemer@stuwflex.nl" });
  const [profile] = useState({ full_name: "Demo Werknemer" });
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = () => {
    navigate('/login');
    toast({
      title: "Uitgelogd",
      description: "Tot ziens!",
    });
  };

  const tasks = [
    { id: 1, name: "Orders picken", available: true },
    { id: 2, name: "EPT rijden", available: false },
    { id: 3, name: "Combi truck", available: true },
    { id: 4, name: "Containers lossen", available: true },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-primary">Stuwflex</h1>
            <Badge variant="secondary">Werknemer Dashboard</Badge>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span className="text-sm">{profile?.full_name || user?.email}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Uitloggen
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Uren Registreren
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button className="w-full mb-2" onClick={() => navigate('/hours')}>
                Uren Invullen
              </Button>
              <Button variant="outline" className="w-full">
                Uren Overzicht
              </Button>
            </CardContent>
          </Card>

          {/* Availability */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Beschikbaarheid
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button className="w-full mb-2" onClick={() => navigate('/availability')}>
                Beschikbaarheid Instellen
              </Button>
              <Button variant="outline" className="w-full">
                Planning Bekijken
              </Button>
            </CardContent>
          </Card>

          {/* Current Tasks */}
          <Card>
            <CardHeader>
              <CardTitle>Huidige Taken</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div key={task.id} className="flex justify-between items-center">
                    <span className="text-sm">{task.name}</span>
                    <Badge variant={task.available ? "default" : "secondary"}>
                      {task.available ? "Beschikbaar" : "Niet beschikbaar"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;