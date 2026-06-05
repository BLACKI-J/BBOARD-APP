import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { UiProvider } from './ui/UiProvider.jsx';
import './index.css';
import './App.css';

import { polyfill } from "mobile-drag-drop";
import { scrollBehaviourDragImageTranslateOverride } from "mobile-drag-drop/scroll-behaviour";
import "mobile-drag-drop/default.css";

polyfill({
    dragImageTranslateOverride: scrollBehaviourDragImageTranslateOverride
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
