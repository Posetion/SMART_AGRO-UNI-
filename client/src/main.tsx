import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { MyanmarDigitObserver } from './components/MyanmarDigitObserver';
import './styles.css';

if ('serviceWorker' in navigator) {
  void navigator.serviceWorker.getRegistrations().then((regs) =>
    Promise.all(regs.map((reg) => reg.unregister()))
  );
}
if (typeof caches !== 'undefined') {
  void caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))));
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <MyanmarDigitObserver />
        <AuthProvider>
          <App />
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>
);
