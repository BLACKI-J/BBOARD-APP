import React from 'react';
import { X, Mail, Phone, Edit2, AlertCircle, CheckSquare } from 'lucide-react';
import Avatar from '../common/Avatar';
import { RoleBadge, GroupBadge } from '../common/Badges';
import { getAge } from '../../utils/participantUtils';

const ParticipantDetails = ({ viewingParticipant, setViewingParticipant, handleEdit, groups }) => {
    if (!viewingParticipant) return null;

    return (
        <div className="modal-overlay" onClick={() => setViewingParticipant(null)}>
            <div className="modal-content animate-scale-in" style={{ borderRadius: '20px', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>

                {/* Header Image */}
                <div style={{
                    height: '140px', // Increased height
                    background: `linear-gradient(135deg, ${viewingParticipant.role === 'animator' ? '#10b981' : (viewingParticipant.role === 'direction' ? '#8b5cf6' : '#3b82f6')} 0%, #f8fafc 100%)`,
                    position: 'relative',
                    flexShrink: 0
                }}>
                    <button className="close-btn" onClick={() => setViewingParticipant(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'white', color: '#64748b', borderRadius: '50%', padding: '6px', border: 'none', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        <X size={18} />
                    </button>
                </div>

                <div style={{ padding: '0 2rem 2rem 2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                    {/* Profile Info */}
                    <div className="profile-section" style={{ marginTop: '-70px', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                        <div className="profile-avatar" style={{ border: '4px solid white', borderRadius: '50%', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', background: 'white', marginBottom: '0.75rem' }}>
                            <Avatar participant={viewingParticipant} size={120} /> {/* Increased size */}
                        </div>
                        <h2 style={{ fontSize: '1.4rem', color: '#1e293b', margin: '0 0 0.5rem 0', fontWeight: '700', textAlign: 'center' }}>
                            {viewingParticipant.firstName} <span style={{ fontWeight: 400 }}>{viewingParticipant.lastName}</span>
                        </h2>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                            <RoleBadge role={viewingParticipant.role} />
                            <GroupBadge groupId={viewingParticipant.group} groups={groups} />
                        </div>
                    </div>

                    {/* Info List */}
                    <div className="info-list" style={{ background: 'white', borderRadius: '12px', border: '1px solid #f1f5f9', padding: '0.5rem', marginBottom: '1.5rem', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                        <div className="info-item">
                            <span className="label">Âge</span>
                            <span className="value">{getAge(viewingParticipant.birthDate)} <span className="sub">({viewingParticipant.birthDate || 'N/A'})</span></span>
                        </div>

                        {(viewingParticipant.role === 'animator' || viewingParticipant.role === 'direction') && viewingParticipant.training && (
                            <div className="info-item">
                                <span className="label">Formation</span>
                                <span className="value">{viewingParticipant.training}</span>
                            </div>
                        )}

                        {(viewingParticipant.role === 'animator' || viewingParticipant.role === 'direction') && viewingParticipant.phone && (
                            <div className="info-item">
                                <span className="label">Téléphone</span>
                                <div className="value-row">
                                    <Phone size={14} className="icon" />
                                    <span>{viewingParticipant.phone}</span>
                                </div>
                            </div>
                        )}

                        {(viewingParticipant.role === 'animator' || viewingParticipant.role === 'direction') && viewingParticipant.address && (
                            <div className="info-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                                <span className="label" style={{ alignSelf: 'flex-start' }}>Adresse</span>
                                <span className="value" style={{ textAlign: 'left', fontSize: '0.85rem' }}>{viewingParticipant.address}</span>
                            </div>
                        )}

                        {(viewingParticipant.role === 'animator' || viewingParticipant.role === 'direction') && viewingParticipant.emergencyContact && (
                            <div className="info-item" style={{ background: '#fffbeb', margin: '4px', borderRadius: '8px', border: '1px solid #fef3c7' }}>
                                <span className="label" style={{ color: '#92400e' }}>Urgence</span>
                                <span className="value" style={{ color: '#92400e' }}>{viewingParticipant.emergencyContact}</span>
                            </div>
                        )}
                    </div>

                    {/* Medical / Notes */}
                    {(viewingParticipant.allergies || viewingParticipant.constraints) ? (
                        <div className="medical-card">
                            <div className="medical-header">
                                <AlertCircle size={18} />
                                <span>Santé & Sécurité</span>
                            </div>
                            {viewingParticipant.allergies && (
                                <div className="medical-item">
                                    <span className="label">Allergies</span>
                                    <span className="value">{viewingParticipant.allergies}</span>
                                </div>
                            )}
                            {viewingParticipant.constraints && (
                                <div className="medical-item">
                                    <span className="label">Contraintes</span>
                                    <span className="value">{viewingParticipant.constraints}</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="empty-state-card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
                            <CheckSquare size={20} color="#cbd5e1" />
                            <span style={{ fontSize: '0.9rem' }}>Aucune info médicale</span>
                        </div>
                    )}

                    {/* Actions Footer */}
                    <div className="drawer-footer" style={{ marginTop: '0', paddingTop: '0', borderTop: 'none' }}>
                        <button className="btn btn-outline" onClick={() => setViewingParticipant(null)}>Fermer</button>
                        <button className="btn btn-primary" onClick={() => {
                            const p = viewingParticipant;
                            setViewingParticipant(null);
                            handleEdit(p);
                        }}>
                            <Edit2 size={16} style={{ marginRight: '8px' }} /> Modifier
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ParticipantDetails;
