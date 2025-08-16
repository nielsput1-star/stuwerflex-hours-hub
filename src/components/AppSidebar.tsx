import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  Settings, 
  LogOut,
  Building,
  ClipboardList,
  FileText,
  Package
} from 'lucide-react';
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
} from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { isAdmin, signOut } = useAuth();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  const employeeItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Uren Registreren", url: "/time-tracking", icon: Clock },
    { title: "Taken", url: "/tasks", icon: ClipboardList },
    { title: "Mijn Profiel", url: "/profile", icon: Settings },
  ];

  const adminItems = [
    { title: "Admin Dashboard", url: "/admin", icon: LayoutDashboard },
    { title: "Werknemers", url: "/admin/employees", icon: Users },
    { title: "Afdelingen", url: "/admin/departments", icon: Building },
    { title: "Taken Beheer", url: "/admin/tasks", icon: Package },
    { title: "Uren Overzicht", url: "/admin/work-hours", icon: Clock },
    { title: "Rapporten", url: "/admin/reports", icon: FileText },
  ];

  const items = isAdmin ? adminItems : employeeItems;

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <Sidebar className={state === "collapsed" ? "w-14" : "w-60"}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {!collapsed && (isAdmin ? "Administratie" : "Werknemers")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={({ isActive }) => 
                        isActive 
                          ? "bg-accent text-accent-foreground font-medium" 
                          : "hover:bg-accent/50"
                      }
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

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  {state !== "collapsed" && <span>Uitloggen</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}