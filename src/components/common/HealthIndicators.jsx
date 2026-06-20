import React from 'react';
import { ShieldAlert } from 'lucide-react';

const HealthIndicators = ({ participant = {}, expanded = false }) => {
    const hasAllergies = participant?.allergies && participant.allergies.trim() !== '';
    const hasConstraints = participant?.constraints && participant.constraints.trim() !== '';
    const hasDiet = participant?.diet && participant.diet.trim() !== '';
    const isSwimmer = !!participant?.swimTest;

    if (!hasAllergies && !hasConstraints && !hasDiet && !isSwimmer) return expanded ? (
        <span style={{color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '800', opacity: 0.6, letterSpacing: '0.02em'}}>
            AUCUNE ALERTE SANTÉ
        </span>
    ) : null;

    return (
        <div style={{
            display:'flex',
            flexDirection: 'column',
            gap:'0.5rem',
            width: expanded ? '100%' : 'auto'
        }}>
            {(hasAllergies || hasConstraints) && (
                <div style={{
                    display:'flex', alignItems: 'center', gap: '0.5rem',
                    color: 'var(--danger-color)', background: 'oklch(62% 0.2 28 / 0.08)',
                    padding: '0.25rem 0.75rem', borderRadius: '10px', border: '1.2px solid oklch(62% 0.2 28 / 0.15)',
                    fontSize: '0.75rem', fontWeight: '900'
                }}>
                    <ShieldAlert size={14} strokeWidth={2} />
                    <span style={{ textTransform: 'uppercase' }}>Alertes Santé</span>
                </div>
            )}

            {(hasDiet || isSwimmer) && (
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    {hasDiet && (
                        <div style={{
                            background: 'rgba(0,0,0,0.04)', padding: '2px 8px', borderRadius: '6px',
                            fontSize: '10px', fontWeight: '900', color: 'var(--text-main)', border: '1px solid var(--glass-border)'
                        }}>
                            DIET: {participant.diet}
                        </div>
                    )}
                    {isSwimmer && (
                        <div style={{
                            background: 'oklch(62% 0.18 145 / 0.1)', padding: '2px 8px', borderRadius: '6px',
                            fontSize: '10px', fontWeight: '950', color: 'oklch(62% 0.18 145)', border: '1px solid oklch(62% 0.18 145 / 0.2)'
                        }}>
                            NAGEUR OK
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default HealthIndicators;
