import React, { useState, useMemo } from 'react';
import { Utensils, Info, Wheat, List, Edit2, AlertCircle } from 'lucide-react';

export default function Menus({ participants, currentDate }) {
    // Basic state for the weekly menu
    const [menus, setMenus] = useState(() => {
        const saved = localStorage.getItem('colo-menus');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Failed to parse menus:", e);
            }
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

    // Save on change
    React.useEffect(() => {
        localStorage.setItem('colo-menus', JSON.stringify(menus));
    }, [menus]);

    const handleMenuChange = (day, meal, value) => {
        setMenus(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                [meal]: value
            }
        }));
    };

    // Extract children with allergies
    const childrenWithAllergies = useMemo(() => {
        return participants.filter(p => p.role === 'child' && p.allergies && p.allergies.trim() !== '');
    }, [participants]);

    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    const meals = [
        { id: 'matin', label: 'Petit-Déjeuner', icon: '☕' },
        { id: 'midi', label: 'Déjeuner', icon: '🍲' },
        { id: 'gouter', label: 'Goûter', icon: '🍎' },
        { id: 'soir', label: 'Dîner', icon: '🍝' }
    ];

    const dayIndex = currentDate ? currentDate.getDay() : new Date().getDay(); // 0 is Sunday, 1 is Monday
    const dayMap = [6, 0, 1, 2, 3, 4, 5]; // Map to our days array index
    const currentDayName = days[dayMap[dayIndex]];

    return (
        <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#f8faff', borderRadius: '16px' }}>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', gap: '1.5rem' }}>

                {/* Main Menu Grid for Current Day */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                    {/* Header is handled by Schedule.jsx now, just show the day */}
                    <div style={{ padding: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ background: 'white', border: '1px solid #e2e8f0', padding: '0.5rem 1rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                            <Utensils size={18} color="#f59e0b" />
                            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#1e293b' }}>Repas du {currentDayName}</h2>
                        </div>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', paddingRight: '2px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                            {meals.map(m => (
                                <div key={m.id} style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                    <div style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#f8fafc' }}>
                                        <div style={{ background: 'white', padding: '0.4rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', fontSize: '1.2rem' }}>
                                            {m.icon}
                                        </div>
                                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: '#334155' }}>{m.label}</h3>
                                    </div>
                                    <div style={{ padding: '1rem', flex: 1 }}>
                                        <textarea
                                            value={menus[currentDayName][m.id]}
                                            onChange={e => handleMenuChange(currentDayName, m.id, e.target.value)}
                                            placeholder={`Entrez le menu pour le ${m.label.toLowerCase()}...`}
                                            style={{ width: '100%', height: '140px', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.875rem', fontSize: '0.95rem', resize: 'none', background: '#f8fafc', transition: 'all 0.2s', outline: 'none', boxSizing: 'border-box' }}
                                            onFocus={e => { e.target.style.background = 'white'; e.target.style.borderColor = '#fbbf24'; e.target.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.1)'; }}
                                            onBlur={e => { e.target.style.background = '#f8fafc'; e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Sidebar: Allergies */}
                <div style={{ width: '300px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', padding: '1.25rem', overflowY: 'auto', flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', color: '#ef4444' }}>
                            <AlertCircle size={20} />
                            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800' }}>Allergies & Régimes</h3>
                        </div>

                        {childrenWithAllergies.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94a3b8' }}>
                                <Wheat size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                                <p style={{ fontSize: '0.9rem', margin: 0 }}>Aucune allergie enregistrée chez les enfants.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {childrenWithAllergies.map(child => (
                                    <div key={child.id} style={{ padding: '0.875rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px' }}>
                                        <div style={{ fontWeight: '700', color: '#991b1b', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span>👤 {child.firstName} {child.lastName}</span>
                                            {/* (child.group && <span style={{fontSize:'0.7rem', padding:'2px 6px', background:'white', borderRadius:'4px', color:'#7f1d1d'}}>{child.group}</span>) */}
                                        </div>
                                        <div style={{ marginTop: '0.5rem', color: '#b91c1c', fontSize: '0.85rem', lineHeight: '1.4' }}>
                                            <strong>Allergie/Régime :</strong> {child.allergies}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#eff6ff', borderRadius: '10px', display: 'flex', gap: '0.75rem' }}>
                            <Info size={18} color="#3b82f6" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#1d4ed8', lineHeight: '1.5' }}>
                                Les données ci-dessus sont tirées directement des profils enfants dans le répertoire <strong>Annuaire</strong>.
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
