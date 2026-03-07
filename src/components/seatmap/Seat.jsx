import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function Seat({ id, label, vehiclePrefix, placements, participants, onDrop, onDragOver, onDragLeave, onRemove, isDriverSeat = false }) {
    const fullSeatId = `${vehiclePrefix}-${id}`;
    const pId = placements[fullSeatId];
    const participant = pId ? participants.find(p => p.id === pId) : null;
    const isAnimator = participant?.role === 'animator';
    const isDirection = participant?.role === 'direction';
    const hasHealthIssue = participant && (participant.allergies || participant.constraints);

    // Premium color scheme per role
    const roleColors = {
        animator: { bg: '#059669', border: '#047857', text: 'white', back: 'rgba(0,0,0,0.15)' },
        direction: { bg: '#7c3aed', border: '#6d28d9', text: 'white', back: 'rgba(0,0,0,0.15)' },
        child: { bg: '#2563eb', border: '#1d4ed8', text: 'white', back: 'rgba(0,0,0,0.15)' },
    };

    const colors = participant
        ? (roleColors[participant.role] || roleColors.child)
        : null;

    // Initials fallback
    const initials = participant
        ? `${(participant.firstName || '').charAt(0)}${(participant.lastName || '').charAt(0)}`
        : '';

    return (
        <div
            className={`seat ${participant ? 'occupied' : 'empty'} ${isDriverSeat ? 'driver' : ''}`}
            style={{
                background: colors ? `linear-gradient(135deg, ${colors.bg}, ${colors.border})` : undefined,
                border: hasHealthIssue
                    ? '2.5px solid #ef4444'
                    : colors ? `2px solid ${colors.border}` : undefined,
                cursor: participant ? 'pointer' : 'default',
                boxShadow: colors
                    ? `0 4px 12px ${colors.bg}55, inset 0 1px 0 rgba(255,255,255,0.2)`
                    : undefined,
                transition: 'all 0.2s',
            }}
            onDrop={(e) => { onDragLeave(e); onDrop(e, id); }}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => participant && onRemove(id)}
            title={participant
                ? `${participant.firstName} ${participant.lastName}${hasHealthIssue ? `\n⚠️ ${participant.allergies || ''} ${participant.constraints || ''}` : ''}\n(clic pour retirer)`
                : (isDriverSeat ? 'Place Chauffeur' : `Siège ${id}`)}
        >
            {/* Health badge */}
            {hasHealthIssue && (
                <div style={{
                    position: 'absolute', top: '-6px', right: '-6px',
                    background: 'white', borderRadius: '50%', padding: '1px',
                    zIndex: 10, border: '1.5px solid #ef4444', display: 'flex',
                    boxShadow: '0 2px 6px rgba(239,68,68,0.4)'
                }}>
                    <AlertCircle size={11} color="#ef4444" />
                </div>
            )}

            {/* Seat back */}
            {!isDriverSeat && (
                <div className="seat-back" style={{ backgroundColor: colors ? colors.back : undefined }} />
            )}

            {participant ? (
                <>
                    {/* Avatar circle */}
                    <div style={{
                        width: '28px', height: '28px', borderRadius: '50%',
                        background: 'rgba(255,255,255,0.25)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.65rem', fontWeight: '800', color: 'white',
                        border: '1.5px solid rgba(255,255,255,0.4)',
                        zIndex: 1, flexShrink: 0
                    }}>
                        {initials}
                    </div>
                    <span className="seat-label" style={{ color: 'white', fontWeight: '700' }}>
                        {participant.firstName}
                    </span>
                </>
            ) : (
                <span style={{ fontSize: '0.65rem', opacity: 0.4, zIndex: 1, textAlign: 'center', lineHeight: '1.1', color: '#64748b' }}>
                    {label || id}
                </span>
            )}
        </div>
    );
}
