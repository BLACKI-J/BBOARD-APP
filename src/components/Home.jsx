import React, { useMemo, useState } from 'react';
import {
    Clock, Utensils, Calendar, Users, AlertTriangle, Cake, FileText,
    Pill, Plus, Check, ChevronRight, MessageSquareText, Sun, Sunrise, Moon, Apple, ShieldAlert
} from 'lucide-react';
import { getMedicationsList, ALL_SLOTS } from '../utils/meds';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const DAY_MAP = [6, 0, 1, 2, 3, 4, 5]; // JS getDay() (Sun=0) → Monday-first index
const pad = (n) => String(n).padStart(2, '0');
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };

const MEAL_META = {
    matin:  { label: 'Petit-déj', icon: <Sunrise size={15} />, color: 'oklch(60% 0.16 50)' },
    midi:   { label: 'Déjeuner',  icon: <Sun size={15} />,     color: 'oklch(58% 0.14 85)' },
    gouter: { label: 'Goûter',    icon: <Apple size={15} />,   color: 'oklch(60% 0.18 25)' },
    soir:   { label: 'Dîner',     icon: <Moon size={15} />,    color: 'oklch(52% 0.14 275)' },
};

const PRIORITY = {
    urgent:    { label: 'Urgent',    color: 'var(--danger-color)',  bg: 'oklch(96% 0.05 28)' },
    important: { label: 'Important', color: 'oklch(58% 0.15 75)',   bg: 'oklch(96% 0.07 80)' },
    info:      { label: 'Info',      color: 'var(--primary-color)', bg: 'var(--primary-light)' },
};

// Current half-day bucket for activities + meal/med slot, from the clock.
const currentPeriod = () => {
    const h = new Date().getHours();
    if (h < 12) return 'matin';
    if (h < 18) return 'aprem';
    return 'soir';
};
const currentMedSlot = () => {
    const h = new Date().getHours();
    if (h >= 6 && h < 11) return 'Matin';
    if (h >= 11 && h < 15) return 'Midi';
    if (h >= 15 && h < 18) return 'Goûter';
    return 'Soir';
};
const activityBucket = (a) => {
    const t = a.startTime || '';
    const h = parseInt(t.split(':')[0], 10);
    if (Number.isNaN(h)) return 'aprem';
    if (h < 12) return 'matin';
    if (h < 18) return 'aprem';
    return 'soir';
};

