import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface Props {
  children: ReactNode;
  requireRole?: ("super_admin" | "clinic_admin" | "operator" | "viewer")[];
}

export function ProtectedRoute({ children, requireRole }: Props) {
  const { user, loading, roles } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (requireRole && !roles.some((r) => requireRole.includes(r.role as never))) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}
