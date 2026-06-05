import React from 'react';

/**
 * GlassCard — replaces divs with className="card-glass" + inline padding/radius.
 * padding: 'none' | 'sm' | 'md' | 'lg'
 */
export const GlassCard = ({ children, padding = 'md', style = {}, className = '', ...rest }) => {
    const paddingMap = {
        none: '0',
        sm: '1rem',
        md: '1.5rem',
        lg: '1.75rem 2rem',
    };
    return (
        <div
            className={`card-glass ${className}`}
            style={{
                padding: paddingMap[padding] || padding,
                borderRadius: '24px',
                ...style,
            }}
            {...rest}
        >
            {children}
        </div>
    );
};

/**
 * WhiteCard — solid white card with glass border.
 */
export const WhiteCard = ({ children, padding = 'md', style = {}, className = '', ...rest }) => {
    const paddingMap = {
        none: '0',
        sm: '1rem',
        md: '1.5rem',
        lg: '1.75rem 2rem',
    };
    return (
        <div
            className={className}
            style={{
                padding: paddingMap[padding] || padding,
                borderRadius: '24px',
                background: 'white',
                border: '1.5px solid var(--glass-border)',
                boxShadow: 'var(--shadow-sm)',
                ...style,
            }}
            {...rest}
        >
            {children}
        </div>
    );
};

export default GlassCard;
