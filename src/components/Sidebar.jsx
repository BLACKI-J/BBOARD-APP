import React, { useState } from 'react';
import { AlertCircle, Users, Search, Filter, ShieldAlert } from 'lucide-react';

export default function Sidebar({ participants, setParticipants, groups }) {
    // Filters state
    const [filterAllergies, setFilterAllergies] = useState(false);
    const [filterAge, setFilterAge] = useState('all'); // 'all', '6-8', '9-11', '12+'
    const [filterGroup, setFilterGroup] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Handle Drag Start
    const handleDragStart = (e, participant) => {
        e.dataTransfer.setData('participantId', participant.id);
        e.dataTransfer.effectAllowed = 'move';
        e.currentTarget.style.opacity = '0.5';
    };

    const handleDragEnd = (e) => {
        e.currentTarget.style.opacity = '1';
    };

    const getGroupStyle = (groupId) => {
        const group = groups.find(g => g.id === groupId);
        if (!group) return { background: 'oklch(96% 0.01 232 / 0.5)', color: 'oklch(40% 0.02 232)' };

        const color = group.color;
        const background = color.startsWith('oklch')
            ? `oklch(from ${color} 98% calc(c / 8) h / 0.15)`
            : `${color}15`;

        return {
            background,
            color: color,
            border: `1px solid oklch(from ${color} l c h / 0.25)`,
            fontFamily: 'Sora, sans-serif',
            fontWeight: '800'
        };
    };

    const renderParticipantCard = (participant, index) => (
        <div
            key={participant.id}
            className="card-glass sidebar-card animate-fade-in"
            style={{
                '--i': index,
                animationDelay: `calc(var(--i, 0) * 30ms)`,
                padding: '0.85rem 1rem',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: '0.85rem',
                cursor: 'grab',
                position: 'relative',
                marginBottom: 'var(--space-sm)',
                borderLeft: '5px solid ' + (
                    participant.role === 'animator' ? 'var(--secondary-color)' :
                    (participant.role === 'direction' ? 'var(--accent-color)' : 'var(--primary-color)')
                ),
                transition: 'all 0.3s var(--ease-out-expo)'
            }}
            draggable="true"
            onDragStart={(e) => handleDragStart(e, participant)}
            onDragEnd={handleDragEnd}
        >
            {/* Tooltip on Hover */}
            <div className="participant-tooltip card-glass" style={{
                position: 'absolute',
                left: '105%',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255, 255, 255, 0.98)',
                padding: '1.25rem',
                zIndex: 200,
                width: '240px',
                pointerEvents: 'none',
                opacity: 0,
                transition: 'all 0.3s var(--ease-out-expo)',
                visibility: 'hidden',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ fontWeight: '900', fontSize: '1.1rem', color: 'var(--text-main)', borderBottom: '1.5px solid var(--glass-border)', paddingBottom: '0.5rem', letterSpacing: '-0.02em' }}>
                        {participant.firstName} {participant.lastName}
                    </div>

                    {participant.photo && (
                        <div style={{ width: '100%', height: '140px', backgroundImage: `url(${participant.photo})`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '12px', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)' }}></div>
                    )}

                    <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>
                        <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Âge :</span> {participant.birthDate ? `${new Date().getFullYear() - new Date(participant.birthDate).getFullYear()} ans` : 'N/A'}
                    </div>

                    {participant.role === 'child' && (
                        <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>
                            <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Groupe :</span> {groups.find(g => g.id === participant.group)?.name || participant.group || 'Aucun'}
                        </div>
                    )}

                    {(participant.allergies || participant.constraints) && (
                        <div style={{ marginTop: '0.25rem', paddingTop: '0.75rem', borderTop: '1px dashed var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {participant.allergies && (
                                <div style={{ color: 'var(--danger-color)', fontSize: '0.8rem', display: 'flex', alignItems: 'flex-start', gap: '6px', background: 'oklch(62% 0.2 28 / 0.08)', padding: '6px 8px', borderRadius: '10px' }}>
                                    <ShieldAlert size={14} style={{ marginTop: '1px', flexShrink: 0 }} /> 
                                    <div><strong>Allergies:</strong> {participant.allergies}</div>
                                </div>
                            )}
                            {participant.constraints && (
                                <div style={{ color: 'oklch(65% 0.15 85)', fontSize: '0.8rem', background: 'oklch(65% 0.15 85 / 0.08)', padding: '6px 8px', borderRadius: '10px', display: 'flex', gap: '6px' }}>
                                     <AlertCircle size={14} style={{ flexShrink: 0 }} />
                                     <div><strong>Santé:</strong> {participant.constraints}</div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .sidebar-card:hover .participant-tooltip {
                    opacity: 1;
                    visibility: visible;
                    transform: translateY(-50%) translateX(10px);
                }
                .sidebar-card:hover {
                    background: rgba(255,255,255,0.8) !important;
                    transform: translateX(4px);
                    box-shadow: var(--shadow-md);
                }
            `}</style>

            {/* Avatar */}
            <div style={{
                width: '42px', height: '42px', borderRadius: '14px',
                backgroundColor: participant.role === 'animator' ? 'var(--secondary-color)' :
                    (participant.role === 'direction' ? 'var(--accent-color)' : 'var(--primary-color)'),
                color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0,
                backgroundImage: participant.photo ? `url(${participant.photo})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center',
                fontSize: '0.9rem', fontWeight: '950',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                border: '2px solid white'
            }}>
                {!participant.photo && participant.firstName.charAt(0).toUpperCase()}
            </div>

            {/* Infos */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem' }}>
                    <h4 style={{ margin: 0, fontSize: 'var(--text-sm)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: '900', fontFamily: 'Sora, sans-serif', color: 'var(--text-main)', letterSpacing: '-0.03em' }}>
                        {participant.firstName} {participant.lastName}
                    </h4>
                    {participant.group && (
                        <span style={{
                            fontSize: '9px', padding: '1px 6px', borderRadius: '6px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.04em',
                            ...getGroupStyle(participant.group)
                        }}>
                            {groups.find(g => g.id === participant.group)?.name || participant.group}
                        </span>
                    )}
                    {(participant.allergies || participant.constraints) && (
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--danger-color)', boxShadow: '0 0 6px var(--danger-color)' }} />
                    )}
                </div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: '700', marginTop: '1px', textTransform: 'capitalize' }}>
                    {participant.role === 'animator' ? 'Animateur' :
                        (participant.role === 'direction' ? 'Directeur' :
                            (participant.birthDate && new Date().getFullYear() - new Date(participant.birthDate).getFullYear() + " ans"))}
                </p>
            </div>
        </div>
    );

    const getAge = (birthDate) => {
        if (!birthDate) return null;
        const diff = Date.now() - new Date(birthDate).getTime();
        return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    };

    const direction = participants.filter(p => p.role === 'direction');
    const animators = participants.filter(p => p.role === 'animator');
    const allChildren = participants.filter(p => !p.role || p.role === 'child');

    const filteredChildren = allChildren.filter(child => {
        if (searchQuery && !(`${child.firstName} ${child.lastName}`).toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (filterAllergies && !child.allergies && !child.constraints) return false;
        if (filterGroup !== 'all' && child.group !== filterGroup) return false;
        if (filterAge !== 'all') {
            const age = getAge(child.birthDate);
            if (age === null) return false;
            if (filterAge === '6-8' && (age < 6 || age > 8)) return false;
            if (filterAge === '9-11' && (age < 9 || age > 11)) return false;
            if (filterAge === '12+' && age < 12) return false;
        }
        return true;
    });

    const filteredAnimators = animators.filter(p => {
        if (searchQuery && !(`${p.firstName} ${p.lastName}`).toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const filteredDirection = direction.filter(p => {
        if (searchQuery && !(`${p.firstName} ${p.lastName}`).toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    return (
        <aside className="sidebar glass-surface animate-slide-in" style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
            <div className="sidebar-header" style={{ padding: '1.5rem 1.5rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: 'var(--text-xl)', fontWeight: '950', fontFamily: 'Sora, sans-serif', color: 'var(--text-main)', letterSpacing: '-0.04em' }}>
                        <div style={{ width: '40px', height: '40px', background: 'var(--primary-gradient)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 8px 16px oklch(58% 0.18 var(--brand-hue) / 0.2)' }}>
                            <Users size={22} />
                        </div>
                        Effectifs
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <span style={{ fontSize: 'var(--text-xs)', fontWeight: '800', color: 'var(--primary-color)', background: 'oklch(58% 0.2 var(--brand-hue) / 0.1)', padding: '2px 8px', borderRadius: '20px' }}>
                            {participants.length} TOTAL
                        </span>
                    </div>
                </div>
            </div>

            {/* Search & Filters Section */}
            <div style={{ padding: '0 1.25rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Rechercher un membre..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.75rem 1rem 0.75rem 2.5rem',
                            borderRadius: '16px',
                            border: '1.5px solid var(--glass-border)',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            background: 'rgba(255, 255, 255, 0.5)',
                            transition: 'all 0.3s var(--ease-out-expo)',
                            outline: 'none'
                        }}
                        className="glass-input"
                    />
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '4px' }} className="no-scrollbar">
                    <button
                        onClick={() => setFilterAllergies(!filterAllergies)}
                        style={{
                            padding: '0.5rem 0.85rem',
                            borderRadius: '12px',
                            border: filterAllergies ? '1.5px solid var(--danger-color)' : '1.5px solid var(--glass-border)',
                            background: filterAllergies ? 'oklch(62% 0.2 28 / 0.1)' : 'white',
                            color: filterAllergies ? 'var(--danger-color)' : 'var(--text-main)',
                            fontSize: '0.75rem',
                            fontWeight: '900',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            flexShrink: 0,
                            transition: 'all 0.2s'
                        }}
                    >
                        <ShieldAlert size={14} strokeWidth={2.5} /> Santé
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                        <div style={{ height: '24px', width: '1.5px', background: 'var(--glass-border)', margin: '0 2px' }} />
                        <select
                            value={filterGroup}
                            onChange={e => setFilterGroup(e.target.value)}
                            style={{ padding: '0.5rem 0.75rem', borderRadius: '12px', border: '1.5px solid var(--glass-border)', fontSize: '0.75rem', background: 'white', fontWeight: '800', outline: 'none', cursor: 'pointer' }}
                        >
                            <option value="all">Groupes</option>
                            {groups.map(g => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                        </select>

                        <select
                            value={filterAge}
                            onChange={e => setFilterAge(e.target.value)}
                            style={{ padding: '0.5rem 0.75rem', borderRadius: '12px', border: '1.5px solid var(--glass-border)', fontSize: '0.75rem', background: 'white', fontWeight: '800', outline: 'none', cursor: 'pointer' }}
                        >
                            <option value="all">Âges</option>
                            <option value="6-8">6-8 ans</option>
                            <option value="9-11">9-11 ans</option>
                            <option value="12+">12+ ans</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="no-scrollbar" style={{ padding: '0 1.25rem 1.25rem', flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {participants.length === 0 && (
                    <div className="card-glass" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-muted)' }}>
                        <Users size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                        <p style={{ fontWeight: '800', color: 'var(--text-main)', fontSize: 'var(--text-md)' }}>Aucun participant</p>
                        <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', fontWeight: '600' }}>Ajoutez des membres depuis l'Annuaire pour commencer.</p>
                    </div>
                )}

                {filteredDirection.length > 0 && (
                    <section>
                        <h3 style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: '900', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-color)' }} />
                            Direction • {filteredDirection.length}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {filteredDirection.map((p, i) => renderParticipantCard(p, i))}
                        </div>
                    </section>
                )}

                {filteredAnimators.length > 0 && (
                    <section style={{ marginTop: '0.5rem' }}>
                        <h3 style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: '900', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--secondary-color)' }} />
                            Animateurs • {filteredAnimators.length}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {filteredAnimators.map((p, i) => renderParticipantCard(p, i + filteredDirection.length))}
                        </div>
                    </section>
                )}

                {filteredChildren.length > 0 && (
                    <section style={{ marginTop: '0.5rem' }}>
                        <h3 style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: '900', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary-color)' }} />
                            Enfants • {filteredChildren.length}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {filteredChildren.map((p, i) => renderParticipantCard(p, i + filteredDirection.length + filteredAnimators.length))}
                        </div>
                    </section>
                )}
            </div>
        </aside>
    );
}
