import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import LoginPage from "@/pages/login";
import UniversityDashboard from "@/pages/university-dashboard";
import StudentDashboard from "@/pages/student-dashboard";
import VerifierDashboard from "@/pages/verifier-dashboard";
import FabricStatus from "@/components/FabricStatus";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={LoginPage} />
      <Route path="/university" component={UniversityDashboard} />
      <Route path="/student" component={StudentDashboard} />
      <Route path="/verifier" component={VerifierDashboard} />
      <Route component={LoginPage} />
    </Switch>
  );
}

function AppInner() {
  const { restoreSession, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    restoreSession();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-100">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin w-8 h-8 text-blue-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          <p className="text-sm text-slate-400">Kết nối Fabric network...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Router />
      <FabricStatus />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInner />
    </QueryClientProvider>
  );
}

export default App;
