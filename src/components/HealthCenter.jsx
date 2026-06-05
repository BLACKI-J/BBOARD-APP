import React, { useState, useMemo } from 'react';
import {
    Activity, Zap, FileText, User, ClipboardList, LayoutDashboard
} from 'lucide-react';
import { useUi } from '../ui/UiProvider';

// ─── Sub-component imports (extracted for maintainability) ────────────────
import HealthDashboard  from './health/HealthDashboard';
import OverviewTable    from './health/OverviewTable';
import IndividualCarnet from './health/IndividualCarnet';
import MedsDashboard    from './health/MedsDashboard';
import InfoVacSection   from './health/InfoVacSection';
import RegistreInfi     from './health/RegistreInfi';

const HEALTH_TABS = [
    { id: 'overview',   label: 'Tableau Bord',      icon: <LayoutDashboard size={20} />, color: 'oklch(55% 0.2 232)',  bg: 'oklch(96% 0.06 232)' },
    { id: 'meds',       label: 'Médicaments',       icon: <Zap size={20} />,             color: 'oklch(55% 0.22 30)',  bg: 'oklch(96% 0.06 30)' },
    { id: 'infovac',    label: 'Fiches Infos',      icon: <FileText size={20} />,        color: 'oklch(52% 0.2 272)',  bg: 'oklch(96% 0.05 272)' },
    { id: 'individual', label: 'Carnet Individuel', icon: <User size={20} />,             color: 'oklch(52% 0.2 145)',  bg: 'oklch(96% 0.06 145)' },
    { id: 'registre',   label: 'Registre Infi',     icon: <ClipboardList size={20} />,   color: 'oklch(52% 0.22 310)', bg: 'oklch(96% 0.05 310)' },
];

