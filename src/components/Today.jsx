import React, { useMemo } from 'react';
import {
    Calendar, Clock, Utensils, ShieldAlert, Activity,
    Coffee, Sun, ChefHat, Moon, AlertCircle, Users,
    ArrowRight, Cake, FileText
} from 'lucide-react';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const DAY_MAP = [6, 0, 1, 2, 3, 4, 5];
const MEAL_META = {
    matin:  { label: 'Petit-Déj',  icon: <Coffee size={16} />,   color: 'oklch(71% 0.19 45)' },
    midi:   { label: 'Déjeuner',   icon: <Sun size={16} />,      color: 'oklch(62% 0.18 200)' },
    gouter: { label: 'Goûter',     icon: <ChefHat size={16} />,  color: 'oklch(62% 0.18 320)' },
    soir:   { label: 'Dîner',      icon: <Moon size={16} />,     color: 'oklch(62% 0.18 260)' }
};

const formatDate = d => d.toISOString().split('T')[0];

export default function Today({ activities = [], participants = [], groups = [], menus = {}, healthAlerts = [], isMobile, onNavigate }) {
    const today = useMemo(() => new Date(), []);
    const todayStr = formatDate(today);
    const dayName = DAYS[DAY_MAP[today.getDay()]];

    const todayActivities = useMemo(() =>
        activities
            .filter(a => a.date === todayStr)
            .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || '')),
        [activities, todayStr]
    );

    const todayMenus = menus[dayName] || {};

    const children = useMemo(() => participants.filter(p => p.role === 'child'), [participants]);
    const animators = useMemo(() => participants.filter(p => p.role === 'animator' || p.role === 'direction'), [participants]);
    const childrenWithAlerts = useMemo(() =>
        children.filter(c => (c.allergies && c.allergies.trim()) || (c.constraints && c.constraints.trim())),
        [children]
    );
    const nonSwimTested = useMemo(() => children.filter(c => !c.swimTest).length, [children]);

    const doneCount = todayActivities.filter(a => a.done).length;
    const progress = todayActivities.length > 0 ? Math.round((doneCount / todayActivities.length) * 100) : 0;

    const dateLabel = today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: isMobile ? '1rem' : '2rem 1rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* En-tête */}
            <div className="card-glass" style={{ padding: isMobile ? '1.25rem' : '2rem 2.5rem', background: 'var(--primary-gradient)', borderRadius: '28px', color: 'white', display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: '1rem' }}>
                <div>
                    <div style={{ fontSize: '11px', fontWeight: '950', textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.75, marginBottom: '0.4rem' }}>Tableau de bord</div>
                    <h1 style={{ margin: 0, fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: '950', fontFamily: 'Bricolage Grotesque, sans-serif', letterSpacing: '-0.04em', textTransform: 'capitalize' }}>{dateLabel}</h1>
                </div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {[
                        { label: 'Enfants', value: children.length, icon: <Users size={16} /> },
                        { label: 'Équipe', value: animators.length, icon: <Activity size={16} /> },
                        { label: 'Activités', value: todayActivities.length, icon: <Calendar size={16} /> }
                    ].map(s => (
                        <div key={s.label} style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', borderRadius: '16px', padding: '0.75rem 1.25rem', textAlign: 'center', minWidth: '80px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', opacity: 0.8, marginBottom: '0.3rem' }}>{s.icon}<span style={{ fontSize: '10px', fontWeight: '950', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</span></div>
                            <div style={{ fontSize: '1.75rem', fontWeight: '950', fontFamily: 'Bricolage Grotesque, sans-serif', letterSpacing: '-0.04em' }}>{s.value}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '2rem' }}>

                {/* Activités du jour */}
                <div className="card-glass" style={{ background: 'white', borderRadius: '28px', border: '1.5px solid var(--glass-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ padding: '1.5rem 2rem', borderBottom: '1.5px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                            <div style={{ background: 'oklch(96% 0.04 var(--brand-hue))', padding: '0.5rem', borderRadius: '10px', color: 'var(--primary-color)', display: 'flex' }}><Calendar size={18} strokeWidth={2.5} /></div>
                            <div>
                                <div style={{ fontWeight: '950', color: 'var(--text-main)', fontSize: '1rem', letterSpacing: '-0.02em' }}>Activités du jour</div>
                                <div style={{ fontSize: '10px', fontWeight: '950', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{doneCount}/{todayActivities.length} faites</div>
                            </div>
                        </div>
                        <button onClick={() => onNavigate?.('schedule')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '950', fontSize: '0.8rem' }}>
                            Planning <ArrowRight size={14} />
                        </button>
                    </div>
                    {todayActivities.length > 0 && (
                        <div style={{ padding: '0.75rem 2rem', borderBottom: '1px solid var(--glass-border)' }}>
                            <div style={{ height: '6px', background: 'var(--bg-secondary)', borderRadius: '10px', overflow: 'hidden' }}>
                                <div style={{ width: `${progress}%`, height: '100%', background: 'var(--primary-gradient)', borderRadius: '10px', transition: 'width 1s' }} />
                            </div>
                        </div>
                    )}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }} className="no-scrollbar">
                        {todayActivities.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                                <Calendar size={40} strokeWidth={1.5} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                                <p style={{ fontWeight: '850', fontSize: '0.9rem' }}>Journée libre</p>
                            </div>
                        ) : todayActivities.map(a => (
                            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', borderRadius: '14px', background: a.done ? 'var(--bg-secondary)' : 'white', border: '1.5px solid var(--glass-border)', opacity: a.done ? 0.55 : 1, transition: 'all 0.2s' }}>
                                <div style={{ width: '4px', height: '36px', borderRadius: '4px', background: a.color || 'var(--primary-color)', flexShrink: 0 }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: '950', fontSize: '0.9rem', color: 'var(--text-main)', letterSpacing: '-0.02em', textDecoration: a.done ? 'line-through' : 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.title}</div>
                                    {a.startTime && <div style={{ fontSize: '10px', fontWeight: '850', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}><Clock size={10} /> {a.startTime}{a.endTime ? ` – ${a.endTime}` : ''}</div>}
                                </div>
                                {a.done && <span style={{ fontSize: '10px', fontWeight: '950', color: 'var(--success-color)', background: 'oklch(96% 0.05 145)', padding: '2px 8px', borderRadius: '20px', flexShrink: 0 }}>✓</span>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Menus du jour */}
                <div className="card-glass" style={{ background: 'white', borderRadius: '28px', border: '1.5px solid var(--glass-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ padding: '1.5rem 2rem', borderBottom: '1.5px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                            <div style={{ background: 'oklch(97% 0.04 45)', padding: '0.5rem', borderRadius: '10px', color: 'oklch(62% 0.18 45)', display: 'flex' }}><Utensils size={18} strokeWidth={2.5} /></div>
                            <div>
                                <div style={{ fontWeight: '950', color: 'var(--text-main)', fontSize: '1rem', letterSpacing: '-0.02em' }}>Menus</div>
                                <div style={{ fontSize: '10px', fontWeight: '950', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{dayName}</div>
                            </div>
                        </div>
                        <button onClick={() => onNavigate?.('schedule')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '950', fontSize: '0.8rem' }}>
                            Modifier <ArrowRight size={14} />
                        </button>
                    </div>
                    <div style={{ flex: 1, padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {Object.entries(MEAL_META).map(([id, meta]) => (
                            <div key={id} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '0.875rem 1rem', borderRadius: '14px', background: 'var(--bg-secondary)', border: '1.5px solid var(--glass-border)' }}>
                                <div style={{ color: meta.color, display: 'flex', flexShrink: 0, marginTop: '2px' }}>{meta.icon}</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '10px', fontWeight: '950', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>{meta.label}</div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: '750', color: todayMenus[id] ? 'var(--text-main)' : 'var(--text-muted)', fontStyle: todayMenus[id] ? 'normal' : 'italic', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
                                        {todayMenus[id] || 'Non renseigné'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Alertes & vigilance */}
                <div className="card-glass" style={{ background: 'white', borderRadius: '28px', border: '1.5px solid var(--glass-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ padding: '1.5rem 2rem', borderBottom: '1.5px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                            <div style={{ background: 'oklch(96% 0.06 20)', padding: '0.5rem', borderRadius: '10px', color: 'var(--danger-color)', display: 'flex' }}><ShieldAlert size={18} strokeWidth={2.5} /></div>
                            <div>
                                <div style={{ fontWeight: '950', color: 'var(--text-main)', fontSize: '1rem', letterSpacing: '-0.02em' }}>Alertes santé</div>
                                <div style={{ fontSize: '10px', fontWeight: '950', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{healthAlerts.length} alerte{healthAlerts.length !== 1 ? 's' : ''}</div>
                            </div>
                        </div>
                        <button onClick={() => onNavigate?.('health')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '950', fontSize: '0.8rem' }}>
                            Santé <ArrowRight size={14} />
                        </button>
                    </div>
                    <div style={{ flex: 1, padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' }} className="no-scrollbar">
                        {healthAlerts.length === 0 && childrenWithAlerts.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                                <ShieldAlert size={36} strokeWidth={1.5} style={{ margin: '0 auto 0.75rem', opacity: 0.25 }} />
                                <p style={{ fontWeight: '850', fontSize: '0.9rem' }}>Tout est sous contrôle.</p>
                            </div>
                        ) : (
                            <>
                                {healthAlerts.map(a => (
                                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '12px', background: a.type === 'birthday' ? 'oklch(97% 0.05 82)' : 'oklch(97% 0.04 20)', border: '1.5px solid var(--glass-border)' }}>
                                        {a.type === 'birthday' ? <Cake size={16} style={{ color: 'oklch(62% 0.15 82)', flexShrink: 0 }} /> : <AlertCircle size={16} style={{ color: 'var(--danger-color)', flexShrink: 0 }} strokeWidth={3} />}
                                        <span style={{ fontSize: '0.85rem', fontWeight: '850', color: 'var(--text-main)' }}>{a.message}</span>
                                    </div>
                                ))}
                                {childrenWithAlerts.length > 0 && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '12px', background: 'oklch(97% 0.04 20)', border: '1.5px solid var(--glass-border)' }}>
                                        <FileText size={16} style={{ color: 'var(--danger-color)', flexShrink: 0 }} strokeWidth={2.5} />
                                        <span style={{ fontSize: '0.85rem', fontWeight: '850', color: 'var(--text-main)' }}>{childrenWithAlerts.length} enfant{childrenWithAlerts.length > 1 ? 's' : ''} avec allergie / régime spécifique</span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Bilan natation */}
                <div className="card-glass" style={{ background: 'white', borderRadius: '28px', border: '1.5px solid var(--glass-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ padding: '1.5rem 2rem', borderBottom: '1.5px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                            <div style={{ background: 'oklch(97% 0.04 232)', padding: '0.5rem', borderRadius: '10px', color: 'oklch(55% 0.18 232)', display: 'flex' }}><Activity size={18} strokeWidth={2.5} /></div>
                            <div>
                                <div style={{ fontWeight: '950', color: 'var(--text-main)', fontSize: '1rem', letterSpacing: '-0.02em' }}>Test natation</div>
                                <div style={{ fontSize: '10px', fontWeight: '950', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{children.length - nonSwimTested}/{children.length} validés</div>
                            </div>
                        </div>
                        <button onClick={() => onNavigate?.('health')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '950', fontSize: '0.8rem' }}>
                            Santé <ArrowRight size={14} />
                        </button>
                    </div>
                    <div style={{ padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: '850', color: 'var(--text-muted)' }}>Progression</span>
                                <span style={{ fontSize: '0.85rem', fontWeight: '950', color: children.length > 0 && nonSwimTested === 0 ? 'var(--success-color)' : 'var(--primary-color)' }}>
                                    {children.length > 0 ? Math.round(((children.length - nonSwimTested) / children.length) * 100) : 0}%
                                </span>
                            </div>
                            <div style={{ height: '10px', background: 'var(--bg-secondary)', borderRadius: '10px', overflow: 'hidden' }}>
                                <div style={{ width: children.length > 0 ? `${((children.length - nonSwimTested) / children.length) * 100}%` : '0%', height: '100%', background: nonSwimTested === 0 ? 'oklch(62% 0.18 145)' : 'var(--primary-gradient)', borderRadius: '10px', transition: 'width 1s' }} />
                            </div>
                        </div>
                        {nonSwimTested > 0 ? (
                            <div style={{ padding: '1rem', background: 'oklch(97% 0.06 45)', borderRadius: '16px', border: '1.5px solid oklch(85% 0.10 45)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{ fontSize: '1.25rem', color: 'var(--primary-color)' }}>•</span>
                                <span style={{ fontSize: '0.85rem', fontWeight: '850', color: 'oklch(40% 0.12 45)' }}>
                                    <strong>{nonSwimTested}</strong> enfant{nonSwimTested > 1 ? 's' : ''} n'ont pas encore passé le test de natation.
                                </span>
                            </div>
                        ) : children.length > 0 ? (
                            <div style={{ padding: '1rem', background: 'oklch(97% 0.04 145)', borderRadius: '16px', border: '1.5px solid oklch(85% 0.08 145)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{ fontSize: '1.25rem', color: 'var(--success-color)' }}>•</span>
                                <span style={{ fontSize: '0.85rem', fontWeight: '850', color: 'oklch(35% 0.15 145)' }}>Tous les enfants ont validé le test de natation.</span>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem', fontSize: '0.85rem', fontWeight: '750' }}>Aucun enfant enregistré.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
