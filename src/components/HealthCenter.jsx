import React, { useState, useMemo } from 'react';
import {
    Activity, Zap, FileText, ClipboardList
} from 'lucide-react';
import { useUi } from '../ui/UiProvider';
import { useScrollCollapse } from '../utils/useScrollCollapse';

// ─── Sub-component imports ────────────────────────────────────────────────
import TransmissionComposer from './health/TransmissionComposer';
import MedsDashboard    from './health/MedsDashboard';
import InfoVacSection   from './health/InfoVacSection';
import RegistreInfi     from './health/RegistreInfi';

const HEALTH_TABS = [
    { id: 'infovac',    label: 'Fiches & Suivi',    short: 'Fiches',       icon: <FileText size={20} />,        color: 'oklch(52% 0.2 272)',  bg: 'oklch(96% 0.05 272)' },
    { id: 'meds',       label: 'Médicaments',       short: 'Médicaments',  icon: <Zap size={20} />,             color: 'oklch(55% 0.22 30)',  bg: 'oklch(96% 0.06 30)' },
    { id: 'registre',   label: 'Registre',          short: 'Registre',     icon: <ClipboardList size={20} />,   color: 'oklch(52% 0.22 310)', bg: 'oklch(96% 0.05 310)' },
];

export default function HealthCenter({ participants = [], setParticipants, groups = [], canEdit = true, isMobile, transmissions = [], setTransmissions, activeUser }) {
    const ui = useUi();
    const [activeTab, setActiveTab] = useState('infovac');

    const children = useMemo(
        () => (participants || []).filter(p => p.role === 'child'),
        [participants]
    );

    const { scrollRef, isScrolled, onScroll, scrollToTop } = useScrollCollapse(80);

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
            {/* ── Header ── */}
            {!isMobile && (
                <header style={{
                    padding: '1.5rem 2.5rem',
                    borderBottom: '1.5px solid var(--glass-border)',
                    background: 'rgba(255, 255, 255, 0.6)',
                    backdropFilter: 'blur(20px)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    gap: '1rem', zIndex: 10
                }}>
                    <div className="u-flex u-items-center u-gap-md">
                        <div style={{ background: 'oklch(62% 0.18 20 / 0.1)', borderRadius: '12px', padding: '0.625rem', color: 'oklch(62% 0.18 20)' }}>
                            <Activity size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: '1.3rem', fontWeight: '950', color: 'var(--text-main)', margin: 0, letterSpacing: '-0.03em' }}>Pôle Santé</h1>
                            <p className="u-text-muted u-font-bold" style={{ margin: 0, fontSize: '0.75rem' }}>Assistant Sanitaire & Suivi Médical</p>
                        </div>
                    </div>
                    {/* Desktop tabs */}
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
                </header>
            )}

            {/* ── Mobile: segmented tab bar (3 cases égales, sans scroll) ── */}
            {isMobile && (
                <div style={{
                    position: 'sticky', top: 0, zIndex: 10,
                    background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(16px)',
                    borderBottom: '1px solid var(--glass-border)',
                    display: 'flex', gap: '0.375rem', padding: '0.5rem 0.75rem',
                    flexShrink: 0
                }}>
                    {HEALTH_TABS.map(tab => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                                flex: 1, minWidth: 0,
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.2rem',
                                padding: '0.45rem 0.3rem', borderRadius: '14px',
                                border: '1.5px solid', cursor: 'pointer', minHeight: '48px',
                                transition: 'all 0.2s',
                                borderColor: isActive ? tab.color : 'var(--glass-border)',
                                background: isActive ? tab.color : 'white',
                                color: isActive ? 'white' : 'var(--text-muted)',
                                fontWeight: '900', fontSize: '0.7rem', lineHeight: 1.1,
                                boxShadow: isActive ? `0 2px 10px ${tab.color}40` : 'none',
                            }}>
                                <span style={{ display: 'flex', opacity: isActive ? 1 : 0.75 }}>
                                    {React.cloneElement(tab.icon, { size: 18 })}
                                </span>
                                <span style={{ whiteSpace: 'nowrap' }}>{tab.short || tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* ── Tab Content ── */}
            <main ref={scrollRef} onScroll={onScroll} style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '1rem' : '2rem 2.5rem' }} className="no-scrollbar">
                {activeTab === 'meds' ? (
                    <MedsDashboard
                        children={children} updateParticipantHealth={updateParticipantHealth}
                        canEdit={canEdit} isMobile={isMobile} groups={groups}
                        isScrolled={isScrolled} scrollToTop={scrollToTop}
                    />
                ) : activeTab === 'registre' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <TransmissionComposer
                            children={children} transmissions={transmissions} setTransmissions={setTransmissions}
                            activeUser={activeUser} canEdit={canEdit} isMobile={isMobile}
                        />
                        <RegistreInfi
                            children={children} groups={groups}
                            updateParticipantHealth={updateParticipantHealth} canEdit={canEdit} isMobile={isMobile}
                        />
                    </div>
                ) : (
                    <InfoVacSection
                        children={children} groups={groups}
                        updateParticipantHealth={updateParticipantHealth} addHealthLog={addHealthLog}
                        canEdit={canEdit} isMobile={isMobile}
                    />
                )}
            </main>
        </div>
    );
}
