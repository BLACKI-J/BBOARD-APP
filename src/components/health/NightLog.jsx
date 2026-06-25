import React, { useState, useMemo } from 'react';
import { Moon, Trash2, Plus, User, Clock, Check, Droplets, Pencil, ChevronLeft, ChevronRight, Printer } from 'lucide-react';
import { useUi } from '../../ui/UiProvider';
import { parseISO } from '../../utils/dates';
import { printHtml } from '../../utils/printHtml';
import Avatar from '../common/Avatar';

const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Rondes de nuit : créneaux fixes toutes les 2 h de 21h30 à 7h30.
const NIGHT_SLOTS = ['21:30', '23:30', '01:30', '03:30', '05:30', '07:30'];
// Raisons fréquentes d'un passage (autocomplétion <datalist>, saisie libre possible).
const REASONS = ['Toilette', 'Pipi (WC)', 'Cauchemar', 'Soif', 'Malade'];

const pad = (n) => String(n).padStart(2, '0');
const HOURS = Array.from({ length: 24 }, (_, i) => pad(i));
const MINUTES = Array.from({ length: 12 }, (_, i) => pad(i * 5)); // pas de 5 min
// Heure courante arrondie à 5 min (gère le passage à l'heure suivante).
const nowHM = () => {
    const d = new Date();
    let m = Math.round(d.getMinutes() / 5) * 5;
    let h = d.getHours();
    if (m === 60) { m = 0; h = (h + 1) % 24; }
    return `${pad(h)}:${pad(m)}`;
};
// Heure < 12 h = après minuit → appartient à la nuit commencée la veille.
const defaultNight = () => {
    const d = new Date();
    if (d.getHours() < 12) d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
// Valeur de tri horaire à l'échelle d'une nuit (avant midi = +24 h → après le soir).
const slotSortVal = (t) => { const [h, m] = (t || '0:0').split(':').map(Number); return (h < 12 ? h + 24 : h) * 60 + m; };
const shiftNight = (iso, days) => { const d = parseISO(iso); d.setDate(d.getDate() + days); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const fmtNight = (iso) => { try { return parseISO(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' }); } catch { return iso; } };
const fmtTime = (iso) => { try { return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); } catch { return ''; } };

export default function NightLog({ nightLogs = [], setNightLogs, children = [], activeUser, canEdit, isMobile }) {
    const ui = useUi();
    const [nightDate, setNightDate] = useState(defaultNight());
    const [noteSlot, setNoteSlot] = useState('');   // créneau dont on saisit une note
    const [noteText, setNoteText] = useState('');
    // Formulaire passage
    const [pTime, setPTime] = useState(nowHM());
    const [pChild, setPChild] = useState('');
    const [pReason, setPReason] = useState('');
    const [pNote, setPNote] = useState('');

    const childById = useMemo(() => Object.fromEntries(children.map(c => [c.id, c])), [children]);
    const nightEntries = useMemo(() => (nightLogs || []).filter(e => e.nightDate === nightDate), [nightLogs, nightDate]);
    const rondeBySlot = useMemo(() => Object.fromEntries(nightEntries.filter(e => e.kind === 'ronde').map(e => [e.time, e])), [nightEntries]);
    const passages = useMemo(() => nightEntries.filter(e => e.kind === 'passage').sort((a, b) => slotSortVal(a.time) - slotSortVal(b.time)), [nightEntries]);
    const rondesDone = NIGHT_SLOTS.filter(s => rondeBySlot[s]).length;

    const authorName = activeUser ? `${activeUser.firstName || ''} ${activeUser.lastName || ''}`.trim() : '';
    const baseEntry = () => ({ id: (crypto?.randomUUID?.() || `nl_${Date.now()}`), nightDate, author: authorName, authorId: activeUser?.id || '', createdAt: new Date().toISOString() });

    const guard = () => { if (!canEdit) { ui.toast('Droits insuffisants.', { type: 'error' }); return false; } return true; };

    // Enregistre/écrase une ronde (un seul enregistrement par créneau & par nuit).
    const logRonde = (slot, status, note = '') => {
        if (!guard()) return;
        const entry = { ...baseEntry(), kind: 'ronde', time: slot, status, note };
        const cleaned = (nightLogs || []).filter(e => !(e.kind === 'ronde' && e.nightDate === nightDate && e.time === slot));
        setNightLogs([entry, ...cleaned]);
        setNoteSlot(''); setNoteText('');
    };

    const addPassage = () => {
        if (!guard()) return;
        if (!pChild) { ui.toast('Choisissez un enfant.', { type: 'error' }); return; }
        const child = children.find(c => c.id === pChild);
        const entry = {
            ...baseEntry(), kind: 'passage', time: pTime || nowHM(),
            childId: pChild, childName: child ? `${child.firstName} ${(child.lastName || '').toUpperCase()}` : '',
            reason: pReason.trim() || 'Toilette', note: pNote.trim(),
        };
        setNightLogs([entry, ...(nightLogs || [])]);
        setPTime(nowHM()); setPChild(''); setPReason(''); setPNote('');
        ui.toast('Passage noté.', { type: 'success' });
    };

    const remove = (id) => { if (!guard()) return; setNightLogs((nightLogs || []).filter(e => e.id !== id)); };

    // Impression A4 de la nuit sélectionnée : rondes + passages, style registre
    // (bandeau sombre, lignes réglées + lignes vierges pour compléter à la main).
    const printNight = () => {
        const tableBlock = (caption, headers, rows, minRows) => {
            const thead = headers.map(h => `<th>${escapeHtml(h)}</th>`).join('');
            const filled = rows.map(r => `<tr>${r.map(c => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`).join('');
            const blanks = `<tr class="blank">${headers.map(() => '<td>&nbsp;</td>').join('')}</tr>`.repeat(Math.max(0, (minRows || 0) - rows.length));
            return `<div class="cap">${escapeHtml(caption)}</div><table><thead><tr>${thead}</tr></thead><tbody>${filled}${blanks}</tbody></table>`;
        };
        const rondeRows = NIGHT_SLOTS.map(slot => {
            const e = rondeBySlot[slot];
            return [slot, e ? (e.status === 'RAS' ? 'RAS' : e.note) : '', e?.author || '', e ? fmtTime(e.createdAt) : ''];
        });
        const passageRows = passages.map(p => [p.time, p.childName || '', p.reason || '', p.note || '', p.author || '']);
        printHtml(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Journal de nuit</title>
            <style>
                * { box-sizing: border-box; }
                body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #1a1a1a; padding: 22px; }
                .hd { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid #2b2b2b; padding-bottom: 8px; margin-bottom: 4px; }
                h1 { font-size: 18px; margin: 0; text-transform: uppercase; }
                .sub { color: #666; font-size: 11px; margin: 6px 0 18px; text-transform: capitalize; font-weight: 700; }
                .cap { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; margin: 18px 0 6px; }
                table { width: 100%; border-collapse: collapse; table-layout: fixed; }
                th { background: #2b2b2b; color: #fff; text-align: center; padding: 8px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; border: 1px solid #2b2b2b; }
                td { padding: 0 8px; height: 28px; border: 1px solid #b8b8b8; vertical-align: middle; word-wrap: break-word; overflow: hidden; }
                tbody tr:nth-child(even) td { background: #efefef; }
                tr.blank td { color: transparent; }
                .sign { margin-top: 24px; display: flex; justify-content: space-between; font-size: 11px; color: #333; }
                @media print { @page { size: A4 portrait; margin: 12mm; } body { padding: 0; } th, tbody tr:nth-child(even) td { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
            </style></head><body>
            <div class="hd"><h1>Journal de nuit</h1><div style="font-size:10px;color:#666;text-align:right">Imprimé le ${escapeHtml(new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))}</div></div>
            <div class="sub">Nuit du ${escapeHtml(fmtNight(nightDate))}</div>
            ${tableBlock('Rondes de nuit (21h30 → 7h30)', ['Créneau', 'État / Note', 'Par', 'Saisi à'], rondeRows, 6)}
            ${tableBlock('Passages & réveils', ['Heure', 'Enfant', 'Raison', 'Note', 'Par'], passageRows, 10)}
            <div class="sign"><div>Anim(s) de nuit : ______________________</div><div>Visa responsable : ______________________</div></div>
            </body></html>`);
    };

    const card = { background: 'var(--surface-color)', border: '1px solid var(--glass-border)', borderRadius: '16px' };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* ── Sélecteur de nuit ── */}
            <div className="glass-card" style={{ padding: '0.875rem 1rem', borderRadius: '18px', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span style={{ width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'color-mix(in oklch, var(--accent-color) 14%, white)', color: 'var(--accent-color)' }}>
                    <Moon size={20} strokeWidth={2.2} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.66rem', fontWeight: '950', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Nuit du</div>
                    <div style={{ fontWeight: '900', fontSize: '1rem', color: 'var(--text-main)', textTransform: 'capitalize' }}>{fmtNight(nightDate)}</div>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: '900', color: rondesDone === NIGHT_SLOTS.length ? 'var(--success-color)' : 'var(--text-muted)' }}>
                    {rondesDone}/{NIGHT_SLOTS.length} rondes · {passages.length} passage{passages.length > 1 ? 's' : ''}
                </span>
                <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                    <button onClick={() => setNightDate(d => shiftNight(d, -1))} title="Nuit précédente" style={{ width: '38px', height: '38px', borderRadius: '11px', border: '1px solid var(--glass-border)', background: 'var(--surface-color)', color: 'var(--text-main)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><ChevronLeft size={18} /></button>
                    <input type="date" value={nightDate} onChange={e => setNightDate(e.target.value || defaultNight())} className="glass-input" style={{ height: '40px', padding: '0 0.75rem', fontWeight: '700', width: isMobile ? '140px' : '160px' }} />
                    <button onClick={() => setNightDate(d => shiftNight(d, 1))} title="Nuit suivante" style={{ width: '38px', height: '38px', borderRadius: '11px', border: '1px solid var(--glass-border)', background: 'var(--surface-color)', color: 'var(--text-main)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><ChevronRight size={18} /></button>
                    <button onClick={printNight} title="Imprimer cette nuit" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', height: '38px', padding: '0 0.85rem', borderRadius: '11px', border: '1px solid var(--glass-border)', background: 'var(--surface-color)', color: 'var(--text-main)', cursor: 'pointer', fontWeight: '850', fontSize: '0.8rem' }}>
                        <Printer size={16} strokeWidth={2} /> {isMobile ? '' : 'Imprimer'}
                    </button>
                </div>
            </div>

            {/* ── Rondes (créneaux 2 h) ── */}
            <div className="glass-card" style={{ padding: isMobile ? '1rem' : '1.25rem', borderRadius: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem' }}>
                    <Clock size={17} strokeWidth={2.2} style={{ color: 'var(--accent-color)' }} />
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '900', color: 'var(--text-main)' }}>Rondes de nuit</h4>
                    <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)' }}>21h30 → 7h30, toutes les 2 h</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {NIGHT_SLOTS.map(slot => {
                        const e = rondeBySlot[slot];
                        const isNoting = noteSlot === slot;
                        return (
                            <div key={slot} style={{ ...card, padding: '0.6rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', borderColor: e ? (e.status === 'RAS' ? 'color-mix(in oklch, var(--success-color) 35%, transparent)' : 'color-mix(in oklch, var(--warning-color) 35%, transparent)') : 'var(--glass-border)' }}>
                                <span style={{ fontWeight: '950', fontSize: '0.95rem', color: 'var(--text-main)', width: '52px', flexShrink: 0 }}>{slot}</span>
                                {e ? (
                                    <>
                                        {e.status === 'RAS' ? (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', fontWeight: '900', padding: '3px 10px', borderRadius: '100px', background: 'color-mix(in oklch, var(--success-color) 14%, white)', color: 'var(--success-color)' }}><Check size={13} strokeWidth={3} /> RAS</span>
                                        ) : (
                                            <span style={{ flex: 1, minWidth: 0, fontSize: '0.86rem', fontWeight: '700', color: 'var(--text-main)' }}>{e.note}</span>
                                        )}
                                        <span style={{ flex: e.status === 'RAS' ? 1 : 0 }} />
                                        <span style={{ fontSize: '0.68rem', fontWeight: '700', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{e.author}{e.createdAt ? ` · ${fmtTime(e.createdAt)}` : ''}</span>
                                        {canEdit && <button onClick={() => remove(e.id)} title="Effacer" style={{ width: '28px', height: '28px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--surface-color)', color: 'var(--text-muted)', cursor: 'pointer', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={13} /></button>}
                                    </>
                                ) : canEdit ? (
                                    isNoting ? (
                                        <>
                                            <input autoFocus value={noteText} onChange={ev => setNoteText(ev.target.value)} onKeyDown={ev => { if (ev.key === 'Enter' && noteText.trim()) logRonde(slot, 'note', noteText.trim()); if (ev.key === 'Escape') { setNoteSlot(''); setNoteText(''); } }}
                                                placeholder="Note…" className="glass-input" style={{ flex: 1, minWidth: '120px', height: '40px', padding: '0 0.85rem', fontWeight: '600' }} />
                                            <button onClick={() => noteText.trim() && logRonde(slot, 'note', noteText.trim())} className="btn btn-primary" style={{ height: '40px', borderRadius: '10px', paddingInline: '0.9rem', fontWeight: '850', fontSize: '0.8rem' }}>OK</button>
                                            <button onClick={() => { setNoteSlot(''); setNoteText(''); }} style={{ height: '40px', borderRadius: '10px', paddingInline: '0.7rem', border: '1px solid var(--glass-border)', background: 'var(--surface-color)', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: '800', fontSize: '0.8rem' }}>Annuler</button>
                                        </>
                                    ) : (
                                        <>
                                            <span style={{ flex: 1 }} />
                                            <button onClick={() => logRonde(slot, 'RAS')} className="btn btn-primary" style={{ height: '36px', borderRadius: '10px', paddingInline: '1.1rem', fontWeight: '900', fontSize: '0.82rem' }}>RAS</button>
                                            <button onClick={() => { setNoteSlot(slot); setNoteText(''); }} title="Ajouter une note" style={{ height: '36px', borderRadius: '10px', paddingInline: '0.75rem', border: '1px solid var(--glass-border)', background: 'var(--surface-color)', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: '800', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}><Pencil size={13} /> Note</button>
                                        </>
                                    )
                                ) : (
                                    <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-softer)', fontStyle: 'italic' }}>Non renseigné</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Passages (toilettes / réveils) ── */}
            <div className="glass-card" style={{ padding: isMobile ? '1rem' : '1.25rem', borderRadius: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem' }}>
                    <Droplets size={17} strokeWidth={2.2} style={{ color: 'var(--accent-color)' }} />
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '900', color: 'var(--text-main)' }}>Passages & réveils</h4>
                    <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)' }}>qui · quand · pourquoi</span>
                </div>

                {canEdit && (
                    <div style={{ ...card, padding: '0.75rem', marginBottom: '0.875rem', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '150px 1.2fr 1.2fr auto', gap: '0.6rem', alignItems: 'end' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: '950', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Heure</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <select value={pTime.split(':')[0]} onChange={e => setPTime(`${e.target.value}:${pTime.split(':')[1] || '00'}`)} className="glass-input" style={{ height: '44px', padding: '0 0.5rem', fontWeight: '800', textAlign: 'center', flex: 1 }}>
                                    {HOURS.map(h => <option key={h} value={h}>{h}h</option>)}
                                </select>
                                <span style={{ fontWeight: '900', color: 'var(--text-muted)' }}>:</span>
                                <select value={pTime.split(':')[1] || '00'} onChange={e => setPTime(`${pTime.split(':')[0] || '00'}:${e.target.value}`)} className="glass-input" style={{ height: '44px', padding: '0 0.5rem', fontWeight: '800', textAlign: 'center', flex: 1 }}>
                                    {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: '950', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Enfant</label>
                            <select value={pChild} onChange={e => setPChild(e.target.value)} className="glass-input" style={{ height: '44px', padding: '0 0.75rem', fontWeight: '700', width: '100%' }}>
                                <option value="">— Choisir…</option>
                                {children.map(c => <option key={c.id} value={c.id}>{c.firstName} {(c.lastName || '').toUpperCase()}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: '950', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Raison</label>
                            <input list="night-reasons" value={pReason} onChange={e => setPReason(e.target.value)} placeholder="Toilette…" className="glass-input" style={{ height: '44px', padding: '0 0.85rem', fontWeight: '700', width: '100%' }} />
                            <datalist id="night-reasons">{REASONS.map(r => <option key={r} value={r} />)}</datalist>
                        </div>
                        <button onClick={addPassage} className="btn btn-primary" style={{ height: '44px', borderRadius: '12px', fontWeight: '900', paddingInline: '1.1rem' }}>
                            <Plus size={17} strokeWidth={2.6} /> {isMobile ? 'Ajouter' : ''}
                        </button>
                    </div>
                )}

                {passages.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontWeight: '800', fontSize: '0.82rem' }}>Aucun passage noté pour cette nuit.</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {passages.map(p => {
                            const child = p.childId ? childById[p.childId] : null;
                            return (
                                <div key={p.id} style={{ ...card, padding: '0.6rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.7rem', flexWrap: 'wrap' }}>
                                    <span style={{ fontWeight: '950', fontSize: '0.92rem', color: 'var(--text-main)', width: '48px', flexShrink: 0 }}>{p.time}</span>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '850', fontSize: '0.86rem', color: 'var(--text-main)' }}>
                                        {child && <Avatar participant={child} size={22} />} {p.childName || '—'}
                                    </span>
                                    <span style={{ fontSize: '0.74rem', fontWeight: '900', padding: '2px 9px', borderRadius: '100px', background: 'color-mix(in oklch, var(--accent-color) 12%, white)', color: 'var(--accent-color)' }}>{p.reason}</span>
                                    {p.note && <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', minWidth: 0 }}>· {p.note}</span>}
                                    <span style={{ flex: 1 }} />
                                    <span style={{ fontSize: '0.66rem', fontWeight: '700', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}><User size={11} /> {p.author}</span>
                                    {canEdit && <button onClick={() => remove(p.id)} title="Supprimer" style={{ width: '28px', height: '28px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--surface-color)', color: 'var(--text-muted)', cursor: 'pointer', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={13} /></button>}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
