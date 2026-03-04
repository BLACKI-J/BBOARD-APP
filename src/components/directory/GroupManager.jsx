import React from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

const GroupManager = ({ isOpen, onClose, groups, setGroups, participants, setParticipants, newGroupData, setNewGroupData, onAddGroup, onDeleteGroup }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div 
                className="modal-content animate-scale-in" 
                onClick={e => e.stopPropagation()}
                style={{ 
                    width: '380px', // Small fixed width
                    maxHeight: '80vh',
                    display: 'flex', 
                    flexDirection: 'column',
                    borderRadius: '16px',
                    background: 'white',
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
                    overflow: 'hidden'
                }}
            >
                {/* Header */}
                <div className="modal-header" style={{ 
                    padding: '1.25rem', 
                    borderBottom: '1px solid #e2e8f0', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    background: '#f8fafc'
                }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold', color: '#1e293b' }}>Gestion des Groupes</h3>
                    <button 
                        onClick={onClose}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px', display: 'flex' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="modal-body" style={{ padding: '1.25rem', overflowY: 'auto' }}>
                     {/* Add Group Form */}
                     <form onSubmit={onAddGroup} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <input 
                            type="text" 
                            value={newGroupData.name} 
                            onChange={e => setNewGroupData({ ...newGroupData, name: e.target.value })} 
                            placeholder="Nom du groupe..."
                            required
                            className="input-field"
                            style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                        />
                        <div style={{ position: 'relative', width: '40px', height: '38px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1', cursor: 'pointer' }}>
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
                                padding: '0 0.75rem', borderRadius: '8px', background: 'var(--primary-color)', color: 'white', border: 'none' 
                            }}
                        >
                            <Plus size={18} />
                        </button>
                    </form>

                    {/* Groups List */}
                    <div className="groups-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {groups.length === 0 && (
                            <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem', padding: '1rem' }}>
                                Aucun groupe créé.
                            </div>
                        )}
                        {groups.map(group => (
                            <div 
                                key={group.id} 
                                className="group-item animate-fade-in" 
                                style={{ 
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '0.75rem 1rem', background: 'white', 
                                    border: '1px solid #f1f5f9', borderRadius: '8px',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                                    borderLeft: `4px solid ${group.color}`
                                }}
                            >
                                <span style={{ fontWeight: 500, color: '#334155' }}>{group.name}</span>
                                <button 
                                    onClick={() => onDeleteGroup(group.id)}
                                    title="Supprimer"
                                    style={{ 
                                        background: 'transparent', border: 'none', cursor: 'pointer', 
                                        color: '#cbd5e1', padding: '4px', transition: 'color 0.2s' 
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = '#cbd5e1'}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GroupManager;
