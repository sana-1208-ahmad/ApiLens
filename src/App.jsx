import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Overview from './pages/Overview';
import HarUpload from './pages/HarUpload';
import ApiExplorer from './pages/ApiExplorer';
import RequestInspector from './pages/RequestInspector';
import SecurityInspector from './pages/SecurityInspector';
import ApiFlowMap from './pages/ApiFlowMap';
import AiAnalyst from './pages/AiAnalyst';
import Reports from './pages/Reports';

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Overview />} />
        <Route path="/overview" element={<Navigate to="/" replace />} />
        <Route path="/har-upload" element={<HarUpload />} />
        <Route path="/api-explorer" element={<ApiExplorer />} />
        <Route path="/request-inspector" element={<RequestInspector />} />
        <Route path="/security-inspector" element={<SecurityInspector />} />
        <Route path="/api-flow-map" element={<ApiFlowMap />} />
        <Route path="/ai-analyst" element={<AiAnalyst />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
