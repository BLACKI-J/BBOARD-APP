import React, { useMemo } from 'react';
import { Stethoscope, ChevronRight, Clock } from 'lucide-react';
import Avatar from '../common/Avatar';


const HealthDashboard = ({ children = [], groups = [], onNavigate, isMobile }) => {
    const recentPassages = useMemo(() => {
        const all = [];
        children.forEach(c => (c.passageLogs || []).forEach(l =>
            all.push({ ...l, name: `${c.firstName} ${(c.lastName || "").toUpperCase()}`, child: c })
        ));
        return all.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 4);
    }, [children]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Recent passages */}
            {recentPassages.length > 0 && (
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
                        {recentPassages.map(log => (
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
