// ──────────────────────────────────────────────────────────────
// ProtectedRoute — require a signed-in Clerk session
// ──────────────────────────────────────────────────────────────
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@clerk/react";

export default function ProtectedRoute() {
  const { isLoaded, isSignedIn } = useAuth();
  const location = useLocation();

  if (!isLoaded) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-slate-400">
        Checking authentication…
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <Navigate to="/sign-in" replace state={{ from: location.pathname }} />
    );
  }

  return <Outlet />;
}
