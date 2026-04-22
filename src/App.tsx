import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import NotFound from "./pages/NotFound.tsx";
import Dashboard from "./pages/app/Dashboard.tsx";
import QueuePanel from "./pages/app/QueuePanel.tsx";
import TVPanel from "./pages/app/TVPanel.tsx";
import Admin from "./pages/app/Admin.tsx";
import Schedule from "./pages/app/Schedule.tsx";
import Companies from "./pages/app/Companies.tsx";
import ClientView from "./pages/ClientView.tsx";
import CollaboratorPortal from "./pages/CollaboratorPortal.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/q/:token" element={<ClientView />} />
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/queue"
              element={
                <ProtectedRoute>
                  <QueuePanel />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/tv"
              element={
                <ProtectedRoute>
                  <TVPanel />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/admin"
              element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/schedule"
              element={
                <ProtectedRoute>
                  <Schedule />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/companies"
              element={
                <ProtectedRoute>
                  <Companies />
                </ProtectedRoute>
              }
            />
            <Route path="/c/:token" element={<CollaboratorPortal />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
