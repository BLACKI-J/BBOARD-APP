import React, { useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';

const THRESHOLD = 70;   // px of pull needed to trigger a refresh
const MAX_PULL = 100;   // px cap on the visual pull distance

// Wraps a scrollable area and triggers onRefresh when the user pulls down
// from the very top. Touch-only; pass disabled on desktop.
export default function PullToRefresh({ onRefresh, disabled = false, className, style, children }) {
    const scrollRef = useRef(null);
    const startY = useRef(null);
    const [pull, setPull] = useState(0);
    const [refreshing, setRefreshing] = useState(false);

    const onTouchStart = (e) => {
        if (disabled || refreshing) return;
        const el = scrollRef.current;
        startY.current = el && el.scrollTop <= 0 ? e.touches[0].clientY : null;
    };

    const onTouchMove = (e) => {
        if (startY.current == null) return;
        const dy = e.touches[0].clientY - startY.current;
        if (dy <= 0) { setPull(0); return; }
        setPull(Math.min(dy * 0.5, MAX_PULL)); // resistance
    };

    const onTouchEnd = async () => {
        if (startY.current == null) return;
        startY.current = null;
        if (pull >= THRESHOLD && onRefresh) {
            setRefreshing(true);
            setPull(THRESHOLD);
            try { await onRefresh(); } catch { /* swallow — banner handles errors */ }
            setRefreshing(false);
        }
        setPull(0);
    };

    const visible = pull > 0 || refreshing;
    const ready = pull >= THRESHOLD;

    return (
        <div
            ref={scrollRef}
            className={className}
            style={style}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            {visible && (
                <div style={{
                    position: 'absolute', top: 0, left: '50%', zIndex: 50,
                    transform: `translateX(-50%) translateY(${Math.max(pull - 36, 4)}px)`,
                    width: '40px', height: '40px', borderRadius: '50%', background: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.15)', border: '1.5px solid var(--glass-border)',
                    color: ready || refreshing ? 'var(--primary-color)' : 'var(--text-muted)',
                    transition: refreshing ? 'transform 0.2s' : 'none', pointerEvents: 'none'
                }}>
                    <RefreshCw
                        size={18} strokeWidth={2.5}
                        className={refreshing ? 'spin' : ''}
                        style={refreshing ? undefined : { transform: `rotate(${pull * 3}deg)` }}
                    />
                </div>
            )}
            {children}
        </div>
    );
}
