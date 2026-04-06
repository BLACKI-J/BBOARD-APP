import React from 'react';
import { Check, Square, Eye, Edit2, Trash2, Coins, ChevronRight } from 'lucide-react';
import Avatar from '../common/Avatar';
import { RoleBadge, GroupBadge } from '../common/Badges';
import HealthIndicators from '../common/HealthIndicators';
import { getAge } from '../../utils/participantUtils';

const ParticipantCard = ({ participant, index, isSelected, toggleSelection, handleViewDetails, handleEdit, handleDelete, groups, isMobile, canEdit }) => {
    const age = getAge(participant.birthDate);
    
    return (
        <div
            className={`card-glass participant-card animate-fade-in ${isSelected ? 'selected' : ''}`}
            onClick={() => toggleSelection(participant.id)}
            style={{
                '--i': index,
                animationDelay: `calc(var(--i, 0) * 30ms)`,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                background: isSelected ? 'white' : 'rgba(255, 255, 255, 0.6)',
                borderRadius: '24px',
                border: `1.5px solid ${isSelected ? 'var(--primary-color)' : 'var(--glass-border)'}`,
                boxShadow: isSelected ? 'var(--shadow-lg)' : 'var(--shadow-md)',
                overflow: 'hidden',
                transition: 'all 0.4s var(--ease-out-expo)',
                cursor: 'pointer',
                position: 'relative'
            }}
        >
            {/* Selection Checkbox */}
            <div
                className="selection-check"
                onClick={(e) => { e.stopPropagation(); toggleSelection(participant.id); }}
                style={{ 
                    position: 'absolute', top: '16px', right: '16px', 
                    width: '28px', height: '28px', borderRadius: '10px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isSelected ? 'var(--primary-color)' : 'white',
                    border: '1.5px solid', 
                    borderColor: isSelected ? 'var(--primary-color)' : 'var(--glass-border)',
                    color: 'white', zIndex: 10, transition: 'all 0.3s'
                }}
            >
                {isSelected && <Check size={18} strokeWidth={3} />}
            </div>

            {/* Content Area */}
            <div style={{ padding: '2rem 1.5rem 1rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem' }}>
                <Avatar participant={participant} size={84} />
                
                <div style={{ width: '100%' }}>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontWeight: '950', fontFamily: 'Sora, sans-serif', color: 'var(--text-main)', letterSpacing: '-0.02em', textTransform: 'capitalize' }}>
                        {participant.firstName} <span style={{ textTransform: 'uppercase' }}>{participant.lastName}</span>
                    </h3>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '800', letterSpacing: '0.04em' }}>
                        {age || 'Âge inconnu'}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <RoleBadge role={participant.role} />
                    <GroupBadge groupId={participant.group} groups={groups} />
                </div>
            </div>

            {/* Alerts Area */}
            <div style={{ padding: '0 1.5rem 1rem 1.5rem', flex: 1, display: 'flex', justifyContent: 'center' }}>
                <HealthIndicators participant={participant} expanded={false} />
            </div>

            {/* Actions Footer */}
            <div style={{
                marginTop: 'auto',
                padding: '1rem 1.25rem',
                background: 'rgba(255, 255, 255, 0.4)',
                borderTop: '1.5px solid var(--glass-border)',
                display: 'flex',
                gap: '0.625rem',
                alignItems: 'center'
            }}>
                <button
                    onClick={(e) => { e.stopPropagation(); handleViewDetails(participant); }}
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '0.625rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '900', gap: '0.5rem' }}
                >
                    <Eye size={16} strokeWidth={2.5} /> <span className="hide-mobile">Détails</span>
                </button>
                
                {canEdit && (
                    <>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleEdit(participant); }}
                            className="btn-icon-ref"
                            title="Modifier"
                        >
                            <Edit2 size={16} strokeWidth={2.5} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(participant.id); }}
                            className="btn-icon-ref danger"
                            title="Supprimer"
                        >
                            <Trash2 size={16} strokeWidth={2.5} />
                        </button>
                    </>
                )}
            </div>

            <style>{`
                .participant-card:hover { transform: translateY(-8px); border-color: var(--primary-color); background: white !important; }
                @media (max-width: 600px) {
                    .hide-mobile { display: none; }
                }
            `}</style>
        </div>
    );
};

export default ParticipantCard;
