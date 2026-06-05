import React, { useState, useMemo } from 'react';
import {
    Activity, Clipboard, Phone, Plus,
    Heart, Pill, Scale, ShoppingCart, PhoneCall, UserCheck,
    ChevronRight, Check, X
} from 'lucide-react';
import Avatar from '../common/Avatar';
import { GroupBadge } from '../common/Badges';
import { getMedicationsList } from '../../utils/meds';
import { EmptyState } from '../ui';

const LOG_TYPES = {
    soin:    { label: 'Soin effectué',       icon: <Heart size={18} />,       color: 'oklch(62% 0.18 20)' },
    medoc:   { label: 'Médicament',          icon: <Pill size={18} />,        color: 'oklch(62% 0.18 232)' },
    physio:  { label: 'Physio',              icon: <Scale size={18} />,       color: 'oklch(62% 0.18 145)' },
    frais:   { label: 'Frais',               icon: <ShoppingCart size={18} />, color: 'oklch(62% 0.18 45)' },
    appel:   { label: 'Appel parents',       icon: <PhoneCall size={18} />,   color: 'oklch(62% 0.18 300)' },
    medecin: { label: 'Consultation Médicale', icon: <UserCheck size={18} />, color: 'oklch(62% 0.18 180)' },
};

const LogTypeButton = ({ active, onClick, icon, label, color }) => (
    <button
        onClick={onClick}
        style={{
            display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.625rem 1rem',
            borderRadius: '14px', border: '1.5px solid',
            borderColor: active ? color : 'var(--glass-border)',
            background: active ? 'white' : 'transparent',
            color: active ? color : 'var(--text-muted)',
            cursor: 'pointer', transition: 'all 0.2s',
            fontWeight: '950', fontSize: '0.8rem'
        }}
    >
        {icon}
        {label}
    </button>
);

