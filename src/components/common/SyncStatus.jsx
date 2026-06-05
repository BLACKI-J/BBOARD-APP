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
                background: 'white', borderRadius: '100px', height: isMobile ? '40px' : '44px',
                padding: isMobile ? '0' : '0 0.9rem', width: isMobile ? '40px' : 'auto',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                color, fontWeight: '950', fontSize: '0.78rem', cursor: isSyncing ? 'default' : 'pointer'
            }}
        >
            {isSyncing ? <RefreshCw size={16} strokeWidth={3} className="spin" />
                : offline ? <CloudOff size={16} strokeWidth={2.5} />
                : <Cloud size={16} strokeWidth={2.5} />}
            {!isMobile && (
                <span>{label}{!isSyncing && !offline && timeLabel ? ` · ${timeLabel}` : ''}</span>
            )}
        </button>
    );
}
