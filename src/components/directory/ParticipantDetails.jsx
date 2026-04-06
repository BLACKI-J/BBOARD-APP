import React from 'react';
import { X, Mail, Phone, Edit2, ShieldAlert, CheckCircle2, Coins, MapPin, GraduationCap, Calendar, History, ArrowRight } from 'lucide-react';
import Avatar from '../common/Avatar';
import { RoleBadge, GroupBadge } from '../common/Badges';
import { getAge } from '../../utils/participantUtils';

const ParticipantDetails = ({ viewingParticipant, setViewingParticipant, handleEdit, groups, canEdit }) => {
    if (!viewingParticipant) return null;

    const age = getAge(viewingParticipant.birthDate);
    const roleColor = viewingParticipant.role === 'animator' ? 'var(--secondary-color)' : (viewingParticipant.role === 'direction' ? 'var(--accent-color)' : 'var(--primary-color)');

    return (
        <div className="modal-overlay animate-fade-in" onClick={() => setViewingParticipant(null)} style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', zIndex: 1000 }}>
            <div className="modal-content animate-scale-in" 
                style={{ 
                    borderRadius: '32px', 
                    overflow: 'hidden', 
                    maxWidth: '520px', 
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.95)',
                    boxShadow: '0 25px 80px oklch(0% 0 0 / 0.25)',
                    border: '1.5px solid var(--glass-border)'
                }} 
                onClick={(e) => e.stopPropagation()}>

                {/* Header Image / Gradient Area */}
                <div style={{
                    height: '120px',
                    background: `linear-gradient(135deg, ${roleColor} 0%, oklch(from ${roleColor} 90% 0.05 h) 100%)`,
                    position: 'relative',
                    flexShrink: 0
                }}>
                    <button onClick={() => setViewingParticipant(null)} 
                        style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(255,255,255,0.2)', color: 'white', borderRadius: '12px', padding: '8px', border: 'none', cursor: 'pointer', backdropFilter: 'blur(10px)', display: 'flex' }}>
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </div>

                <div style={{ padding: '0 2rem 2.5rem 2.5rem', maxHeight: '80vh', overflowY: 'auto' }} className="no-scrollbar">
                    {/* Profile Header */}
                    <div style={{ marginTop: '-60px', marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                        <div style={{ border: '6px solid white', borderRadius: '32px', boxShadow: '0 12px 30px oklch(0% 0 0 / 0.15)', background: 'white', marginBottom: '1.25rem' }}>
                            <Avatar participant={viewingParticipant} size={110} />
                        </div>
                        <h2 style={{ fontSize: '1.75rem', color: 'var(--text-main)', margin: '0 0 0.5rem 0', fontWeight: '950', fontFamily: 'Sora, sans-serif', textAlign: 'center', letterSpacing: '-0.03em' }}>
                            {viewingParticipant.firstName} <span style={{ textTransform: 'uppercase' }}>{viewingParticipant.lastName}</span>
                        </h2>
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                            <RoleBadge role={viewingParticipant.role} />
                            <GroupBadge groupId={viewingParticipant.group} groups={groups} />
                        </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                        <div className="card-glass" style={{ padding: '1rem', background: 'white', textAlign: 'center', borderRadius: '20px' }}>
                            <div style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: '950', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Âge</div>
                            <div style={{ color: 'var(--text-main)', fontWeight: '900', fontSize: '1.1rem' }}>{age || '—'}</div>
                        </div>
                        <div className="card-glass" style={{ padding: '1rem', background: 'white', textAlign: 'center', borderRadius: '20px' }}>
                            <div style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: '950', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Date Naiss.</div>
                            <div style={{ color: 'var(--text-main)', fontWeight: '900', fontSize: '1.1rem' }}>{viewingParticipant.birthDate || '—'}</div>
                        </div>
                    </div>

                    {/* Details List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        
                        {/* Medical / Alerte Section */}
                        {(viewingParticipant.allergies || viewingParticipant.constraints) ? (
                            <div style={{ background: 'oklch(62% 0.2 28 / 0.05)', border: '1.5px solid oklch(62% 0.2 28 / 0.15)', borderRadius: '24px', padding: '1.5rem', color: 'var(--danger-color)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '950', fontSize: '0.85rem', marginBottom: '1rem' }}>
                                    <ShieldAlert size={20} strokeWidth={2.5} /> SÉCURITÉ MÉDICALE
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {viewingParticipant.allergies && (
                                        <div>
                                            <div style={{ fontSize: '10px', fontWeight: '950', opacity: 0.6, marginBottom: '2px' }}>ALLERGIES</div>
                                            <div style={{ color: 'var(--text-main)', fontWeight: '750', fontSize: '0.95rem' }}>{viewingParticipant.allergies}</div>
                                        </div>
                                    )}
                                    {viewingParticipant.constraints && (
                                        <div>
                                            <div style={{ fontSize: '10px', fontWeight: '950', opacity: 0.6, marginBottom: '2px' }}>CONTRAINTES / RÉGIME</div>
                                            <div style={{ color: 'var(--text-main)', fontWeight: '750', fontSize: '0.95rem' }}>{viewingParticipant.constraints}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div style={{ background: 'var(--bg-secondary)', borderRadius: '24px', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)' }}>
                                <CheckCircle2 size={20} style={{ color: 'var(--success-color)' }} />
                                <span style={{ fontWeight: '850', fontSize: '0.85rem' }}>AUCUN PROBLÈME MÉDICAL SIGNALÉ</span>
                            </div>
                        )}

                        {/* Professional Info (Staff Only) */}
                        {(viewingParticipant.role === 'animator' || viewingParticipant.role === 'direction') && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <h3 style={{ fontSize: '11px', fontWeight: '950', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0.5rem 0 0 0' }}>Informations Professionnelles</h3>
                                <div className="card-glass" style={{ background: 'white', padding: '1.5rem', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    {viewingParticipant.training && (
                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            <GraduationCap size={18} style={{ color: 'var(--primary-color)', flexShrink: 0 }} />
                                            <div>
                                                <div style={{ fontSize: '10px', fontWeight: '950', color: 'var(--text-muted)' }}>FORMATION</div>
                                                <div style={{ fontWeight: '800', fontSize: '0.95rem' }}>{viewingParticipant.training}</div>
                                            </div>
                                        </div>
                                    )}
                                    {viewingParticipant.phone && (
                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            <Phone size={18} style={{ color: 'var(--primary-color)', flexShrink: 0 }} />
                                            <div>
                                                <div style={{ fontSize: '10px', fontWeight: '950', color: 'var(--text-muted)' }}>TÉLÉPHONE</div>
                                                <div style={{ fontWeight: '800', fontSize: '0.95rem' }}>{viewingParticipant.phone}</div>
                                            </div>
                                        </div>
                                    )}
                                    {viewingParticipant.address && (
                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            <MapPin size={18} style={{ color: 'var(--primary-color)', flexShrink: 0 }} />
                                            <div>
                                                <div style={{ fontSize: '10px', fontWeight: '950', color: 'var(--text-muted)' }}>ADRESSE</div>
                                                <div style={{ fontWeight: '800', fontSize: '0.95rem', lineHeight: 1.4 }}>{viewingParticipant.address}</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Pocket Money Section (Children Only) */}
                        {viewingParticipant.role === 'child' && viewingParticipant.pocketMoney && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <h3 style={{ fontSize: '11px', fontWeight: '950', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0.5rem 0 0 0' }}>Gestion de l'argent de poche</h3>
                                <div className="card-glass" style={{ background: 'white', padding: '1.75rem', borderRadius: '24px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                        <div>
                                            <div style={{ fontSize: '10px', fontWeight: '950', color: 'var(--text-muted)', marginBottom: '4px' }}>SOLDE ACTUEL</div>
                                            <div style={{ fontSize: '2rem', fontWeight: '950', color: viewingParticipant.pocketMoney.current < 0 ? 'var(--danger-color)' : 'var(--success-color)', lineHeight: 1 }}>
                                                {Number(viewingParticipant.pocketMoney.current || 0).toFixed(2)} €
                                            </div>
                                        </div>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'oklch(71% 0.19 45 / 0.1)', color: 'oklch(71% 0.19 45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Coins size={24} />
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '16px' }}>
                                         <div>
                                            <div style={{ fontSize: '9px', fontWeight: '950', color: 'var(--text-muted)' }}>DÉPOT INITIAL</div>
                                            <div style={{ fontWeight: '900', fontSize: '0.9rem' }}>{Number(viewingParticipant.pocketMoney.initial || 0).toFixed(2)} €</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '9px', fontWeight: '950', color: 'var(--text-muted)' }}>TOTAL DÉPENSÉ</div>
                                            <div style={{ fontWeight: '900', fontSize: '0.9rem', color: 'var(--danger-color)' }}>
                                                {Number((viewingParticipant.pocketMoney.initial || 0) - (viewingParticipant.pocketMoney.current || 0)).toFixed(2)} €
                                            </div>
                                        </div>
                                    </div>

                                    {viewingParticipant.pocketMoney.history && viewingParticipant.pocketMoney.history.length > 0 && (
                                        <div style={{ marginTop: '1.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '10px', fontWeight: '950', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                                                <History size={12} /> DERNIÈRES OPÉRATIONS
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                {viewingParticipant.pocketMoney.history.slice(0, 3).map((tx) => (
                                                    <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'white', border: '1.5px solid var(--glass-border)', borderRadius: '12px', fontSize: '0.85rem' }}>
                                                        <span style={{ fontWeight: '800' }}>{tx.description}</span>
                                                        <span style={{ fontWeight: '950', color: 'var(--danger-color)' }}>-{Number(tx.amount || 0).toFixed(2)} €</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    {canEdit && (
                        <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem' }}>
                            <button onClick={() => setViewingParticipant(null)} className="btn btn-secondary" style={{ flex: 1, padding: '1rem', borderRadius: '16px', fontWeight: '900' }}>Fermer</button>
                            <button onClick={() => {
                                const p = viewingParticipant;
                                setViewingParticipant(null);
                                handleEdit(p);
                            }} className="btn btn-primary" style={{ flex: 1.5, padding: '1rem', borderRadius: '16px', fontWeight: '950', gap: '0.75rem' }}>
                                <Edit2 size={18} strokeWidth={2.5} /> Modifier la fiche
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ParticipantDetails;
