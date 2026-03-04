import React from 'react';

export const StatBadge = ({ icon, count, label, color = 'blue' }) => (
    <div className="badge-stat" style={{ 
        color: color === 'blue' ? 'var(--primary-color)' : (color === 'green' ? 'var(--secondary-color)' : '#64748b'),
        background: color === 'blue' ? 'rgba(59, 130, 246, 0.1)' : (color === 'green' ? 'rgba(16, 185, 129, 0.1)' : '#f1f5f9')
    }}>
        {icon}
        <span>{count} {label}</span>
    </div>
);

export const RoleBadge = ({ role }) => {
    let color = 'var(--primary-color)';
    let bg = 'rgba(59, 130, 246, 0.1)';
    let label = 'Enfant';

    if (role === 'animator') {
        color = 'var(--secondary-color)';
        bg = 'rgba(16, 185, 129, 0.1)';
        label = 'Animateur';
    } else if (role === 'direction') {
        color = '#8b5cf6';
        bg = 'rgba(139, 92, 246, 0.1)';
        label = 'Direction';
    }

    return (
        <span style={{ padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', background: bg, color: color, fontWeight: 700, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
            {label}
        </span>
    );
};

export const GroupBadge = ({ groupId, groups = [] }) => {
    if (!groupId) return <span style={{fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic'}}>—</span>;
    
    // Safety check: ensure groups is an array
    const safeGroups = Array.isArray(groups) ? groups : [];
    const group = safeGroups.find(g => g.id === groupId);
    const color = group?.color || '#94a3b8';
    
    return (
        <span style={{ 
            padding: '0.25rem 0.5rem', borderRadius: '6px', fontWeight: '600', fontSize: '0.8rem',
            background: 'white', color: color, border: `1px solid ${color}`
        }}>
            {group?.name || '?'}
        </span>
    );
};
