
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LessonProvider } from './context/LessonContext';
import { ToastProvider } from './context/ToastContext';

const AppWrapper: React.FC = () => {
    const { currentUser } = useAuth();
    return (
        <ToastProvider>
            <LessonProvider currentUser={currentUser}>
                <App />
            </LessonProvider>
        </ToastProvider>
    );
};

const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error("Could not find root element to mount to");
}

window.onerror = (message, source, lineno, colno, error) => {
    console.error(`Erro: ${message}\nLinha: ${lineno}\nErro: ${error}`);
    return false;
};

const root = ReactDOM.createRoot(rootElement);
root.render(
    <React.StrictMode>
        <AuthProvider>
            <AppWrapper />
        </AuthProvider>
    </React.StrictMode>
);

if ((window as any).logDebug) (window as any).logDebug('React.render chamado');

// Register Service Worker for PWA (Disabled temporarily for debugging)
/*
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => console.log('SW registered:', registration))
      .catch(error => console.log('SW registration failed:', error));
  });
}
*/
