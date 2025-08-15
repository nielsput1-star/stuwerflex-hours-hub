import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Users, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-primary mb-4">
            Stuwflex
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Urenregistratie & Personeelsplanning
          </p>
          <Button size="lg" onClick={() => navigate('/login')}>
            Inloggen
          </Button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-primary" />
                Uren Registratie
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Eenvoudig uren invullen en bijhouden voor alle taken
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-primary" />
                Beschikbaarheid
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Plan je beschikbaarheid voor verschillende taken
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-primary" />
                Team Overzicht
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Admin dashboard met volledig team overzicht
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
