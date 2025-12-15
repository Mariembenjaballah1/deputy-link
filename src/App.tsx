import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import Index from "./pages/Index";
import MPProfile from "./pages/MPProfile";
import NewComplaint from "./pages/NewComplaint";
import Complaints from "./pages/Complaints";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import MPDashboard from "./pages/MPDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  
  if (isAuthenticated && user) {
    if (user.role === 'mp') return <Navigate to="/mp-dashboard" replace />;
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-center" />
      <BrowserRouter>
        <Routes>
          {/* Public Auth Route */}
          <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
          
          {/* Citizen Routes */}
          <Route path="/" element={<ProtectedRoute allowedRoles={['citizen']}><Index /></ProtectedRoute>} />
          <Route path="/mp/:id" element={<ProtectedRoute allowedRoles={['citizen']}><MPProfile /></ProtectedRoute>} />
          <Route path="/complaint/new" element={<ProtectedRoute allowedRoles={['citizen']}><NewComplaint /></ProtectedRoute>} />
          <Route path="/complaints" element={<ProtectedRoute allowedRoles={['citizen']}><Complaints /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute allowedRoles={['citizen']}><Notifications /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute allowedRoles={['citizen']}><Profile /></ProtectedRoute>} />
          
          {/* MP Routes */}
          <Route path="/mp-dashboard" element={<ProtectedRoute allowedRoles={['mp']}><MPDashboard /></ProtectedRoute>} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
