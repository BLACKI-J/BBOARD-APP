import React, { useMemo } from 'react';
import {
    ShieldAlert, Pill, Activity, FileWarning, Stethoscope,
    Utensils, ChevronRight, Clock
} from 'lucide-react';
import Avatar from '../common/Avatar';
import { getMedicationsList } from '../../utils/meds';

const todayStr = () => new Date().toISOString().split('T')[0];

// ── KPI card ────────────────────────────────────────────────────────────────
const KpiCard = ({ icon, value, suffix, label, hint, color, accentBg, onClick, isMobile }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={!onClick}
        style={{
            textAlign: 'left', cursor: onClick ? 'pointer' : 'default',
            background: 'white', border: '1.5px solid var(--glass-border)',
            borderRadius: '22px', padding: isMobile ? '1rem' : '1.25rem 1.4rem',
            display: 'flex', flexDirection: 'column', gap: '0.75rem',
            boxShadow: 'var(--shadow-sm)', transition: 'transform 0.2s var(--ease-out-expo), box-shadow 0.2s',
            position: 'relative', overflow: 'hidden'
        }}
        className={onClick ? 'kpi-card kpi-clickable' : 'kpi-card'}
    >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ background: accentBg, color, borderRadius: '12px', padding: '0.5rem', display: 'flex' }}>
                {icon}
            </div>
            {onClick && <ChevronRight size={16} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />}
        </div>
        <div>
            <div style={{ fontFamily: 'Bricolage Grotesque, serif', fontWeight: '900', fontSize: isMobile ? '1.9rem' : '2.3rem', lineHeight: 1, color: 'var(--text-main)', letterSpacing: '-0.03em' }}>
                {value}<span style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-muted)', marginLeft: '2px' }}>{suffix}</span>
            </div>
            <div style={{ fontSize: '0.78rem', fontWeight: '900', color: 'var(--text-main)', marginTop: '6px', letterSpacing: '-0.01em' }}>{label}</div>
            {hint && <div style={{ fontSize: '0.7rem', fontWeight: '700', color, marginTop: '2px' }}>{hint}</div>}
        </div>
        <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: accentBg, opacity: 0.35, pointerEvents: 'none' }} />
    </button>
);

