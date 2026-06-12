import React, { useState, useMemo, useEffect } from 'react';
import {
    Activity, Zap, FileText, ClipboardList
} from 'lucide-react';
import { useUi } from '../ui/UiProvider';
import { useScrollCollapse } from '../utils/useScrollCollapse';
import SectionHeader from './common/SectionHeader';

// ─── Sub-component imports ────────────────────────────────────────────────
import TransmissionComposer from './health/TransmissionComposer';
import MedsDashboard    from './health/MedsDashboard';
import InfoVacSection   from './health/InfoVacSection';
import RegistreInfi     from './health/RegistreInfi';

const HEALTH_TABS = [
    { id: 'infovac',    label: 'Fiches Sanitaires', short: 'Fiches',       permKey: 'viewHealthInfovac',  icon: <FileText size={20} />,        color: 'oklch(52% 0.2 272)',  bg: 'oklch(96% 0.05 272)' },
    { id: 'meds',       label: 'Médicaments',       short: 'Médicaments',  permKey: 'viewHealthMeds',     icon: <Zap size={20} />,             color: 'oklch(55% 0.22 30)',  bg: 'oklch(96% 0.06 30)' },
    { id: 'registre',   label: 'Registre',          short: 'Registre',     permKey: 'viewHealthRegistre', icon: <ClipboardList size={20} />,   color: 'oklch(52% 0.22 310)', bg: 'oklch(96% 0.05 310)' },
];

export default function HealthCenter({ participants = [], setParticipants, groups = [], canEdit = true, isMobile, transmissions = [], setTransmissions, activeUser, permissions = {} }) {
    const ui = useUi();

    // Onglets visibles selon le rôle : un onglet n'est masqué que si sa permission
    // est explicitement à false (absente ou true → visible, rétrocompatible).
    // Visibilité par sous-section (clé absente ou true → visible ; false → masqué).
    // L'onglet Registre regroupe 3 sous-blocs : il reste visible si au moins un l'est.
    const can = (key) => permissions?.[key] !== false;
    const tabVisible = {
        infovac: can('viewHealthInfovac'),
        meds: can('viewHealthMeds'),
        registre: can('viewHealthTransmissions') || can('viewHealthRegistreMeds') || can('viewHealthPassages'),
    };
    const visibleTabs = HEALTH_TABS.filter(t => tabVisible[t.id]);
    const visibleIds = visibleTabs.map(t => t.id).join(',');

    const [activeTab, setActiveTab] = useState(() => {
        const firstVisible = HEALTH_TABS.find(t => (
            t.id === 'infovac' ? permissions?.['viewHealthInfovac'] !== false
            : t.id === 'meds' ? permissions?.['viewHealthMeds'] !== false
            : permissions?.['viewHealthTransmissions'] !== false || permissions?.['viewHealthRegistreMeds'] !== false || permissions?.['viewHealthPassages'] !== false
        ));
        return firstVisible ? firstVisible.id : 'infovac';
    });

    // Si l'onglet courant devient masqué (changement de droits), bascule sur le premier visible.
    useEffect(() => {
        if (visibleTabs.length && !visibleTabs.some(t => t.id === activeTab)) {
            setActiveTab(visibleTabs[0].id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visibleIds, activeTab]);

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
                    <SectionHeader hue="var(--sec-sante)" icon={Activity} title="Pôle Santé" subtitle="Assistant Sanitaire & Suivi Médical" />
                    {/* Desktop tabs */}
                    <div style={{ display: 'flex', gap: '0.35rem', background: 'rgba(0,0,0,0.05)', padding: '4px', borderRadius: '14px' }}>
                        {visibleTabs.map(tab => (
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
                    {visibleTabs.map(tab => {
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
                {visibleTabs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)', fontWeight: 800 }}>
                        Aucune sous-section du Pôle Santé n'est accessible avec votre rôle.
                    </div>
                ) : activeTab === 'meds' ? (
                    <MedsDashboard
                        children={children} updateParticipantHealth={updateParticipantHealth}
                        canEdit={canEdit && can('editHealthMeds')} isMobile={isMobile} groups={groups}
                        isScrolled={isScrolled} scrollToTop={scrollToTop}
                    />
                ) : activeTab === 'registre' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {can('viewHealthTransmissions') && (
                            <TransmissionComposer
                                children={children} transmissions={transmissions} setTransmissions={setTransmissions}
                                activeUser={activeUser} canEdit={canEdit && can('editHealthTransmissions')} isMobile={isMobile}
                            />
                        )}
                        {(can('viewHealthRegistreMeds') || can('viewHealthPassages')) && (
                            <RegistreInfi
                                children={children} groups={groups}
                                updateParticipantHealth={updateParticipantHealth} isMobile={isMobile}
                                showMeds={can('viewHealthRegistreMeds')} canEditMeds={canEdit && can('editHealthRegistreMeds')}
                                showPassages={can('viewHealthPassages')} canEditPassages={canEdit && can('editHealthPassages')}
                            />
                        )}
                    </div>
                ) : (
                    <InfoVacSection
                        children={children} groups={groups}
                        updateParticipantHealth={updateParticipantHealth} addHealthLog={addHealthLog}
                        canEdit={canEdit && can('editHealthInfovac')} isMobile={isMobile}
                    />
                )}
            </main>
        </div>
    );
}
