import React from 'react';

/**
 * Generic Button component replacing ad-hoc inline button styles.
 * variant: 'primary' | 'secondary' | 'ghost' | 'danger' | 'icon'
 * size: 'sm' | 'md' | 'lg'
 */
export const Button = ({
    children,
    variant = 'secondary',
    size = 'md',
    icon,
    onClick,
    disabled = false,
    type = 'button',
    className = '',
    style = {},
    ...rest
}) => {
    const sizeMap = {
        sm: { height: '36px', padding: '0 0.875rem', fontSize: '0.78rem', borderRadius: '10px' },
        md: { height: '44px', padding: '0 1.25rem', fontSize: '0.85rem', borderRadius: '12px' },
        lg: { height: '52px', padding: '0 1.75rem', fontSize: '0.95rem', borderRadius: '16px' },
        icon: { width: '40px', height: '40px', padding: '0', borderRadius: '10px' },
    };
    const actualSize = variant === 'icon' ? 'icon' : size;
    const dims = sizeMap[actualSize] || sizeMap.md;

    // Accept icon as either an element (<Save />) or a component (Save).
    const iconNode = icon
        ? (React.isValidElement(icon) ? icon : React.createElement(icon, { size: 18, strokeWidth: 2.5 }))
        : null;

    const base = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        fontWeight: '900',
        fontFamily: 'inherit',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
        opacity: disabled ? 0.5 : 1,
        flexShrink: 0,
        ...dims,
    };

    const variantMap = {
        primary: { background: 'var(--primary-gradient)', color: 'white', boxShadow: '0 4px 16px var(--shadow-color)' },
        secondary: { background: 'white', color: 'var(--text-main)', border: '1.5px solid var(--glass-border)' },
        ghost: { background: 'transparent', color: 'var(--text-muted)', border: '1.5px solid transparent' },
        danger: { background: 'oklch(95% 0.05 20)', color: 'var(--danger-color)', border: '1.5px solid oklch(62% 0.2 28 / 0.2)' },
        icon: { background: 'white', color: 'var(--text-muted)', border: '1.5px solid var(--glass-border)' },
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`btn-ui ${className}`}
            style={{ ...base, ...(variantMap[variant] || variantMap.secondary), ...style }}
            {...rest}
        >
            {iconNode && <span style={{ display: 'flex', alignItems: 'center' }}>{iconNode}</span>}
            {children}
        </button>
    );
};

export default Button;
