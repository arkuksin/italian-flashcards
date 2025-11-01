import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import './lib/env';
import { AuthProvider } from './contexts/AuthContext';
import { ProgressProvider } from './hooks/useProgress';
import { initI18n } from './lib/i18n';

// Initialize i18n before rendering the app
initI18n().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <ProgressProvider>
            <App />
          </ProgressProvider>
        </AuthProvider>
      </BrowserRouter>
    </StrictMode>
  );
}).catch((error) => {
  console.error('Failed to initialize i18n:', error);
  // Render app anyway with fallback language
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <ProgressProvider>
            <App />
          </ProgressProvider>
        </AuthProvider>
      </BrowserRouter>
    </StrictMode>
  );
});
