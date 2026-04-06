import React from 'react';

const Avatar = ({ participant = {}, size = 32, className = '' }) => {
    const hasPhoto = participant?.photo && participant.photo.trim() !== '';
    const initial = participant?.firstName && participant.firstName.length > 0 ? participant.firstName[0].toUpperCase() : '?';
    
    let bgColor = 'var(--primary-color)';
    if (participant?.role === 'animator') bgColor = 'var(--secondary-color)';
    if (participant?.role === 'direction') bgColor = 'var(--accent-color)';

    return (
        <div 
            className={`avatar ${className}`}
            style={{ 
                width: `${size}px`, 
                height: `${size}px`, 
                borderRadius: size > 48 ? '22px' : '14px', 
                background: hasPhoto ? `url(${participant.photo}) center/cover` : bgColor,
                color: 'white', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                fontSize: `${size * 0.4}px`,
                flexShrink: 0, 
                fontWeight: '950', 
                boxShadow: size > 48 ? '0 12px 24px oklch(0% 0 0 / 0.12)' : '0 4px 10px oklch(0% 0 0 / 0.08)',
                border: '2.5px solid white',
                transition: 'all 0.3s var(--ease-out-expo)'
            }}
        >
            {!hasPhoto && initial}
        </div>
    );
};

export default Avatar;
