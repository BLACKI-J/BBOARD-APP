import React, { useState } from 'react';
import { X, CheckCircle2, Circle, Search, Users, AlertCircle } from 'lucide-react';

export default function AttendanceTracker({ isOpen, onClose, participants, setParticipants, groups }) {
    if (!isOpen) return null;

    const [searchTerm, setSearchTerm] = useState('');
    const [filterGroup, setFilterGroup] = useState('all');

    // Only show children for attendance by default
    const children = participants.filter(p => p.role === 'child');

    const filteredChildren = children.filter(child => {
        const matchSearch = (child.firstName + ' ' + child.lastName).toLowerCase().includes(searchTerm.toLowerCase());
        const matchGroup = filterGroup === 'all' || child.group === filterGroup;
        return matchSearch && matchGroup;
    }).sort((a, b) => (a.firstName || '').localeCompare(b.firstName || ''));

    const presentCount = children.filter(c => c.isPresent).length;
    const totalCount = children.length;
    const progress = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

    const togglePresence = (id) => {
        setParticipants(participants.map(p => {
            if (p.id === id) {
                return { ...p, isPresent: !p.isPresent };
            }
            return p;
        }));
    };

    const markAllVisible = (status) => {
        const visibleIds = filteredChildren.map(c => c.id);
        setParticipants(participants.map(p => {
            if (visibleIds.includes(p.id)) {
                return { ...p, isPresent: status };
            }
            return p;
        }));
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200, padding: '0'
        }}>
            <div className="attendance-modal" style={{
                background: '#f8fafc', width: '100%', maxWidth: '800px', height: '90vh',
                borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
                display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 -10px 40px rgba(0,0,0,0.2)'
            }}>
                {/* Header */}
                <div style={{ padding: '1.5rem', background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ background: '#eef2ff', padding: '0.75rem', borderRadius: '12px', display: 'flex' }}>
                            <CheckCircle2 size={24} color="#4f46e5" />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#1e293b' }}>Pointage Rapide</h2>
                            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>Vérifiez les présences pour le rassemblement</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', color: '#64748b' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Progress & Stats */}
                <div style={{ padding: '1.5rem', background: 'white', borderBottom: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.75rem' }}>
                        <div>
                            <span style={{ fontSize: '2rem', fontWeight: '800', color: progress === 100 ? '#10b981' : '#4f46e5' }}>{presentCount}</span>
                            <span style={{ fontSize: '1.1rem', fontWeight: '600', color: '#94a3b8' }}> / {totalCount} présents</span>
                        </div>
                        <span style={{ fontSize: '0.9rem', fontWeight: '700', color: progress === 100 ? '#10b981' : '#64748b' }}>
                            {progress}%
                        </span>
                    </div>
                    <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${progress}%`, height: '100%', background: progress === 100 ? '#10b981' : '#4f46e5', transition: 'all 0.4s ease' }} />
                    </div>
                </div>

                {/* Filters */}
                <div style={{ padding: '1rem 1.5rem', background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                        <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                            type="text"
                            placeholder="Rechercher un enfant..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem 1rem 0.75rem 2.5rem', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '0.95rem', outline: 'none' }}
                            onFocus={e => e.target.style.borderColor = '#4f46e5'}
                            onBlur={e => e.target.style.borderColor = '#cbd5e1'}
                        />
                    </div>
                    <select
                        value={filterGroup}
                        onChange={(e) => setFilterGroup(e.target.value)}
                        style={{ padding: '0.75rem 2rem 0.75rem 1rem', border: '1px solid #cbd5e1', borderRadius: '10px', background: 'white', fontSize: '0.95rem', color: '#475569', cursor: 'pointer', outline: 'none' }}>
                        <option value="all">Tous les groupes</option>
                        {groups.map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                    </select>
                </div>

                {/* Bulk Actions */}
                <div style={{ padding: '0.75rem 1.5rem', display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => markAllVisible(true)} style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
                        ✓ Tout pointer
                    </button>
                    <button onClick={() => markAllVisible(false)} style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
                        Annuler tout
                    </button>
                </div>

                {/* List */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '0 1.5rem 2rem 1.5rem' }}>
                    {filteredChildren.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                            <Users size={32} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                            <p>Aucun enfant trouvé.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.75rem' }}>
                            {filteredChildren.map(child => {
                                const group = groups.find(g => g.id === child.group);
                                return (
                                    <div
                                        key={child.id}
                                        onClick={() => togglePresence(child.id)}
                                        style={{
                                            background: child.isPresent ? '#ecfdf5' : 'white',
                                            border: `2px solid ${child.isPresent ? '#34d399' : '#e2e8f0'}`,
                                            borderRadius: '12px', padding: '0.75rem 1rem',
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            cursor: 'pointer', transition: 'all 0.1s ease',
                                            boxShadow: child.isPresent ? '0 4px 12px rgba(52,211,153,0.1)' : '0 1px 3px rgba(0,0,0,0.02)'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            {/* Avatar or Photo */}
                                            {child.photo ? (
                                                <img src={child.photo} alt={child.firstName} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '1.1rem' }}>
                                                    {(child.firstName?.[0] || '?').toUpperCase()}
                                                </div>
                                            )}

                                            <div>
                                                <div style={{ fontWeight: '700', color: child.isPresent ? '#065f46' : '#1e293b', fontSize: '1rem' }}>
                                                    {child.firstName} {child.lastName}
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '2px' }}>
                                                    {group && (
                                                        <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: `${group.color}20`, color: group.color, borderRadius: '4px', fontWeight: '600' }}>
                                                            {group.name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ color: child.isPresent ? '#10b981' : '#cbd5e1' }}>
                                            {child.isPresent ? <CheckCircle2 size={28} /> : <Circle size={28} />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
            <style>{`
                @media (min-width: 800px) {
                    .attendance-modal {
                        margin-bottom: 2rem;
                        height: 85vh !important;
                        border-radius: 24px !important;
                    }
                }
            `}</style>
        </div>
    );
}
