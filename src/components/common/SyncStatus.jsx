import React from 'react';
import { RefreshCw, Cloud, CloudOff } from 'lucide-react';

// Compact topbar pill: shows live sync state + last sync time, click to refresh.
export default function SyncStatus({ status, isSyncing, lastSyncAt, onRefresh, isMobile }) {
    const offline = status === 'error';
    const color = offline ? 'var(--danger-color)' : 'var(--success-color)';
    const label = isSyncing ? 'Synchro…' : offline ? 'Hors-ligne' : 'À jour';
    const timeLabel = lastSyncAt
        ? new Date(lastSyncAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        : null;

    return (
        <button
            onClick={onRefresh}
            disabled={isSyncing}
            title={timeLabel ? `Dernière synchro à ${timeLabel} — appuyer pour actualiser` : 'Actualiser'}
            className="btn-icon-ref"
            style={{
                background: 'white', borderRadius: '100px', height: '44px',
                padding: isMobile ? '0' : '0 1rem', width: isMobile ? '44px' : 'auto',
                flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                color, fontWeight: '950', fontSize: '0.78rem', cursor: isSyncing ? 'default' : 'pointer',
                whiteSpace: 'nowrap'
            }}
        >
            {isSyncing ? <RefreshCw size={16} strokeWidth={3} className="spin" style={{ flexShrink: 0 }} />
                : offline ? <CloudOff size={16} strokeWidth={2.5} style={{ flexShrink: 0 }} />
                : <Cloud size={16} strokeWidth={2.5} style={{ flexShrink: 0 }} />}
            {!isMobile && (
                <span style={{ whiteSpace: 'nowrap' }}>{label}{!isSyncing && !offline && timeLabel ? ` · ${timeLabel}` : ''}</span>
            )}
        </button>
    );
}
