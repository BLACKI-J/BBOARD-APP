import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { UiProvider } from './ui/UiProvider.jsx';
import { initGlassTilt } from './utils/glassTilt.js';
// Polices auto-hébergées (bundlées par Vite) → plus de dépendance au CDN Google Fonts,
// donc fonctionne sur réseaux filtrés / DNS bloquant google (ERR_NAME_NOT_RESOLVED).
import '@fontsource/bricolage-grotesque/400.css';
import '@fontsource/bricolage-grotesque/500.css';
import '@fontsource/bricolage-grotesque/600.css';
import '@fontsource/bricolage-grotesque/700.css';
import '@fontsource/bricolage-grotesque/800.css';
import '@fontsource/hanken-grotesk/400.css';
import '@fontsource/hanken-grotesk/500.css';
import '@fontsource/hanken-grotesk/600.css';
import '@fontsource/hanken-grotesk/700.css';
import '@fontsource/hanken-grotesk/800.css';
import '@fontsource/hanken-grotesk/900.css';
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
        polyfill({
            dragImageTranslateOverride: scrollBehaviourDragImageTranslateOverride,
            // Sans holdToDrag, poser le doigt sur un élément draggable pour SCROLLER
            // démarre un drag → scroll du Planning cassé sur tactile. 400 ms d'appui
            // long pour déclencher un vrai drag.
            holdToDrag: 400,
        });
    }).catch(() => {});
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
}

// Préférence d'affichage « réduire la transparence » appliquée AVANT le rendu (sans flash).
try { if (localStorage.getItem('colo-ui-solid') === '1') document.body.classList.add('ui-solid'); } catch { /* storage indispo */ }

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <UiProvider>
            <App />
        </UiProvider>
    </React.StrictMode>,
);

// Tilt 3D + reflet au curseur (bureau only) sur les cartes verre vedettes.
// Écouteurs délégués sur document → marche aussi pour les cartes montées + tard.
initGlassTilt();
