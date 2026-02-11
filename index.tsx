
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Global error handler for mobile debugging
window.onerror = (message, source, lineno, colno, error) => {
  const msg = `Erro: ${message}\nLinha: ${lineno}\nErro: ${error}`;
  if ((window as any).logDebug) (window as any).logDebug(msg);
  alert(msg);
  return false;
};

if ((window as any).logDebug) (window as any).logDebug('Entrando no index.tsx');

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if ((window as any).logDebug) (window as any).logDebug('React.render chamado');

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => console.log('SW registered:', registration))
      .catch(error => console.log('SW registration failed:', error));
  });
}
