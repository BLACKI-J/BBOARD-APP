import React, { useState } from 'react';
import { ShieldAlert, ChevronRight, Waves, Moon, Pill as PillIcon, AlertTriangle, UtensilsCrossed } from 'lucide-react';
import Avatar from '../common/Avatar';
import { GroupBadge } from '../common/Badges';
import { getDetailSections, getAlertFlags, getCompletion } from './infoVacSchema';
import { getMedicationsList } from '../../utils/meds';
import ChildHealthDetail from './ChildHealthDetail';

// Anneau de complétion (SVG). Couleur selon le taux : rouge < 40, ambre < 80, vert ≥ 80.
const CompletionRing = ({ pct }) => {
    const r = 15, circ = 2 * Math.PI * r, offset = circ * (1 - pct / 100);
    const color = pct >= 80 ? 'oklch(58% 0.13 145)' : pct >= 40 ? 'oklch(70% 0.14 75)' : 'oklch(60% 0.16 28)';
    return (
        <span style={{ position: 'relative', width: '38px', height: '38px', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} title={`Fiche complétée à ${pct}%`}>
            <svg width="38" height="38" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="19" cy="19" r={r} fill="none" stroke="var(--glass-border)" strokeWidth="3.5" />
                <circle cx="19" cy="19" r={r} fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 0.6s var(--ease-out-expo)' }} />
            </svg>
            <span style={{ position: 'absolute', fontSize: '0.58rem', fontWeight: '950', color: 'var(--text-main)' }}>{pct}</span>
        </span>
    );
};

// Tonalité d'une réponse rapide (résumé d'un coup d'œil).
const TONES = {
    good: { bg: 'color-mix(in oklch, oklch(58% 0.13 145) 12%, white)', fg: 'oklch(45% 0.13 145)', bd: 'color-mix(in oklch, oklch(58% 0.13 145) 28%, transparent)' },
    warn: { bg: 'color-mix(in oklch, oklch(72% 0.14 75) 16%, white)',  fg: 'oklch(50% 0.13 70)',  bd: 'color-mix(in oklch, oklch(72% 0.14 75) 32%, transparent)' },
    bad:  { bg: 'color-mix(in oklch, oklch(60% 0.16 28) 12%, white)',  fg: 'oklch(50% 0.18 28)',  bd: 'color-mix(in oklch, oklch(60% 0.16 28) 30%, transparent)' },
    med:  { bg: 'color-mix(in oklch, oklch(56% 0.14 285) 12%, white)', fg: 'oklch(47% 0.15 285)', bd: 'color-mix(in oklch, oklch(56% 0.14 285) 28%, transparent)' },
    neutral: { bg: 'var(--bg-secondary)', fg: 'var(--text-muted)', bd: 'var(--glass-border)' },
};
const valueTone = (v) => {
    if (!v) return 'neutral';
    if (['OUI', 'Oui', 'Autonome'].includes(v)) return 'good';
    if (v === 'NON') return 'bad';
    return 'warn';
};

// ── Child card : hiérarchie claire — en-tête + résumé + bandeau critique + détail ──
//  1) En-tête : avatar (anneau couleur groupe) · nom · groupe · anneau de complétion
//  2) Résumé d'un coup d'œil : pastilles courtes (baignade, nage, sommeil, traitement)
//  3) Bandeau critique : allergies (rouge) · régime (ambre) · alertes médicales (rouge)
//  4) Détail : sections restantes, puces lisibles (intitulé au-dessus, valeur en gras)
const Pill = ({ icon, text, tone }) => {
    const t = TONES[tone] || TONES.neutral;
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', fontWeight: '850', padding: '4px 10px', borderRadius: '100px', background: t.bg, color: t.fg, border: `1px solid ${t.bd}` }}>
            {icon && React.cloneElement(icon, { size: 13, strokeWidth: 2.4 })} {text}
        </span>
    );
};

