import React from 'react';

export const StatBadge = ({ icon, count, label, color = 'blue' }) => {
    const mainColor = color === 'blue' ? 'var(--primary-color)' : (color === 'green' ? 'var(--secondary-color)' : 'var(--text-muted)');
    const bg = color === 'blue' ? 'oklch(58% 0.2 var(--brand-hue) / 0.1)' : (color === 'green' ? 'oklch(62% 0.18 145 / 0.1)' : 'oklch(0% 0 0 / 0.05)');
    
    return (
        <div style={{ 
            display: 'flex', alignItems: 'center', gap: '0.625rem',
            padding: '0.5rem 1rem', borderRadius: '14px',
            fontSize: 'var(--text-xs)', fontWeight: '950',
            color: mainColor, background: bg,
            border: '1.5px solid oklch(from ' + mainColor + ' l c h / 0.15)',
            textTransform: 'uppercase', letterSpacing: '0.04em',
            backdropFilter: 'blur(4px)',
            transition: 'all 0.3s'
        }}>
            {icon}
            <span>{count} {label}</span>
        </div>
    );
};

export const RoleBadge = ({ role }) => {
    let color = 'var(--primary-color)';
    let bg = 'oklch(58% 0.2 var(--brand-hue) / 0.1)';
    let label = 'Enfant';

    if (role === 'animator') {
        color = 'var(--secondary-color)';
        bg = 'oklch(62% 0.18 145 / 0.1)';
        label = 'Animateur';
    } else if (role === 'direction') {
        color = 'var(--accent-color)';
        bg = 'oklch(60% 0.15 340 / 0.1)';
        label = 'Directeur';
    }

    return (
        <span style={{ 
            padding: '2px 10px', borderRadius: '8px', 
            fontSize: '10px', background: bg, color: color, 
            fontWeight: '950', letterSpacing: '0.06em', 
            textTransform: 'uppercase',
            border: '1.5px solid oklch(from ' + color + ' l c h / 0.2)'
        }}>
            {label}
        </span>
    );
};

export const GroupBadge = ({ groupId, groups = [] }) => {
    if (!groupId) return <span style={{fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.02em'}}>NON ASSIGNÉ</span>;
    
    const safeGroups = Array.isArray(groups) ? groups : [];
    const group = safeGroups.find(g => g.id === groupId);
    const color = group?.color || 'var(--text-muted)';
    
    return (
        <span style={{ 
            padding: '2px 10px', borderRadius: '8px', fontWeight: '950', fontSize: '10px',
            background: 'white', color: color, 
            border: '1.5px solid oklch(from ' + color + ' l c h / 0.25)',
            textTransform: 'uppercase', letterSpacing: '0.04em'
        }}>
            {group?.name || 'Inconnu'}
        </span>
    );
};
