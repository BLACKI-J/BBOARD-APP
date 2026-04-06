import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Circle, Search, Users, Camera, Image as ImageIcon, UserCheck, UserMinus, LayoutGrid, LayoutList, X, Trophy, ChevronRight, ShieldAlert, Check } from 'lucide-react';
import WebcamPhotoCapture from './directory/WebcamPhotoCapture';
import confetti from 'canvas-confetti';
import { useUi } from '../ui/UiProvider';

export default function Attendance({ participants, setParticipants, groups, canEdit = true, isMobile }) {
    const ui = useUi();
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
            const duration = 4 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 40, spread: 360, ticks: 100, zIndex: 1000 };

            const randomInRange = (min, max) => Math.random() * (max - min) + min;

            const interval = setInterval(function () {
                const timeLeft = animationEnd - Date.now();
                if (timeLeft <= 0) return clearInterval(interval);

                const particleCount = 60 * (timeLeft / duration);
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.4), y: Math.random() - 0.2 } });
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.6, 0.9), y: Math.random() - 0.2 } });
            }, 300);
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
        if (!canEdit) {
            ui.toast('Pointage non autorisé.', { type: 'error' });
            return;
        }
        setParticipants(participants.map(p => p.id === id ? { ...p, isPresent: !p.isPresent } : p));
    };

    const markAllVisible = (status) => {
        if (!canEdit) return;
        const visibleIds = filteredChildren.map(c => c.id);
        setParticipants(participants.map(p => visibleIds.includes(p.id) ? { ...p, isPresent: status } : p));
    };

    const markGroupPresent = (groupId) => {
        if (!canEdit) return;
        const groupMembersIds = children.filter(c => c.group === groupId).map(c => c.id);
        setParticipants(participants.map(p => groupMembersIds.includes(p.id) ? { ...p, isPresent: true } : p));
    };

    const handlePhotoUpload = (e, participantId) => {
        if (!canEdit) return;
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
        if (!canEdit) return;
        setParticipants(participants.map(p => p.id === selectedParticipantId ? { ...p, photo: photoBase64 } : p));
        setIsCameraOpen(false);
        setSelectedParticipantId(null);
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'transparent' }}>
            <div style={{ maxWidth: '1600px', width: '96%', margin: '0 auto', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            {/* Action Bar */}
            <div style={{ 
                padding: isMobile ? '0.75rem 1rem' : '1rem 2.5rem', 
                background: 'var(--glass-bg)', 
                backdropFilter: 'blur(var(--glass-blur))', 
                borderBottom: '1.5px solid var(--glass-border)', 
                display: 'flex', 
                flexDirection: 'column',
                gap: isMobile ? '0.75rem' : '1rem',
                zIndex: 20 
            }}>
                <div style={{ display: 'flex', gap: isMobile ? '0.75rem' : '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Search */}
                    <div style={{ flex: isMobile ? '1 1 100%' : '1', minWidth: isMobile ? '0' : '280px', position: 'relative', order: isMobile ? 2 : 1 }}>
                        <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder={isMobile ? "Rechercher..." : "Rechercher un enfant..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ 
                                width: '100%', 
                                padding: isMobile ? '0.65rem 2.5rem' : '0.75rem 2.8rem', 
                                border: '1.5px solid var(--glass-border)', 
                                borderRadius: '14px', 
                                fontSize: '0.9rem', 
                                fontWeight: '600',
                                outline: 'none', 
                                background: 'rgba(255, 255, 255, 0.6)', 
                                transition: 'all 0.3s var(--ease-out-expo)' 
                            }}
                            className="glass-input"
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.05)', border: 'none', color: 'var(--text-muted)', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                <X size={12} />
                            </button>
                        )}
                    </div>

                    {/* Bulk Actions */}
                    <div style={{ display: 'flex', gap: '0.5rem', width: isMobile ? '100%' : 'auto', order: isMobile ? 1 : 2 }}>
                        <button onClick={() => markAllVisible(true)} className="btn btn-primary" style={{ flex: isMobile ? 1 : 'none', padding: '0.65rem 1rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '900', gap: '0.5rem' }}>
                            <UserCheck size={16} strokeWidth={2.5} /> Tout cocher
                        </button>
                        <button onClick={() => markAllVisible(false)} className="btn btn-secondary" style={{ width: '40px', height: '40px', padding: '0', borderRadius: '12px', justifyContent: 'center' }} title="Réinitialiser">
                            <UserMinus size={18} strokeWidth={2.5} />
                        </button>
                        
                        <div style={{ display: 'flex', background: 'oklch(0% 0 0 / 0.06)', padding: '4px', borderRadius: '12px', backdropFilter: 'blur(10px)', marginLeft: isMobile ? 'auto' : '0.5rem' }}>
                            <button onClick={() => setViewMode('grid')} style={{ width: '32px', height: '32px', borderRadius: '8px', background: viewMode === 'grid' ? 'white' : 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: viewMode === 'grid' ? 'var(--shadow-sm)' : 'none', transition: 'all 0.3s' }}>
                                <LayoutGrid size={16} color={viewMode === 'grid' ? 'var(--primary-color)' : 'var(--text-muted)'} strokeWidth={2.5} />
                            </button>
                            <button onClick={() => setViewMode('list')} style={{ width: '32px', height: '32px', borderRadius: '8px', background: viewMode === 'list' ? 'white' : 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: viewMode === 'list' ? 'var(--shadow-sm)' : 'none', transition: 'all 0.3s' }}>
                                <LayoutList size={16} color={viewMode === 'list' ? 'var(--primary-color)' : 'var(--text-muted)'} strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', width: isMobile ? '100%' : 'auto', paddingBottom: isMobile ? '4px' : 0 }} className="no-scrollbar">
                        {[
                            { id: 'all', label: 'Tous', count: children.length },
                            { id: 'absent', label: 'Restants', count: children.length - presentCount, color: 'var(--cta-color)' },
                            { id: 'present', label: 'Présents', count: presentCount, color: 'var(--success-color)' }
                        ].map(pill => (
                            <button
                                key={pill.id}
                                onClick={() => setStatusFilter(pill.id)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.625rem',
                                    padding: '0.5rem 1rem', borderRadius: '30px', fontSize: '0.8rem', fontWeight: '900',
                                    border: '1.5px solid',
                                    borderColor: statusFilter === pill.id ? 'transparent' : 'var(--glass-border)',
                                    background: statusFilter === pill.id ? (pill.color || 'var(--primary-color)') : 'white',
                                    color: statusFilter === pill.id ? 'white' : 'var(--text-muted)',
                                    boxShadow: statusFilter === pill.id ? '0 8px 16px oklch(0% 0 0 / 0.1)' : 'none',
                                    cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0
                                }}
                            >
                                {pill.label}
                                <span style={{ opacity: 0.8, fontSize: '0.7rem', background: 'rgba(0,0,0,0.1)', padding: '2px 8px', borderRadius: '10px', fontWeight: '950' }}>{pill.count}</span>
                            </button>
                        ))}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'space-between' : 'flex-end' }}>
                        <select
                            value={filterGroup}
                            onChange={(e) => setFilterGroup(e.target.value)}
                            style={{ background: 'white', border: '1.5px solid var(--glass-border)', padding: '0.4rem 0.65rem', borderRadius: '10px', color: 'var(--text-main)', fontWeight: '800', cursor: 'pointer', fontSize: '0.75rem', outline: 'none', flex: isMobile ? 1 : 'none' }}
                        >
                            <option value="all">Tous Groupes</option>
                            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                        <button
                            onClick={() => setSortBy(sortBy === 'lastName' ? 'firstName' : 'lastName')}
                            style={{ background: 'white', border: '1.5px solid var(--glass-border)', padding: '0.4rem 0.65rem', borderRadius: '10px', color: 'var(--primary-color)', fontWeight: '900', cursor: 'pointer', fontSize: '0.75rem', transition: 'all 0.2s', flex: isMobile ? 1 : 'none' }}
                        >
                            Trier : {sortBy === 'lastName' ? 'NOM' : 'PRÉNOM'}
                        </button>
                    </div>
                </div>
            </div>

            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* Lateral Summary Sidebar */}
                <div style={{ 
                    width: '320px', 
                    borderRight: '1.5px solid var(--glass-border)', 
                    background: 'rgba(255, 255, 255, 0.4)', 
                    backdropFilter: 'blur(10px)',
                    overflowY: 'auto', 
                    padding: '2rem 1.5rem', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '2rem' 
                }} className="hide-mobile no-scrollbar">
                    
                    <div>
                        <h3 style={{ fontSize: '11px', fontWeight: '950', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                <Users size={14} />
                            </div>
                            Groupes ({groupStats.length})
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {groupStats.map(group => (
                                <div key={group.id} className="card-glass" style={{
                                    padding: '1.25rem', 
                                    border: `1.5px solid ${group.isComplete ? 'var(--success-color)' : 'var(--glass-border)'}`,
                                    background: group.isComplete ? 'oklch(62% 0.18 145 / 0.08)' : 'rgba(255, 255, 255, 0.7)',
                                    transition: 'transform 0.3s var(--ease-out-expo)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <div style={{ fontWeight: '950', fontSize: '0.95rem', color: group.isComplete ? 'var(--success-color)' : 'var(--text-main)', letterSpacing: '-0.02em' }}>{group.name}</div>
                                        <div style={{ fontSize: '11px', fontWeight: '950', color: group.isComplete ? 'white' : 'var(--text-muted)', background: group.isComplete ? 'var(--success-color)' : 'rgba(0,0,0,0.06)', padding: '3px 10px', borderRadius: '20px' }}>
                                            {group.presentCount} / {group.count}
                                        </div>
                                    </div>
                                    <div style={{ height: '8px', background: 'rgba(0,0,0,0.06)', borderRadius: '10px', overflow: 'hidden', marginBottom: '1.25rem' }}>
                                        <div style={{
                                            width: `${group.count > 0 ? (group.presentCount / group.count) * 100 : 0}%`,
                                            height: '100%',
                                            background: group.isComplete ? 'var(--success-color)' : group.color || 'var(--primary-color)',
                                            borderRadius: '10px',
                                            transition: 'width 1s var(--ease-out-expo)'
                                        }} />
                                    </div>
                                    {!group.isComplete && group.count > 0 && (
                                        <button
                                            onClick={() => markGroupPresent(group.id)}
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', background: 'white', border: '1.5px solid var(--glass-border)', color: group.color || 'var(--primary-color)', fontSize: '0.8rem', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s' }}
                                            onMouseOver={(e) => e.currentTarget.style.background = 'var(--glass-bg)'}
                                            onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                                        >
                                            Tout cocher <ChevronRight size={16} strokeWidth={2.5} />
                                        </button>
                                    )}
                                    {group.isComplete && group.count > 0 && (
                                        <div style={{ color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '0.625rem', fontSize: '0.85rem', fontWeight: '950', justifyContent: 'center', background: 'white', padding: '0.75rem', borderRadius: '12px', border: '1.5px solid var(--success-color)' }}>
                                            <Check size={18} strokeWidth={3} /> GROUPE COMPLET
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginTop: 'auto', padding: '1.5rem', background: 'var(--primary-gradient)', borderRadius: '24px', textAlign: 'center', color: 'white', boxShadow: '0 12px 30px oklch(58% 0.18 var(--brand-hue) / 0.25)', border: '2px solid white' }}>
                        <div style={{ width: '56px', height: '56px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', backdropFilter: 'blur(10px)' }}>
                            <Trophy size={28} />
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: '950', marginBottom: '6px', letterSpacing: '-0.02em' }}>
                            Pointage Atteint
                        </div>
                        <div style={{ fontSize: '2.5rem', fontWeight: '950', marginBottom: '8px', lineHeight: 1 }}>{progress}%</div>
                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '10px', overflow: 'hidden', margin: '15px 0' }}>
                             <div style={{ width: `${progress}%`, height: '100%', background: 'white', transition: 'width 1s' }} />
                        </div>
                        <p style={{ fontSize: '0.8rem', fontWeight: '700', color: 'rgba(255,255,255,0.9)', lineHeight: '1.5' }}>
                            {progress === 100 ? "Mission accomplie ! Tous les enfants sont là." : `Encore ${totalCount - presentCount} enfants à trouver.`}
                        </p>
                    </div>
                </div>

                {/* Main Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '1rem' : '2.5rem', background: 'rgba(0,0,0,0.02)' }} className="no-scrollbar">
                    {filteredChildren.length === 0 ? (
                        <div className="card-glass" style={{ textAlign: 'center', padding: '6rem 2rem', maxWidth: '600px', margin: '4rem auto', border: '2.5px dashed var(--glass-border)' }}>
                            <div style={{ width: '90px', height: '90px', background: 'var(--bg-secondary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                                <Users size={44} style={{ opacity: 0.15 }} />
                            </div>
                            <h3 style={{ color: 'var(--text-main)', fontSize: '1.5rem', fontWeight: '950', marginBottom: '0.75rem', letterSpacing: '-0.03em' }}>Aucun résultat</h3>
                            <p style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: '600', lineHeight: '1.6' }}>Affinez vos critères de recherche ou réinitialisez les filtres.</p>
                            {(searchTerm || filterGroup !== 'all' || statusFilter !== 'all') && (
                                <button
                                    onClick={() => { setSearchTerm(''); setFilterGroup('all'); setStatusFilter('all'); }}
                                    className="btn btn-primary" style={{ marginTop: '2rem', padding: '0.85rem 2rem', fontWeight: '950' }}
                                >
                                    Réinitialiser tout
                                </button>
                            )}
                        </div>
                    ) : (
                        <div style={{
                            display: viewMode === 'grid' ? 'grid' : 'flex',
                            flexDirection: 'column',
                            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(340px, 1fr))',
                            gap: isMobile ? '0.75rem' : '1.25rem',
                            paddingBottom: isMobile ? '2rem' : '4rem'
                        }}>
                            {filteredChildren.map((child, idx) => {
                                const group = groups.find(g => g.id === child.group);
                                return (
                                    <div
                                        key={child.id}
                                        className="card-glass attendance-card animate-fade-in"
                                        style={{
                                            '--i': idx,
                                            animationDelay: `calc(var(--i, 0) * 20ms)`,
                                            border: `1.5px solid ${child.isPresent ? 'var(--success-color)' : 'var(--glass-border)'}`,
                                            background: child.isPresent ? 'white' : 'rgba(255,255,255,0.7)',
                                            padding: isMobile ? '0.75rem' : '1.25rem',
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'space-between',
                                            gap: isMobile ? '0.75rem' : '1rem',
                                            cursor: 'pointer',
                                            borderRadius: isMobile ? '20px' : '24px'
                                        }}
                                        onClick={() => togglePresence(child.id)}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.75rem' : '1.25rem', minWidth: 0 }}>
                                            {/* Avatar Area */}
                                            <div style={{ position: 'relative', flexShrink: 0 }}>
                                                {child.photo ? (
                                                    <img src={child.photo} alt={child.firstName} style={{ width: isMobile ? '56px' : '68px', height: isMobile ? '56px' : '68px', borderRadius: isMobile ? '16px' : '20px', objectFit: 'cover', border: '2.5px solid white', boxShadow: 'var(--shadow-md)' }} />
                                                ) : (
                                                    <div style={{ width: isMobile ? '56px' : '68px', height: isMobile ? '56px' : '68px', borderRadius: isMobile ? '16px' : '20px', background: `linear-gradient(135deg, ${group?.color || 'var(--primary-color)'}15 0%, ${group?.color || 'var(--primary-color)'}30 100%)`, color: group?.color || 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '950', fontSize: isMobile ? '1.2rem' : '1.5rem', border: '2.5px solid white', boxShadow: 'var(--shadow-md)' }}>
                                                        {(child.lastName?.[0] || child.firstName?.[0] || '?').toUpperCase()}
                                                    </div>
                                                )}

                                                <div style={{ position: 'absolute', bottom: isMobile ? '-4px' : '-6px', right: isMobile ? '-4px' : '-6px', display: 'flex', gap: '4px', zIndex: 10 }}>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setSelectedParticipantId(child.id); setIsCameraOpen(true); }}
                                                        style={{ width: isMobile ? '24px' : '28px', height: isMobile ? '24px' : '28px', background: 'white', border: '1.5px solid var(--glass-border)', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 8px rgba(0,0,0,0.08)' }}
                                                        title="Photo Caméra">
                                                        <Camera size={isMobile ? 12 : 14} strokeWidth={2.5} />
                                                    </button>
                                                    {!isMobile && (
                                                        <label
                                                            onClick={(e) => e.stopPropagation()}
                                                            style={{ width: '28px', height: '28px', background: 'white', border: '1.5px solid var(--glass-border)', borderRadius: '10px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 8px rgba(0,0,0,0.08)' }}
                                                            title="Upload Photo">
                                                            <ImageIcon size={14} strokeWidth={2.5} />
                                                            <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, child.id)} style={{ display: 'none' }} />
                                                        </label>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Info Area */}
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{ fontWeight: '950', color: 'var(--text-main)', fontSize: isMobile ? '0.9rem' : '1rem', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {child.lastName?.toUpperCase()}
                                                </div>
                                                <div style={{ fontWeight: '800', color: 'var(--text-muted)', fontSize: isMobile ? '0.8rem' : '0.9rem', marginBottom: isMobile ? '2px' : '6px' }}>
                                                    {child.firstName}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    {group && (
                                                        <span style={{ fontSize: '9px', padding: '1px 6px', background: `oklch(from ${group.color} 98% calc(c / 8) h / 0.1)`, color: group.color, borderRadius: '4px', fontWeight: '950', border: '1px solid oklch(from ${group.color} l c h / 0.15)' }}>
                                                            {group.name}
                                                        </span>
                                                    )}
                                                    {child.isPresent && !isMobile && (
                                                        <div style={{ fontSize: '10px', color: 'var(--success-color)', fontWeight: '950', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success-color)', boxShadow: '0 0 6px var(--success-color)' }} /> PRÉSENT
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Presence Toggle */}
                                        <div style={{ 
                                            width: isMobile ? '40px' : '52px', 
                                            height: isMobile ? '40px' : '52px', 
                                            borderRadius: isMobile ? '14px' : '18px',
                                            background: child.isPresent ? 'var(--success-color)' : 'white',
                                            color: child.isPresent ? 'white' : 'var(--glass-border)',
                                            border: `2px solid ${child.isPresent ? 'var(--success-color)' : 'var(--glass-border)'}`,
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            transition: 'all 0.4s var(--ease-out-expo)',
                                            boxShadow: child.isPresent ? '0 8px 20px oklch(62% 0.18 145 / 0.3)' : 'none'
                                        }}>
                                            {child.isPresent ? <Check size={isMobile ? 24 : 32} strokeWidth={4} /> : <div style={{ width: isMobile ? '8px' : '12px', height: isMobile ? '8px' : '12px', borderRadius: '50%', background: 'var(--glass-border)' }} />}
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
                    transform: translateY(-4px) scale(1.02);
                    background: white !important;
                    box-shadow: 0 20px 40px oklch(0% 0 0 / 0.08) !important;
                    border-color: var(--primary-color) !important;
                }
                .attendance-card:active {
                    transform: scale(0.98);
                }
                @media (max-width: 1024px) {
                    .hide-mobile {
                        display: none !important;
                    }
                }
            `}</style>
            </div>
        </div>
    );
}
