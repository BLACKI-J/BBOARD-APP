import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Utensils, AlertCircle, Wheat, Clock, ChefHat, Coffee, Sun, Moon, Printer } from 'lucide-react';
import SectionHeader from './common/SectionHeader';
import { printHtml } from '../utils/printHtml';

const DEFAULT_DAY = { matin: '', midi: '', gouter: '', soir: '' };
const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nl2br = (s) => escapeHtml(s).replace(/\n/g, '<br>');

// Champ menu : draft local + sauvegarde différée. Sans ça, chaque frappe émettait
// un POST de toute la collection menus (et le refetch socket écrasait la frappe).
const MealField = ({ value, disabled, placeholder, isMobile, onCommit }) => {
    const [draft, setDraft] = useState(value || '');
    const focusedRef = useRef(false);
    const timerRef = useRef(null);
    useEffect(() => { if (!focusedRef.current) setDraft(value || ''); }, [value]);
    useEffect(() => () => clearTimeout(timerRef.current), []);
    return (
        <textarea
            value={draft} disabled={disabled} placeholder={placeholder} className="glass-input"
            onChange={e => { const v = e.target.value; setDraft(v); clearTimeout(timerRef.current); timerRef.current = setTimeout(() => onCommit(v), 600); }}
            onFocus={() => { focusedRef.current = true; }}
            onBlur={() => { focusedRef.current = false; clearTimeout(timerRef.current); onCommit(draft); }}
            style={{ width: '100%', height: isMobile ? '120px' : '160px', padding: isMobile ? '1.25rem' : '1.5rem', fontSize: isMobile ? '0.9rem' : '1rem', lineHeight: '1.6', borderRadius: '24px', background: 'var(--bg-secondary)', border: '2px solid transparent', resize: 'none', fontWeight: '750' }}
        />
    );
};

const MEALS = [
    { id: 'matin', label: 'Petit-Déjeuner', icon: <Coffee size={24} />, time: '08:00', gradient: 'oklch(52% 0.006 250 / 0.1)' },
    { id: 'midi', label: 'Déjeuner', icon: <Sun size={24} />, time: '12:30', gradient: 'oklch(52% 0.006 250 / 0.1)' },
    { id: 'gouter', label: 'Goûter', icon: <ChefHat size={24} />, time: '16:00', gradient: 'oklch(52% 0.006 250 / 0.1)' },
    { id: 'soir', label: 'Dîner', icon: <Moon size={24} />, time: '19:30', gradient: 'oklch(52% 0.006 250 / 0.1)' }
];

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const DAY_MAP = [6, 0, 1, 2, 3, 4, 5]; // JS getDay() → index in DAYS

