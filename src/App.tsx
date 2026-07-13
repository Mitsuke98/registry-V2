import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RegistryProvider, useRegistry } from '@/data/RegistryContext';
import { SearchProvider } from '@/context/SearchContext';
import { DetailTabProvider } from '@/context/DetailTabContext';
import { AppShell } from '@/components/layout/AppShell';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { SsoLogin } from '@/components/registry/SsoLogin';
// Pages
import { CatalogPage } from '@/pages/CatalogPage';
import { ServerDetailPage } from '@/pages/ServerDetailPage';
import { AgentDetailPage } from '@/pages/AgentDetailPage';
import { SkillDetailPage } from '@/pages/SkillDetailPage';
import { PromptDetailPage } from '@/pages/PromptDetailPage';
import { WorkspacesPage } from '@/pages/WorkspacesPage';
import { WorkspaceDetailPage } from '@/pages/WorkspaceDetailPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ApprovalsPage } from '@/pages/ApprovalsPage';
import { UserHomePage } from '@/pages/UserHomePage';
import { AdminDashboardPage } from '@/pages/AdminDashboardPage';
import { AllAssetsPage } from '@/pages/AllAssetsPage';
import { UsersPage } from '@/pages/UsersPage';
import { CapabilityDetailPage } from '@/pages/CapabilityDetailPage';
import { HomePage } from '@/pages/HomePage';

function AppContent() {
  const { currentUser, can } = useRegistry();

  if (!currentUser) {
    return <SsoLogin />;
  }

  const isSA = currentUser.role === 'super_admin';

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={isSA ? <Navigate to="/dashboard" replace /> : <Navigate to="/home" replace />} />
        <Route path="/home" element={isSA ? <Navigate to="/dashboard" replace /> : <HomePage />} />
        <Route path="/dashboard" element={isSA ? <AdminDashboardPage /> : <Navigate to="/home" replace />} />
        <Route path="/assets" element={isSA ? <AllAssetsPage /> : <Navigate to="/home" replace />} />
        <Route path="/users" element={isSA ? <UsersPage /> : <Navigate to="/home" replace />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/servers/:id" element={<ServerDetailPage />} />
        <Route path="/agents/:id" element={<AgentDetailPage />} />
        <Route path="/skills/:id" element={<SkillDetailPage />} />
        <Route path="/prompts/:id" element={<PromptDetailPage />} />
        <Route path="/tools/:id" element={<CapabilityDetailPage kind="tool" />} />
        <Route path="/resources/:id" element={<CapabilityDetailPage kind="resource" />} />
        <Route path="/capability-prompts/:id" element={<CapabilityDetailPage kind="prompt" />} />
        <Route path="/my-registry" element={<UserHomePage />} />
        <Route path="/workspaces" element={<WorkspacesPage />} />
        <Route path="/workspaces/:id" element={<WorkspaceDetailPage />} />
        <Route path="/register" element={can('register') ? <RegisterPage /> : <Navigate to="/approvals" replace />} />
        <Route path="/approvals" element={isSA ? <ApprovalsPage /> : <Navigate to="/home" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}

function App() {
  return (
    <HashRouter>
      <RegistryProvider>
        <SearchProvider>
          <DetailTabProvider>
            <TooltipProvider>
              <AppContent />
              <Toaster position="top-right" />
            </TooltipProvider>
          </DetailTabProvider>
        </SearchProvider>
      </RegistryProvider>
    </HashRouter>
  );
}

export default App;
