import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import TimeTracking from "./pages/TimeTracking";
import TimeTrackingAdvanced from "./pages/TimeTrackingAdvanced";
import Tasks from "./pages/Tasks";
import Profile from "./pages/Profile";
import LeaveManagement from "./pages/LeaveManagement";
import ProjectManagement from "./pages/ProjectManagement";
import AdminEmployees from "./pages/admin/AdminEmployees";
import AdminDepartments from "./pages/admin/AdminDepartments";
import AdminTasks from "./pages/admin/AdminTasks";
import AdminWorkHours from "./pages/admin/AdminWorkHours";
import AdminReports from "./pages/admin/AdminReports";
import NotFound from "./pages/NotFound";

import { queryClient } from "@/lib/queryClient";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/time-tracking" element={
              <ProtectedRoute>
                <Layout>
                  <TimeTracking />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/time-tracking-advanced" element={
              <ProtectedRoute>
                <Layout>
                  <TimeTrackingAdvanced />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/tasks" element={
              <ProtectedRoute>
                <Layout>
                  <Tasks />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/leave-management" element={
              <ProtectedRoute>
                <Layout>
                  <LeaveManagement />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/projects" element={
              <ProtectedRoute>
                <Layout>
                  <ProjectManagement />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/employees" element={
              <ProtectedRoute requireAdmin={true}>
                <Layout>
                  <AdminEmployees />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/departments" element={
              <ProtectedRoute requireAdmin={true}>
                <Layout>
                  <AdminDepartments />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/tasks" element={
              <ProtectedRoute requireAdmin={true}>
                <Layout>
                  <AdminTasks />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/work-hours" element={
              <ProtectedRoute requireAdmin={true}>
                <Layout>
                  <AdminWorkHours />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/reports" element={
              <ProtectedRoute requireAdmin={true}>
                <Layout>
                  <AdminReports />
                </Layout>
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
