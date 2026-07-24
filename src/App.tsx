import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// Public pages (eager — landing loads fast, small bundle)
import Index from "./pages/Index";
import Services from "./pages/Services";
import Cities from "./pages/Cities";
import NotFound from "./pages/NotFound";

// Authenticated / role-scoped pages (lazy)
const Auth = lazy(() => import("./pages/Auth"));
const ClientDashboard = lazy(() => import("./pages/client/Dashboard"));
const ClientProfile = lazy(() => import("./pages/client/Profile"));
const CreateJob = lazy(() => import("./pages/client/CreateJob"));
const JobDetail = lazy(() => import("./pages/client/JobDetail"));
const JobsList = lazy(() => import("./pages/client/JobsList"));
const ClientContractDetail = lazy(() => import("./pages/client/ContractDetail"));
const SpecialistDashboard = lazy(() => import("./pages/specialist/Dashboard"));
const SpecialistProfile = lazy(() => import("./pages/specialist/Profile"));
const BrowseJobs = lazy(() => import("./pages/specialist/BrowseJobs"));
const SpecialistJobDetail = lazy(() => import("./pages/specialist/JobDetail"));
const MyBids = lazy(() => import("./pages/specialist/MyBids"));
const MyContracts = lazy(() => import("./pages/specialist/MyContracts"));
const Earnings = lazy(() => import("./pages/specialist/Earnings"));
const SpecialistContractDetail = lazy(() => import("./pages/specialist/ContractDetail"));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center text-muted-foreground">Cargando...</div>
);

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user, role, isLoading } = useAuth();

  if (isLoading) {
    return <RouteFallback />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles) {
    if (role === null) {
      return <RouteFallback />;
    }
    if (!allowedRoles.includes(role)) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}

function ProfileRedirect() {
  const { user, role, isLoading } = useAuth();

  if (isLoading) {
    return <RouteFallback />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (role === 'specialist') {
    return <Navigate to={`/specialist/profile/${user.id}`} replace />;
  }
  return <Navigate to={`/client/profile/${user.id}`} replace />;
}

function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/servicios" element={<Services />} />
        <Route path="/ciudades" element={<Cities />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/profile" element={<ProfileRedirect />} />

        {/* Client Routes */}
        <Route path="/client" element={<ProtectedRoute allowedRoles={['client', 'admin']}><ClientDashboard /></ProtectedRoute>} />
        <Route path="/client/profile/:id" element={<ProtectedRoute><ClientProfile /></ProtectedRoute>} />
        <Route path="/client/jobs" element={<ProtectedRoute allowedRoles={['client', 'admin']}><JobsList /></ProtectedRoute>} />
        <Route path="/client/jobs/new" element={<ProtectedRoute allowedRoles={['client', 'admin']}><CreateJob /></ProtectedRoute>} />
        <Route path="/client/jobs/:id" element={<ProtectedRoute allowedRoles={['client', 'admin']}><JobDetail /></ProtectedRoute>} />
        <Route path="/client/contracts/:id" element={<ProtectedRoute allowedRoles={['client', 'admin']}><ClientContractDetail /></ProtectedRoute>} />

        {/* Specialist Routes */}
        <Route path="/specialist" element={<ProtectedRoute allowedRoles={['specialist', 'admin']}><SpecialistDashboard /></ProtectedRoute>} />
        <Route path="/specialist/profile/:id" element={<ProtectedRoute><SpecialistProfile /></ProtectedRoute>} />
        <Route path="/specialist/browse" element={<ProtectedRoute allowedRoles={['specialist', 'admin']}><BrowseJobs /></ProtectedRoute>} />
        <Route path="/specialist/jobs/:id" element={<ProtectedRoute allowedRoles={['specialist', 'admin']}><SpecialistJobDetail /></ProtectedRoute>} />
        <Route path="/specialist/bids" element={<ProtectedRoute allowedRoles={['specialist', 'admin']}><MyBids /></ProtectedRoute>} />
        <Route path="/specialist/contracts" element={<ProtectedRoute allowedRoles={['specialist', 'admin']}><MyContracts /></ProtectedRoute>} />
        <Route path="/specialist/contracts/:id" element={<ProtectedRoute allowedRoles={['specialist', 'admin']}><SpecialistContractDetail /></ProtectedRoute>} />
        <Route path="/specialist/earnings" element={<ProtectedRoute allowedRoles={['specialist', 'admin']}><Earnings /></ProtectedRoute>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
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
