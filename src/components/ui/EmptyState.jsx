import React from 'react';

/**
 * EmptyState — standardized empty state placeholder.
 */
export const EmptyState = ({ icon, title, subtitle, style = {} }) => (
    <div style={{
        padding: '4rem',
        textAlign: 'center',
        opacity: 0.45,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
        ...style,
    }}>
        {icon && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {icon}
            </div>
        )}
        {title && <p style={{ fontWeight: '900', fontSize: '0.95rem', margin: 0 }}>{title}</p>}
        {subtitle && <p style={{ fontWeight: '700', fontSize: '0.8rem', margin: 0, opacity: 0.7 }}>{subtitle}</p>}
    </div>
);

export default EmptyState;