export default function HealthCenter({ participants = [], setParticipants, groups = [], canEdit = true, isMobile }) {
    const ui = useUi();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedChildId, setSelectedChildId] = useState(null);
    const [filterAlertsOnly, setFilterAlertsOnly] = useState(false);

    const children = useMemo(
        () => (participants || []).filter(p => p.role === 'child'),
        [participants]
    );

    const selectedChild = useMemo(
        () => children.find(c => c.id === selectedChildId),
        [children, selectedChildId]
    );

    const filteredChildren = useMemo(() => {
        return children.filter(c => {
            const matchesSearch = `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
            const hasAlerts = (c.allergies && c.allergies.trim() !== '') || (c.constraints && c.constraints.trim() !== '');
            return matchesSearch && (!filterAlertsOnly || hasAlerts);
        });
    }, [children, searchTerm, filterAlertsOnly]);

    const updateParticipantHealth = (childId, field, value) => {
        if (!canEdit) return;
        setParticipants(participants.map(p => p.id === childId ? { ...p, [field]: value } : p));
    };

    const addHealthLog = (childId, logEntry) => {
        if (!canEdit) return;
        const child = participants.find(p => p.id === childId);
        const logs = Array.isArray(child.healthLogs) ? child.healthLogs : [];
        const newLogs = [{ ...logEntry, id: Date.now(), timestamp: new Date().toISOString() }, ...logs];
        updateParticipantHealth(childId, 'healthLogs', newLogs);
        ui.toast('Suivi mis à jour.', { type: 'success' });
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'transparent', overflow: 'hidden' }}>
            {/* ── Header / Nav ── */}
            <header style={{
                padding: isMobile ? '1rem' : '1.5rem 2.5rem',
                borderBottom: '1.5px solid var(--glass-border)',
                background: 'rgba(255, 255, 255, 0.6)',
                backdropFilter: 'blur(20px)',
                display: 'flex', flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center',
                gap: '1rem', zIndex: 10
            }}>
                <div className="u-flex u-items-center u-gap-md">
                    <div style={{ background: 'oklch(62% 0.18 20 / 0.1)', borderRadius: '12px', padding: '0.625rem', color: 'oklch(62% 0.18 20)' }}>
                        <Activity size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: isMobile ? '1.15rem' : '1.3rem', fontWeight: '950', color: 'var(--text-main)', margin: 0, letterSpacing: '-0.03em' }}>Pôle Santé</h1>
                        <p className="u-text-muted u-font-bold" style={{ margin: 0, fontSize: '0.75rem' }}>Assistant Sanitaire & Suivi Médical</p>
                    </div>
                </div>

                {/* ── Nav Tabs ── */}
                {isMobile ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        {HEALTH_TABS.map(tab => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                                    display: 'flex', alignItems: 'center', gap: '0.625rem',
                                    padding: '0.75rem 1rem', borderRadius: '14px', border: '2px solid', cursor: 'pointer',
                                    transition: 'all 0.25s cubic-bezier(0.34,1.2,0.64,1)',
                                    borderColor: isActive ? tab.color : 'var(--glass-border)',
                                    background: isActive ? tab.color : 'white',
                                    boxShadow: isActive ? `0 4px 16px ${tab.color}35` : 'none',
                                    transform: isActive ? 'scale(1.02)' : 'scale(1)',
                                }}>
                                    <div style={{
                                        width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: isActive ? 'rgba(255,255,255,0.2)' : tab.bg,
                                        color: isActive ? 'white' : tab.color, transition: 'all 0.25s'
                                    }}>
                                        {tab.icon}
                                    </div>
                                    <span style={{ fontSize: '0.72rem', fontWeight: '950', lineHeight: 1.2, textAlign: 'left', color: isActive ? 'white' : 'var(--text-main)', letterSpacing: '-0.01em' }}>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div style={{ display: 'flex', gap: '0.35rem', background: 'rgba(0,0,0,0.05)', padding: '4px', borderRadius: '14px' }}>
                        {HEALTH_TABS.map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                                padding: '0.55rem 1.1rem', borderRadius: '10px', border: 'none', cursor: 'pointer',
                                fontSize: '0.78rem', transition: 'all 0.2s',
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                background: activeTab === tab.id ? 'white' : 'transparent',
                                boxShadow: activeTab === tab.id ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                                color: activeTab === tab.id ? 'var(--primary-color)' : 'var(--text-muted)',
                                fontWeight: activeTab === tab.id ? '950' : '800'
                            }}>
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>
                )}
            </header>

            {/* ── Tab Content ── */}
            <main style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '1rem' : '2rem 2.5rem' }} className="no-scrollbar">
                {activeTab === 'overview' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <HealthDashboard
                            children={children} groups={groups}
                            onNavigate={setActiveTab} isMobile={isMobile}
                        />
                        <OverviewTable
                            children={filteredChildren} groups={groups}
                            searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                            filterAlertsOnly={filterAlertsOnly} setFilterAlertsOnly={setFilterAlertsOnly}
                            updateParticipantHealth={updateParticipantHealth} canEdit={canEdit} isMobile={isMobile}
                        />
                    </div>
                ) : activeTab === 'meds' ? (
                    <MedsDashboard
                        children={children} updateParticipantHealth={updateParticipantHealth}
                        canEdit={canEdit} isMobile={isMobile} groups={groups}
                    />
                ) : activeTab === 'infovac' ? (
                    <InfoVacSection
                        children={children} groups={groups}
                        updateParticipantHealth={updateParticipantHealth} canEdit={canEdit} isMobile={isMobile}
                    />
                ) : activeTab === 'registre' ? (
                    <RegistreInfi
                        children={children} groups={groups}
                        updateParticipantHealth={updateParticipantHealth} canEdit={canEdit} isMobile={isMobile}
                    />
                ) : (
                    <IndividualCarnet
                        children={filteredChildren} groups={groups}
                        selectedChild={selectedChild} setSelectedChildId={setSelectedChildId}
                        addHealthLog={addHealthLog} updateParticipantHealth={updateParticipantHealth}
                        canEdit={canEdit} isMobile={isMobile}
                    />
                )}
            </main>
        </div>
    );
}