const IndividualCarnet = ({
    children,
    groups,
    selectedChild,
    setSelectedChildId,
    addHealthLog,
    updateParticipantHealth,
    canEdit,
    isMobile,
}) => {
    const [logType, setLogType] = useState('soin');
    const [logContent, setLogContent] = useState('');
    const [logValue, setLogValue] = useState('');
    const [logCategory, setLogCategory] = useState('');

    const handleSubmitLog = () => {
        if (!logContent && !logValue) return;
        if (logType === 'medecin') {
            updateParticipantHealth(selectedChild.id, 'doctorSeenDate', new Date().toISOString());
        }
        addHealthLog(selectedChild.id, { type: logType, content: logContent, value: logValue, category: logCategory });
        setLogContent(''); setLogValue(''); setLogCategory('');
    };

    const medsList = useMemo(
        () => selectedChild ? getMedicationsList(selectedChild) : [],
        [selectedChild]
    );

    return (
        <div style={{ display: 'flex', gap: '2rem', height: '100%', flexDirection: isMobile ? 'column' : 'row' }}>
            {/* Child selector */}
            <div style={{ width: isMobile ? '100%' : '300px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h3 className="u-section-title" style={{ marginBottom: '0.5rem' }}>Sélectionner un enfant</h3>
                <div style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: '0.5rem', overflowX: isMobile ? 'auto' : 'hidden', overflowY: isMobile ? 'hidden' : 'auto' }} className="no-scrollbar">
                    {children.map(child => (
                        <button
                            key={child.id}
                            onClick={() => setSelectedChildId(child.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
                                borderRadius: '16px', border: '1.5px solid',
                                borderColor: selectedChild?.id === child.id ? 'var(--primary-color)' : 'var(--glass-border)',
                                background: selectedChild?.id === child.id ? 'white' : 'rgba(255,255,255,0.4)',
                                cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                                flexShrink: 0, minWidth: isMobile ? '200px' : 'auto'
                            }}
                        >
                            <Avatar participant={child} size={32} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: '900', fontSize: '0.85rem', color: 'var(--text-main)' }} className="u-truncate">{child.firstName} {child.lastName}</div>
                                <div className="u-text-xs u-text-muted u-font-bold">{groups.find(g => g.id === child.group)?.name || 'Sans groupe'}</div>
                            </div>
                            {selectedChild?.id === child.id && <ChevronRight size={16} color="var(--primary-color)" />}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tracking panel */}
            {selectedChild ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Summary card */}
                    <div className="card-glass" style={{ padding: '1.75rem', borderRadius: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', background: 'white' }}>
                        <div className="u-flex u-items-center u-gap-lg">
                            <Avatar participant={selectedChild} size={72} />
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '950', letterSpacing: '-0.04em', color: 'var(--text-main)' }}>{selectedChild.firstName} {selectedChild.lastName}</h2>
                                <div className="u-flex u-gap-sm" style={{ marginTop: '0.625rem' }}>
                                    <GroupBadge groupId={selectedChild.group} groups={groups} />
                                    {selectedChild.emergencyContact && (
                                        <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '6px', background: 'oklch(95% 0.05 var(--brand-hue))', padding: '4px 12px', borderRadius: '10px' }}>
                                            <Phone size={12} strokeWidth={3} /> {selectedChild.emergencyContact}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="u-flex u-gap-md" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
                            {/* Treatments */}
                            <div style={{ padding: '0.75rem 1.25rem', background: 'var(--bg-main)', borderRadius: '16px', border: '1px solid var(--glass-border)', minWidth: '200px' }}>
                                <div className="u-label" style={{ marginBottom: '4px' }}>Traitement de fond</div>
                                {medsList.length === 0 ? (
                                    <span style={{ opacity: 0.5, fontSize: '0.8rem' }}>Aucun traitement</span>
                                ) : (
                                    <div className="u-flex-col u-gap-xs">
                                        {medsList.map((med, idx) => (
                                            <div key={idx} className="u-flex u-items-center" style={{ background: 'white', padding: '4px 8px', borderRadius: '8px', border: '1px solid var(--glass-border)', fontSize: '0.8rem', gap: '6px' }}>
                                                <span style={{ fontWeight: 'bold' }}>{med.name}</span>
                                                <div className="u-flex u-gap-xs">
                                                    {med.slots.map(s => (
                                                        <span key={s} style={{ fontSize: '0.6rem', background: 'var(--bg-main)', padding: '2px 4px', borderRadius: '4px' }}>{s}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div style={{ textAlign: 'right', padding: '0.75rem 1.25rem', background: 'var(--bg-main)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                                <div className="u-label">Dernière Pesée</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: '950', color: 'var(--text-main)' }}>{selectedChild.weight || '--'} <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>kg</span></div>
                            </div>
                            {selectedChild.doctorSeenDate && (
                                <div style={{ textAlign: 'right', padding: '0.75rem 1.25rem', background: 'oklch(98% 0.02 180)', borderRadius: '16px', border: '1px solid oklch(62% 0.18 180 / 0.1)' }}>
                                    <div style={{ fontSize: '0.65rem', fontWeight: '800', color: 'oklch(62% 0.18 180)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Suivi Médical</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: '950', color: 'oklch(62% 0.18 180)' }}>{new Date(selectedChild.doctorSeenDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Log Form */}
                    <div className="card-glass" style={{ padding: '1.5rem', borderRadius: '24px' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: '950', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Plus size={20} strokeWidth={3} style={{ color: 'var(--primary-color)' }} /> Nouveau Suivi
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            {Object.entries(LOG_TYPES).map(([id, cfg]) => (
                                <LogTypeButton key={id} active={logType === id} onClick={() => setLogType(id)} icon={cfg.icon} label={cfg.label.split(' ')[0]} color={cfg.color} />
                            ))}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {logType === 'medoc' && (
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {['Matin', 'Midi', 'Goûter', 'Soir'].map(time => (
                                        <button key={time} onClick={() => setLogCategory(time)} style={{
                                            flex: 1, padding: '0.5rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '900', border: '1.5px solid',
                                            borderColor: logCategory === time ? 'var(--primary-color)' : 'var(--glass-border)',
                                            background: logCategory === time ? 'var(--primary-light)' : 'white',
                                            color: logCategory === time ? 'var(--primary-color)' : 'var(--text-muted)'
                                        }}>{time}</button>
                                    ))}
                                </div>
                            )}
                            {logType === 'physio' ? (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label className="u-label">MESURE</label>
                                        <select className="glass-input" value={logCategory} onChange={e => setLogCategory(e.target.value)} style={{ height: '44px', fontWeight: '800' }}>
                                            <option value="">Sélectionner...</option>
                                            <option value="poids">Poids (kg)</option>
                                            <option value="selles">Selles</option>
                                            <option value="couches">Couches</option>
                                            <option value="temperature">Température (°C)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="u-label">VALEUR</label>
                                        <input className="glass-input" placeholder="Ex: 32.5 ou OK" value={logValue} onChange={e => setLogValue(e.target.value)} style={{ height: '44px', fontWeight: '800' }} />
                                    </div>
                                </div>
                            ) : (
                                <textarea
                                    className="glass-input"
                                    placeholder={logType === 'soin' ? "Description du soin (ex: Nettoyage plaie genou + pansement)..." : "Notes complémentaires..."}
                                    value={logContent} onChange={e => setLogContent(e.target.value)}
                                    style={{ height: '100px', padding: '1rem', resize: 'none', borderRadius: '16px' }}
                                />
                            )}
                            {logType === 'frais' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <input className="glass-input" placeholder="Montant (€)" type="number" value={logValue} onChange={e => setLogValue(e.target.value)} style={{ height: '44px', fontWeight: '800' }} />
                                    <select className="glass-input" value={logCategory} onChange={e => setLogCategory(e.target.value)} style={{ height: '44px', fontWeight: '800' }}>
                                        <option value="pharmacie">Pharmacie</option>
                                        <option value="medecin">Médecin / Spécialiste</option>
                                        <option value="autre">Autre dépense</option>
                                    </select>
                                </div>
                            )}
                            <button className="btn btn-primary" onClick={handleSubmitLog} disabled={!canEdit} style={{ height: '52px', borderRadius: '16px', fontWeight: '950', fontSize: '1rem', marginTop: '0.5rem' }}>
                                Enregistrer le suivi
                            </button>
                        </div>
                    </div>

                    {/* Health log timeline */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <h3 className="u-section-title" style={{ paddingLeft: '0.5rem' }}>Historique de santé</h3>
                        {(!selectedChild.healthLogs || selectedChild.healthLogs.length === 0) ? (
                            <EmptyState icon={<Clipboard size={32} strokeWidth={1.5} />} title="Aucun historique pour le moment." />
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {selectedChild.healthLogs.map(log => {
                                    const cfg = LOG_TYPES[log.type] || LOG_TYPES.soin;
                                    return (
                                        <div key={log.id} className="card-glass animate-fade-in" style={{ padding: '1rem 1.25rem', borderRadius: '18px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{
                                                width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                background: `${cfg.color} / 0.1)`.replace('oklch(', 'oklch(').replace('/ 0.1)', '/ 0.1)'),
                                                color: cfg.color
                                            }}>
                                                {cfg.icon}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div className="u-flex" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
                                                    <span className="u-text-xs u-text-muted u-font-heavy u-uppercase">
                                                        {log.type === 'medoc' ? `Médicament - ${log.category}` : log.type === 'physio' ? `Physio - ${log.category}` : log.type === 'frais' ? `Frais - ${log.category}` : cfg.label}
                                                    </span>
                                                    <span className="u-text-xs u-text-muted" style={{ fontWeight: '600' }}>
                                                        {new Date(log.timestamp).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <div style={{ fontWeight: '800', fontSize: '0.9rem', color: 'var(--text-main)', marginTop: '2px' }}>
                                                    {log.content || (log.value ? `${log.value} ${log.category === 'poids' ? 'kg' : ''}` : 'Confirmé')}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.4 }}>
                    <Activity size={80} strokeWidth={1} />
                    <p style={{ fontWeight: '900', fontSize: '1.25rem', marginTop: '1.5rem' }}>Sélectionnez un enfant pour voir son carnet</p>
                </div>
            )}
        </div>
    );
};

export default IndividualCarnet;
