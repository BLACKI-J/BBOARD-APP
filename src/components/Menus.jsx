import React, { useState, useMemo } from 'react';
import { Utensils, Info, Wheat, List, Edit2, AlertCircle, Clock, ChevronRight, Sparkles, ChefHat, Coffee, Sun, Moon } from 'lucide-react';
import { useUi } from '../ui/UiProvider';

export default function Menus({ participants, currentDate, isMobile }) {
    const ui = useUi();
    const [menus, setMenus] = useState(() => {
        const saved = localStorage.getItem('colo-menus');
        if (saved) {
            try { return JSON.parse(saved); }
            catch (e) { console.error("Failed to parse menus:", e); }
        }
        return {
            'Lundi': { matin: '', midi: '', gouter: '', soir: '' },
            'Mardi': { matin: '', midi: '', gouter: '', soir: '' },
            'Mercredi': { matin: '', midi: '', gouter: '', soir: '' },
            'Jeudi': { matin: '', midi: '', gouter: '', soir: '' },
            'Vendredi': { matin: '', midi: '', gouter: '', soir: '' },
            'Samedi': { matin: '', midi: '', gouter: '', soir: '' },
            'Dimanche': { matin: '', midi: '', gouter: '', soir: '' }
        };
    });

    React.useEffect(() => {
        localStorage.setItem('colo-menus', JSON.stringify(menus));
    }, [menus]);

    const handleMenuChange = (day, meal, value) => {
        setMenus(prev => ({
            ...prev,
            [day]: { ...prev[day], [meal]: value }
        }));
    };

    const childrenWithAllergies = useMemo(() => {
        return (participants || []).filter(p => p.role === 'child' && p.allergies && p.allergies.trim() !== '');
    }, [participants]);

    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    const meals = [
        { id: 'matin', label: 'Petit-Déjeuner', icon: <Coffee size={24} />, time: '08:00', gradient: 'oklch(71% 0.19 45 / 0.1)' },
        { id: 'midi', label: 'Déjeuner', icon: <Sun size={24} />, time: '12:30', gradient: 'oklch(62% 0.18 200 / 0.1)' },
        { id: 'gouter', label: 'Goûter', icon: <ChefHat size={24} />, time: '16:00', gradient: 'oklch(62% 0.18 320 / 0.1)' },
        { id: 'soir', label: 'Dîner', icon: <Moon size={24} />, time: '19:30', gradient: 'oklch(62% 0.18 260 / 0.1)' }
    ];

    const dayIndex = currentDate ? currentDate.getDay() : new Date().getDay();
    const dayMap = [6, 0, 1, 2, 3, 4, 5];
    const currentDayName = days[dayMap[dayIndex]];

    return (
        <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'transparent' }}>
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) 340px', gap: isMobile ? '1.5rem' : '2.5rem', overflow: isMobile ? 'visible' : 'hidden', padding: isMobile ? '0.75rem 0' : '1.5rem 0' }}>

                {/* Main Content Area */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', overflow: isMobile ? 'visible' : 'hidden' }}>
                    
                    {/* Header */}
                    <div className="card-glass" style={{ padding: isMobile ? '1.25rem' : '1.5rem 2rem', display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', background: 'white', gap: isMobile ? '1rem' : '0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                            <div style={{ background: 'var(--primary-gradient)', borderRadius: '14px', padding: '0.75rem', color: 'white', display: 'flex' }}>
                                <Utensils size={24} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h2 style={{ margin: 0, fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: '950', fontFamily: 'Sora, sans-serif', color: 'var(--text-main)', letterSpacing: '-0.03em' }}>
                                    Menu du {currentDayName}
                                </h2>
                                <div style={{ fontSize: '10px', fontWeight: '950', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '2px' }}>
                                    Gestion des repas
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: '12px', border: '1.5px solid var(--glass-border)', alignSelf: isMobile ? 'flex-end' : 'center' }}>
                            <Clock size={16} strokeWidth={2.5} style={{ color: 'var(--primary-color)' }} />
                            <span style={{ fontSize: '0.85rem', fontWeight: '950', color: 'var(--text-main)' }}>{new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>

                    {/* Meal Cards Grid */}
                    <div style={{ flex: 1, overflowY: isMobile ? 'visible' : 'auto', paddingRight: isMobile ? '0' : '0.5rem' }} className="no-scrollbar">
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
                            {meals.map((m, idx) => (
                                <div key={m.id} className="card-glass animate-fade-in" style={{ 
                                    '--i': idx,
                                    animationDelay: `calc(var(--i) * 50ms)`,
                                    padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'white',
                                    border: '1.5px solid var(--glass-border)', transition: 'all 0.4s var(--ease-out-expo)',
                                    position: 'relative', overflow: 'hidden'
                                }}>
                                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: m.gradient.replace(' / 0.1)', '') }} />
                                    
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
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
                                    </div>

                                    <div style={{ position: 'relative' }}>
                                        <textarea
                                            value={menus[currentDayName][m.id]}
                                            onChange={e => handleMenuChange(currentDayName, m.id, e.target.value)}
                                            placeholder={`Composer le menu...`}
                                            className="glass-input"
                                            style={{ 
                                                width: '100%', height: isMobile ? '120px' : '160px', padding: isMobile ? '1.25rem' : '1.5rem', fontSize: isMobile ? '0.9rem' : '1rem', lineHeight: '1.6',
                                                borderRadius: '24px', background: 'var(--bg-secondary)', border: '2px solid transparent',
                                                resize: 'none', fontWeight: '750'
                                            }}
                                        />
                                        <div style={{ position: 'absolute', bottom: '1.25rem', right: '1.25rem', display: 'flex', gap: '0.5rem', opacity: 0.4 }}>
                                            <ChefHat size={20} strokeWidth={2.5} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar: Allergies */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', overflow: isMobile ? 'visible' : 'hidden' }}>
                    <div className="card-glass" style={{ 
                        flex: 1, padding: isMobile ? '1.25rem' : '2rem', display: 'flex', flexDirection: 'column', background: 'white',
                        border: '1.5px solid var(--glass-border)', overflow: 'hidden'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '2rem' }}>
                            <div style={{ background: 'oklch(62% 0.18 20 / 0.1)', padding: '0.625rem', borderRadius: '12px', color: 'var(--danger-color)', display: 'flex' }}>
                                <AlertCircle size={20} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '950', color: 'var(--text-main)', letterSpacing: '-0.01em' }}>Allergies & Régimes</h3>
                                <div style={{ fontSize: '10px', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    Données Cruciales
                                </div>
                            </div>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }} className="no-scrollbar">
                            {childrenWithAllergies.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '4rem 1.5rem', background: 'var(--bg-secondary)', borderRadius: '24px', border: '1.5px dashed var(--glass-border)' }}>
                                    <Wheat size={40} strokeWidth={1.5} style={{ margin: '0 auto 1.25rem', color: 'var(--text-muted)', opacity: 0.3 }} />
                                    <p style={{ fontSize: '0.9rem', fontWeight: '850', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                                        Aucune allergie critique signalée pour ce séjour.
                                    </p>
                                </div>
                            ) : (
                                childrenWithAllergies.map((child, idx) => (
                                    <div key={child.id} className="animate-fade-in" style={{ 
                                        '--i': idx,
                                        animationDelay: `calc(var(--i) * 40ms)`,
                                        padding: '1.25rem', background: 'oklch(62% 0.18 20 / 0.04)', 
                                        border: '1.5px solid oklch(62% 0.18 20 / 0.08)', borderRadius: '20px',
                                        transition: 'all 0.3s ease'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                            <div style={{ fontWeight: '950', color: 'var(--danger-color)', fontSize: '0.95rem' }}>
                                                {child.firstName} <span style={{ textTransform: 'uppercase', fontSize: '0.85em', opacity: 0.7 }}>{child.lastName}</span>
                                            </div>
                                            {child.group && (
                                                <div style={{ fontSize: '9px', fontWeight: '950', background: 'white', padding: '2px 8px', borderRadius: '6px', color: 'var(--text-muted)', border: '1px solid var(--glass-border)' }}>
                                                    {child.group}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ background: 'white', padding: '0.75rem 1rem', borderRadius: '14px', border: '1.5px solid oklch(62% 0.18 20 / 0.1)', color: 'oklch(20% 0.05 20)', fontSize: '0.85rem', fontWeight: '800', lineHeight: '1.5' }}>
                                            {child.allergies}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div style={{ marginTop: '2rem', padding: '1.25rem', background: 'var(--primary-gradient)', borderRadius: '20px', display: 'flex', gap: '1rem', color: 'white', border: 'none', boxShadow: '0 12px 24px var(--shadow-color)' }}>
                            <Sparkles size={20} strokeWidth={2.5} style={{ flexShrink: 0, marginTop: '2px' }} />
                            <div>
                                <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: '1.5', fontWeight: '900', opacity: 0.9 }}>
                                    Ces informations proviennent directement des fiches sanitaires de l'Annuaire.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <style>{`
                .glass-input:focus {
                    background: white !important;
                    border-color: var(--primary-color) !important;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.06);
                }
            `}</style>
        </div>
    );
}
