import React from 'react';
import { X, Plus, Trash2, LayoutGrid } from 'lucide-react';

const GroupManager = ({ isOpen, onClose, groups, setGroups, participants, setParticipants, newGroupData, setNewGroupData, onAddGroup, onDeleteGroup, canEdit }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay animate-fade-in" onClick={onClose} style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', zIndex: 1000 }}>
            <div 
                className="modal-content animate-scale-in" 
                onClick={e => e.stopPropagation()}
                style={{ 
                    width: '100%',
                    maxWidth: '440px',
                    borderRadius: '28px',
                    background: 'white',
                    boxShadow: '0 25px 80px oklch(0% 0 0 / 0.15)',
                    overflow: 'hidden',
                    border: '1.5px solid var(--glass-border)'
                }}
            >
                {/* Header */}
                <div style={{ 
                    padding: '1.5rem 2rem', 
                    background: 'var(--primary-gradient)', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    color: 'white'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div style={{ width: '36px', height: '36px', background: 'rgba(255,255,255,0.2)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <LayoutGrid size={20} strokeWidth={2.5} />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '950', fontFamily: 'Sora, sans-serif', letterSpacing: '-0.02em' }}>Gestion des Groupes</h3>
                    </div>
                    <button 
                        onClick={onClose}
                        style={{ background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', color: 'white', borderRadius: '10px', padding: '6px', display: 'flex' }}
                    >
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: '2rem', overflowY: 'auto' }} className="no-scrollbar">
                     {/* Add Group Form */}
                     {canEdit && (
                         <form onSubmit={onAddGroup} style={{ display: 'flex', gap: '0.75rem', marginBottom: '2.5rem' }}>
                            <input 
                                type="text" 
                                value={newGroupData.name} 
                                onChange={e => setNewGroupData({ ...newGroupData, name: e.target.value })} 
                                placeholder="Nom du groupe..."
                                required
                                className="glass-input"
                                style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '14px', border: '1.5px solid var(--glass-border)', fontSize: '0.9rem', fontWeight: '700', background: 'var(--bg-secondary)', outline: 'none' }}
                            />
                            <div style={{ position: 'relative', width: '48px', height: '48px', borderRadius: '14px', overflow: 'hidden', border: '1.5px solid var(--glass-border)', cursor: 'pointer', background: 'white' }}>
                                <input 
                                    type="color" 
                                    value={newGroupData.color} 
                                    onChange={e => setNewGroupData({ ...newGroupData, color: e.target.value })} 
                                    style={{ 
                                        position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', 
                                        padding: 0, margin: 0, cursor: 'pointer', border: 'none' 
                                    }}
                                />
                            </div>
                            <button 
                                type="submit" 
                                className="btn btn-primary"
                                style={{ 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                    width: '48px', height: '48px', borderRadius: '14px', padding: 0, flexShrink: 0
                                }}
                            >
                                <Plus size={24} strokeWidth={3} />
                            </button>
                        </form>
                     )}

                    {/* Groups List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {groups.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--bg-secondary)', borderRadius: '20px', border: '1.5px dashed var(--glass-border)' }}>
                                <div style={{ marginBottom: '1rem', color: 'var(--text-muted)', opacity: 0.4 }}><LayoutGrid size={44} /></div>
                                <div style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-muted)' }}>Aucun groupe créé</div>
                            </div>
                        ) : (
                            groups.map(group => (
                                <div 
                                    key={group.id} 
                                    className="card-glass animate-fade-in" 
                                    style={{ 
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '1.25rem 1.5rem', background: 'white', 
                                        borderRadius: '18px',
                                        border: '1.5px solid var(--glass-border)',
                                        borderLeft: `8px solid ${group.color}`,
                                        transition: 'transform 0.3s var(--ease-out-expo)'
                                    }}
                                >
                                    <span style={{ fontWeight: '950', color: 'var(--text-main)', fontSize: '1rem', letterSpacing: '-0.01em' }}>{group.name}</span>
                                    {canEdit && (
                                        <button 
                                            onClick={() => onDeleteGroup(group.id)}
                                            className="btn-icon-ref danger"
                                            title="Supprimer le groupe"
                                            style={{ width: '36px', height: '36px', borderRadius: '10px' }}
                                        >
                                            <Trash2 size={16} strokeWidth={2.5} />
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div style={{ padding: '1.5rem 2rem', background: 'var(--bg-secondary)', borderTop: '1.5px solid var(--glass-border)', textAlign: 'right' }}>
                    <button onClick={onClose} className="btn btn-secondary" style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: '950' }}>Fermer</button>
                </div>
            </div>
            <style>{`
                .glass-input:focus { border-color: var(--primary-color) !important; background: white !important; }
            `}</style>
        </div>
    );
};

export default GroupManager;