export default function Home({
    activities = [], participants = [], groups = [], menus = {},
    healthAlerts = [], transmissions = [], setTransmissions, activeUser,
    onNavigate, isMobile,
}) {
    const now = new Date();
    const today = todayISO();
    const hour = now.getHours();
    const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
    const GreetIcon = hour < 12 ? Sunrise : hour < 18 ? Sun : Moon;
    const firstName = activeUser?.firstName ? `, ${activeUser.firstName}` : '';
    const formattedDate = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    const dayName = DAYS[DAY_MAP[now.getDay()]];
    const period = currentPeriod();
    const medSlot = currentMedSlot();

    // Staff (Direction / AS / anim) can post a message or alert directly here
    const canPost = !!activeUser && activeUser.role !== 'child';
    const [msgOpen, setMsgOpen] = useState(false);
    const [msgText, setMsgText] = useState('');
    const [msgPriority, setMsgPriority] = useState('info');

    const postMessage = () => {
        if (!msgText.trim() || !setTransmissions) return;
        const author = activeUser ? `${activeUser.firstName || ''} ${activeUser.lastName || ''}`.trim() : '';
        const entry = {
            id: (crypto?.randomUUID?.() || `msg_${Date.now()}`),
            text: msgText.trim(),
            priority: msgPriority,
            targetDate: today,
            childName: '',
            author: author || (activeUser?.role === 'direction' ? 'Direction' : 'Équipe'),
            createdAt: new Date().toISOString(),
            done: false,
        };
        setTransmissions([entry, ...(transmissions || [])]);
        setMsgText(''); setMsgPriority('info'); setMsgOpen(false);
    };

    const children = useMemo(() => participants.filter(p => !p.role || p.role === 'child'), [participants]);

    // ── Activities of the current half-day (fallback: next upcoming today) ──
    const periodActivities = useMemo(() => {
        const todays = activities
            .filter(a => a.date === today)
            .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
        const inBucket = todays.filter(a => activityBucket(a) === period);
        if (inBucket.length > 0) return { list: inBucket, isFallback: false };
        const nowMin = hour * 60 + now.getMinutes();
        const upcoming = todays.filter(a => {
            const [h, m] = (a.startTime || '0:0').split(':').map(Number);
            return (h * 60 + m) >= nowMin;
        });
        return { list: upcoming, isFallback: true };
    }, [activities, today, period, hour, now]);

    // ── Meds to give in the current slot (not yet validated) ──
    const medsNow = useMemo(() => {
        const due = [];
        children.forEach(c => {
            const v = c.medsValidated?.[today]?.[medSlot];
            getMedicationsList(c).forEach(m => {
                if (!m.slots.includes(medSlot)) return;
                const done = v === true || (v && typeof v === 'object' && v[m.name]);
                if (!done) due.push({ name: `${c.firstName} ${(c.lastName || "").toUpperCase()}`, med: m.name });
            });
        });
        return due;
    }, [children, today, medSlot]);

    // ── Transmissions due today (target date reached, not done) + auto health alerts ──
    const dueTransmissions = useMemo(() => {
        return (transmissions || [])
            .filter(t => !t.done && (t.targetDate || '') <= today)
            .sort((a, b) => {
                const order = { urgent: 0, important: 1, info: 2 };
                return (order[a.priority] ?? 3) - (order[b.priority] ?? 3) || (b.createdAt || '').localeCompare(a.createdAt || '');
            });
    }, [transmissions, today]);

    const dismiss = (id) => {
        if (!setTransmissions) return;
        setTransmissions((transmissions || []).map(t => t.id === id ? { ...t, done: true } : t));
    };

    const todayMenus = menus[dayName] || {};
    const hasMeals = Object.keys(MEAL_META).some(k => todayMenus[k]);

    const periodLabel = period === 'matin' ? 'Ce matin' : period === 'aprem' ? 'Cet après-midi' : 'Ce soir';

    // ── Build present sections (bento) ──
    const blocks = [];

    if (canPost || dueTransmissions.length > 0 || healthAlerts.length > 0) {
        const PRIO_OPTS = [
            { id: 'info', label: 'Info', color: 'var(--primary-color)' },
            { id: 'important', label: 'Important', color: 'oklch(58% 0.15 75)' },
            { id: 'urgent', label: 'Urgent', color: 'var(--danger-color)' },
        ];
        blocks.push(
            <section key="releve" className="premium-card" style={{ padding: isMobile ? '1.25rem' : '1.5rem', borderTop: '4px solid var(--primary-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: '800', margin: 0 }}>
                        <MessageSquareText size={18} style={{ color: 'var(--primary-color)' }} /> Messages & Alertes
                    </h3>
                    {canPost && (
                        <button onClick={() => setMsgOpen(o => !o)} style={{ background: msgOpen ? 'var(--primary-light)' : 'transparent', border: 'none', cursor: 'pointer', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: '900', fontSize: '0.75rem', padding: '5px 10px', borderRadius: '10px' }}>
                            <Plus size={13} /> {msgOpen ? 'Fermer' : 'Écrire'}
                        </button>
                    )}
                </div>

                {/* Inline composer */}
                {canPost && msgOpen && (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '0.875rem', padding: '0.875rem', borderRadius: '14px', background: 'var(--bg-main)', border: '1.5px solid var(--glass-border)' }}>
                        <textarea value={msgText} onChange={e => setMsgText(e.target.value)} autoFocus
                            placeholder="Message ou alerte pour l'équipe…"
                            className="glass-input" style={{ minHeight: '60px', padding: '0.625rem 0.75rem', resize: 'vertical', borderRadius: '10px', fontWeight: '600', fontFamily: 'inherit' }} />
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', gap: '0.375rem' }}>
                                {PRIO_OPTS.map(p => (
                                    <button key={p.id} onClick={() => setMsgPriority(p.id)} style={{
                                        display: 'flex', alignItems: 'center', gap: '4px', padding: '0.4rem 0.75rem', borderRadius: '100px', cursor: 'pointer', minHeight: '36px',
                                        border: '1.5px solid', borderColor: msgPriority === p.id ? p.color : 'var(--glass-border)',
                                        background: msgPriority === p.id ? p.color : 'white', color: msgPriority === p.id ? 'white' : 'var(--text-muted)',
                                        fontWeight: '900', fontSize: '0.72rem'
                                    }}>{msgPriority === p.id && <Check size={11} strokeWidth={3} />}{p.label}</button>
                                ))}
                            </div>
                            <button onClick={postMessage} className="btn btn-primary" style={{ height: '38px', padding: '0 1.1rem', borderRadius: '10px', fontWeight: '950', fontSize: '0.8rem' }}>Publier</button>
                        </div>
                    </div>
                )}

                {dueTransmissions.length === 0 && healthAlerts.length === 0 ? (
                    <div style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '700', fontSize: '0.85rem' }}>Aucun message. {canPost ? 'Écris-en un pour l\'équipe.' : ''}</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {dueTransmissions.map(t => {
                            const p = PRIORITY[t.priority] || PRIORITY.info;
                            return (
                                <div key={t.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem 0.875rem', borderRadius: '12px', background: p.bg, border: `1px solid ${p.color}25` }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.color, flexShrink: 0, marginTop: '6px' }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: '850', fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.35 }}>
                                            {t.childName && <span style={{ color: p.color, fontWeight: '950' }}>{t.childName} — </span>}{t.text}
                                        </div>
                                        <div style={{ fontSize: '0.68rem', fontWeight: '700', color: 'var(--text-muted)', marginTop: '2px' }}>
                                            {PRIORITY[t.priority]?.label || 'Info'}{t.author ? ` · ${t.author}` : ''}
                                        </div>
                                    </div>
                                    <button onClick={() => dismiss(t.id)} title="Vu" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '10px', border: `1.5px solid ${p.color}40`, background: 'white', color: p.color, fontWeight: '900', fontSize: '0.7rem', cursor: 'pointer' }}>
                                        <Check size={12} strokeWidth={3} /> Vu
                                    </button>
                                </div>
                            );
                        })}
                        {healthAlerts.map(a => (
                            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 0.875rem', borderRadius: '12px', background: a.type === 'birthday' ? 'oklch(97% 0.05 82)' : 'oklch(97% 0.04 28)', border: '1px solid var(--glass-border)' }}>
                                {a.type === 'birthday' ? <Cake size={16} style={{ color: 'oklch(60% 0.15 82)', flexShrink: 0 }} /> : <FileText size={16} style={{ color: 'var(--danger-color)', flexShrink: 0 }} strokeWidth={2.5} />}
                                <span style={{ fontSize: '0.86rem', fontWeight: '800', color: 'var(--text-main)' }}>{a.message}</span>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        );
    }

    if (medsNow.length > 0) {
        blocks.push(
            <section key="meds" className="premium-card" style={{ padding: isMobile ? '1.25rem' : '1.5rem', borderTop: '4px solid oklch(55% 0.18 232)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: '800', margin: 0 }}>
                        <Pill size={18} style={{ color: 'oklch(55% 0.18 232)' }} /> À donner ({medSlot})
                    </h3>
                    {onNavigate && <button onClick={() => onNavigate('health')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: '900', fontSize: '0.75rem' }}>Santé <ChevronRight size={13} /></button>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {medsNow.map((m, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.875rem', borderRadius: '12px', background: 'oklch(96% 0.05 232)', border: '1px solid oklch(55% 0.18 232 / 0.2)' }}>
                            <Pill size={14} style={{ color: 'oklch(55% 0.18 232)', flexShrink: 0 }} />
                            <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-main)' }}><span style={{ fontWeight: '950' }}>{m.name}</span> · {m.med}</span>
                        </div>
                    ))}
                </div>
            </section>
        );
    }

    // Activités — always shown (daily reference)
    blocks.push(
        <section key="activ" className="premium-card" style={{ padding: isMobile ? '1.25rem' : '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: '800', margin: 0 }}>
                    <Calendar size={18} style={{ color: 'var(--primary-color)' }} /> {periodActivities.list.length > 0 && periodActivities.isFallback ? 'À venir' : periodLabel}
                </h3>
                {onNavigate && <button onClick={() => onNavigate('schedule')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: '900', fontSize: '0.75rem' }}>Planning <ChevronRight size={13} /></button>}
            </div>
            {periodActivities.list.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '700', fontSize: '0.85rem' }}>Rien de prévu {period === 'matin' ? 'ce matin' : period === 'aprem' ? 'cet après-midi' : 'ce soir'}.</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {periodActivities.list.map(a => (
                        <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.7rem 0.875rem', borderRadius: '12px', background: 'var(--bg-main)', border: '1px solid var(--glass-border)', opacity: a.done ? 0.55 : 1 }}>
                            <div style={{ width: '4px', height: '34px', borderRadius: '4px', background: a.color || 'var(--primary-color)', flexShrink: 0 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: '850', fontSize: '0.9rem', color: 'var(--text-main)', textDecoration: a.done ? 'line-through' : 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.title}</div>
                                {a.startTime && <div style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}><Clock size={10} /> {a.startTime}{a.endTime ? ` – ${a.endTime}` : ''}</div>}
                            </div>
                            {a.done && <Check size={16} style={{ color: 'var(--success-color)', flexShrink: 0 }} strokeWidth={3} />}
                        </div>
                    ))}
                </div>
            )}
        </section>
    );

    // Repas — always shown (daily reference)
    blocks.push(
        <section key="meals" className="premium-card" style={{ padding: isMobile ? '1.25rem' : '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: '800', margin: 0 }}>
                    <Utensils size={18} style={{ color: 'oklch(60% 0.18 25)' }} /> Repas du jour
                </h3>
                {onNavigate && <button onClick={() => onNavigate('schedule')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: '900', fontSize: '0.75rem' }}>Modifier <ChevronRight size={13} /></button>}
            </div>
            {!hasMeals ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '700', fontSize: '0.85rem' }}>Menus non renseignés pour {dayName.toLowerCase()}.</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {Object.entries(MEAL_META).filter(([id]) => todayMenus[id]).map(([id, meta]) => (
                        <div key={id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.6rem 0.875rem', borderRadius: '12px', background: 'var(--bg-main)', border: '1px solid var(--glass-border)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: meta.color, fontSize: '0.62rem', fontWeight: '950', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0, minWidth: '78px', marginTop: '2px' }}>{meta.icon} {meta.label}</span>
                            <span style={{ fontSize: '0.85rem', fontWeight: '750', color: 'var(--text-main)', lineHeight: 1.35 }}>{todayMenus[id]}</span>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );

    return (
        <div className="animate-fade-in" style={{ padding: '0.5rem', width: '100%', maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* ── Header ── */}
            <div>
                <span className="glass-pill hero-up" style={{ marginBottom: isMobile ? '0.25rem' : '0.6rem', animationDelay: '0ms' }}>
                    <Clock size={14} /> {formattedDate}
                </span>
                <h2 className="hero-up" style={{ fontSize: isMobile ? '1.5rem' : 'clamp(1.8rem, 5vw, 2.8rem)', fontWeight: '800', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.625rem', animationDelay: '90ms' }}>
                    <span className="hero-greet">{greeting}{firstName}</span>
                    <GreetIcon className="hero-icon" size={isMobile ? 22 : 30} strokeWidth={2.5} style={{ color: 'var(--cta-color)', flexShrink: 0 }} />
                </h2>
                {(() => {
                    const parts = [];
                    const consignes = dueTransmissions.length + healthAlerts.length;
                    if (consignes > 0) parts.push(`${consignes} consigne${consignes > 1 ? 's' : ''}`);
                    if (medsNow.length > 0) parts.push(`${medsNow.length} traitement${medsNow.length > 1 ? 's' : ''} (${medSlot})`);
                    return (
                        <p className="hero-up" style={{ margin: '0.4rem 0 0', fontSize: isMobile ? '0.85rem' : '0.95rem', fontWeight: '750', color: parts.length ? 'var(--text-muted)' : 'var(--success-color)', animationDelay: '180ms' }}>
                            {parts.length ? `À suivre : ${parts.join(' · ')}` : 'Tout est calme pour le moment'}
                        </p>
                    );
                })()}
            </div>

            {/* ── Bento grid ── */}
            {blocks.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '1.25rem', alignItems: 'start' }}>
                    {blocks}
                </div>
            ) : (
                <div className="premium-card" style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <ShieldAlert size={40} strokeWidth={1.5} style={{ opacity: 0.25, marginBottom: '1rem' }} />
                    <p style={{ fontWeight: '850', fontSize: '1rem', margin: 0, color: 'var(--text-main)' }}>Tout est calme</p>
                    <p style={{ fontWeight: '700', fontSize: '0.85rem', marginTop: '0.5rem' }}>Aucune consigne, activité ou traitement pour le moment.</p>
                </div>
            )}
        </div>
    );
}
