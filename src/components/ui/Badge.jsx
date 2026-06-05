import React from 'react';

/**
 * Colored badge / pill component.
 * color: any CSS color string (oklch recommended)
 * variant: 'filled' | 'subtle' (default 'subtle')
 */
export const Badge = ({ children, color = 'var(--primary-color)', variant = 'subtle', style = {} }) => {
    const isOklch = color.startsWith('oklch(');

    // Build background from color by adding opacity
    const getBg = () => {
        if (isOklch) {
            // e.g. oklch(62% 0.18 145) → oklch(62% 0.18 145 / 0.12)
            const base = color.replace(')', '');
            return `${base} / 0.12)`;
        }
        return `${color}20`; // hex fallback
    };

    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '3px 10px',
            borderRadius: '8px',
            fontSize: '0.72rem',
            fontWeight: '900',
            letterSpacing: '0.01em',
            background: variant === 'filled' ? color : getBg(),
            color: variant === 'filled' ? 'white' : color,
            border: `1px solid ${color}30`,
            lineHeight: 1.4,
            whiteSpace: 'nowrap',
            ...style,
        }}>
            {children}
        </span>
    );
};

export default Badge;
