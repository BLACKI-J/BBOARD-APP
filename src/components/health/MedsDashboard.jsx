import React, { useState, useMemo, useCallback } from 'react';
import {
    Sunrise, Sun, Apple, Moon, Printer, AlertCircle, Check, FileDown, History, ChevronDown
} from 'lucide-react';
import Avatar from '../common/Avatar';
import { getMedicationsList, getSiBesoinList, ALL_SLOTS } from '../../utils/meds';
import MedsPdfExport from '../MedsPdfExport';
import MedsCalendar from './MedsCalendar';
import { EmptyState } from '../ui';
import { printHtml } from '../../utils/printHtml';

const pad = (n) => String(n).padStart(2, '0');
const localISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromISO = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

const SLOT_CONFIG = {
    'Matin':  { icon: <Sunrise size={18} />, color: 'var(--primary-color)',  colorLight: 'var(--bg-secondary)',  gradient: 'linear-gradient(135deg, var(--primary-color), var(--primary-hover))' },
    'Midi':   { icon: <Sun size={18} />,     color: 'var(--primary-color)',  colorLight: 'var(--bg-secondary)',  gradient: 'linear-gradient(135deg, var(--primary-color), var(--primary-hover))' },
    'Goûter': { icon: <Apple size={18} />,   color: 'var(--primary-color)',   colorLight: 'var(--bg-secondary)',  gradient: 'linear-gradient(135deg, var(--primary-color), var(--primary-hover))' },
    'Soir':   { icon: <Moon size={18} />,    color: 'var(--primary-color)',  colorLight: 'var(--bg-secondary)', gradient: 'linear-gradient(135deg, var(--primary-color), var(--primary-hover))' },
    'Coucher':{ icon: <Moon size={18} />,    color: 'var(--primary-color)', colorLight: 'var(--bg-secondary)', gradient: 'linear-gradient(135deg, var(--primary-color), var(--primary-hover))' },
};