const HealthDashboard = ({ children = [], groups = [], onNavigate, isMobile }) => {
    const stats = useMemo(() => {
        const today = todayStr();
        const now = new Date();

        const birthdays = children.filter(c => {
            if (!c.birthDate) return false;
            const d = new Date(c.birthDate);
            return d.getDate() === now.getDate() && d.getMonth() === now.getMonth();
        });
        const missingDocs = children.filter(c => !c.healthDocProvided);
        const allergyKids = children.filter(c =>
            (c.allergies && c.allergies.trim()) || (c.constraints && c.constraints.trim()) || (c.diet && c.diet.trim())
        );

        // Meds given today across all scheduled (med × slot) pairs
        let total = 0, done = 0;
        children.forEach(c => {
            getMedicationsList(c).forEach(m => {
                (m.slots || []).forEach(slot => {
                    total++;
                    const v = c.medsValidated?.[today]?.[slot];
                    if (v === true || (v && typeof v === 'object' && v[m.name])) done++;
                });
            });
        });
        const medsPct = total > 0 ? Math.round((done / total) * 100) : null;

        const swimOk = children.filter(c => c.swimTest).length;
        const swimPct = children.length > 0 ? Math.round((swimOk / children.length) * 100) : 0;

        // Passages infi
        const allPassages = [];
        children.forEach(c => (c.passageLogs || []).forEach(l =>
            allPassages.push({ ...l, name: `${c.firstName} ${c.lastName.toUpperCase()}`, child: c })
        ));
        allPassages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const passagesToday = allPassages.filter(l => (l.timestamp || '').split('T')[0] === today);

        return {
            alertCount: birthdays.length + missingDocs.length,
            birthdays: birthdays.length,
            missingDocs: missingDocs.length,
            allergyCount: allergyKids.length,
            medsPct, medsDone: done, medsTotal: total,
            swimPct, swimOk, swimTotal: children.length,
            passagesToday: passagesToday.length,
            recentPassages: allPassages.slice(0, 4),
        };
    }, [children]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* KPI grid */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(180px, 1fr))', gap: isMobile ? '0.75rem' : '1rem' }}>
                <KpiCard isMobile={isMobile}
                    icon={<ShieldAlert size={18} strokeWidth={2.5} />}
                    value={stats.alertCount}
                    label="Alertes du jour"
                    hint={stats.alertCount > 0 ? `${stats.missingDocs} fiche(s) · ${stats.birthdays} annif` : 'Tout est en ordre'}
                    color="var(--danger-color)" accentBg="oklch(95% 0.05 28)" />

                <KpiCard isMobile={isMobile}
                    icon={<Utensils size={18} strokeWidth={2.5} />}
                    value={stats.allergyCount}
                    label="Allergies / régimes"
                    hint="enfants concernés"
                    color="var(--primary-color)" accentBg="var(--primary-light)" />

                <KpiCard isMobile={isMobile}
                    icon={<Pill size={18} strokeWidth={2.5} />}
                    value={stats.medsPct === null ? '—' : stats.medsPct} suffix={stats.medsPct === null ? '' : '%'}
                    label="Traitements du jour"
                    hint={stats.medsPct === null ? 'aucun traitement' : `${stats.medsDone}/${stats.medsTotal} doses`}
                    color="oklch(55% 0.18 232)" accentBg="oklch(96% 0.05 232)"
                    onClick={onNavigate ? () => onNavigate('meds') : undefined} />

                <KpiCard isMobile={isMobile}
                    icon={<Activity size={18} strokeWidth={2.5} />}
                    value={stats.swimPct} suffix="%"
                    label="Test natation"
                    hint={`${stats.swimOk}/${stats.swimTotal} validés`}
                    color="var(--success-color)" accentBg="oklch(96% 0.05 150)" />

                <KpiCard isMobile={isMobile}
                    icon={<FileWarning size={18} strokeWidth={2.5} />}
                    value={stats.missingDocs}
                    label="Fiches sanitaires"
                    hint={stats.missingDocs > 0 ? 'manquantes' : 'toutes reçues'}
                    color="oklch(58% 0.15 75)" accentBg="oklch(96% 0.07 80)" />

                <KpiCard isMobile={isMobile}
                    icon={<Stethoscope size={18} strokeWidth={2.5} />}
                    value={stats.passagesToday}
                    label="Passages infi"
                    hint="aujourd'hui"
                    color="oklch(52% 0.2 310)" accentBg="oklch(96% 0.05 310)"
                    onClick={onNavigate ? () => onNavigate('registre') : undefined} />
            </div>

            {/* Recent passages */}
            {stats.recentPassages.length > 0 && (
                <div style={{ background: 'white', border: '1.5px solid var(--glass-border)', borderRadius: '22px', padding: isMobile ? '1rem' : '1.25rem 1.5rem', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
                        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '900', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Stethoscope size={16} style={{ color: 'oklch(52% 0.2 310)' }} /> Derniers passages infirmerie
                        </h3>
                        {onNavigate && (
                            <button onClick={() => onNavigate('registre')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: '900', fontSize: '0.78rem' }}>
                                Registre <ChevronRight size={14} />
                            </button>
                        )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {stats.recentPassages.map(log => (
                            <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.625rem 0.75rem', borderRadius: '14px', background: 'var(--bg-main)', border: '1px solid var(--glass-border)' }}>
                                <Avatar participant={log.child} size={32} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: '900', fontSize: '0.85rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.name}</div>
                                    <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {log.nature || 'Passage'}{log.soins ? ` — ${log.soins}` : ''}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-muted)', flexShrink: 0 }}>
                                    <Clock size={11} />
                                    {new Date(log.timestamp).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} {new Date(log.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <style>{`
                .kpi-clickable:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
                .kpi-clickable:active { transform: translateY(-1px) scale(0.99); }
            `}</style>
        </div>
    );
};

export default HealthDashboard;
