import React from 'react';
import { ShieldAlert } from 'lucide-react';

const HealthIndicators = ({ participant = {}, expanded = false }) => {
    const hasAllergies = participant?.allergies && participant.allergies.trim() !== '';
    const hasConstraints = participant?.constraints && participant.constraints.trim() !== '';

    if (!hasAllergies && !hasConstraints) return expanded ? (
        <span style={{color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '800', opacity: 0.6, letterSpacing: '0.02em'}}>
            AUCUNE ALERTE SANTÉ
        </span>
    ) : null;
    
    return (
        <div style={{ 
            display:'flex', 
            alignItems: expanded ? 'flex-start' : 'center', 
            gap:'0.75rem', 
            color: 'var(--danger-color)', 
            fontSize: '0.8rem', 
            fontWeight: '900',
            background: 'oklch(62% 0.2 28 / 0.08)',
            padding: expanded ? '0.75rem 1rem' : '0.25rem 0.75rem',
            borderRadius: '12px',
            border: '1.5px solid oklch(62% 0.2 28 / 0.15)',
            width: expanded ? '100%' : 'auto'
        }}>
            <ShieldAlert size={18} strokeWidth={2.5} style={{ flexShrink: 0, marginTop: expanded ? '2px' : '0' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                {hasAllergies && (
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: expanded ? 'normal' : 'nowrap' }}>
                        <strong style={{ opacity: 0.7, fontSize: '0.7rem' }}>ALLERGIES :</strong> {participant.allergies}
                    </span>
                )}
                {hasConstraints && (
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: expanded ? 'normal' : 'nowrap' }}>
                        <strong style={{ opacity: 0.7, fontSize: '0.7rem' }}>RESTRIC. :</strong> {participant.constraints}
                    </span>
                )}
            </div>
        </div>
    );
};

export default HealthIndicators;
