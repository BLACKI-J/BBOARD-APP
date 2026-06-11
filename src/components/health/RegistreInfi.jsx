import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Pill, ClipboardList, Clipboard, Stethoscope, Trash2, Printer } from 'lucide-react';
import { useUi } from '../../ui/UiProvider';
import { EmptyState } from '../ui';
import { printHtml } from '../../utils/printHtml';

const labelStyle = { display: 'block', fontSize: '0.72rem', fontWeight: '950', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' };
const thStyle = { padding: '0.875rem 1.5rem', fontSize: '0.7rem', fontWeight: '950', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left', whiteSpace: 'nowrap' };
const tdStyle = { padding: '0.875rem 1.5rem', fontSize: '0.88rem', color: 'var(--text-main)' };

const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

// Opens an A4 print window styled like the physical infirmary register:
// dark header band, ruled rows, blank lines to fill by hand. Portrait.
const printRegister = (title, subtitle, headers, rows, minRows = 22) => {
    const thead = headers.map(h => `<th>${escapeHtml(h)}</th>`).join('');
    // Pad with blank ruled rows so the page reads as a fillable register.
    const filled = rows.map(r => `<tr>${r.map(c => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`);
    const blanks = Math.max(0, minRows - rows.length);
    const blankRow = `<tr class="blank">${headers.map(() => '<td>&nbsp;</td>').join('')}</tr>`;
    const tbody = filled.join('') + blankRow.repeat(blanks);
    printHtml(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>${escapeHtml(title)}</title>
        <style>
            * { box-sizing: border-box; }
            body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #1a1a1a; padding: 22px; }
            .hd { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid #2b2b2b; padding-bottom: 8px; margin-bottom: 4px; }
            h1 { font-size: 18px; margin: 0; letter-spacing: 0.01em; text-transform: uppercase; }
            .sub { color: #666; font-size: 10px; margin: 6px 0 14px; }
            table { width: 100%; border-collapse: collapse; table-layout: fixed; }
            th { background: #2b2b2b; color: #fff; text-align: center; padding: 9px 8px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; border: 1px solid #2b2b2b; }
            td { padding: 0 8px; height: 30px; border: 1px solid #b8b8b8; vertical-align: middle; word-wrap: break-word; overflow: hidden; }
            tbody tr:nth-child(even) td { background: #efefef; }
            tr.blank td { color: transparent; }
            .sign { margin-top: 22px; display: flex; justify-content: space-between; font-size: 11px; color: #333; }
            @media print { @page { size: A4 portrait; margin: 12mm; } body { padding: 0; } th { -webkit-print-color-adjust: exact; print-color-adjust: exact; } tbody tr:nth-child(even) td { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style></head><body>
        <div class="hd"><h1>${escapeHtml(title)}</h1><div style="font-size:10px;color:#666;text-align:right">${escapeHtml(new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))}</div></div>
        <div class="sub">${escapeHtml(subtitle)}</div>
        <table><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>
        <div class="sign"><div>Visa infirmier(ère) / responsable sanitaire : ______________________</div><div>Signature : ______________________</div></div>
        </body></html>`);
};

// ─── Registre Médicaments ───────────────────────────────────────────────────
const RegistreMeds = ({ children, updateParticipantHealth, canEdit, isMobile }) => {
    const ui = useUi();
    const [showForm, setShowForm] = useState(false);
    const nowTime = () => new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const [form, setForm] = useState({ childId: '', heure: '', medicaments: '', traitement: '', soignant: '' });

    const allLogs = useMemo(() => {
        const logs = [];
        children.forEach(c => {
            (c.registreLogs || []).forEach(log => {
                logs.push({ ...log, childId: c.id, childName: `${c.firstName} ${(c.lastName || "").toUpperCase()}` });
            });
        });
        return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }, [children]);

    const handleChildSelect = (childId) => {
        const child = children.find(c => c.id === childId);
        setForm(f => ({ ...f, childId, medicaments: child?.dailyMeds || '' }));
    };

    const handleAdd = () => {
        if (!form.childId || !form.soignant) { ui.toast('Vacancier et soignant obligatoires.', { type: 'error' }); return; }
        const child = children.find(c => c.id === form.childId);
        const newLog = { id: Date.now(), timestamp: new Date().toISOString(), heure: form.heure || nowTime(), medicaments: form.medicaments, traitement: form.traitement, soignant: form.soignant };
        const existing = Array.isArray(child.registreLogs) ? child.registreLogs : [];
        updateParticipantHealth(form.childId, 'registreLogs', [newLog, ...existing]);
        setForm({ childId: '', heure: '', medicaments: '', traitement: '', soignant: '' });
        setShowForm(false);
        ui.toast('Entrée enregistrée au registre.', { type: 'success' });
    };

    const handleDelete = (childId, logId) => {
        const child = children.find(c => c.id === childId);
        updateParticipantHealth(childId, 'registreLogs', (child.registreLogs || []).filter(l => l.id !== logId));
    };

    const handleExport = () => {
        const rows = allLogs.map(l => [
            new Date(l.timestamp).toLocaleDateString('fr-FR'),
            l.heure || '',
            l.childName,
            l.medicaments || '',
            l.traitement || '',
            l.soignant || ''
        ]);
        printRegister(
            "Registre de l'infirmerie — Administration des traitements",
            `${allLogs.length} entrée(s) — document à conserver`,
            ['Date', 'Heure', 'Vacancier', 'Médicaments du jour', 'Soin / Traitement donné', 'Soignant'],
            rows
        );
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="u-flex u-flex-between">
                <h3 className="u-section-title" style={{ margin: 0 }}>Registre · {allLogs.length} entrée{allLogs.length !== 1 ? 's' : ''}</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={handleExport} disabled={allLogs.length === 0} title="Exporter / imprimer le registre"
                        style={{ height: '40px', padding: '0 1.1rem', borderRadius: '12px', fontSize: '0.82rem', fontWeight: '950', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1.5px solid var(--glass-border)', background: 'white', color: 'var(--text-muted)', cursor: allLogs.length === 0 ? 'not-allowed' : 'pointer', opacity: allLogs.length === 0 ? 0.5 : 1 }}>
                        <Printer size={16} strokeWidth={2.5} /> Exporter PDF
                    </button>
                    {canEdit && (
                        <button onClick={() => setShowForm(v => !v)} className="btn btn-primary" style={{ height: '40px', padding: '0 1.25rem', borderRadius: '12px', fontSize: '0.82rem', fontWeight: '950', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Plus size={16} strokeWidth={3} /> Nouvelle entrée
                        </button>
                    )}
                </div>
            </div>

            {showForm && (
                <div className="card-glass animate-fade-in" style={{ padding: '1.5rem', borderRadius: '24px', border: '2px solid var(--primary-color)', background: 'white' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={labelStyle}>Vacancier</label>
                            <select className="glass-input" value={form.childId} onChange={e => handleChildSelect(e.target.value)} style={{ height: '44px', fontWeight: '800' }}>
                                <option value="">Sélectionner…</option>
                                {children.map(c => <option key={c.id} value={c.id}>{c.firstName} {(c.lastName || "").toUpperCase()}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Heure</label>
                            <input className="glass-input" type="time" value={form.heure} onChange={e => setForm(f => ({ ...f, heure: e.target.value }))} style={{ height: '44px', fontWeight: '800' }} />
                        </div>
                        <div>
                            <label style={labelStyle}>Soignant</label>
                            <input className="glass-input" placeholder="Prénom du soignant" value={form.soignant} onChange={e => setForm(f => ({ ...f, soignant: e.target.value }))} style={{ height: '44px', fontWeight: '800' }} />
                        </div>
                        <div>
                            <label style={labelStyle}>Médicaments du jour</label>
                            <input className="glass-input" placeholder="Auto-rempli depuis la fiche" value={form.medicaments} onChange={e => setForm(f => ({ ...f, medicaments: e.target.value }))} style={{ height: '44px', fontWeight: '800' }} />
                        </div>
                        <div>
                            <label style={labelStyle}>Soin / Traitement donné</label>
                            <input className="glass-input" placeholder="Ex: Ventoline, Doliprane..." value={form.traitement} onChange={e => setForm(f => ({ ...f, traitement: e.target.value }))} style={{ height: '44px', fontWeight: '800' }} />
                        </div>
                    </div>
                    <div className="u-flex u-justify-end u-gap-sm">
                        <button onClick={() => setShowForm(false)} style={{ height: '44px', padding: '0 1.25rem', borderRadius: '12px', border: '1.5px solid var(--glass-border)', background: 'white', color: 'var(--text-muted)', fontWeight: '900', fontSize: '0.85rem', cursor: 'pointer' }}>Annuler</button>
                        <button onClick={handleAdd} className="btn btn-primary" style={{ height: '44px', padding: '0 1.5rem', borderRadius: '12px', fontWeight: '950', fontSize: '0.85rem' }}>Enregistrer</button>
                    </div>
                </div>
            )}

            <div className="u-table-wrap">
                {allLogs.length === 0 ? (
                    <EmptyState icon={<Clipboard size={40} strokeWidth={1.5} />} title="Aucune entrée dans le registre." />
                ) : (
                    <table className="u-table">
                        <thead>
                            <tr style={{ background: 'var(--bg-main)', borderBottom: '1.5px solid var(--glass-border)' }}>
                                <th style={thStyle}>Date</th>
                                <th style={thStyle}>Heure</th>
                                <th style={thStyle}>Vacancier</th>
                                <th style={thStyle}>Médicaments du jour</th>
                                <th style={thStyle}>Soin / Traitement donné</th>
                                <th style={thStyle}>Soignant</th>
                                {canEdit && <th style={{ ...thStyle, width: '48px' }}></th>}
                            </tr>
                        </thead>
                        <tbody>
                            {allLogs.map(log => (
                                <tr key={log.id} style={{ borderBottom: '1px solid var(--glass-border)' }} className="hover-row">
                                    <td style={tdStyle}>{new Date(log.timestamp).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })}</td>
                                    <td style={tdStyle}><span style={{ fontWeight: '800', color: 'var(--primary-color)' }}>{log.heure || '--:--'}</span></td>
                                    <td style={tdStyle}><span style={{ fontWeight: '900' }}>{log.childName}</span></td>
                                    <td style={tdStyle}><span style={{ fontSize: '0.85rem', opacity: log.medicaments ? 1 : 0.3 }}>{log.medicaments || '—'}</span></td>
                                    <td style={tdStyle}>{log.traitement
                                        ? <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'oklch(55% 0.22 30)', background: 'oklch(96% 0.06 30)', padding: '3px 10px', borderRadius: '8px' }}>{log.traitement}</span>
                                        : <span style={{ opacity: 0.3 }}>—</span>}
                                    </td>
                                    <td style={tdStyle}><span style={{ fontWeight: '800' }}>{log.soignant}</span></td>
                                    {canEdit && (
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <button onClick={() => handleDelete(log.childId, log.id)} style={{ minWidth: '44px', minHeight: '44px', borderRadius: '8px', border: '1.5px solid var(--glass-border)', background: 'white', color: 'var(--danger-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

// ─── Suivi Passage ──────────────────────────────────────────────────────────
const SuiviPassage = ({ children, updateParticipantHealth, canEdit, isMobile }) => {
    const ui = useUi();
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ childId: '', soignant: '', nature: '', soins: '', observation: '' });

    const allLogs = useMemo(() => {
        const logs = [];
        children.forEach(c => {
            (c.passageLogs || []).forEach(log => {
                logs.push({ ...log, childId: c.id, childName: `${c.firstName} ${(c.lastName || "").toUpperCase()}` });
            });
        });
        return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }, [children]);

    const handleAdd = () => {
        if (!form.childId || !form.soignant) { ui.toast('Vacancier et soignant obligatoires.', { type: 'error' }); return; }
        const child = children.find(c => c.id === form.childId);
        const newLog = { id: Date.now(), timestamp: new Date().toISOString(), soignant: form.soignant, nature: form.nature, soins: form.soins, observation: form.observation };
        const existing = Array.isArray(child.passageLogs) ? child.passageLogs : [];
        updateParticipantHealth(form.childId, 'passageLogs', [newLog, ...existing]);
        setForm({ childId: '', soignant: '', nature: '', soins: '', observation: '' });
        setShowForm(false);
        ui.toast('Passage enregistré.', { type: 'success' });
    };

    const handleDelete = (childId, logId) => {
        const child = children.find(c => c.id === childId);
        updateParticipantHealth(childId, 'passageLogs', (child.passageLogs || []).filter(l => l.id !== logId));
    };

    const handleExport = () => {
        const rows = allLogs.map(l => [
            new Date(l.timestamp).toLocaleDateString('fr-FR'),
            new Date(l.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            l.childName,
            l.soignant || '',
            l.nature || '',
            l.soins || '',
            l.observation || ''
        ]);
        printRegister(
            "Suivi des passages à l'infirmerie",
            `${allLogs.length} passage(s) — document à conserver`,
            ['Date', 'Heure', 'Vacancier', 'Soignant', 'Nature', 'Soins effectués', 'Observation'],
            rows
        );
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="u-flex u-flex-between">
                <div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: '950', color: 'var(--text-main)', letterSpacing: '-0.03em', margin: 0 }}>Suivi Passage Infirmerie</h2>
                    <p className="u-text-sm u-text-muted u-font-bold" style={{ margin: '4px 0 0' }}>{allLogs.length} passage{allLogs.length !== 1 ? 's' : ''} enregistré{allLogs.length !== 1 ? 's' : ''}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={handleExport} disabled={allLogs.length === 0} title="Exporter / imprimer le suivi"
                        style={{ height: '40px', padding: '0 1.1rem', borderRadius: '12px', fontSize: '0.82rem', fontWeight: '950', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1.5px solid var(--glass-border)', background: 'white', color: 'var(--text-muted)', cursor: allLogs.length === 0 ? 'not-allowed' : 'pointer', opacity: allLogs.length === 0 ? 0.5 : 1 }}>
                        <Printer size={16} strokeWidth={2.5} /> Exporter PDF
                    </button>
                    {canEdit && (
                        <button onClick={() => setShowForm(v => !v)} className="btn btn-primary" style={{ height: '40px', padding: '0 1.25rem', borderRadius: '12px', fontSize: '0.82rem', fontWeight: '950', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Plus size={16} strokeWidth={3} /> Nouveau passage
                        </button>
                    )}
                </div>
            </div>

            {showForm && (
                <div className="card-glass animate-fade-in" style={{ padding: '1.5rem', borderRadius: '24px', border: '2px solid var(--primary-color)', background: 'white' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={labelStyle}>Vacancier</label>
                            <select className="glass-input" value={form.childId} onChange={e => setForm(f => ({ ...f, childId: e.target.value }))} style={{ height: '44px', fontWeight: '800' }}>
                                <option value="">Sélectionner…</option>
                                {children.map(c => <option key={c.id} value={c.id}>{c.firstName} {(c.lastName || "").toUpperCase()}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Soignant</label>
                            <input className="glass-input" placeholder="Prénom du soignant" value={form.soignant} onChange={e => setForm(f => ({ ...f, soignant: e.target.value }))} style={{ height: '44px', fontWeight: '800' }} />
                        </div>
                        <div>
                            <label style={labelStyle}>Nature du passage</label>
                            <input className="glass-input" placeholder="Ex: Fièvre, Douleur abdominale, Chute…" value={form.nature} onChange={e => setForm(f => ({ ...f, nature: e.target.value }))} style={{ height: '44px', fontWeight: '800' }} />
                        </div>
                        <div>
                            <label style={labelStyle}>Soins effectués</label>
                            <input className="glass-input" placeholder="Ex: Pansement, Doliprane 500mg…" value={form.soins} onChange={e => setForm(f => ({ ...f, soins: e.target.value }))} style={{ height: '44px', fontWeight: '800' }} />
                        </div>
                        <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                            <label style={labelStyle}>Observation</label>
                            <textarea className="glass-input" placeholder="Observation complémentaire, consignes de suivi…" value={form.observation} onChange={e => setForm(f => ({ ...f, observation: e.target.value }))} style={{ height: '80px', padding: '0.75rem', resize: 'none', borderRadius: '14px', fontWeight: '700' }} />
                        </div>
                    </div>
                    <div className="u-flex u-justify-end u-gap-sm">
                        <button onClick={() => setShowForm(false)} style={{ height: '44px', padding: '0 1.25rem', borderRadius: '12px', border: '1.5px solid var(--glass-border)', background: 'white', color: 'var(--text-muted)', fontWeight: '900', fontSize: '0.85rem', cursor: 'pointer' }}>Annuler</button>
                        <button onClick={handleAdd} className="btn btn-primary" style={{ height: '44px', padding: '0 1.5rem', borderRadius: '12px', fontWeight: '950', fontSize: '0.85rem' }}>Enregistrer</button>
                    </div>
                </div>
            )}

            <div className="u-table-wrap">
                {allLogs.length === 0 ? (
                    <EmptyState icon={<Stethoscope size={40} strokeWidth={1.5} />} title="Aucun passage enregistré." />
                ) : (
                    <table className="u-table">
                        <thead>
                            <tr style={{ background: 'var(--bg-main)', borderBottom: '1.5px solid var(--glass-border)' }}>
                                <th style={thStyle}>Date</th>
                                <th style={thStyle}>Heure</th>
                                <th style={thStyle}>Vacancier</th>
                                <th style={thStyle}>Soignant</th>
                                <th style={thStyle}>Nature</th>
                                <th style={thStyle}>Soins effectués</th>
                                <th style={thStyle}>Observation</th>
                                {canEdit && <th style={{ ...thStyle, width: '48px' }}></th>}
                            </tr>
                        </thead>
                        <tbody>
                            {allLogs.map(log => (
                                <tr key={log.id} style={{ borderBottom: '1px solid var(--glass-border)' }} className="hover-row">
                                    <td style={tdStyle}>{new Date(log.timestamp).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })}</td>
                                    <td style={tdStyle}><span style={{ fontWeight: '800', color: 'var(--primary-color)' }}>{new Date(log.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span></td>
                                    <td style={tdStyle}><span style={{ fontWeight: '900' }}>{log.childName}</span></td>
                                    <td style={tdStyle}><span style={{ fontWeight: '800' }}>{log.soignant}</span></td>
                                    <td style={tdStyle}>{log.nature
                                        ? <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'oklch(52% 0.22 232)', background: 'oklch(96% 0.06 232)', padding: '3px 10px', borderRadius: '8px' }}>{log.nature}</span>
                                        : <span style={{ opacity: 0.3 }}>—</span>}
                                    </td>
                                    <td style={tdStyle}><span style={{ fontSize: '0.85rem' }}>{log.soins || '—'}</span></td>
                                    <td style={{ ...tdStyle, maxWidth: '220px' }}><span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{log.observation || '—'}</span></td>
                                    {canEdit && (
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <button onClick={() => handleDelete(log.childId, log.id)} style={{ minWidth: '44px', minHeight: '44px', borderRadius: '8px', border: '1.5px solid var(--glass-border)', background: 'white', color: 'var(--danger-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

// ─── RegistreInfi Container ─────────────────────────────────────────────────
const RegistreInfi = ({ children, groups, updateParticipantHealth, isMobile,
    showMeds = true, canEditMeds = true, showPassages = true, canEditPassages = true }) => {
    const TABS = [
        ...(showMeds ? [{ id: 'meds', label: 'Administration & Traitements', icon: <Pill size={15} /> }] : []),
        ...(showPassages ? [{ id: 'passage', label: 'Suivi Passage Infi', icon: <ClipboardList size={15} /> }] : []),
    ];
    const [activeSection, setActiveSection] = useState(TABS[0]?.id || 'meds');

    // Garde l'onglet interne sur une section visible si les droits changent.
    useEffect(() => {
        if (TABS.length && !TABS.some(t => t.id === activeSection)) {
            setActiveSection(TABS[0].id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showMeds, showPassages]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {TABS.length > 1 && (
                <div style={{ display: 'flex', gap: '0.35rem', background: 'rgba(0,0,0,0.05)', padding: '4px', borderRadius: '14px', alignSelf: 'flex-start' }}>
                    {TABS.map(tab => (
                        <button key={tab.id} onClick={() => setActiveSection(tab.id)} style={{
                            padding: '0.55rem 1.1rem', borderRadius: '10px', border: 'none', cursor: 'pointer',
                            fontSize: '0.78rem', transition: 'all 0.2s',
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            background: activeSection === tab.id ? 'white' : 'transparent',
                            boxShadow: activeSection === tab.id ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                            color: activeSection === tab.id ? 'var(--primary-color)' : 'var(--text-muted)',
                            fontWeight: activeSection === tab.id ? '950' : '800'
                        }}>
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>
            )}

            {activeSection === 'meds' && showMeds
                ? <RegistreMeds children={children} groups={groups} updateParticipantHealth={updateParticipantHealth} canEdit={canEditMeds} isMobile={isMobile} />
                : activeSection === 'passage' && showPassages
                ? <SuiviPassage children={children} groups={groups} updateParticipantHealth={updateParticipantHealth} canEdit={canEditPassages} isMobile={isMobile} />
                : null
            }
        </div>
    );
};

export default RegistreInfi;
