import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ClientDashboard from "./pages/client/Dashboard";
import CreateJob from "./pages/client/CreateJob";
import JobDetail from "./pages/client/JobDetail";
import JobsList from "./pages/client/JobsList";
import SpecialistDashboard from "./pages/specialist/Dashboard";
import BrowseJobs from "./pages/specialist/BrowseJobs";
import SpecialistJobDetail from "./pages/specialist/JobDetail";
import MyBids from "./pages/specialist/MyBids";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user, role, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      
      {/* Client Routes */}
      <Route path="/client" element={<ProtectedRoute allowedRoles={['client', 'admin']}><ClientDashboard /></ProtectedRoute>} />
      <Route path="/client/jobs" element={<ProtectedRoute allowedRoles={['client', 'admin']}><JobsList /></ProtectedRoute>} />
      <Route path="/client/jobs/new" element={<ProtectedRoute allowedRoles={['client', 'admin']}><CreateJob /></ProtectedRoute>} />
      <Route path="/client/jobs/:id" element={<ProtectedRoute allowedRoles={['client', 'admin']}><JobDetail /></ProtectedRoute>} />
      
      {/* Specialist Routes */}
      <Route path="/specialist" element={<ProtectedRoute allowedRoles={['specialist', 'admin']}><SpecialistDashboard /></ProtectedRoute>} />
      <Route path="/specialist/browse" element={<ProtectedRoute allowedRoles={['specialist', 'admin']}><BrowseJobs /></ProtectedRoute>} />
      <Route path="/specialist/jobs/:id" element={<ProtectedRoute allowedRoles={['specialist', 'admin']}><SpecialistJobDetail /></ProtectedRoute>} />
      <Route path="/specialist/bids" element={<ProtectedRoute allowedRoles={['specialist', 'admin']}><MyBids /></ProtectedRoute>} />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
