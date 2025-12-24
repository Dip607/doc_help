import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { FloatingChatbot } from "@/components/FloatingChatbot";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Pending from "./pages/Pending";
import Deactivated from "./pages/Deactivated";
import Admin from "./pages/Admin";
import AuditLogs from "./pages/AuditLogs";
import Documents from "./pages/Documents";
import DocumentsList from "./pages/DocumentsList";
import DocumentDetail from "./pages/DocumentDetail";
import ApiKeys from "./pages/ApiKeys";
import Subscription from "./pages/Subscription";
import Settings from "./pages/Settings";
import Developer from "./pages/Developer"; // 1. Import the Developer Page
import NotFound from "./pages/NotFound";

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
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/pending" element={<Pending />} />
            <Route path="/deactivated" element={<Deactivated />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/audit-logs" element={<AuditLogs />} />
            <Route path="/documents/upload" element={<Documents />} />
            <Route path="/documents/list" element={<DocumentsList />} />
            <Route path="/documents/:id" element={<DocumentDetail />} />
            <Route path="/settings/api" element={<ApiKeys />} />
            <Route path="/settings/subscription" element={<Subscription />} />
            <Route path="/settings" element={<Settings />} />
            {/* 2. Added the Developer Route */}
            <Route path="/developer" element={<Developer />} /> 
            <Route path="*" element={<NotFound />} />
          </Routes>
          <FloatingChatbot />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;