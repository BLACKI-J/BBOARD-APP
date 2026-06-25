// Liquid Glass poussé — tilt 3D + reflet spéculaire (glare) qui suit le curseur,
// sur les cartes verre vedettes (.premium-card, .glass-card).
//
// Bureau uniquement : activé seulement si le pointeur est FIN (souris/trackpad)
// et que le survol existe. Tablette/mobile (pointeur grossier) gardent l'arête
// réfractive statique → zéro coût tactile, pas de jank sur iPad/iPhone.
// Respecte prefers-reduced-motion + les modes runtime ui-solid / ui-reduce-motion.

const SELECTOR = '.premium-card, .glass-card';
const MAX_TILT = 6; // degrés d'inclinaison max

let active = null;   // carte actuellement survolée
let raf = 0;
let lastX = 0, lastY = 0;

function clear(el) {
    el.classList.remove('glass-tilt-on');
    el.style.transform = '';
    el.style.removeProperty('--gx');
    el.style.removeProperty('--gy');
}

function paint() {
    raf = 0;
    if (!active) return;
    // Modes accessibilité activés à chaud → on relâche immédiatement.
    if (document.body.classList.contains('ui-solid') ||
        document.body.classList.contains('ui-reduce-motion')) {
        clear(active); active = null; return;
    }
    const r = active.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const px = (lastX - r.left) / r.width;   // 0..1
    const py = (lastY - r.top) / r.height;   // 0..1
    const rx = (0.5 - py) * MAX_TILT * 2;
    const ry = (px - 0.5) * MAX_TILT * 2;
    active.style.transform =
        `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(-3px)`;
    active.style.setProperty('--gx', `${(px * 100).toFixed(1)}%`);
    active.style.setProperty('--gy', `${(py * 100).toFixed(1)}%`);
}

function onMove(e) {
    const t = e.target;
    const card = (t && t.closest) ? t.closest(SELECTOR) : null;
    if (card !== active) {
        if (active) clear(active);
        active = card;
        if (card) card.classList.add('glass-tilt-on');
    }
    if (!active) return;
    lastX = e.clientX; lastY = e.clientY;
    if (!raf) raf = requestAnimationFrame(paint);
}

function onLeave() {
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    if (active) { clear(active); active = null; }
}

export function initGlassTilt() {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!fine.matches || reduced.matches) return; // tactile / mouvement réduit : on n'arme rien
    document.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave, { passive: true });
    window.addEventListener('blur', onLeave, { passive: true });
}
