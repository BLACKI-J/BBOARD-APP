import { useRef, useCallback } from 'react';

/**
 * Horizontal swipe → navigate between tabs.
 * Filters out vertical scrolls: only fires when |dx| > |dy| AND |dx| >= minDist.
 */
export function useSwipeNav({ tabs, activeTab, onNavigate, minDist = 55 }) {
    const start = useRef(null);

    const onTouchStart = useCallback((e) => {
        const t = e.touches[0];
        start.current = { x: t.clientX, y: t.clientY };
    }, []);

    const onTouchEnd = useCallback((e) => {
        if (!start.current) return;
        const dx = e.changedTouches[0].clientX - start.current.x;
        const dy = e.changedTouches[0].clientY - start.current.y;
        start.current = null;

        if (Math.abs(dx) < minDist || Math.abs(dy) > Math.abs(dx) * 0.8) return;

        const idx = tabs.findIndex(t => t.id === activeTab);
        if (dx < 0 && idx < tabs.length - 1) onNavigate(tabs[idx + 1].id);
        if (dx > 0 && idx > 0) onNavigate(tabs[idx - 1].id);
    }, [tabs, activeTab, onNavigate, minDist]);

    return { onTouchStart, onTouchEnd };
}
