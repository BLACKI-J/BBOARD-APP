import React, { useState, useMemo } from 'react';
import {
    ArrowLeft, FileText, Clipboard, Phone, Plus, Heart, Pill, Scale,
    ShoppingCart, PhoneCall, UserCheck, Edit2
} from 'lucide-react';
import Avatar from '../common/Avatar';
import { GroupBadge } from '../common/Badges';
import { getMedicationsList } from '../../utils/meds';
import { EmptyState } from '../ui';
import { SECTIONS } from './infoVacSchema';

const LOG_TYPES = {
    soin:    { label: 'Soin',        icon: <Heart size={16} />,        color: 'oklch(62% 0.18 20)' },
    medoc:   { label: 'Médoc',       icon: <Pill size={16} />,         color: 'oklch(62% 0.18 232)' },
    physio:  { label: 'Physio',      icon: <Scale size={16} />,        color: 'oklch(62% 0.18 145)' },
    frais:   { label: 'Frais',       icon: <ShoppingCart size={16} />, color: 'oklch(62% 0.18 45)' },
    appel:   { label: 'Appel',       icon: <PhoneCall size={16} />,    color: 'oklch(62% 0.18 300)' },
    medecin: { label: 'Médecin',     icon: <UserCheck size={16} />,    color: 'oklch(62% 0.18 180)' },
};

