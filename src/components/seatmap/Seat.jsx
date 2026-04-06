import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function Seat({ id, label, vehiclePrefix, placements, participants, onDrop, onDragOver, onDragLeave, onRemove, isDriverSeat = false }) {
    const fullSeatId = `${vehiclePrefix}-${id}`;
    const pId = placements[fullSeatId];
    const participant = pId ? participants.find(p => p.id === pId) : null;
    const isAnimator = participant?.role === 'animator';
    const isDirection = participant?.role === 'direction';
    const hasHealthIssue = participant && (participant.allergies || participant.constraints);

    // Premium color scheme per role (OKLCH - High Vibrancy)
    const roleColors = {
        animator: { 
            bg: 'oklch(65% 0.18 150)', 
            border: 'oklch(50% 0.15 150)', 
            shadow: 'oklch(50% 0.15 150 / 0.3)',
            text: 'white' 
        },
        direction: { 
            bg: 'oklch(65% 0.22 260)', 
            border: 'oklch(50% 0.18 260)', 
            shadow: 'oklch(50% 0.18 260 / 0.3)',
            text: 'white' 
        },
        child: { 
            bg: 'oklch(65% 0.20 235)', 
            border: 'oklch(50% 0.16 235)', 
            shadow: 'oklch(50% 0.16 235 / 0.3)',
            text: 'white' 
        },
    };

    const colors = participant
        ? (roleColors[participant.role] || roleColors.child)
        : null;

    const [isOver, setIsOver] = React.useState(false);

    // Initials fallback
    const initials = participant
        ? `${(participant.firstName || '').charAt(0)}${(participant.lastName || '').charAt(0)}`.toUpperCase()
        : '';

    return (
        <div
            className={`seat ${participant ? 'occupied' : 'empty'} ${isDriverSeat ? 'driver' : ''} ${isOver ? 'drag-over' : ''}`}
            style={{
                width: '64px',
                height: '64px',
                background: colors 
                    ? `linear-gradient(145deg, ${colors.bg}, ${colors.border})` 
                    : 'rgba(255, 255, 255, 0.45)',
                backdropFilter: colors ? 'none' : 'blur(8px)',
                border: hasHealthIssue
                    ? '2.5px solid oklch(65% 0.25 25)' 
                    : colors ? `1.5px solid rgba(255,255,255,0.5)` : '1.5px solid rgba(148,163,184,0.15)',
                cursor: 'pointer',
                boxShadow: colors
                    ? `0 8px 20px ${colors.shadow}, inset 0 1px 1px rgba(255,255,255,0.4)`
                    : 'inset 0 2px 4px rgba(15,23,42,0.02)',
                transition: 'all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                borderRadius: '18px',
            }}
            onDragEnter={(e) => { e.preventDefault(); setIsOver(true); }}
            onDragOver={(e) => { e.preventDefault(); onDragOver(e); }}
            onDragLeave={(e) => { setIsOver(false); onDragLeave(e); }}
            onDrop={(e) => { 
                setIsOver(false); 
                onDragLeave(e); 
                onDrop(e, id, vehiclePrefix); 
            }}
            onClick={() => onRemove(id, vehiclePrefix)}
            title={participant
                ? `${participant.firstName} ${participant.lastName}${hasHealthIssue ? `\n${participant.allergies || ''} ${participant.constraints || ''}` : ''}\n(clic pour retirer)`
                : (isDriverSeat ? 'Place Chauffeur' : `Siège ${id} (clic pour assigner)`)}
        >
            <div className="seat-glow" />
            
            {hasHealthIssue && (
                <div style={{
                    position: 'absolute', top: '-8px', right: '-8px',
                    background: 'white', borderRadius: '50%', padding: '3px',
                    zIndex: 10, border: '2px solid oklch(65% 0.25 25)', display: 'flex',
                    boxShadow: '0 6px 12px rgba(220,38,38,0.2)'
                }}>
                    <AlertCircle size={14} color="oklch(65% 0.25 25)" />
                </div>
            )}

            {participant ? (
                <>
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: 'rgba(255,255,255,0.25)',
                        backdropFilter: 'blur(10px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '11px', fontWeight: '900', color: 'white',
                        border: '1px solid rgba(255,255,255,0.4)',
                        zIndex: 1, flexShrink: 0,
                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                    }}>
                        {initials}
                    </div>
                    <span className="seat-label" style={{ 
                        color: 'white', 
                        fontWeight: '800', 
                        fontFamily: "'Sora', sans-serif", 
                        fontSize: '10px', 
                        letterSpacing: '-0.02em'
                    }}>
                        {participant.firstName}
                    </span>
                </>
            ) : (
                <div style={{ opacity: 0.35, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', border: '1.5px solid currentColor' }} />
                    <span style={{ fontSize: '0.6rem', fontWeight: '700', letterSpacing: '0.05em' }}>
                        {label || id}
                    </span>
                </div>
            )}
        </div>
    );
}
