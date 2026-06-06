import React, { useMemo } from 'react';
import { Utensils, AlertCircle, Wheat, Clock, Sparkles, ChefHat, Coffee, Sun, Moon } from 'lucide-react';

const DEFAULT_DAY = { matin: '', midi: '', gouter: '', soir: '' };

const MEALS = [
    { id: 'matin', label: 'Petit-Déjeuner', icon: <Coffee size={24} />, time: '08:00', gradient: 'oklch(71% 0.19 45 / 0.1)' },
    { id: 'midi', label: 'Déjeuner', icon: <Sun size={24} />, time: '12:30', gradient: 'oklch(62% 0.18 200 / 0.1)' },
    { id: 'gouter', label: 'Goûter', icon: <ChefHat size={24} />, time: '16:00', gradient: 'oklch(62% 0.18 320 / 0.1)' },
    { id: 'soir', label: 'Dîner', icon: <Moon size={24} />, time: '19:30', gradient: 'oklch(62% 0.18 260 / 0.1)' }
];

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const DAY_MAP = [6, 0, 1, 2, 3, 4, 5]; // JS getDay() → index in DAYS

export default function Menus({ participants, currentDate, isMobile, menus = {}, setMenus }) {
    const childrenWithAllergies = useMemo(() =>
        (participants || []).filter(p => p.role === 'child' && p.allergies && p.allergies.trim() !== ''),
        [participants]
    );

    const dayIndex = currentDate ? currentDate.getDay() : new Date().getDay();
    const currentDayName = DAYS[DAY_MAP[dayIndex]];
    const dayMenus = menus[currentDayName] || DEFAULT_DAY;

    const handleChange = (mealId, value) => {
        if (!setMenus) return;
        setMenus({
            ...menus,
            [currentDayName]: { ...dayMenus, [mealId]: value }
        });
    };

    return (
        <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'transparent' }}>
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) 340px', gap: isMobile ? '1.5rem' : '2.5rem', overflow: isMobile ? 'visible' : 'hidden', padding: isMobile ? '0.75rem 0' : '1.5rem 0' }}>

                {/* Repas du jour */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', overflow: isMobile ? 'visible' : 'hidden' }}>
                    <div className="card-glass" style={{ padding: isMobile ? '1.25rem' : '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                            <div style={{ background: 'var(--primary-gradient)', borderRadius: '14px', padding: '0.75rem', color: 'white', display: 'flex' }}>
                                <Utensils size={24} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h2 style={{ margin: 0, fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: '950', fontFamily: 'Bricolage Grotesque, sans-serif', color: 'var(--text-main)', letterSpacing: '-0.03em' }}>
                                    Menu du {currentDayName}
                                </h2>
                                <div style={{ fontSize: '10px', fontWeight: '950', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '2px' }}>
                                    Synchronisé entre tous les appareils
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: '12px', border: '1.5px solid var(--glass-border)' }}>
                            <Clock size={16} strokeWidth={2.5} style={{ color: 'var(--primary-color)' }} />
                            <span style={{ fontSize: '0.85rem', fontWeight: '950', color: 'var(--text-main)' }}>{new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>

                    <div style={{ flex: 1, overflowY: isMobile ? 'visible' : 'auto', paddingRight: isMobile ? '0' : '0.5rem' }} className="no-scrollbar">
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
                            {MEALS.map((m, idx) => (
                                <div key={m.id} className="card-glass animate-fade-in" style={{
                                    '--i': idx, animationDelay: `calc(var(--i) * 50ms)`,
                                    padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'white',
                                    border: '1.5px solid var(--glass-border)', position: 'relative', overflow: 'hidden'
                                }}>
                                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: m.gradient.replace('/ 0.1)', '/ 1)') }} />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ background: m.gradient, padding: '0.85rem', borderRadius: '16px', color: 'var(--text-main)', display: 'flex', border: '1.5px solid var(--glass-border)' }}>
                                            {m.icon}
                                        </div>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '950', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>{m.label}</h3>
                                            <div style={{ fontSize: '10px', fontWeight: '950', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Clock size={10} strokeWidth={3} /> {m.time}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        <textarea
                                            value={dayMenus[m.id] || ''}
                                            onChange={e => handleChange(m.id, e.target.value)}
                                            placeholder="Composer le menu..."
                                            className="glass-input"
                                            style={{
                                                width: '100%', height: isMobile ? '120px' : '160px',
                                                padding: isMobile ? '1.25rem' : '1.5rem', fontSize: isMobile ? '0.9rem' : '1rem',
                                                lineHeight: '1.6', borderRadius: '24px', background: 'var(--bg-secondary)',
                                                border: '2px solid transparent', resize: 'none', fontWeight: '750'
                                            }}
                                        />
                                        <div style={{ position: 'absolute', bottom: '1.25rem', right: '1.25rem', opacity: 0.4 }}>
                                            <ChefHat size={20} strokeWidth={2.5} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar allergies */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', overflow: isMobile ? 'visible' : 'hidden' }}>
                    <div className="card-glass" style={{ flex: 1, padding: isMobile ? '1.25rem' : '2rem', display: 'flex', flexDirection: 'column', background: 'white', border: '1.5px solid var(--glass-border)', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '2rem' }}>
                            <div style={{ background: 'oklch(62% 0.18 20 / 0.1)', padding: '0.625rem', borderRadius: '12px', color: 'var(--danger-color)', display: 'flex' }}>
                                <AlertCircle size={20} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '950', color: 'var(--text-main)', letterSpacing: '-0.01em' }}>Allergies & Régimes</h3>
                                <div style={{ fontSize: '10px', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Données Cruciales</div>
                            </div>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }} className="no-scrollbar">
                            {childrenWithAllergies.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '4rem 1.5rem', background: 'var(--bg-secondary)', borderRadius: '24px', border: '1.5px dashed var(--glass-border)' }}>
                                    <Wheat size={40} strokeWidth={1.5} style={{ margin: '0 auto 1.25rem', color: 'var(--text-muted)', opacity: 0.3 }} />
                                    <p style={{ fontSize: '0.9rem', fontWeight: '850', color: 'var(--text-muted)', lineHeight: '1.5' }}>Aucune allergie critique signalée.</p>
                                </div>
                            ) : childrenWithAllergies.map((child, idx) => (
                                <div key={child.id} className="animate-fade-in" style={{ '--i': idx, animationDelay: `calc(var(--i) * 40ms)`, padding: '1.25rem', background: 'oklch(62% 0.18 20 / 0.04)', border: '1.5px solid oklch(62% 0.18 20 / 0.08)', borderRadius: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                        <div style={{ fontWeight: '950', color: 'var(--danger-color)', fontSize: '0.95rem' }}>
                                            {child.firstName} <span style={{ textTransform: 'uppercase', fontSize: '0.85em', opacity: 0.7 }}>{child.lastName}</span>
                                        </div>
                                        {child.group && (
                                            <div style={{ fontSize: '9px', fontWeight: '950', background: 'white', padding: '2px 8px', borderRadius: '6px', color: 'var(--text-muted)', border: '1px solid var(--glass-border)' }}>{child.group}</div>
                                        )}
                                    </div>
                                    <div style={{ background: 'white', padding: '0.75rem 1rem', borderRadius: '14px', border: '1.5px solid oklch(62% 0.18 20 / 0.1)', color: 'oklch(20% 0.05 20)', fontSize: '0.85rem', fontWeight: '800', lineHeight: '1.5' }}>
                                        {child.allergies}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: '2rem', padding: '1.25rem', background: 'var(--primary-gradient)', borderRadius: '20px', display: 'flex', gap: '1rem', color: 'white' }}>
                            <Sparkles size={20} strokeWidth={2.5} style={{ flexShrink: 0, marginTop: '2px' }} />
                            <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: '1.5', fontWeight: '900', opacity: 0.9 }}>
                                Ces informations proviennent directement des fiches sanitaires de l'Annuaire.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`.glass-input:focus { background: white !important; border-color: var(--primary-color) !important; box-shadow: 0 8px 24px rgba(0,0,0,0.06); }`}</style>
        </div>
    );
}
