import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FeaturePage from './pages/FeaturePage';
import AIHistory from './pages/AIHistory';
import KanbanBoard from './pages/KanbanBoard';
import JurisdictionRules from './pages/JurisdictionRules';
import FeeCalculator from './pages/FeeCalculator';
import AIPredictive from './pages/AIPredictive';
import Integrations from './pages/Integrations';
import './App.css';

// // === Batch 06 Gaps & Frontend Mounts ===
import CFAiPlanPreScreeningPage from './pages/CFAiPlanPreScreeningPage';
import CFZoningAssistantChatbotPage from './pages/CFZoningAssistantChatbotPage';
import CFInspectionRoutingOptimizationPage from './pages/CFInspectionRoutingOptimizationPage';
import CFViolationEscalationScoringPage from './pages/CFViolationEscalationScoringPage';
import CFNeighborhoodImpactAnalysisPage from './pages/CFNeighborhoodImpactAnalysisPage';
import GapExistingAihistoryJsAndAipermitJsStubsNeedRPage from './pages/GapExistingAihistoryJsAndAipermitJsStubsNeedRPage';
import GapPlansWithoutPlanPage from './pages/GapPlansWithoutPlanPage';
import GapInspectionsWithoutInspectionPage from './pages/GapInspectionsWithoutInspectionPage';
import GapViolationsWithoutViolationPage from './pages/GapViolationsWithoutViolationPage';
import GapCodeWithoutCodePage from './pages/GapCodeWithoutCodePage';
import GapNoCadGisIntegrationPlanViewerParcelMapsPage from './pages/GapNoCadGisIntegrationPlanViewerParcelMapsPage';
import GapNoPublicPortalOnlinePermitTrackingDocSubmisPage from './pages/GapNoPublicPortalOnlinePermitTrackingDocSubmisPage';
import GapNoFeeCalculationEnginePage from './pages/GapNoFeeCalculationEnginePage';
import GapLimitedIntegrationWithTitleDeedRecordsIntegrPage from './pages/GapLimitedIntegrationWithTitleDeedRecordsIntegrPage';
import GapNoDocumentVersioningForPlansPage from './pages/GapNoDocumentVersioningForPlansPage';
import GapLimitedFrontendOnly7PagesFor19Page from './pages/GapLimitedFrontendOnly7PagesFor19Page';
import GapNoNotificationsLayerGrepShowsOnly1MentionPage from './pages/GapNoNotificationsLayerGrepShowsOnly1MentionPage';
import GapNoWebhooksForInspectionSchedulingTriggersPage from './pages/GapNoWebhooksForInspectionSchedulingTriggersPage';
import GapNoAuditLogOnly1AuditReferencePage from './pages/GapNoAuditLogOnly1AuditReferencePage';
import CustomViewsPage from './pages/CustomViewsPage';
import CodexCustomVizFeature from './pages/CodexCustomVizFeature';
import CodexOperationsFeature from './pages/CodexOperationsFeature';

import TimelineView from './pages/TimelineView';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) return <div className="loading-screen">Loading...</div>;

  return (
    <Router>
      <Routes>
        <Route path="/insights/timeline" element={<TimelineView />} />
        <Route path="/codex/custom-viz" element={<CodexCustomVizFeature />} />
        <Route path="/codex/operations" element={<CodexOperationsFeature />} />

        <Route path="/login" element={
          user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />
        } />
        <Route path="/" element={
          user ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
        } />
        <Route path="/feature/:featureKey" element={
          user ? <FeaturePage user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
        } />
        <Route path="/ai-history" element={
          user ? <AIHistory user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
        } />
        <Route path="/kanban" element={
          user ? <KanbanBoard user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
        } />
        <Route path="/jurisdiction-rules" element={
          user ? <JurisdictionRules user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
        } />
        <Route path="/fee-calculator" element={
          user ? <FeeCalculator user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
        } />
        <Route path="/ai-predictive" element={
          user ? <AIPredictive user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
        } />
        <Route path="/integrations" element={
          user ? <Integrations user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
        } />
      
          {/* // === Batch 06 Gaps & Frontend Mounts === */}
          <Route path="/cf-ai-plan-pre-screening" element={<CFAiPlanPreScreeningPage />} />
          <Route path="/cf-zoning-assistant-chatbot" element={<CFZoningAssistantChatbotPage />} />
          <Route path="/cf-inspection-routing-optimization" element={<CFInspectionRoutingOptimizationPage />} />
          <Route path="/cf-violation-escalation-scoring" element={<CFViolationEscalationScoringPage />} />
          <Route path="/cf-neighborhood-impact-analysis" element={<CFNeighborhoodImpactAnalysisPage />} />
          <Route path="/gap-existing-aihistory-js-and-aipermit-js-stubs-need-r" element={<GapExistingAihistoryJsAndAipermitJsStubsNeedRPage />} />
          <Route path="/gap-plans-without-plan" element={<GapPlansWithoutPlanPage />} />
          <Route path="/gap-inspections-without-inspection" element={<GapInspectionsWithoutInspectionPage />} />
          <Route path="/gap-violations-without-violation" element={<GapViolationsWithoutViolationPage />} />
          <Route path="/gap-code-without-code" element={<GapCodeWithoutCodePage />} />
          <Route path="/gap-no-cad-gis-integration-plan-viewer-parcel-maps" element={<GapNoCadGisIntegrationPlanViewerParcelMapsPage />} />
          <Route path="/gap-no-public-portal-online-permit-tracking-doc-submis" element={<GapNoPublicPortalOnlinePermitTrackingDocSubmisPage />} />
          <Route path="/gap-no-fee-calculation-engine" element={<GapNoFeeCalculationEnginePage />} />
          <Route path="/gap-limited-integration-with-title-deed-records-integr" element={<GapLimitedIntegrationWithTitleDeedRecordsIntegrPage />} />
          <Route path="/gap-no-document-versioning-for-plans" element={<GapNoDocumentVersioningForPlansPage />} />
          <Route path="/gap-limited-frontend-only-7-pages-for-19" element={<GapLimitedFrontendOnly7PagesFor19Page />} />
          <Route path="/gap-no-notifications-layer-grep-shows-only-1-mention" element={<GapNoNotificationsLayerGrepShowsOnly1MentionPage />} />
          <Route path="/gap-no-webhooks-for-inspection-scheduling-triggers" element={<GapNoWebhooksForInspectionSchedulingTriggersPage />} />
          <Route path="/gap-no-audit-log-only-1-audit-reference" element={<GapNoAuditLogOnly1AuditReferencePage />} />
          <Route path="/custom-views" element={
            user ? <CustomViewsPage user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
          } />
        </Routes>
    </Router>
  );
}

export default App;
