import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  Home, 
  Clock, 
  CheckSquare, 
  User, 
  Users, 
  Building2, 
  ListTodo, 
  BarChart3,
  Settings
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";

interface UserProfile {
  role: 'admin' | 'employee';
}

const employeeItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Uren Registreren", url: "/time-tracking", icon: Clock },
  { title: "Taken", url: "/tasks", icon: CheckSquare },
  { title: "Profiel", url: "/profile", icon: User },
];

const adminItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Uren Registreren", url: "/time-tracking", icon: Clock },
  { title: "Taken", url: "/tasks", icon: CheckSquare },
  { title: "Profiel", url: "/profile", icon: User },
];

const adminManagementItems = [
  { title: "Medewerkers", url: "/admin/employees", icon: Users },
  { title: "Afdelingen", url: "/admin/departments", icon: Building2 },
  { title: "Taken Beheer", url: "/admin/tasks", icon: ListTodo },
  { title: "Uren Overzicht", url: "/admin/work-hours", icon: Clock },
  { title: "Rapporten", url: "/admin/reports", icon: BarChart3 },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const currentPath = location.pathname;

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        
        if (data && !error) {
          setUserProfile({ role: data.role as 'admin' | 'employee' });
        }
      }
    };

    fetchUserProfile();
  }, [user]);

  const isActive = (path: string) => currentPath === path;
  const getNavCls = (active: boolean) =>
    active ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "hover:bg-sidebar-accent/50";

  const isAdmin = userProfile?.role === 'admin';

  return (
    <Sidebar className={state === "collapsed" ? "w-14" : "w-60"} collapsible="icon">
      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Hoofdmenu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {(isAdmin ? adminItems : employeeItems).map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={getNavCls(isActive(item.url))}
                    >
                        <item.icon className="h-4 w-4" />
                        {state !== "collapsed" && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Management */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Beheer</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminManagementItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        className={getNavCls(isActive(item.url))}
                      >
                        <item.icon className="h-4 w-4" />
                        {state !== "collapsed" && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}