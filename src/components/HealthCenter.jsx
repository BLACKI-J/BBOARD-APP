import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
    Activity, Zap, FileText, ClipboardList, Moon
} from 'lucide-react';
import { useScrollCollapse } from '../utils/useScrollCollapse';
import useAppStore from '../store/useAppStore';
import SectionHeader from './common/SectionHeader';

// ─── Sub-component imports ────────────────────────────────────────────────
import MedsDashboard    from './health/MedsDashboard';
import InfoVacSection   from './health/InfoVacSection';
import RegistreInfi     from './health/RegistreInfi';
import NightLog         from './health/NightLog';

const HEALTH_TABS = [
    { id: 'infovac',    label: 'Fiches Sanitaires', short: 'Fiches',       icon: <FileText size={20} />,        color: 'var(--primary-color)' },
    { id: 'meds',       label: 'Médicaments',       short: 'Médicaments',  icon: <Zap size={20} />,             color: 'var(--primary-color)' },
    { id: 'registre',   label: 'Registre',          short: 'Registre',     icon: <ClipboardList size={20} />,   color: 'var(--primary-color)' },
    { id: 'nuit',       label: 'Nuit',              short: 'Nuit',         icon: <Moon size={20} />,            color: 'var(--primary-color)' },
];

export default function HealthCenter({ participants = [], patchParticipant, groups = [], canEdit = true, isMobile, nightLogs = [], setNightLogs, activeUser, permissions = {} }) {
    // Setter brut du store (maj locale instantanée, SANS appel réseau) — distinct
    // de patchParticipant qui, lui, persiste un seul enfant côté serveur.
    const setParticipantsLocal = useAppStore(s => s.setParticipants);

    // Onglets visibles selon le rôle : un onglet n'est masqué que si sa permission
    // est explicitement à false (absente ou true → visible, rétrocompatible).
    // Visibilité par sous-section (clé absente ou true → visible ; false → masqué).
    // L'onglet Registre regroupe 3 sous-blocs : il reste visible si au moins un l'est.
    const can = (key) => permissions?.[key] !== false;
    const tabVisible = {
        infovac: can('viewHealthInfovac'),
        meds: can('viewHealthMeds'),
        registre: can('viewHealthRegistreMeds') || can('viewHealthPassages'),
        nuit: can('viewHealthNuit'),
    };
    const visibleTabs = HEALTH_TABS.filter(t => tabVisible[t.id]);
    const visibleIds = visibleTabs.map(t => t.id).join(',');

    const [activeTab, setActiveTab] = useState(() => {
        const firstVisible = HEALTH_TABS.find(t => tabVisible[t.id]);
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

    // Édition santé : maj optimiste locale IMMÉDIATE (champ réactif sous le doigt)
    // + PATCH réseau DEBOUNCÉ par enfant (1 requête après l'arrêt de frappe, ne
    // poste que le(s) champ(s) modifié(s) — fini le POST de toute la collection).
    const pendingPatch = useRef({}); // { [childId]: { field: value, ... } }
    const patchTimers = useRef({});  // { [childId]: timeoutId }

    const flushPatch = (childId) => {
        clearTimeout(patchTimers.current[childId]);
        const fields = pendingPatch.current[childId];
        if (!fields) return;
        delete pendingPatch.current[childId];
        patchParticipant?.(childId, fields);
    };

    const updateParticipantHealth = (childId, field, value) => {
        if (!canEdit) return;
        // 1. réactivité immédiate (aucun réseau)
        setParticipantsLocal(useAppStore.getState().participants.map(p => p.id === childId ? { ...p, [field]: value } : p));
        // 2. accumulation + persistance différée
        pendingPatch.current[childId] = { ...(pendingPatch.current[childId] || {}), [field]: value };
        clearTimeout(patchTimers.current[childId]);
        patchTimers.current[childId] = setTimeout(() => flushPatch(childId), 600);
    };

    // Au démontage (changement d'onglet/section), persiste les éditions encore
    // en attente pour ne rien perdre.
    useEffect(() => {
        const timers = patchTimers.current;
        const pending = pendingPatch.current;
        return () => {
            Object.keys(pending).forEach(childId => {
                clearTimeout(timers[childId]);
                if (pending[childId]) patchParticipant?.(childId, pending[childId]);
            });
        };
    }, [patchParticipant]);

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
                    <SectionHeader icon={Activity} title="Pôle Santé" subtitle="Assistant Sanitaire & Suivi Médical" />
                    {/* Desktop tabs */}
                    <div style={{ display: 'flex', gap: '0.35rem', background: 'rgba(0,0,0,0.05)', padding: '4px', borderRadius: '14px' }}>
                        {visibleTabs.map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                                padding: '0.55rem 1.1rem', borderRadius: '10px', border: 'none', cursor: 'pointer',
                                fontSize: '0.78rem', transition: 'all 0.2s',
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                background: activeTab === tab.id ? 'var(--surface-color)' : 'transparent',
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
                                background: isActive ? tab.color : 'var(--surface-color)',
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
                ) : activeTab === 'nuit' ? (
                    <NightLog
                        nightLogs={nightLogs} setNightLogs={setNightLogs}
                        children={children} activeUser={activeUser}
                        canEdit={canEdit && can('editHealthNuit')} isMobile={isMobile}
                    />
                ) : activeTab === 'registre' ? (
                    <RegistreInfi
                        children={children} groups={groups}
                        staff={(participants || []).filter(p => p.role !== 'child')}
                        updateParticipantHealth={updateParticipantHealth} isMobile={isMobile}
                        showMeds={can('viewHealthRegistreMeds')} canEditMeds={canEdit && can('editHealthRegistreMeds')}
                        showPassages={can('viewHealthPassages')} canEditPassages={canEdit && can('editHealthPassages')}
                    />
                ) : (
                    <InfoVacSection
                        children={children} groups={groups}
                        updateParticipantHealth={updateParticipantHealth}
                        canEdit={canEdit && can('editHealthInfovac')} isMobile={isMobile}
                    />
                )}
            </main>
        </div>
    );
}
