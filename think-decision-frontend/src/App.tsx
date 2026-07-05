import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { queryClient } from "./lib/queryClient";
import { ProtectedRoute } from "./router/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { DashboardPage } from "./pages/dashboard/DashboardPage";
import { CreateCasePage } from "./pages/cases/CreateCasePage";
import { CaseDetailPage } from "./pages/cases/CaseDetailPage";
import { CaseResultPage } from "./pages/cases/CaseResultPage";
import { ExpertAssessPage } from "./pages/expert/ExpertAssessPage";
import { ExpertDashboardPage } from "./pages/expert/ExpertDashboardPage";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/cases/new" element={<CreateCasePage />} />
              <Route path="/cases/:id" element={<CaseDetailPage />} />
              <Route path="/cases/:id/results" element={<CaseResultPage />} />
              <Route path="/expert" element={<ExpertDashboardPage />} />
              <Route path="/expert/assess/:caseId" element={<ExpertAssessPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
