import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { LoginPage } from './components/LoginPage';

// Standalone sign-in page. Served to signed-out visitors by middleware.ts; it doesn't include the portal or the spec.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <LoginPage onSuccess={() => window.location.replace('/')} />
    </AuthProvider>
  </StrictMode>
);