const MedsDashboard = ({ children, updateParticipantHealth, canEdit, isMobile, groups, isScrolled = false, scrollToTop }) => {
    const [activeSlot, setActiveSlot] = useState(() => {
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 11) return 'Matin';
        if (hour >= 11 && hour < 15) return 'Midi';
        if (hour >= 15 && hour < 19) return 'Goûter';
        if (hour >= 19 && hour < 21) return 'Soir';
        return 'Coucher';
    });

    const today = localISO(new Date());
    const [selectedDate, setSelectedDate] = useState(today);
    const isToday = selectedDate === today;

    // Dates that already have at least one recorded validation (for calendar dots)
    const datesWithRecords = useMemo(() => {
        const set = new Set();
        children.forEach(c => Object.keys(c.medsValidated || {}).forEach(d => set.add(d)));
        return set;
    }, [children]);

    // Memoized derived lists
    const childrenWithMeds = useMemo(() =>
        children.filter(c => getMedicationsList(c).length > 0 || getSiBesoinList(c).length > 0),
        [children]
    );

    const displayChildren = useMemo(() =>
        childrenWithMeds.filter(c => {
            const hasMedInSlot = getMedicationsList(c).some(m => m.slots.includes(activeSlot));
            return hasMedInSlot || getSiBesoinList(c).length > 0;
        }),
        [childrenWithMeds, activeSlot]
    );

    const getValidated = useCallback((child) => child.medsValidated?.[selectedDate] || {}, [selectedDate]);

    const toggleMed = useCallback((child, slot, medName) => {
        if (!canEdit) return;
        const currentDay = getValidated(child);
        const currentSlot = currentDay[slot];
        let newSlot;
        if (currentSlot === true) {
            const meds = getMedicationsList(child).filter(m => m.slots.includes(slot)).map(m => m.name);
            newSlot = {};
            meds.forEach(m => newSlot[m] = true);
            newSlot[medName] = false;
        } else if (typeof currentSlot === 'object' && currentSlot) {
            newSlot = { ...currentSlot, [medName]: !currentSlot[medName] };
        } else {
            newSlot = { [medName]: true };
        }
        updateParticipantHealth(child.id, 'medsValidated', { ...child.medsValidated, [selectedDate]: { ...currentDay, [slot]: newSlot } });
    }, [canEdit, getValidated, selectedDate, updateParticipantHealth]);

    const validateAllMeds = useCallback((child, slot) => {
        if (!canEdit) return;
        const meds = getMedicationsList(child).filter(m => m.slots.includes(slot)).map(m => m.name);
        const currentDay = getValidated(child);
        // Repartir de l'état existant du créneau pour ne pas écraser les PRN déjà cochés.
        const newSlot = (typeof currentDay[slot] === 'object' && currentDay[slot]) ? { ...currentDay[slot] } : {};
        meds.forEach(m => newSlot[m] = true);
        updateParticipantHealth(child.id, 'medsValidated', { ...child.medsValidated, [selectedDate]: { ...currentDay, [slot]: newSlot } });
    }, [canEdit, getValidated, selectedDate, updateParticipantHealth]);

    const toggleSiBesoin = useCallback((child, slot, medName) => {
        if (!canEdit) return;
        const currentDay = getValidated(child);
        const rawSlot = currentDay[slot];
        let currentSlot;
        if (rawSlot === true) {
            // Legacy boolean "tout validé" : on le déplie en objet par-médoc pour
            // ne pas perdre l'état des traitements quotidiens en cochant un PRN.
            const meds = getMedicationsList(child).filter(m => m.slots.includes(slot)).map(m => m.name);
            currentSlot = {};
            meds.forEach(m => currentSlot[m] = true);
        } else {
            currentSlot = (typeof rawSlot === 'object' && rawSlot) ? rawSlot : {};
        }
        const newSlot = { ...currentSlot, [medName]: !currentSlot[medName] };
        updateParticipantHealth(child.id, 'medsValidated', { ...child.medsValidated, [selectedDate]: { ...currentDay, [slot]: newSlot } });
    }, [canEdit, getValidated, selectedDate, updateParticipantHealth]);

    const activeConfig = SLOT_CONFIG[activeSlot] || SLOT_CONFIG['Matin'];

    // Print/export the recorded administration for the selected day (A4).
    const printDay = () => {
        const dateLabel = fromISO(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        const rows = [];
        children.forEach(c => {
            const meds = getMedicationsList(c);
            const prn = getSiBesoinList(c);
            if (meds.length === 0 && prn.length === 0) return;
            const v = c.medsValidated?.[selectedDate] || {};
            const name = `${c.firstName} ${(c.lastName || "").toUpperCase()}`;
            meds.forEach(m => (m.slots || []).forEach(slot => {
                const sd = v[slot];
                const done = sd === true || (sd && typeof sd === 'object' && sd[m.name]);
                rows.push([name, slot, m.name, done]);
            }));
            prn.forEach(med => {
                const given = ALL_SLOTS.some(slot => { const sd = v[slot]; return sd && typeof sd === 'object' && sd[`prn_${med}`]; });
                rows.push([name, 'Si besoin', `${med} (PRN)`, given]);
            });
        });
        const body = rows.length
            ? rows.map(r => `<tr><td>${escapeHtml(r[0])}</td><td>${escapeHtml(r[1])}</td><td>${escapeHtml(r[2])}</td><td class="${r[3] ? 'ok' : 'no'}">${r[3] ? '✓ Donné' : '✗ Non'}</td></tr>`).join('')
            : `<tr><td colspan="4" style="text-align:center;color:#999;padding:24px">Aucun traitement enregistré ce jour</td></tr>`;
        printHtml(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Administration médicaments — ${escapeHtml(dateLabel)}</title>
            <style>
                * { box-sizing: border-box; }
                body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #1a1a1a; padding: 24px; }
                .hd { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2.5px solid #1a1a1a; padding-bottom: 10px; }
                h1 { font-size: 18px; margin: 0; }
                .sub { color: #666; font-size: 11px; margin: 6px 0 18px; text-transform: capitalize; }
                table { width: 100%; border-collapse: collapse; }
                th { background: #f1f1f1; text-align: left; padding: 7px 10px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid #ccc; }
                td { padding: 7px 10px; border: 1px solid #ddd; vertical-align: top; }
                tr:nth-child(even) td { background: #fafafa; }
                td.ok { color: #15803d; font-weight: bold; }
                td.no { color: #b91c1c; font-weight: bold; }
                .sign { margin-top: 36px; font-size: 11px; color: #444; }
                @media print { @page { size: A4 portrait; margin: 12mm; } body { padding: 0; } }
            </style></head><body>
            <div class="hd"><h1>Registre d'administration des médicaments</h1><div style="font-size:11px;color:#666">Imprimé le ${escapeHtml(new Date().toLocaleDateString('fr-FR'))}</div></div>
            <div class="sub">${escapeHtml(dateLabel)}</div>
            <table><thead><tr><th>Vacancier</th><th>Créneau</th><th>Médicament</th><th>Statut</th></tr></thead><tbody>${body}</tbody></table>
            <div class="sign">Visa infirmier(ère) / responsable sanitaire : ______________________&nbsp;&nbsp;&nbsp;Signature : ______________________</div>
            </body></html>`);
    };

    const collapsed = isMobile && isScrolled;
    const shortDate = fromISO(selectedDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2rem' }}>
            <MedsPdfExport children={children} />

            {/* ── Collapsible header: calendar + slot selector ── */}
            <div style={{
                overflow: 'hidden',
                maxHeight: collapsed ? '0' : '600px',
                opacity: collapsed ? 0 : 1,
                transition: 'max-height 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.25s',
                display: 'flex', flexDirection: 'column', gap: '1.5rem',
                pointerEvents: collapsed ? 'none' : 'auto'
            }}>
                {/* Date picker */}
                <MedsCalendar selectedDate={selectedDate} onSelect={setSelectedDate} datesWithRecords={datesWithRecords} isMobile={isMobile} />

                {/* Viewing a past day */}
                {!isToday && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1.25rem', borderRadius: '16px', background: 'color-mix(in oklch, var(--warning-color) 12%, white)', border: '1.5px solid color-mix(in oklch, var(--warning-color) 50%, transparent)', color: 'var(--warning-color)', fontWeight: '850', fontSize: '0.85rem' }}>
                        <History size={16} strokeWidth={2} />
                        Vous consultez un jour passé.
                    </div>
                )}

                {/* Slot selector */}
                <div style={{
                    background: 'var(--surface-color)', borderRadius: '24px', padding: '0.5rem',
                    border: '1.5px solid var(--glass-border)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
                    display: 'flex', gap: '0.5rem',
                    flexWrap: isMobile ? 'wrap' : 'nowrap'
                }}>
                    {ALL_SLOTS.map(slot => {
                        const cfg = SLOT_CONFIG[slot];
                        const isActive = activeSlot === slot;
                        return (
                            <button key={slot} onClick={() => setActiveSlot(slot)} style={{
                                flex: 1, padding: '0.75rem 1rem', borderRadius: '18px', border: 'none',
                                background: isActive ? cfg.gradient : 'transparent',
                                color: isActive ? 'white' : 'var(--text-muted)',
                                fontWeight: '950', fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.3s',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                boxShadow: isActive ? `0 4px 16px ${cfg.color}40` : 'none', minHeight: '44px'
                            }}>
                                <span style={{ filter: isActive ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' : 'grayscale(0.5) opacity(0.6)' }}>{cfg.icon}</span>
                                {slot}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Compact sticky bar (mobile, scrolled) ── */}
            {isMobile && (
                <div style={{
                    position: 'sticky', top: 0, zIndex: 25,
                    background: 'var(--surface-color)',
                    borderRadius: '18px',
                    border: '1.5px solid var(--glass-border)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    display: 'flex', alignItems: 'center',
                    overflow: 'hidden',
                    maxHeight: collapsed ? '52px' : '0',
                    opacity: collapsed ? 1 : 0,
                    transition: 'max-height 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.2s',
                    pointerEvents: collapsed ? 'auto' : 'none',
                }}>
                    {/* Slot switcher pills */}
                    <div style={{ display: 'flex', flex: 1, padding: '4px 6px', gap: '4px', overflowX: 'auto', scrollbarWidth: 'none' }} className="no-scrollbar">
                        {ALL_SLOTS.map(slot => {
                            const cfg = SLOT_CONFIG[slot];
                            const isActive = activeSlot === slot;
                            return (
                                <button key={slot} onClick={() => setActiveSlot(slot)} style={{
                                    flexShrink: 0, display: 'flex', alignItems: 'center', gap: '5px',
                                    padding: '6px 12px', borderRadius: '100px', border: 'none', cursor: 'pointer',
                                    background: isActive ? cfg.gradient : 'transparent',
                                    color: isActive ? 'white' : 'var(--text-muted)',
                                    fontWeight: '900', fontSize: '0.78rem', transition: 'all 0.2s', minHeight: '36px'
                                }}>
                                    <span style={{ display: 'flex', filter: isActive ? 'none' : 'grayscale(0.6) opacity(0.6)' }}>{React.cloneElement(cfg.icon, { size: 14 })}</span>
                                    {slot}
                                </button>
                            );
                        })}
                    </div>
                    {/* Date + expand */}
                    <button onClick={scrollToTop} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 12px', background: 'transparent', border: 'none', borderLeft: '1px solid var(--glass-border)', cursor: 'pointer', flexShrink: 0, color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '800', minHeight: '44px', whiteSpace: 'nowrap' }}>
                        {shortDate} <ChevronDown size={14} style={{ opacity: 0.6 }} />
                    </button>
                </div>
            )}

            {/* Header */}
            <div className="u-flex u-flex-between" style={{ flexWrap: 'wrap', gap: '1rem', padding: '0 0.5rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: activeConfig.color, margin: 0, letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {activeConfig.icon} Traitements du {activeSlot}
                    </h2>
                    <p className="u-text-sm u-text-muted u-font-bold" style={{ margin: '4px 0 0' }}>
                        {displayChildren.length} vacancier{displayChildren.length !== 1 ? 's' : ''} concerné{displayChildren.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button onClick={printDay} className="btn btn-primary" style={{ padding: '0.5rem 1rem', borderRadius: '12px', fontWeight: '900', gap: '0.5rem', display: 'flex', alignItems: 'center' }}>
                        <FileDown size={16} /> Exporter ce jour
                    </button>
                    <button onClick={() => window.print()} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', borderRadius: '12px', fontWeight: '800', gap: '0.5rem', border: '1.5px solid var(--glass-border)', background: 'var(--surface-color)', display: 'flex', alignItems: 'center' }}>
                        <Printer size={16} /> Fiche vierge
                    </button>
                </div>
            </div>

            {/* Cards */}
            {displayChildren.length === 0 ? (
                <EmptyState icon={<span style={{ fontSize: '3rem' }}>{activeConfig.icon}</span>} title="Aucun traitement prévu pour ce créneau." />
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: '1rem' }}>
                    {displayChildren.map(child => {
                        const validated = getValidated(child);
                        const slotData = validated[activeSlot];
                        const isAllLegacyDone = slotData === true;
                        const medsForSlot = getMedicationsList(child).filter(m => m.slots.includes(activeSlot)).map(m => m.name);
                        const siBesoinList = getSiBesoinList(child);
                        const isAllDailyDone = medsForSlot.length > 0 && (isAllLegacyDone || medsForSlot.every(m => slotData && slotData[m]));
                        const hasPendingDaily = medsForSlot.length > 0 && !isAllDailyDone;

                        return (
                            <div key={child.id} style={{
                                borderRadius: '24px', overflow: 'hidden', background: 'var(--surface-color)',
                                border: `2px solid ${isAllDailyDone ? activeConfig.color : 'var(--glass-border)'}`,
                                boxShadow: isAllDailyDone ? `0 8px 32px ${activeConfig.color}25` : '0 2px 12px rgba(0,0,0,0.04)',
                                transition: 'all 0.3s', position: 'relative', display: 'flex', flexDirection: 'column'
                            }}>
                                {isAllDailyDone && (
                                    <div style={{ position: 'absolute', top: '1rem', right: '1rem', color: activeConfig.color, background: activeConfig.colorLight, padding: '4px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: '950', display: 'flex', alignItems: 'center', gap: '4px', zIndex: 10 }}>
                                        <Check size={12} strokeWidth={4} /> COMPLET
                                    </div>
                                )}
                                {/* Child header */}
                                <div style={{ padding: '1.25rem 1.5rem', borderBottom: (medsForSlot.length > 0 || siBesoinList.length > 0) ? '1px solid var(--glass-border)' : 'none' }}>
                                    <div className="u-flex u-items-center u-gap-md">
                                        <Avatar participant={child} size={48} />
                                        <div>
                                            <div style={{ fontWeight: '800', fontSize: '1.05rem', color: 'var(--text-main)', letterSpacing: '-0.02em', paddingRight: '60px' }}>{child.firstName} {(child.lastName || "").toUpperCase()}</div>
                                            <div className="u-text-xs u-text-muted u-font-bold">{groups.find(g => g.id === child.group)?.name || ''}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Daily meds */}
                                {medsForSlot.length > 0 && (
                                    <div style={{ padding: '0.5rem 1.5rem' }}>
                                        <div className="u-label" style={{ margin: '0.5rem 0' }}>Traitement Quotidien</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {medsForSlot.map((medName, idx) => {
                                                const isMedDone = isAllLegacyDone || (slotData && slotData[medName]);
                                                const specificMedObj = getMedicationsList(child).find(m => m.name === medName);
                                                const specificDose = specificMedObj?.doses?.[activeSlot];
                                                const doseToDisplay = specificDose || child.medDoses?.[activeSlot];
                                                return (
                                                    <div key={idx} onClick={() => toggleMed(child, activeSlot, medName)} style={{
                                                        display: 'flex', alignItems: 'center', gap: '0.75rem', minHeight: '44px',
                                                        padding: '0.6rem 0.8rem', background: isMedDone ? activeConfig.colorLight : 'var(--bg-main)',
                                                        borderRadius: '12px', cursor: canEdit ? 'pointer' : 'default',
                                                        border: `1.5px solid ${isMedDone ? activeConfig.color : 'transparent'}`
                                                    }}>
                                                        <div style={{
                                                            width: '20px', height: '20px', borderRadius: '6px', flexShrink: 0,
                                                            border: `2px solid ${isMedDone ? activeConfig.color : 'var(--glass-border)'}`,
                                                            background: isMedDone ? activeConfig.color : 'var(--surface-color)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                                                        }}>
                                                            {isMedDone && <Check size={14} strokeWidth={4} />}
                                                        </div>
                                                        <span style={{ fontSize: '0.85rem', fontWeight: '800', color: isMedDone ? activeConfig.color : 'var(--text-main)' }}>
                                                            {medName} {doseToDisplay ? `(${doseToDisplay})` : ''}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {hasPendingDaily && canEdit && medsForSlot.length > 1 && (
                                            <button onClick={() => validateAllMeds(child, activeSlot)} style={{
                                                marginTop: '0.75rem', width: '100%', padding: '0.5rem', borderRadius: '10px',
                                                background: 'transparent', border: '1.5px solid var(--glass-border)',
                                                color: 'var(--text-main)', fontWeight: '800', fontSize: '0.8rem', cursor: 'pointer'
                                            }}>
                                                Tout valider d'un coup
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* PRN meds */}
                                {siBesoinList.length > 0 && (
                                    <div style={{ padding: '0.5rem 1.5rem 1.5rem', background: 'color-mix(in oklch, var(--success-color) 3%, transparent)' }}>
                                        <div style={{ fontSize: '0.65rem', fontWeight: '950', color: 'var(--success-color)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <AlertCircle size={10} strokeWidth={2} /> En cas de besoin (PRN)
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {siBesoinList.map((med, idx) => {
                                                const prnKey = `prn_${med}`;
                                                const isMedDone = slotData && slotData[prnKey];
                                                return (
                                                    <div key={idx} onClick={() => toggleSiBesoin(child, activeSlot, prnKey)} style={{
                                                        display: 'flex', alignItems: 'center', gap: '0.75rem', minHeight: '44px',
                                                        padding: '0.6rem 0.8rem', background: isMedDone ? 'color-mix(in oklch, var(--success-color) 15%, transparent)' : 'var(--surface-color)',
                                                        borderRadius: '12px', cursor: canEdit ? 'pointer' : 'default',
                                                        border: `1.5px solid ${isMedDone ? 'var(--success-color)' : 'var(--glass-border)'}`
                                                    }}>
                                                        <div style={{
                                                            width: '20px', height: '20px', borderRadius: '6px', flexShrink: 0,
                                                            border: `2px solid ${isMedDone ? 'var(--success-color)' : 'var(--glass-border)'}`,
                                                            background: isMedDone ? 'var(--success-color)' : 'var(--surface-color)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                                                        }}>
                                                            {isMedDone && <Check size={14} strokeWidth={4} />}
                                                        </div>
                                                        <span style={{ fontSize: '0.85rem', fontWeight: '800', color: isMedDone ? 'var(--success-color)' : 'var(--text-main)' }}>{med}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MedsDashboard;
