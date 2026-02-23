import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";
import { useEffect } from "react";
import Index from "./pages/Index";
import UserLogin from "./pages/UserLogin";
import UserRegister from "./pages/UserRegister";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import MemberDetailPage from "./pages/MemberDetailPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected route wrapper
function ProtectedRoute({ element, requireAdmin = false }: { element: React.ReactNode; requireAdmin?: boolean }) {
  const { user, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!requireAdmin && isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return element;
}

// Home page wrapper - redirects if already logged in, prevents Index flash
function HomePage() {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect logged-in users silently without showing Index
  useEffect(() => {
    if (!isLoading && user) {
      navigate(isAdmin ? "/admin/dashboard" : "/dashboard", { replace: true });
    }
  }, [user, isAdmin, isLoading, navigate]);

  // Show loading while auth is being checked OR while redirecting
  if (isLoading || user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  // Only show index page if truly logged out
  return <Index />;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/login" element={<UserLogin />} />
    <Route path="/register" element={<UserRegister />} />
    <Route path="/dashboard" element={<ProtectedRoute element={<UserDashboard />} />} />
    <Route path="/admin/login" element={<Navigate to="/login" replace />} />
    <Route path="/admin/dashboard" element={<ProtectedRoute element={<AdminDashboard />} requireAdmin={true} />} />
    <Route path="/admin/member/:userId" element={<ProtectedRoute element={<MemberDetailPage />} requireAdmin={true} />} />
    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
