import React, { useMemo } from 'react';
import { Clock, Utensils, Calendar, Users, AlertCircle, Quote } from 'lucide-react';

export default function Home({ activities, participants, groups }) {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

    // Stats
    const totalParticipants = participants.length;
    const animatorCount = participants.filter(p => p.role === 'animator').length;
    const childCount = participants.filter(p => !p.role || p.role === 'child').length;
    
    // Allergies alert count
    const allergyCount = participants.filter(p => p.allergies || p.constraints).length;

    // Next Activity
    const nextActivity = useMemo(() => {
        if (!activities || activities.length === 0) return null;
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();

        return [...activities]
            .filter(a => {
                const [h, m] = a.start.split(':').map(Number);
                return (h * 60 + m) > currentTime;
            })
            .sort((a, b) => a.start.localeCompare(b.start))[0];
    }, [activities]);

    return (
        <div className="animate-fade-in" style={{ padding: '0.5rem' }}>
            <div className="section-header-modern">
                <div>
                    <span className="glass-pill" style={{ marginBottom: '0.75rem' }}>
                        <Clock size={14} /> {formattedDate}
                    </span>
                    <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: '950' }}>Aujourd'hui</h2>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                {/* Status Card */}
                <div className="premium-card hover-glow" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'var(--primary-gradient)', color: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: '950', fontSize: '0.8rem', letterSpacing: '0.1em' }}>ÉTAT DE LA SESSION</span>
                        <div style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.2)', borderRadius: '100px', fontSize: '10px', fontWeight: '950' }}>EN COURS</div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem' }}>
                        <span style={{ fontSize: '4rem', fontWeight: '950', lineHeight: 1 }}>{totalParticipants}</span>
                        <div style={{ paddingBottom: '0.75rem' }}>
                            <div style={{ fontWeight: '950', fontSize: '0.9rem' }}>Membres</div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.8, fontWeight: '700' }}>{childCount} Enfants • {animatorCount} Staff</div>
                        </div>
                    </div>

                    <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem' }}>
                        <div className="glass-pill" style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white' }}>
                            <Users size={14} /> Effectif complet
                        </div>
                    </div>
                </div>

                {/* Next Activity Card */}
                <div className="premium-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: '950', fontSize: '0.8rem', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>PROCHAINE ACTIVITÉ</span>
                        <Calendar size={20} className="text-primary" />
                    </div>

                    {nextActivity ? (
                        <>
                            <div style={{ fontSize: '1.5rem', fontWeight: '950', color: 'var(--text-main)', marginTop: '0.5rem' }}>
                                {nextActivity.title}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color)', fontWeight: '950' }}>
                                <Clock size={16} /> {nextActivity.start} - {nextActivity.end}
                            </div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '650', marginTop: '0.5rem' }}>
                                {nextActivity.description || "Aucune description fournie pour cette activité."}
                            </div>
                        </>
                    ) : (
                        <div style={{ padding: '1.5rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <p style={{ fontWeight: '800' }}>Fin des activités pour aujourd'hui</p>
                        </div>
                    )}
                </div>

                {/* Medical Alert Card */}
                <div className="premium-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: allergyCount > 0 ? '6px solid var(--danger-color)' : '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: '950', fontSize: '0.8rem', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>VIGILANCE SANTÉ</span>
                        <AlertCircle size={20} color={allergyCount > 0 ? 'var(--danger-color)' : 'var(--success-color)'} />
                    </div>

                    {allergyCount > 0 ? (
                        <>
                            <div style={{ fontSize: '2.5rem', fontWeight: '950', color: 'var(--danger-color)' }}>{allergyCount}</div>
                            <div style={{ fontWeight: '850', color: 'var(--text-main)' }}>Alertes médicales actives</div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                                Consultez l'annuaire pour les détails des allergies ou contraintes spécifiques.
                            </p>
                        </>
                    ) : (
                        <div style={{ marginTop: '0.5rem' }}>
                            <div style={{ fontWeight: '950', color: 'var(--success-color)', fontSize: '1.2rem' }}>RAS</div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', marginTop: '0.5rem' }}>
                                Aucun problème de santé majeur signalé pour le groupe aujourd'hui.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Quote of the Day */}
            <div className="premium-card animate-fade-in" style={{ padding: '2rem', background: 'var(--bg-secondary)', border: 'none', animationDelay: '200ms' }}>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                    <div style={{ width: '48px', height: '48px', background: 'white', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)', flexShrink: 0 }}>
                        <Quote size={24} fill="currentColor" opacity={0.2} />
                    </div>
                    <div>
                        <p style={{ fontSize: '1.1rem', fontWeight: '850', color: 'var(--text-main)', fontStyle: 'italic', lineHeight: 1.5 }}>
                            "Le jeu est la forme la plus haute de la recherche."
                        </p>
                        <p style={{ fontSize: '0.85rem', fontWeight: '950', color: 'var(--primary-color)', marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            — Albert Einstein
                        </p>
                    </div>
                </div>
            </div>
            
            <style>{`
                .hover-glow:hover {
                    box-shadow: 0 20px 40px oklch(58% 0.18 var(--brand-hue) / 0.3);
                }
            `}</style>
        </div>
    );
}
