import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Circle, Search, Users, Camera, Image as ImageIcon, Filter, ListFilter, SortAsc, UserCheck, UserMinus, LayoutGrid, LayoutList, X, ArrowLeft, Trophy, ChevronRight } from 'lucide-react';
import WebcamPhotoCapture from './directory/WebcamPhotoCapture';
import confetti from 'canvas-confetti';

export default function Attendance({ participants, setParticipants, groups }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterGroup, setFilterGroup] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all'); // all, present, absent
    const [sortBy, setSortBy] = useState('lastName'); // firstName, lastName
    const [viewMode, setViewMode] = useState('grid'); // grid, list
    const searchInputRef = useRef(null);

    // Photo capture states
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [selectedParticipantId, setSelectedParticipantId] = useState(null);

    const children = participants.filter(p => p.role === 'child');

    useEffect(() => {
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, []);

    const filteredChildren = children.filter(child => {
        const fullName = (child.firstName + ' ' + child.lastName).toLowerCase();
        const matchSearch = fullName.includes(searchTerm.toLowerCase());
        const matchGroup = filterGroup === 'all' || child.group === filterGroup;
        const matchStatus = statusFilter === 'all' ||
            (statusFilter === 'present' && child.isPresent) ||
            (statusFilter === 'absent' && !child.isPresent);
        return matchSearch && matchGroup && matchStatus;
    }).sort((a, b) => {
        if (sortBy === 'lastName') {
            return (a.lastName || '').localeCompare(b.lastName || '') || (a.firstName || '').localeCompare(b.firstName || '');
        }
        return (a.firstName || '').localeCompare(b.firstName || '') || (a.lastName || '').localeCompare(b.lastName || '');
    });

    const presentCount = children.filter(c => c.isPresent).length;
    const totalCount = children.length;
    const progress = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

    // Confetti effect when reaching 100%
    useEffect(() => {
        if (progress === 100 && totalCount > 0) {
            const duration = 3 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

            const randomInRange = (min, max) => Math.random() * (max - min) + min;

            const interval = setInterval(function () {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
            }, 250);
        }
    }, [progress, totalCount]);

    const groupStats = groups.map(group => {
        const members = children.filter(c => c.group === group.id);
        const presentMembers = members.filter(c => c.isPresent).length;
        return {
            ...group,
            count: members.length,
            presentCount: presentMembers,
            isComplete: members.length > 0 && members.length === presentMembers
        };
    });

    const togglePresence = (id) => {
        setParticipants(participants.map(p => p.id === id ? { ...p, isPresent: !p.isPresent } : p));
    };

    const markAllVisible = (status) => {
        const visibleIds = filteredChildren.map(c => c.id);
        setParticipants(participants.map(p => visibleIds.includes(p.id) ? { ...p, isPresent: status } : p));
    };

    const markGroupPresent = (groupId) => {
        const groupMembersIds = children.filter(c => c.group === groupId).map(c => c.id);
        setParticipants(participants.map(p => groupMembersIds.includes(p.id) ? { ...p, isPresent: true } : p));
    };

    const handlePhotoUpload = (e, participantId) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setParticipants(participants.map(p => p.id === participantId ? { ...p, photo: reader.result } : p));
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePhotoCaptured = (photoBase64) => {
        setParticipants(participants.map(p => p.id === selectedParticipantId ? { ...p, photo: photoBase64 } : p));
        setIsCameraOpen(false);
        setSelectedParticipantId(null);
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
            {/* Main Header */}
            <div style={{ padding: '1.25rem 1.5rem', background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', padding: '0.75rem', borderRadius: '12px', color: 'white', display: 'flex', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)' }}>
                        <UserCheck size={24} />
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#1e293b', letterSpacing: '-0.5px' }}>Pointage & Présences</h1>
                        <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b', fontWeight: '500' }}>{presentCount} sur {totalCount} enfants présents</p>
                    </div>
                </div>
            </div>

            {/* Sticky Stats & Filters Bar */}
            <div style={{ position: 'sticky', top: 0, zIndex: 15, background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                {/* Progress Mini Bar (Always visible at top of sticky) */}
                <div style={{ height: '4px', background: '#f1f5f9', width: '100%' }}>
                    <div style={{ width: `${progress}%`, height: '100%', background: progress === 100 ? '#10b981' : '#4f46e5', transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                </div>

                <div style={{ padding: '0.75rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        {/* Search */}
                        <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
                            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Rechercher par nom..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ width: '100%', boxSizing: 'border-box', padding: '0.65rem 2.5rem', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '0.9rem', outline: 'none', background: 'white', transition: 'all 0.2s', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }}
                                onFocus={(e) => e.target.style.borderColor = '#4f46e5'}
                                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                            />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: '#f1f5f9', border: 'none', color: '#64748b', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Bulk Actions Mini */}
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => markAllVisible(true)} style={{ padding: '0.65rem 1rem', borderRadius: '12px', border: 'none', background: '#10b981', color: 'white', fontSize: '0.8rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 2px 4px rgba(16,185,129,0.2)' }}>
                                <UserCheck size={16} /> Tout cocher
                            </button>
                            <button onClick={() => markAllVisible(false)} style={{ padding: '0.65rem', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: 'white', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Réinitialiser">
                                <UserMinus size={18} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '10px' }}>
                            <button onClick={() => setViewMode('grid')} style={{ padding: '6px', borderRadius: '7px', background: viewMode === 'grid' ? 'white' : 'transparent', border: 'none', cursor: 'pointer', display: 'flex', boxShadow: viewMode === 'grid' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none' }}>
                                <LayoutGrid size={18} color={viewMode === 'grid' ? '#4f46e5' : '#64748b'} />
                            </button>
                            <button onClick={() => setViewMode('list')} style={{ padding: '6px', borderRadius: '7px', background: viewMode === 'list' ? 'white' : 'transparent', border: 'none', cursor: 'pointer', display: 'flex', boxShadow: viewMode === 'list' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none' }}>
                                <LayoutList size={18} color={viewMode === 'list' ? '#4f46e5' : '#64748b'} />
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                            {[
                                { id: 'all', label: 'Tous', count: children.length },
                                { id: 'absent', label: 'Restants', count: children.length - presentCount, color: '#f59e0b' },
                                { id: 'present', label: 'Cochés', count: presentCount, color: '#10b981' }
                            ].map(pill => (
                                <button
                                    key={pill.id}
                                    onClick={() => setStatusFilter(pill.id)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                                        padding: '0.4rem 0.8rem', borderRadius: '30px', fontSize: '0.75rem', fontWeight: '700',
                                        border: '1.5px solid',
                                        borderColor: statusFilter === pill.id ? (pill.color || '#4f46e5') : 'transparent',
                                        background: statusFilter === pill.id ? (pill.color || '#4f46e5') : '#fff',
                                        color: statusFilter === pill.id ? 'white' : '#64748b',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                        cursor: 'pointer', transition: 'all 0.2s'
                                    }}
                                >
                                    {pill.label}
                                    <span style={{ opacity: 0.8, fontSize: '0.7rem', background: statusFilter === pill.id ? 'rgba(255,255,255,0.2)' : '#f1f5f9', padding: '1px 6px', borderRadius: '10px' }}>{pill.count}</span>
                                </button>
                            ))}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#64748b' }}>
                            <SortAsc size={14} />
                            <span style={{ fontWeight: '600' }}>Trier par :</span>
                            <button
                                onClick={() => setSortBy(sortBy === 'lastName' ? 'firstName' : 'lastName')}
                                style={{ background: '#fff', border: '1.5px solid #e2e8f0', padding: '0.4rem 0.75rem', borderRadius: '8px', color: '#4f46e5', fontWeight: '700', cursor: 'pointer', fontSize: '0.75rem' }}
                            >
                                {sortBy === 'lastName' ? 'Nom' : 'Prénom'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* Lateral Summary Sidebar (Desktop Only) */}
                <div style={{ width: '280px', borderRight: '1px solid #e2e8f0', background: 'white', overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="hide-mobile">
                    <div>
                        <h3 style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Users size={14} /> RÉSUMÉ PAR GROUPE
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {groupStats.map(group => (
                                <div key={group.id} style={{
                                    padding: '1rem', borderRadius: '16px', border: `1.5px solid ${group.isComplete ? '#10b981' : '#f1f5f9'}`,
                                    background: group.isComplete ? '#f0fdf4' : '#fff',
                                    transition: 'all 0.2s',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                                        <div style={{ fontWeight: '800', fontSize: '0.85rem', color: group.isComplete ? '#065f46' : '#1e293b' }}>{group.name}</div>
                                        <div style={{ fontSize: '0.75rem', fontWeight: '800', color: group.isComplete ? '#10b981' : '#64748b', background: group.isComplete ? '#dcfce7' : '#f8fafc', padding: '2px 8px', borderRadius: '6px' }}>
                                            {group.presentCount}/{group.count}
                                        </div>
                                    </div>
                                    <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden', marginBottom: '0.8rem' }}>
                                        <div style={{
                                            width: `${group.count > 0 ? (group.presentCount / group.count) * 100 : 0}%`,
                                            height: '100%',
                                            background: group.isComplete ? '#10b981' : group.color || '#4f46e5',
                                            transition: 'width 0.4s ease'
                                        }} />
                                    </div>
                                    {!group.isComplete && group.count > 0 && (
                                        <button
                                            onClick={() => markGroupPresent(group.id)}
                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '10px', background: `${group.color}10`, color: group.color, border: 'none', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', transition: 'all 0.2s' }}
                                            onMouseOver={(e) => e.currentTarget.style.background = `${group.color}20`}
                                            onMouseOut={(e) => e.currentTarget.style.background = `${group.color}10`}
                                        >
                                            Tout pointer <ChevronRight size={14} />
                                        </button>
                                    )}
                                    {group.isComplete && group.count > 0 && (
                                        <div style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: '800', justifyContent: 'center', padding: '0.4rem' }}>
                                            <CheckCircle2 size={16} /> Complet
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginTop: 'auto', padding: '1.25rem', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', borderRadius: '20px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                        <div style={{ width: '48px', height: '48px', background: progress === 100 ? '#fef3c7' : '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                            <Trophy size={24} color={progress === 100 ? '#f59e0b' : '#cbd5e1'} />
                        </div>
                        <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#1e293b', marginBottom: '4px' }}>
                            {progress === 100 ? "Objectif Atteint !" : "Progression"}
                        </div>
                        <div style={{ fontSize: '0.7rem', fontWeight: '600', color: '#64748b', lineHeight: '1.4' }}>
                            {progress === 100 ? "Tous les enfants sont présents sur le camp." : `Encore ${totalCount - presentCount} enfants à pointer pour finir.`}
                        </div>
                    </div>
                </div>

                {/* Main Content (Participant List) */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', background: '#f8fafc' }}>
                    {filteredChildren.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '5rem 2rem', color: '#94a3b8', background: 'white', borderRadius: '24px', border: '2px dashed #e2e8f0', maxWidth: '600px', margin: '2rem auto' }}>
                            <div style={{ width: '80px', height: '80px', background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                <Users size={40} style={{ opacity: 0.3 }} />
                            </div>
                            <h3 style={{ color: '#1e293b', fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.5rem' }}>Aucun résultat</h3>
                            <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: '1.6' }}>Aucun enfant ne correspond à vos critères de recherche ou de filtrage.</p>
                            {(searchTerm || filterGroup !== 'all' || statusFilter !== 'all') && (
                                <button
                                    onClick={() => { setSearchTerm(''); setFilterGroup('all'); setStatusFilter('all'); }}
                                    style={{ marginTop: '1.5rem', padding: '0.75rem 1.5rem', borderRadius: '12px', background: '#4f46e5', color: 'white', border: 'none', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)' }}
                                >
                                    Réinitialiser tout
                                </button>
                            )}
                        </div>
                    ) : (
                        <div style={{
                            display: viewMode === 'grid' ? 'grid' : 'flex',
                            flexDirection: 'column',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                            gap: '1rem',
                            paddingBottom: '2rem'
                        }}>
                            {filteredChildren.map(child => {
                                const group = groups.find(g => g.id === child.group);
                                return (
                                    <div
                                        key={child.id}
                                        className="attendance-card"
                                        style={{
                                            background: 'white',
                                            border: `1.5px solid ${child.isPresent ? '#10b981' : '#fff'}`,
                                            borderRadius: '20px', padding: '1rem',
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            boxShadow: child.isPresent ? '0 8px 16px -4px rgba(16,185,129,0.1)' : '0 2px 4px rgba(0,0,0,0.04)',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            position: 'relative', overflow: 'hidden'
                                        }}
                                    >
                                        {child.isPresent && (
                                            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#10b981' }} />
                                        )}

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                            {/* Avatar */}
                                            <div style={{ position: 'relative' }}>
                                                {child.photo ? (
                                                    <img src={child.photo} alt={child.firstName} style={{ width: '64px', height: '64px', borderRadius: '18px', objectFit: 'cover', border: '2px solid #fff', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }} />
                                                ) : (
                                                    <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: `linear-gradient(135deg, ${group?.color || '#4f46e5'}15 0%, ${group?.color || '#4f46e5'}30 100%)`, color: group?.color || '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1.4rem', border: '2px solid #fff' }}>
                                                        {(child.lastName?.[0] || child.firstName?.[0] || '?').toUpperCase()}
                                                    </div>
                                                )}

                                                <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', display: 'flex', gap: '4px' }}>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setSelectedParticipantId(child.id); setIsCameraOpen(true); }}
                                                        style={{ width: '26px', height: '26px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', transition: 'all 0.2s' }}
                                                        onMouseOver={(e) => e.currentTarget.style.color = '#4f46e5'}
                                                        onMouseOut={(e) => e.currentTarget.style.color = '#64748b'}
                                                        title="Prendre une photo">
                                                        <Camera size={14} />
                                                    </button>
                                                    <label
                                                        style={{ width: '26px', height: '26px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', transition: 'all 0.2s' }}
                                                        onMouseOver={(e) => e.currentTarget.style.color = '#4f46e5'}
                                                        onMouseOut={(e) => e.currentTarget.style.color = '#64748b'}
                                                        title="Importer une photo">
                                                        <ImageIcon size={14} />
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => handlePhotoUpload(e, child.id)}
                                                            style={{ display: 'none' }}
                                                        />
                                                    </label>
                                                </div>
                                            </div>

                                            {/* Info */}
                                            <div>
                                                <div style={{ fontWeight: '800', color: '#1e293b', fontSize: '1rem', marginBottom: '2px' }}>
                                                    {child.lastName?.toUpperCase()}
                                                </div>
                                                <div style={{ fontWeight: '600', color: '#64748b', fontSize: '0.9rem', marginBottom: '4px' }}>
                                                    {child.firstName}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    {group && (
                                                        <span style={{ fontSize: '0.65rem', padding: '2px 8px', background: `${group.color}15`, color: group.color, borderRadius: '6px', fontWeight: '800', letterSpacing: '0.02em' }}>
                                                            {group.name}
                                                        </span>
                                                    )}
                                                    {child.isPresent && (
                                                        <span style={{ fontSize: '0.6rem', color: '#10b981', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                                            <CheckCircle2 size={10} /> Présent
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Toggle Checkbox */}
                                        <div
                                            onClick={() => togglePresence(child.id)}
                                            style={{
                                                width: '48px', height: '48px', borderRadius: '16px',
                                                background: child.isPresent ? '#10b981' : '#f8fafc',
                                                color: child.isPresent ? 'white' : '#e2e8f0',
                                                border: `2px solid ${child.isPresent ? '#10b981' : '#f1f5f9'}`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                boxShadow: child.isPresent ? '0 4px 12px rgba(16,185,129,0.2)' : 'none',
                                                cursor: 'pointer'
                                            }}>
                                            {child.isPresent ? <CheckCircle2 size={28} strokeWidth={2.5} /> : <Circle size={28} strokeWidth={2.5} />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <WebcamPhotoCapture
                isOpen={isCameraOpen}
                onClose={() => { setIsCameraOpen(false); setSelectedParticipantId(null); }}
                onPhotoCaptured={handlePhotoCaptured}
            />

            <style>{`
                .attendance-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 24px -8px rgba(0,0,0,0.1) !important;
                    border-color: #cbd5e1 !important;
                }
                .attendance-card:active {
                    transform: scale(0.98);
                }
                @media (max-width: 768px) {
                    .hide-mobile {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