export default function Menus({ participants, currentDate, isMobile, menus = {}, setMenus, canEdit = true, groups = [] }) {
    const childrenWithAllergies = useMemo(() =>
        (participants || []).filter(p => p.role === 'child' && p.allergies && p.allergies.trim() !== ''),
        [participants]
    );

    const dayIndex = currentDate ? currentDate.getDay() : new Date().getDay();
    const currentDayName = DAYS[DAY_MAP[dayIndex]];
    const dayMenus = menus[currentDayName] || DEFAULT_DAY;

    const handleChange = (mealId, value) => {
        if (!setMenus || !canEdit) return;
        // Updater fonctionnel : ne pas écraser un autre jour édité ailleurs (sync multi-appareils).
        setMenus(prev => ({
            ...prev,
            [currentDayName]: { ...(prev?.[currentDayName] || DEFAULT_DAY), [mealId]: value }
        }));
    };

    const printMenus = () => {
        const dateLabel = (currentDate || new Date()).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        const mealCards = MEALS.map(m => `
            <div class="meal">
                <div class="mh"><span class="mt">${escapeHtml(m.label)}</span><span class="mtime">${escapeHtml(m.time)}</span></div>
                <div class="mb">${dayMenus[m.id] ? nl2br(dayMenus[m.id]) : '<span class="empty">—</span>'}</div>
            </div>`).join('');
        const allergyRows = childrenWithAllergies.map(c => {
            const grp = groups.find(g => g.id === c.group)?.name || '';
            return `<tr><td class="nm">${escapeHtml(c.firstName)} ${escapeHtml((c.lastName || '').toUpperCase())}${grp ? ` <span class="grp">${escapeHtml(grp)}</span>` : ''}</td><td>${escapeHtml(c.allergies)}</td></tr>`;
        }).join('');
        printHtml(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Menu ${escapeHtml(currentDayName)}</title>
            <style>
                * { box-sizing: border-box; }
                body { font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; padding: 20px; }
                .hd { display: flex; justify-content: space-between; align-items: flex-end; background: #20242e; color: #fff; padding: 14px 18px; border-radius: 10px; margin-bottom: 18px; }
                .hd h1 { font-size: 20px; margin: 0; }
                .hd .meta { text-align: right; font-size: 12px; text-transform: capitalize; opacity: 0.92; }
                .meals { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
                .meal { border: 1px solid #dcdcdc; border-radius: 10px; overflow: hidden; page-break-inside: avoid; }
                .mh { display: flex; justify-content: space-between; align-items: baseline; background: #f2f3f5; border-bottom: 1px solid #dcdcdc; padding: 8px 12px; }
                .mh .mt { font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.03em; }
                .mh .mtime { font-size: 11px; color: #777; font-weight: 700; }
                .mb { padding: 12px; font-size: 13px; line-height: 1.6; min-height: 70px; font-weight: 600; }
                .mb .empty { color: #b0b0b0; }
                .sec { font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; margin: 22px 0 8px; display: flex; align-items: center; gap: 8px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #cfcfcf; padding: 7px 10px; font-size: 12px; text-align: left; vertical-align: top; }
                th { background: #2b2b2b; color: #fff; text-transform: uppercase; font-size: 10px; letter-spacing: 0.06em; }
                td.nm { font-weight: 800; white-space: nowrap; }
                .grp { font-weight: 700; color: #777; font-size: 10px; }
                .alrt td { background: #fdedec; }
                @media print { @page { size: A4 portrait; margin: 12mm; } body { padding: 0; } .hd, .mh, th, .alrt td { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
            </style></head><body>
            <div class="hd"><h1>Menu du ${escapeHtml(currentDayName)}</h1><div class="meta">${escapeHtml(dateLabel)}</div></div>
            <div class="meals">${mealCards}</div>
            ${allergyRows ? `<div class="sec">⚠ Allergies &amp; régimes</div><table><thead><tr><th>Enfant</th><th>Allergie / régime</th></tr></thead><tbody>${allergyRows.replace(/<tr>/g, '<tr class="alrt">')}</tbody></table>` : ''}
            </body></html>`);
    };

    return (
        <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'transparent' }}>
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) 340px', gap: isMobile ? '1.5rem' : '2.5rem', overflow: isMobile ? 'visible' : 'hidden', padding: isMobile ? '0.75rem 0' : '1.5rem 0' }}>

                {/* Repas du jour */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', overflow: isMobile ? 'visible' : 'hidden' }}>
                    <div className="card-glass" style={{ padding: isMobile ? '1.25rem' : '1.5rem 2rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                        <SectionHeader icon={Utensils} title={`Menu du ${currentDayName}`} subtitle="Synchronisé entre tous les appareils" />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <button onClick={printMenus} title="Imprimer le menu du jour" style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', height: '40px', padding: '0 1rem', borderRadius: '12px', border: '1.5px solid var(--glass-border)', background: 'var(--surface-color)', color: 'var(--text-main)', cursor: 'pointer', fontWeight: '850', fontSize: '0.85rem' }}>
                                <Printer size={16} strokeWidth={2} /> Imprimer
                            </button>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: '12px', border: '1.5px solid var(--glass-border)' }}>
                                <Clock size={16} strokeWidth={2} style={{ color: 'var(--primary-color)' }} />
                                <span style={{ fontSize: '0.85rem', fontWeight: '950', color: 'var(--text-main)' }}>{new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ flex: 1, overflowY: isMobile ? 'visible' : 'auto', paddingRight: isMobile ? '0' : '0.5rem' }} className="no-scrollbar">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: '1.5rem' }}>
                            {MEALS.map((m, idx) => (
                                <div key={m.id} className="card-glass animate-fade-in" style={{
                                    '--i': idx, animationDelay: `calc(var(--i) * 50ms)`,
                                    padding: 'clamp(1rem, 3vw, 2rem)', display: 'flex', flexDirection: 'column', gap: '1.5rem',
                                    position: 'relative', overflow: 'hidden'
                                }}>
                                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: m.gradient.replace('/ 0.1)', '/ 1)') }} />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ background: m.gradient, padding: '0.85rem', borderRadius: '16px', color: 'var(--text-main)', display: 'flex', border: '1.5px solid var(--glass-border)' }}>
                                            {m.icon}
                                        </div>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>{m.label}</h3>
                                            <div style={{ fontSize: '10px', fontWeight: '950', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Clock size={10} strokeWidth={2} /> {m.time}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        <MealField
                                            value={dayMenus[m.id] || ''}
                                            disabled={!canEdit}
                                            placeholder={canEdit ? "Composer le menu..." : "Lecture seule"}
                                            isMobile={isMobile}
                                            onCommit={v => handleChange(m.id, v)}
                                        />
                                        <div style={{ position: 'absolute', bottom: '1.25rem', right: '1.25rem', opacity: 0.4 }}>
                                            <ChefHat size={20} strokeWidth={2} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar allergies */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', overflow: isMobile ? 'visible' : 'hidden' }}>
                    <div className="card-glass" style={{ flex: 1, padding: isMobile ? '1.25rem' : '2rem', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '2rem' }}>
                            <div style={{ background: 'oklch(62% 0.18 20 / 0.1)', padding: '0.625rem', borderRadius: '12px', color: 'var(--danger-color)', display: 'flex' }}>
                                <AlertCircle size={20} strokeWidth={2} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.01em' }}>Allergies & Régimes</h3>
                                <div style={{ fontSize: '10px', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Données Cruciales</div>
                            </div>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }} className="no-scrollbar">
                            {childrenWithAllergies.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '4rem 1.5rem', background: 'var(--bg-secondary)', borderRadius: '24px', border: '1.5px dashed var(--glass-border)' }}>
                                    <Wheat size={40} strokeWidth={1.5} style={{ margin: '0 auto 1.25rem', color: 'var(--text-muted)', opacity: 0.3 }} />
                                    <p style={{ fontSize: '0.9rem', fontWeight: '850', color: 'var(--text-muted)', lineHeight: '1.5' }}>Aucune allergie critique signalée.</p>
                                </div>
                            ) : childrenWithAllergies.map((child, idx) => {
                                const groupName = groups.find(g => g.id === child.group)?.name;
                                return (
                                <div key={child.id} className="animate-fade-in" style={{ '--i': idx, animationDelay: `calc(var(--i) * 40ms)`, padding: '1.25rem', background: 'oklch(62% 0.18 20 / 0.04)', border: '1.5px solid oklch(62% 0.18 20 / 0.08)', borderRadius: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                        <div style={{ fontWeight: '950', color: 'var(--danger-color)', fontSize: '0.95rem' }}>
                                            {child.firstName} <span style={{ textTransform: 'uppercase', fontSize: '0.85em', opacity: 0.7 }}>{child.lastName}</span>
                                        </div>
                                        {groupName && (
                                            <div style={{ fontSize: '9px', fontWeight: '950', background: 'var(--surface-color)', padding: '2px 8px', borderRadius: '6px', color: 'var(--text-muted)', border: '1px solid var(--glass-border)' }}>{groupName}</div>
                                        )}
                                    </div>
                                    <div style={{ background: 'var(--surface-color)', padding: '0.75rem 1rem', borderRadius: '14px', border: '1.5px solid oklch(62% 0.18 20 / 0.1)', color: 'oklch(20% 0.05 20)', fontSize: '0.85rem', fontWeight: '800', lineHeight: '1.5' }}>
                                        {child.allergies}
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`.glass-input:focus { background: white !important; border-color: var(--primary-color) !important; box-shadow: 0 8px 24px rgba(0,0,0,0.06); }`}</style>
        </div>
    );
}
