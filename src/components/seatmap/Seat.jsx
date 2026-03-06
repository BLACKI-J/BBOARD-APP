import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function Seat({ id, label, vehiclePrefix, placements, participants, onDrop, onDragOver, onDragLeave, onRemove, isDriverSeat = false }) {
    const fullSeatId = `${vehiclePrefix}-${id}`;
    const pId = placements[fullSeatId];
    const participant = pId ? participants.find(p => p.id === pId) : null;
    const isAnimator = participant?.role === 'animator';
    const isDirection = participant?.role === 'direction';
    const hasHealthIssue = participant && (participant.allergies || participant.constraints);

    // Determine background color
    let bgColor = '';
    if (participant) {
        if (isAnimator) bgColor = 'var(--secondary-color)';
        else if (isDirection) bgColor = '#8b5cf6'; // Violet
        else bgColor = 'var(--primary-color)';
    }

    return (
        <div
            className={`seat ${participant ? 'occupied' : 'empty'} ${isDriverSeat ? 'driver' : ''}`}
            style={{
                backgroundColor: bgColor || undefined,
                border: hasHealthIssue ? '2px solid var(--danger-color)' : undefined,
                cursor: participant ? 'pointer' : 'default',
            }}
            onDrop={(e) => {
                onDragLeave(e);
                onDrop(e, id);
            }}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => participant && onRemove(id)}
            title={participant ? `${participant.firstName} ${participant.lastName}${hasHealthIssue ? `\n⚠️ ${participant.allergies || ''} ${participant.constraints || ''}` : ''}` : (isDriverSeat ? "Place Chauffeur" : `Siège ${id}`)}
        >
            {hasHealthIssue && (
                <div style={{ position: 'absolute', top: '-6px', right: '-6px', background: 'white', borderRadius: '50%', padding: '2px', zIndex: 10, border: '1px solid var(--danger-color)', display: 'flex', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <AlertCircle size={12} color="var(--danger-color)" />
                </div>
            )}

            {/* Back rest visualization */}
            {!isDriverSeat && <div className="seat-back" style={{ backgroundColor: participant ? 'rgba(0,0,0,0.2)' : undefined }}></div>}

            {participant ? (
                <>
                    <span className="seat-label">
                        {participant.firstName}
                    </span>
                    <span className="seat-sublabel">
                        {participant.lastName.slice(0, 1)}.
                    </span>
                </>
            ) : (
                <span style={{ fontSize: '0.7rem', opacity: 0.5, zIndex: 1, textAlign: 'center', lineHeight: '1.1' }}>
                    {label || id}
                </span>
            )}
        </div>
    );
}
