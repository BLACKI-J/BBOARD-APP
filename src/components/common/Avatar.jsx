import React from 'react';

const Avatar = ({ participant = {}, size = 32, className = '' }) => {
    const hasPhoto = participant?.photo && participant.photo.trim() !== '';
    const initial = participant?.firstName && participant.firstName.length > 0 ? participant.firstName[0].toUpperCase() : '?';
    
    // Safety check for role color
    let bgColor = 'var(--primary-color)';
    if (participant?.role === 'animator') bgColor = 'var(--secondary-color)';
    if (participant?.role === 'direction') bgColor = '#8b5cf6';

    return (
        <div 
            className={`avatar ${className}`}
            style={{ 
                width: `${size}px`, height: `${size}px`, borderRadius: '50%', 
                background: hasPhoto ? `url(${participant.photo}) center/cover` : bgColor,
                color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: `${size * 0.4}px`,
                flexShrink: 0, fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
        >
            {!hasPhoto && initial}
        </div>
    );
};

export default Avatar;