const ChildCard = ({ child, groups, onOpen }) => {
    const sections = getDetailSections(child);
    const alertFlags = getAlertFlags(child);
    const hasMeds = getMedicationsList(child).length > 0; // vrai système médicaments (plus les ivMed*)
    const pct = getCompletion(child);
    const groupColor = groups?.find(g => g.id === child.group)?.color || 'var(--text-muted)';
    const hasSleep = !!(child.ivSommeilHeures || child.ivSommeilRituel || child.ivSommeilNotes);

    // Résumé d'un coup d'œil
    const glance = [];
    if (child.ivBaignade) glance.push({ icon: <Waves />, text: child.ivBaignade === 'OUI' ? 'Baignade' : `Baignade · ${child.ivBaignade}`, tone: valueTone(child.ivBaignade) });
    if (child.ivNage) glance.push({ icon: <Waves />, text: child.ivNage === 'OUI' ? 'Sait nager' : `Nage · ${child.ivNage}`, tone: valueTone(child.ivNage) });
    if (hasSleep) glance.push({ icon: <Moon />, text: 'Sommeil', tone: 'neutral' });
    if (hasMeds) glance.push({ icon: <PillIcon />, text: 'Traitement', tone: 'med' });

    const isEmpty = !alertFlags.length && !child.allergies && !child.diet && !glance.length && !sections.length;

    return (
        <button type="button" onClick={() => onOpen(child.id)} className="glass-card"
            style={{ width: '100%', textAlign: 'left', cursor: 'pointer', overflow: 'hidden', padding: 0, transition: 'transform 0.25s var(--ease-out-expo), box-shadow 0.25s var(--ease-out-expo)' }}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 16px 36px oklch(20% 0 0 / 0.14)'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}>

            {/* 1) En-tête */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '1.1rem 1.1rem 0.9rem' }}>
                <span style={{ display: 'inline-flex', borderRadius: '50%', flexShrink: 0, boxShadow: `0 0 0 2px var(--surface-color), 0 0 0 4px color-mix(in oklch, ${groupColor} 55%, transparent), 0 4px 12px oklch(40% 0 0 / 0.16)` }}>
                    <Avatar participant={child} size={50} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '850', fontSize: '1.02rem', color: 'var(--text-main)', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {child.firstName} {(child.lastName || "").toUpperCase()}
                    </div>
                    <div style={{ marginTop: '5px' }}>
                        <GroupBadge groupId={child.group} groups={groups} />
                    </div>
                </div>
                <CompletionRing pct={pct} />
                <ChevronRight size={18} strokeWidth={2} style={{ color: 'var(--text-muted)', opacity: 0.45, flexShrink: 0, marginLeft: '-2px' }} />
            </div>

            <div style={{ padding: '0 1.1rem 1.1rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                {/* 2) Résumé d'un coup d'œil */}
                {glance.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {glance.map((g, i) => <Pill key={i} icon={g.icon} text={g.text} tone={g.tone} />)}
                    </div>
                )}

                {/* 3) Bandeau critique */}
                {(child.allergies || child.diet || alertFlags.length > 0) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {child.allergies && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 0.75rem', borderRadius: '12px', background: 'color-mix(in oklch, var(--danger-color) 11%, white)', border: '1px solid color-mix(in oklch, var(--danger-color) 30%, transparent)', color: 'color-mix(in oklch, var(--danger-color) 62%, black)', fontSize: '0.82rem', fontWeight: '800' }}>
                                <AlertTriangle size={15} strokeWidth={2.4} style={{ flexShrink: 0 }} />
                                <span><span style={{ fontWeight: '950', textTransform: 'uppercase', fontSize: '0.66rem', letterSpacing: '0.04em', marginRight: '5px' }}>Allergie</span>{child.allergies}</span>
                            </div>
                        )}
                        {child.diet && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 0.75rem', borderRadius: '12px', background: 'color-mix(in oklch, var(--warning-color) 15%, white)', border: '1px solid color-mix(in oklch, var(--warning-color) 32%, transparent)', color: 'color-mix(in oklch, var(--warning-color) 50%, black)', fontSize: '0.82rem', fontWeight: '800' }}>
                                <UtensilsCrossed size={15} strokeWidth={2.4} style={{ flexShrink: 0 }} />
                                <span><span style={{ fontWeight: '950', textTransform: 'uppercase', fontSize: '0.66rem', letterSpacing: '0.04em', marginRight: '5px' }}>Régime</span>{child.diet}</span>
                            </div>
                        )}
                        {alertFlags.length > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 0.75rem', borderRadius: '12px', background: 'color-mix(in oklch, var(--danger-color) 11%, white)', border: '1px solid color-mix(in oklch, var(--danger-color) 30%, transparent)', color: 'color-mix(in oklch, var(--danger-color) 62%, black)', fontSize: '0.82rem', fontWeight: '800' }}>
                                <ShieldAlert size={15} strokeWidth={2.4} style={{ flexShrink: 0 }} />
                                <span><span style={{ fontWeight: '950', textTransform: 'uppercase', fontSize: '0.66rem', letterSpacing: '0.04em', marginRight: '5px' }}>Alertes</span>{alertFlags.join(' · ')}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* 4) Détail par section — puces lisibles (intitulé + valeur) */}
                {sections.map(sec => (
                    <div key={sec.id}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '6px' }}>
                            <span style={{ display: 'inline-flex', color: sec.color }}>
                                {React.cloneElement(sec.icon, { size: 14, strokeWidth: 2.4 })}
                            </span>
                            <span style={{ fontSize: '0.62rem', fontWeight: '950', letterSpacing: '0.06em', textTransform: 'uppercase', color: `color-mix(in oklch, ${sec.color} 70%, black)` }}>
                                {sec.label}
                            </span>
                            <span style={{ flex: 1, height: '1px', background: `color-mix(in oklch, ${sec.color} 18%, transparent)` }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.45rem 0.75rem' }}>
                            {sec.rows.map((row, i) => {
                                const yes = row.value === 'OUI' || row.value === 'Oui';
                                return (
                                    <div key={i} style={{ minWidth: 0 }}>
                                        <div style={{ fontSize: '0.6rem', fontWeight: '900', letterSpacing: '0.03em', textTransform: 'uppercase', color: 'var(--text-softer)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.label}</div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: '800', color: yes ? 'oklch(50% 0.13 145)' : 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{yes ? 'Oui' : row.value}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {isEmpty && (
                    <div style={{ padding: '0.85rem', borderRadius: '14px', border: '1.5px dashed var(--glass-border)', background: 'var(--bg-secondary)', textAlign: 'center', fontSize: '0.76rem', fontWeight: '800', color: 'var(--text-muted)', opacity: 0.8 }}>
                        Fiche à compléter
                    </div>
                )}
            </div>
        </button>
    );
};

// ── Main: card list ⇄ child detail ──
const InfoVacSection = ({ children, groups, updateParticipantHealth, canEdit }) => {
    const [selectedId, setSelectedId] = useState(null);
    const [search, setSearch] = useState('');

    const selectedChild = children.find(c => c.id === selectedId);
    if (selectedChild) {
        return (
            <ChildHealthDetail
                child={selectedChild}
                groups={groups}
                onBack={() => setSelectedId(null)}
                updateParticipantHealth={updateParticipantHealth}
                canEdit={canEdit}
            />
        );
    }

    const filtered = children.filter(c =>
        `${c.firstName} ${c.lastName || ''}`.toLowerCase().includes(search.toLowerCase())
    );
    const filledCount = filtered.filter(c => getCompletion(c) > 0).length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Rechercher un enfant…" className="glass-input"
                    style={{ flex: 1, height: '44px', borderRadius: '14px', paddingLeft: '1rem' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-muted)', flexShrink: 0, whiteSpace: 'nowrap' }}>
                    {filledCount}/{filtered.length} remplie{filledCount > 1 ? 's' : ''}
                </span>
            </div>

            <div className="anim-cascade" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: '0.875rem', alignItems: 'start' }}>
                {filtered.map(child => (
                    <ChildCard key={child.id} child={child} groups={groups} onOpen={setSelectedId} />
                ))}
            </div>
        </div>
    );
};

export default InfoVacSection;
