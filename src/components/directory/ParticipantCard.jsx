import React from 'react';
import { CheckSquare, Square, Eye, Edit2, Trash2 } from 'lucide-react';
import Avatar from '../common/Avatar';
import { RoleBadge, GroupBadge } from '../common/Badges';
import HealthIndicators from '../common/HealthIndicators';
import { getAge } from '../../utils/participantUtils';

const ParticipantCard = ({ participant, isSelected, toggleSelection, handleViewDetails, handleEdit, handleDelete, groups }) => {
    return (
        <div 
            className={`participant-card ${isSelected ? 'selected' : ''}`}
            onClick={() => toggleSelection(participant.id)}
            style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                minHeight: '240px', // Increased min-height for better spacing
                background: 'white',
                borderRadius: '12px',
                border: isSelected ? '1px solid var(--primary-color)' : '1px solid var(--border-color)',
                boxShadow: isSelected ? '0 0 0 2px var(--primary-color)' : '0 1px 3px rgba(0,0,0,0.05)',
                overflow: 'hidden',
                transition: 'all 0.2s',
                cursor: 'pointer',
                position: 'relative'
            }}
        >
            <div className={`card-role-strip ${participant.role}`} style={{ height: '6px', width: '100%', background: participant.role === 'animator' ? 'var(--secondary-color)' : (participant.role === 'direction' ? '#8b5cf6' : 'var(--primary-color)') }}></div>
            
            {/* Header: Avatar + Name + Checkbox */}
            <div className="card-header" style={{ display: 'flex', alignItems: 'flex-start', padding: '1.25rem 1rem 0.5rem 1rem', gap: '1rem' }}>
                <Avatar participant={participant} size={56} />
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: '4px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '1.2', color: '#1e293b' }}>
                        {participant.firstName} {participant.lastName}
                    </h3>
                    <span style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                        {getAge(participant.birthDate)}
                    </span>
                </div>
                <div 
                    className="selection-check"
                    onClick={(e) => { e.stopPropagation(); toggleSelection(participant.id); }}
                    style={{ cursor: 'pointer', padding: '4px' }}
                >
                    {isSelected ? 
                        <CheckSquare size={24} color="var(--primary-color)" /> : 
                        <Square size={24} color="#e2e8f0" />
                    }
                </div>
            </div>

            {/* Badges Row */}
            <div className="card-tags" style={{ padding: '0.5rem 1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <RoleBadge role={participant.role} />
                <GroupBadge groupId={participant.group} groups={groups} />
            </div>

            {/* Info / Health */}
            <div className="card-info" style={{ padding: '0.5rem 1rem 1rem 1rem', flex: 1 }}>
                <HealthIndicators participant={participant} expanded={true} />
            </div>

            {/* Actions Footer */}
            <div className="card-actions" style={{ 
                marginTop: 'auto', 
                padding: '0.75rem 1rem', 
                background: '#f8fafc', 
                borderTop: '1px solid #f1f5f9',
                display: 'flex', 
                gap: '0.5rem', 
                alignItems: 'center' 
            }}>
                <button 
                    onClick={(e) => { e.stopPropagation(); handleViewDetails(participant); }} 
                    title="Voir"
                    style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <Eye size={16} />
                </button>
                <div style={{ flex: 1 }}></div>
                <button 
                    onClick={(e) => { e.stopPropagation(); handleEdit(participant); }} 
                    title="Modifier"
                    style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <Edit2 size={16} />
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(participant.id); }} 
                    className="danger" 
                    title="Supprimer"
                    style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <Trash2 size={16} />
                </button>
            </div>
            <style>{`
                .participant-card:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border-color: #cbd5e1; }
                .participant-card button:hover { background: #f1f5f9; color: #334155; border-color: #cbd5e1; }
                .participant-card button.danger:hover { background: #fee2e2; color: #ef4444; border-color: #fecaca; }
            `}</style>
        </div>
    );
};

export default ParticipantCard;
