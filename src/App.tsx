import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RegistryProvider, useRegistry } from '@/data/RegistryContext';
import { SearchProvider } from '@/context/SearchContext';
import { DetailTabProvider } from '@/context/DetailTabContext';
import { AppShell } from '@/components/layout/AppShell';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { SsoLogin } from '@/components/registry/SsoLogin';
// Pages
import { HomePage } from '@/pages/HomePage';
import { CatalogPage } from '@/pages/CatalogPage';
import { ServerDetailPage } from '@/pages/ServerDetailPage';
import { AgentDetailPage } from '@/pages/AgentDetailPage';
import { SkillDetailPage } from '@/pages/SkillDetailPage';
import { PromptDetailPage } from '@/pages/PromptDetailPage';
import { WorkspacesPage } from '@/pages/WorkspacesPage';
import { WorkspaceDetailPage } from '@/pages/WorkspaceDetailPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ApprovalsPage } from '@/pages/ApprovalsPage';

function MyRegistryRedirect() {
  const { currentUser } = useRegistry();
  const personalWsId = currentUser?.role === 'super_admin' ? 'jordans-workspace' : 'alexs-workspace';
  return <Navigate to={`/workspaces/${personalWsId}`} replace />;
}

function AppContent() {
  const { currentUser } = useRegistry();

  if (!currentUser) {
    return <SsoLogin />;
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/servers/:id" element={<ServerDetailPage />} />
        <Route path="/agents/:id" element={<AgentDetailPage />} />
        <Route path="/skills/:id" element={<SkillDetailPage />} />
        <Route path="/prompts/:id" element={<PromptDetailPage />} />
        <Route path="/workspaces" element={<WorkspacesPage />} />
        <Route path="/workspaces/:id" element={<WorkspaceDetailPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/approvals" element={<ApprovalsPage />} />
        <Route path="/my-registry" element={<MyRegistryRedirect />} />
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
