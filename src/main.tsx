import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Auto-update service worker cleanly without stale cache traps
registerSW({
  immediate: true,
  onNeedRefresh() {
    // skipWaiting + clientsClaim in Workbox applies updates immediately
  },
});

createRoot(document.getElementById('root')!).render(<App />);
