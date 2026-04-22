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
            className={`premium-card participant-card animate-fade-in ${isSelected ? 'selected' : ''}`}
            onClick={() => toggleSelection(participant.id)}
            style={{
                '--i': index,
                animationDelay: `calc(var(--i, 0) * 30ms)`,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                background: isSelected ? 'var(--primary-light)' : 'white',
                borderColor: isSelected ? 'var(--primary-color)' : 'var(--glass-border)',
                boxShadow: isSelected ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
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

            {/* Top Bar Indicators */}
            {participant.pocketMoney?.current > 0 && (
                <div style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', alignItems: 'center', gap: '4px', background: 'oklch(70% 0.16 142 / 0.12)', padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: '950', color: 'var(--success-color)' }}>
                    <Coins size={12} /> {participant.pocketMoney.current}€
                </div>
            )}

            {/* Content Area */}
            <div style={{ padding: '2.5rem 1.5rem 1.25rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem' }}>
                <div style={{ position: 'relative' }}>
                    <Avatar participant={participant} size={92} />
                    {participant.healthDocProvided && (
                        <div title="Dossier complet" style={{ position: 'absolute', bottom: '2px', right: '2px', background: 'var(--success-color)', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid white', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                            <Check size={14} strokeWidth={4} />
                        </div>
                    )}
                </div>
                
                <div style={{ width: '100%' }}>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '1.3rem', fontWeight: '950', fontFamily: 'Sora, sans-serif', color: 'var(--text-main)', letterSpacing: '-0.04em', lineHeight: 1.2 }}>
                        {participant.firstName} <span style={{ opacity: 0.6 }}>{participant.lastName}</span>
                    </h3>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '800', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        {age || 'Âge inconnu'}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <RoleBadge role={participant.role} />
                    <GroupBadge groupId={participant.group} groups={groups} />
                </div>
            </div>

            {/* Stats/Details */}
            <div style={{ padding: '0 1.5rem 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                <HealthIndicators participant={participant} expanded={false} />
            </div>

            {/* Actions Footer */}
            <div style={{
                marginTop: 'auto',
                padding: '1.25rem 1.25rem',
                background: 'var(--bg-secondary)',
                borderTop: '1.5px solid var(--glass-border)',
                display: 'flex',
                gap: '0.625rem',
                alignItems: 'center'
            }}>
                <button
                    onClick={(e) => { e.stopPropagation(); handleViewDetails(participant); }}
                    className="btn btn-primary"
                    style={{ flex: 1, padding: '0.625rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '950', gap: '0.5rem', background: 'white', color: 'var(--primary-color)', border: '1.5px solid var(--primary-color)', boxShadow: 'none' }}
                >
                    <Eye size={16} strokeWidth={2.5} /> <span className="hide-mobile">Détails</span>
                </button>
                
                {canEdit && (
                    <>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleEdit(participant); }}
                            className="btn-icon-ref"
                            style={{ background: 'white', width: '40px', height: '40px' }}
                            title="Modifier"
                        >
                            <Edit2 size={16} strokeWidth={2.5} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(participant.id); }}
                            className="btn-icon-ref danger"
                            style={{ background: 'white', width: '40px', height: '40px' }}
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