// ── Infos sub-tab: static reference fields ──
const InfosPanel = ({ child, updateParticipantHealth, canEdit }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {SECTIONS.map(sec => (
            <div key={sec.id} style={{ background: 'white', borderRadius: '18px', border: '1.5px solid var(--glass-border)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', color: sec.color, fontSize: '0.75rem', fontWeight: '950', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--glass-border)' }}>
                    {sec.icon} {sec.label}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.625rem', padding: '0.875rem 1rem' }}>
                    {sec.fields.map(f => {
                        const val = child[f.key] || '';
                        const isEmpty = !val;
                        return (
                            <div key={f.key}>
                                <div style={{ fontSize: '0.65rem', fontWeight: '950', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>{f.label}</div>
                                {canEdit ? (
                                    f.type === 'select' ? (
                                        <select value={val} onChange={e => updateParticipantHealth(child.id, f.key, e.target.value)}
                                            style={{ width: '100%', fontSize: '0.85rem', fontWeight: '800', padding: '8px 10px', borderRadius: '10px', border: '1.5px solid var(--glass-border)', background: 'var(--bg-main)', cursor: 'pointer', minHeight: '42px', color: val === 'OUI' ? 'oklch(55% 0.18 145)' : val === 'NON' ? 'var(--text-muted)' : 'var(--text-main)' }}>
                                            <option value="">—</option>
                                            {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                                        </select>
                                    ) : (
                                        <input type="text" value={val} onChange={e => updateParticipantHealth(child.id, f.key, e.target.value)}
                                            placeholder={f.placeholder || '—'}
                                            style={{ width: '100%', fontSize: '0.85rem', fontWeight: '800', padding: '8px 10px', borderRadius: '10px', border: '1.5px solid var(--glass-border)', background: 'var(--bg-main)', outline: 'none', minHeight: '42px' }} />
                                    )
                                ) : (
                                    <div style={{ fontSize: '0.88rem', fontWeight: isEmpty ? '600' : '800', color: isEmpty ? 'var(--text-softer)' : (val === 'OUI' ? 'oklch(55% 0.18 145)' : 'var(--text-main)'), fontStyle: isEmpty ? 'italic' : 'normal', padding: '7px 0' }}>
                                        {isEmpty ? 'Non renseigné' : val}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        ))}
        {canEdit && <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '0.25rem' }}><Edit2 size={12} /> Édition directe — sauvegarde automatique</div>}
    </div>
);

// ── Suivi sub-tab: log form + timeline ──
const SuiviPanel = ({ child, addHealthLog, updateParticipantHealth, canEdit, isMobile }) => {
    const [logType, setLogType] = useState('soin');
    const [logContent, setLogContent] = useState('');
    const [logValue, setLogValue] = useState('');
    const [logCategory, setLogCategory] = useState('');
    const medsList = useMemo(() => getMedicationsList(child), [child]);

    const submit = () => {
        if (!logContent && !logValue) return;
        if (logType === 'medecin') updateParticipantHealth(child.id, 'doctorSeenDate', new Date().toISOString());
        addHealthLog(child.id, { type: logType, content: logContent, value: logValue, category: logCategory });
        setLogContent(''); setLogValue(''); setLogCategory('');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
                <div style={{ padding: '0.75rem 1rem', background: 'white', borderRadius: '14px', border: '1.5px solid var(--glass-border)' }}>
                    <div style={{ fontSize: '0.62rem', fontWeight: '950', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Traitement de fond</div>
                    {medsList.length === 0 ? <span style={{ opacity: 0.5, fontSize: '0.8rem', fontWeight: '700' }}>Aucun</span> : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            {medsList.map((m, i) => <span key={i} style={{ fontSize: '0.82rem', fontWeight: '850' }}>{m.name} <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{m.slots.join(', ')}</span></span>)}
                        </div>
                    )}
                </div>
                <div style={{ padding: '0.75rem 1rem', background: 'white', borderRadius: '14px', border: '1.5px solid var(--glass-border)' }}>
                    <div style={{ fontSize: '0.62rem', fontWeight: '950', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Dernière pesée</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '950' }}>{child.weight || '--'} <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>kg</span></div>
                </div>
                {child.doctorSeenDate && (
                    <div style={{ padding: '0.75rem 1rem', background: 'oklch(98% 0.02 180)', borderRadius: '14px', border: '1.5px solid oklch(62% 0.18 180 / 0.15)' }}>
                        <div style={{ fontSize: '0.62rem', fontWeight: '950', color: 'oklch(55% 0.18 180)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Suivi médical</div>
                        <div style={{ fontSize: '1rem', fontWeight: '950', color: 'oklch(55% 0.18 180)' }}>{new Date(child.doctorSeenDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</div>
                    </div>
                )}
            </div>

            {/* Log form */}
            {canEdit && (
                <div style={{ background: 'white', borderRadius: '18px', border: '1.5px solid var(--glass-border)', padding: '1.25rem' }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: '950', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Plus size={18} strokeWidth={3} style={{ color: 'var(--primary-color)' }} /> Nouveau suivi
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '0.5rem', marginBottom: '1rem' }}>
                        {Object.entries(LOG_TYPES).map(([id, cfg]) => (
                            <button key={id} onClick={() => setLogType(id)} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.55rem', borderRadius: '12px', border: '1.5px solid', cursor: 'pointer', minHeight: '44px',
                                borderColor: logType === id ? cfg.color : 'var(--glass-border)',
                                background: logType === id ? cfg.color : 'white',
                                color: logType === id ? 'white' : 'var(--text-muted)',
                                fontWeight: '900', fontSize: '0.75rem'
                            }}>{cfg.icon} {cfg.label}</button>
                        ))}
                    </div>

                    {logType === 'medoc' && (
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                            {['Matin', 'Midi', 'Goûter', 'Soir'].map(t => (
                                <button key={t} onClick={() => setLogCategory(t)} style={{ flex: 1, padding: '0.5rem', borderRadius: '10px', fontSize: '0.72rem', fontWeight: '900', border: '1.5px solid', minHeight: '40px', borderColor: logCategory === t ? 'var(--primary-color)' : 'var(--glass-border)', background: logCategory === t ? 'var(--primary-light)' : 'white', color: logCategory === t ? 'var(--primary-color)' : 'var(--text-muted)' }}>{t}</button>
                            ))}
                        </div>
                    )}
                    {logType === 'physio' ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <select className="glass-input" value={logCategory} onChange={e => setLogCategory(e.target.value)} style={{ height: '44px', fontWeight: '800' }}>
                                <option value="">Mesure…</option>
                                <option value="poids">Poids (kg)</option>
                                <option value="selles">Selles</option>
                                <option value="couches">Couches</option>
                                <option value="temperature">Température (°C)</option>
                            </select>
                            <input className="glass-input" placeholder="Valeur" value={logValue} onChange={e => setLogValue(e.target.value)} style={{ height: '44px', fontWeight: '800' }} />
                        </div>
                    ) : logType === 'frais' ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <input className="glass-input" placeholder="Montant (€)" type="number" value={logValue} onChange={e => setLogValue(e.target.value)} style={{ height: '44px', fontWeight: '800' }} />
                            <select className="glass-input" value={logCategory} onChange={e => setLogCategory(e.target.value)} style={{ height: '44px', fontWeight: '800' }}>
                                <option value="pharmacie">Pharmacie</option>
                                <option value="medecin">Médecin</option>
                                <option value="autre">Autre</option>
                            </select>
                        </div>
                    ) : (
                        <textarea className="glass-input" placeholder={logType === 'soin' ? 'Description du soin…' : 'Notes…'} value={logContent} onChange={e => setLogContent(e.target.value)} style={{ height: '80px', padding: '0.75rem', resize: 'none', borderRadius: '14px' }} />
                    )}
                    <button className="btn btn-primary" onClick={submit} style={{ width: '100%', height: '48px', borderRadius: '14px', fontWeight: '950', marginTop: '0.75rem' }}>Enregistrer</button>
                </div>
            )}

            {/* Timeline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                <h3 className="u-section-title" style={{ paddingLeft: '0.25rem', margin: 0 }}>Historique</h3>
                {(!child.healthLogs || child.healthLogs.length === 0) ? (
                    <EmptyState icon={<Clipboard size={28} strokeWidth={1.5} />} title="Aucun historique." />
                ) : child.healthLogs.map(log => {
                    const cfg = LOG_TYPES[log.type] || LOG_TYPES.soin;
                    return (
                        <div key={log.id} style={{ background: 'white', borderRadius: '14px', border: '1.5px solid var(--glass-border)', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: cfg.color.replace(')', ' / 0.1)'), color: cfg.color }}>{cfg.icon}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '0.68rem', fontWeight: '950', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                        {log.type === 'medoc' ? `Médoc · ${log.category || ''}` : log.type === 'physio' ? `Physio · ${log.category || ''}` : log.type === 'frais' ? `Frais · ${log.category || ''}` : cfg.label}
                                    </span>
                                    <span style={{ fontSize: '0.68rem', fontWeight: '600', color: 'var(--text-muted)', flexShrink: 0 }}>{new Date(log.timestamp).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div style={{ fontWeight: '800', fontSize: '0.88rem', color: 'var(--text-main)', marginTop: '2px' }}>{log.content || (log.value ? `${log.value} ${log.category === 'poids' ? 'kg' : ''}` : 'Confirmé')}</div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ── Detail view with Infos / Suivi sub-tabs ──
const ChildHealthDetail = ({ child, groups, onBack, updateParticipantHealth, addHealthLog, canEdit, isMobile }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button onClick={onBack} style={{ width: '40px', height: '40px', borderRadius: '12px', border: '1.5px solid var(--glass-border)', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-main)', flexShrink: 0 }}>
                    <ArrowLeft size={18} strokeWidth={2.5} />
                </button>
                <Avatar participant={child} size={44} />
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '950', fontSize: '1.05rem', color: 'var(--text-main)', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {child.firstName} {(child.lastName || "").toUpperCase()}
                    </div>
                    <div style={{ marginTop: '2px' }}><GroupBadge groupId={child.group} groups={groups} /></div>
                </div>
            </div>

            <InfosPanel child={child} updateParticipantHealth={updateParticipantHealth} canEdit={canEdit} />
        </div>
    );
};

export default ChildHealthDetail;
