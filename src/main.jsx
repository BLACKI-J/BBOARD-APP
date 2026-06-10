import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { UiProvider } from './ui/UiProvider.jsx';
import './index.css';
import './App.css';

import "mobile-drag-drop/default.css";

// Polyfill drag-drop tactile chargé en différé (utilisé seulement par le Planning) :
// hors du bundle initial → démarrage plus léger sur mobile.
window.addEventListener('load', () => {
    Promise.all([
        import("mobile-drag-drop"),
        import("mobile-drag-drop/scroll-behaviour"),
    ]).then(([{ polyfill }, { scrollBehaviourDragImageTranslateOverride }]) => {
        polyfill({ dragImageTranslateOverride: scrollBehaviourDragImageTranslateOverride });
    }).catch(() => {});
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <UiProvider>
            <App />
        </UiProvider>
    </React.StrictMode>,
);
