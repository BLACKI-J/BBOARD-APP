import React, { useMemo } from 'react';
import { Users, Tent, Calendar, AlertCircle, CheckCircle2, Clock, ChevronRight, Star } from 'lucide-react';

const formatDateLabel = (date) =>
    date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

export default function Dashboard({ participants = [], groups = [], activities = [], onNavigate }) {
    const safeParticipants = Array.isArray(participants) ? participants : [];
    const safeGroups = Array.isArray(groups) ? groups : [];
    const safeActivities = Array.isArray(activities) ? activities : [];

    const today = new Date();
    const todayKey = today.toISOString().split('T')[0];

    // ── Participant counts ─────────────────────────────────────────────────────
    const stats = useMemo(() => {
        const children = safeParticipants.filter(p => p.role === 'child');
        const animators = safeParticipants.filter(p => p.role === 'animator');
        const directors = safeParticipants.filter(p => p.role === 'direction');
        const withHealthDoc = children.filter(p => p.healthDocProvided).length;
        return {
            total: safeParticipants.length,
            children: children.length,
            animators: animators.length,
            directors: directors.length,
            healthDocRate: children.length > 0 ? Math.round((withHealthDoc / children.length) * 100) : 0,
            withHealthDoc,
            missingHealthDoc: children.length - withHealthDoc,
        };
    }, [safeParticipants]);

    // ── Today's activities ─────────────────────────────────────────────────────
    const todayActivities = useMemo(() =>
        safeActivities
            .filter(a => a.date === todayKey)
            .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || '')),
        [safeActivities, todayKey]);

    // ── Health & birthday alerts ───────────────────────────────────────────────
    const alerts = useMemo(() => {
        const list = [];
        const currentMonth = today.getMonth();
        const currentDay = today.getDate();

        safeParticipants.filter(p => p.role === 'child').forEach(child => {
            if (child.birthDate) {
                const bd = new Date(child.birthDate);
                if (bd.getMonth() === currentMonth && bd.getDate() === currentDay) {
                    list.push({ id: `bday-${child.id}`, type: 'birthday', name: `${child.firstName} ${child.lastName}` });
                }
            }
            if (!child.healthDocProvided) {
                list.push({ id: `doc-${child.id}`, type: 'warning', name: `${child.firstName} ${child.lastName}` });
            }
        });
        return list;
    }, [safeParticipants]);

    // ── Groups overview ────────────────────────────────────────────────────────
    const groupsOverview = useMemo(() =>
        safeGroups.map(g => ({
            ...g,
            count: safeParticipants.filter(p => p.role === 'child' && p.group === g.id).length,
        })),
        [safeGroups, safeParticipants]);

    // ── Upcoming birthdays (next 7 days, excl. today) ──────────────────────────
    const upcomingBirthdays = useMemo(() => {
        const result = [];
        const todayStr = today.toISOString().split('T')[0];
        safeParticipants.filter(p => p.role === 'child' && p.birthDate).forEach(child => {
            const bd = new Date(child.birthDate);
            const nextBd = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
            const nextBdStr = nextBd.toISOString().split('T')[0];
            if (nextBdStr <= todayStr) nextBd.setFullYear(nextBd.getFullYear() + 1);
            const msPerDay = 1000 * 60 * 60 * 24;
            const diff = Math.round((new Date(nextBd.toISOString().split('T')[0]) - new Date(todayStr)) / msPerDay);
            if (diff > 0 && diff <= 7) {
                result.push({ child, diff, date: nextBd });
            }
        });
        return result.sort((a, b) => a.diff - b.diff);
    }, [safeParticipants]);

    return (
        <div style={{ height: '100%', overflowY: 'auto', background: 'linear-gradient(160deg, #f8faff 0%, #f0f4ff 100%)', padding: '1.5rem', boxSizing: 'border-box' }}>

            {/* ── Header ──────────────────────────────────────────────────────── */}
            <div style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
                borderRadius: '16px', padding: '1.25rem 1.5rem', marginBottom: '1.5rem',
                display: 'flex', alignItems: 'center', gap: '1rem',
                boxShadow: '0 6px 20px rgba(99,102,241,0.3)'
            }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '10px', padding: '0.625rem', display: 'flex' }}>
                    <Tent size={22} color="white" />
                </div>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: 'white', lineHeight: 1 }}>
                        Tableau de bord
                    </h1>
                    <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.75)', textTransform: 'capitalize' }}>
                        {formatDateLabel(today)}
                    </p>
                </div>
            </div>

            {/* ── Stat cards ──────────────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                    { label: 'Participants', value: stats.total, icon: <Users size={20} color="#6366f1" />, bg: '#eef2ff', color: '#6366f1' },
                    { label: 'Enfants', value: stats.children, icon: <Star size={20} color="#f59e0b" />, bg: '#fffbeb', color: '#d97706' },
                    { label: 'Animateurs', value: stats.animators, icon: <Users size={20} color="#10b981" />, bg: '#ecfdf5', color: '#059669' },
                    { label: 'Fiches santé', value: `${stats.withHealthDoc}/${stats.children}`, icon: <CheckCircle2 size={20} color={stats.missingHealthDoc > 0 ? '#ef4444' : '#10b981'} />, bg: stats.missingHealthDoc > 0 ? '#fef2f2' : '#ecfdf5', color: stats.missingHealthDoc > 0 ? '#ef4444' : '#059669' },
                ].map((card, i) => (
                    <div key={i} style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                        <div style={{ background: card.bg, borderRadius: '10px', padding: '0.5rem', display: 'inline-flex', marginBottom: '0.75rem' }}>
                            {card.icon}
                        </div>
                        <div style={{ fontSize: '1.75rem', fontWeight: '800', color: card.color, lineHeight: 1 }}>{card.value}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600', marginTop: '0.25rem' }}>{card.label}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>

                {/* ── Today's schedule ──────────────────────────────────────── */}
                <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                    <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Calendar size={18} color="#6366f1" />
                            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#1e293b' }}>Activités du jour</h3>
                        </div>
                        {onNavigate && (
                            <button onClick={() => onNavigate('schedule')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', fontWeight: '600' }}>
                                Voir tout <ChevronRight size={14} />
                            </button>
                        )}
                    </div>
                    <div style={{ padding: '0.75rem 1.25rem', maxHeight: '260px', overflowY: 'auto' }}>
                        {todayActivities.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '1.5rem 1rem', color: '#94a3b8' }}>
                                <Calendar size={28} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
                                <p style={{ margin: 0, fontSize: '0.85rem' }}>Aucune activité prévue aujourd'hui.</p>
                            </div>
                        ) : (
                            todayActivities.map(a => (
                                <div key={a.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', padding: '0.625rem 0', borderBottom: '1px solid #f8fafc' }}>
                                    <div style={{ width: '4px', borderRadius: '2px', alignSelf: 'stretch', background: a.color || '#6366f1', flexShrink: 0 }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: '600', color: a.done ? '#94a3b8' : '#1e293b', fontSize: '0.9rem', textDecoration: a.done ? 'line-through' : 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.title}</div>
                                        {a.startTime && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#64748b', fontSize: '0.78rem', marginTop: '2px' }}>
                                                <Clock size={12} /> {a.startTime}{a.endTime ? ` – ${a.endTime}` : ''}
                                            </div>
                                        )}
                                    </div>
                                    {a.done && <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* ── Groups overview ───────────────────────────────────────── */}
                <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                    <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Tent size={18} color="#f59e0b" />
                            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#1e293b' }}>Groupes</h3>
                        </div>
                        {onNavigate && (
                            <button onClick={() => onNavigate('directory')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', fontWeight: '600' }}>
                                Annuaire <ChevronRight size={14} />
                            </button>
                        )}
                    </div>
                    <div style={{ padding: '0.75rem 1.25rem', maxHeight: '260px', overflowY: 'auto' }}>
                        {groupsOverview.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '1.5rem 1rem', color: '#94a3b8' }}>
                                <Tent size={28} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
                                <p style={{ margin: 0, fontSize: '0.85rem' }}>Aucun groupe créé.</p>
                            </div>
                        ) : (
                            groupsOverview.map(g => (
                                <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0', borderBottom: '1px solid #f8fafc' }}>
                                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: g.color || '#6366f1', flexShrink: 0 }} />
                                    <span style={{ flex: 1, fontWeight: '600', color: '#1e293b', fontSize: '0.9rem' }}>{g.name}</span>
                                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b', background: '#f1f5f9', padding: '2px 10px', borderRadius: '10px' }}>
                                        {g.count} enfant{g.count !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* ── Alerts & upcoming birthdays ───────────────────────────── */}
                <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                    <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <AlertCircle size={18} color="#ef4444" />
                            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#1e293b' }}>Alertes & Anniversaires</h3>
                        </div>
                    </div>
                    <div style={{ padding: '0.75rem 1.25rem', maxHeight: '260px', overflowY: 'auto' }}>
                        {alerts.length === 0 && upcomingBirthdays.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '1.5rem 1rem', color: '#94a3b8' }}>
                                <CheckCircle2 size={28} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
                                <p style={{ margin: 0, fontSize: '0.85rem' }}>Aucune alerte. Tout est en ordre !</p>
                            </div>
                        ) : (
                            <>
                                {alerts.map(alert => (
                                    <div key={alert.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', padding: '0.625rem 0', borderBottom: '1px solid #f8fafc' }}>
                                        <span style={{ fontSize: '1.1rem', lineHeight: 1.4 }}>{alert.type === 'birthday' ? '🎂' : '⚠️'}</span>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: alert.type === 'birthday' ? '#c2410c' : '#b91c1c', lineHeight: 1.4, fontWeight: '500' }}>
                                            {alert.type === 'birthday'
                                                ? `Anniversaire de ${alert.name} aujourd'hui !`
                                                : `Fiche sanitaire manquante — ${alert.name}`}
                                        </p>
                                    </div>
                                ))}
                                {upcomingBirthdays.map(({ child, diff }) => (
                                    <div key={`up-${child.id}`} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', padding: '0.625rem 0', borderBottom: '1px solid #f8fafc' }}>
                                        <span style={{ fontSize: '1.1rem', lineHeight: 1.4 }}>🎉</span>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#92400e', lineHeight: 1.4, fontWeight: '500' }}>
                                            {`Anniversaire de ${child.firstName} ${child.lastName} dans ${diff} jour${diff !== 1 ? 's' : ''}`}
                                        </p>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
