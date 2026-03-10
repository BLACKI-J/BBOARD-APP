import React, { useState } from 'react';
import { Printer, Calendar, MapPin, Users, CheckSquare, Square, Tent, Trash2, Save, Clock, ArrowLeft, Eye, UserCheck, FileText, ChevronDown } from 'lucide-react';

/* ─────────────────────────────────────────────
   PRINT DOCUMENT — rendu uniquement à l'impression
───────────────────────────────────────────── */
const PrintContent = ({ date, destination, startTime, endTime, selectedChildren, selectedAnimatorList, referent, checklistItems }) => (
    <div style={{ fontFamily: 'Arial, sans-serif', color: '#000', fontSize: '13px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
            <div style={{ textAlign: 'center' }}>
                <Tent size={36} />
                <div style={{ fontSize: '9px', fontWeight: 'bold', marginTop: '2px' }}>COLO APP</div>
            </div>
            <div style={{ textAlign: 'center' }}>
                <h1 style={{ fontSize: '26px', fontWeight: '900', margin: 0, letterSpacing: '2px', textTransform: 'uppercase' }}>Fiche de sortie</h1>
                <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>Document officiel — À conserver</div>
            </div>
            <div style={{ textAlign: 'center' }}>
                <Tent size={36} />
                <div style={{ fontSize: '9px', fontWeight: 'bold', marginTop: '2px' }}>COLO APP</div>
            </div>
        </div>

        {/* Info Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px', fontSize: '12px' }}>
            <tbody>
                <tr>
                    <td style={{ border: '1px solid #000', padding: '6px 10px', width: '50%', background: '#f5f5f5' }}>
                        <span style={{ fontWeight: 'bold' }}>📅 Date de la sortie :</span><br />
                        <span style={{ fontSize: '14px' }}>{date ? new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Non précisée'}</span>
                    </td>
                    <td style={{ border: '1px solid #000', padding: '6px 10px' }}>
                        <span style={{ fontWeight: 'bold' }}>📍 Destination :</span><br />
                        <span style={{ fontSize: '14px' }}>{destination || '—'}</span>
                    </td>
                </tr>
                <tr>
                    <td style={{ border: '1px solid #000', padding: '6px 10px', background: '#f5f5f5' }}>
                        <span style={{ fontWeight: 'bold' }}>🕐 Heure de départ :</span> {startTime}
                        &nbsp;&nbsp;&nbsp;
                        <span style={{ fontWeight: 'bold' }}>🕔 Retour :</span> {endTime}
                    </td>
                    <td style={{ border: '1px solid #000', padding: '6px 10px' }}>
                        <span style={{ fontWeight: 'bold' }}>👥 Effectifs :</span> {selectedChildren.length} vacanciers, {selectedAnimatorList.length} animateurs
                    </td>
                </tr>
                <tr>
                    <td colSpan={2} style={{ border: '1px solid #000', padding: '6px 10px', background: '#f5f5f5' }}>
                        <span style={{ fontWeight: 'bold' }}>👤 Animateurs : </span>
                        {selectedAnimatorList.length > 0
                            ? selectedAnimatorList.map(a => `${a.firstName} ${a.lastName}`).join(', ')
                            : 'Aucun'}
                    </td>
                </tr>
            </tbody>
        </table>

        {/* Vacanciers */}
        <div style={{ background: '#222', color: 'white', fontWeight: 'bold', textAlign: 'center', padding: '5px 0', fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Liste des vacanciers — {selectedChildren.length} enfant(s)
        </div>
        <div style={{ border: '1px solid #000', borderTop: 'none', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
            {Array.from({ length: Math.max(selectedChildren.length, 24) }).map((_, i) => {
                const child = selectedChildren[i];
                return (
                    <div key={i} style={{
                        borderRight: (i + 1) % 3 === 0 ? 'none' : '1px solid #ccc',
                        borderBottom: '1px solid #ccc',
                        padding: '5px 8px',
                        minHeight: '26px',
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: i % 2 === 0 ? '#fff' : '#fafafa'
                    }}>
                        <span style={{ color: '#999', fontSize: '10px', minWidth: '18px' }}>{i + 1}.</span>
                        <span style={{ fontWeight: child ? '600' : 'normal' }}>
                            {child ? `${(child.lastName || '').toUpperCase()} ${child.firstName || ''}` : ''}
                        </span>
                    </div>
                );
            })}
        </div>

        {/* Footer */}
        <div style={{ marginTop: '10px', border: '1px solid #000', padding: '10px', background: '#f9f9f9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                    <span style={{ fontWeight: 'bold' }}>Référent de la sortie : </span>
                    <span style={{ textDecoration: 'underline' }}>{referent || '___________________________'}</span>
                </div>
                <div style={{ border: '1px solid #000', padding: '4px 16px', fontSize: '11px', textAlign: 'center' }}>
                    <div style={{ fontWeight: 'bold' }}>Signature direction</div>
                    <div style={{ height: '30px' }}></div>
                </div>
            </div>

            <div style={{ fontWeight: 'bold', textAlign: 'center', marginBottom: '6px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                ✓ Checklist de la sortie
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', border: '1px solid #000' }}>
                {checklistItems.map((item, i) => (
                    <div key={i} style={{
                        padding: '5px 8px',
                        borderRight: (i + 1) % 3 === 0 ? 'none' : '1px solid #000',
                        borderBottom: i < checklistItems.length - 3 ? '1px solid #000' : 'none',
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        <div style={{ width: '14px', height: '14px', border: '1.5px solid #333', borderRadius: '3px', flexShrink: 0 }}></div>
                        {item}
                    </div>
                ))}
            </div>
        </div>
    </div>
);


/* ─────────────────────────────────────────────
   COMPOSANT PRINCIPAL
───────────────────────────────────────────── */
export default function ExitSheet({ participants, groups }) {
    const [destination, setDestination] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [startTime, setStartTime] = useState('14:00');
    const [endTime, setEndTime] = useState('17:00');
    const [referent, setReferent] = useState('');
    const [fileName, setFileName] = useState('');
    const [history, setHistory] = useState([]);
    const [showPreview, setShowPreview] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [selectedAnimators, setSelectedAnimators] = useState([]);
    const [filterGroup, setFilterGroup] = useState('all');
    const [saveStatus, setSaveStatus] = useState(null); // null | 'saving' | 'saved' | 'error'

    const checklistItems = [
        "Trousse de secours", "Eau", "Gobelet",
        "Goûter", "Traitement si besoin", "Casquette",
        "Crème solaire", "Argent de poche", "Rechange si besoin"
    ];

    const fetchHistory = async () => {
        try {
            const res = await fetch('/api/exit-sheets');
            const data = await res.json();
            setHistory(data);
        } catch (err) { console.error(err); }
    };

    React.useEffect(() => { fetchHistory(); }, []);

    React.useEffect(() => {
        const safe = destination.trim().replace(/[^a-z0-9]/gi, '_');
        setFileName(`Fiche_Sortie_${safe || 'Sans_Nom'}_${date}`);
    }, [destination, date]);

    const getFilteredParticipants = () => {
        let list = participants.filter(p => p.role === 'child');
        if (filterGroup !== 'all') list = list.filter(p => p.group === filterGroup);
        return list.sort((a, b) => (a.lastName || '').localeCompare(b.lastName || ''));
    };

    const toggleParticipant = (id) =>
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    const toggleAnimator = (id) =>
        setSelectedAnimators(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    const toggleAllVisible = () => {
        const ids = getFilteredParticipants().map(p => p.id);
        const allSel = ids.every(id => selectedIds.includes(id));
        setSelectedIds(allSel
            ? selectedIds.filter(id => !ids.includes(id))
            : [...new Set([...selectedIds, ...ids])]
        );
    };

    const saveExitSheet = async (silent = false) => {
        if (!silent) setSaveStatus('saving');
        const sheetId = crypto?.randomUUID?.() ?? `sheet_${Date.now()}`;
        const sheetData = { id: sheetId, destination, date, startTime, endTime, referent, fileName, selectedIds, selectedAnimators, timestamp: new Date().toISOString() };
        try {
            const res = await fetch('/api/exit-sheets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sheetData)
            });
            if (res.ok) {
                await fetchHistory();
                if (!silent) {
                    setSaveStatus('saved');
                    setTimeout(() => setSaveStatus(null), 2500);
                }
            }
        } catch (err) {
            console.error(err);
            if (!silent) setSaveStatus('error');
        }
    };

    const handlePrint = async () => {
        await saveExitSheet(true);
        const orig = document.title;
        document.title = (fileName || 'Fiche_Sortie').replace(/ /g, '_');
        setTimeout(() => { window.print(); document.title = orig; }, 500);
    };

    const deleteSheet = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm('Supprimer cette fiche ?')) return;
        try {
            const res = await fetch(`/api/exit-sheets/${id}`, { method: 'DELETE' });
            if (res.ok) await fetchHistory();
        } catch (err) { console.error(err); }
    };

    const loadFromHistory = (sheet) => {
        setDestination(sheet.destination || '');
        setDate(sheet.date || '');
        setStartTime(sheet.startTime || '');
        setEndTime(sheet.endTime || '');
        setReferent(sheet.referent || '');
        setFileName(sheet.fileName || '');
        setSelectedIds(sheet.selectedIds || []);
        setSelectedAnimators(sheet.selectedAnimators || []);
        setShowPreview(true);
    };

    const filteredParticipants = getFilteredParticipants();
    const animators = participants.filter(p => p.role === 'animator' || p.role === 'direction');
    const selectedChildren = participants
        .filter(p => selectedIds.includes(p.id))
        .sort((a, b) => (a.lastName || '').localeCompare(b.lastName || ''));
    const selectedAnimatorList = participants.filter(p => selectedAnimators.includes(p.id));

    // Style helpers
    const headerGradient = 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)';
    const cardStyle = { background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' };

    return (
        <div className="exit-sheet-container" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

            {/* ── SCREEN: CONFIG VIEW ── */}
            {!showPreview ? (
                <div className="no-print" style={{ height: '100%', overflowY: 'auto', background: 'linear-gradient(160deg, #f8faff 0%, #f0f4ff 100%)' }}>
                    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem' }}>

                        {/* Page Header */}
                        <div className="es-page-header" style={{
                            background: headerGradient, borderRadius: '20px', padding: '1.5rem 2rem',
                            marginBottom: '2rem', display: 'flex', justifyContent: 'space-between',
                            alignItems: 'center', boxShadow: '0 8px 32px rgba(99,102,241,0.3)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '12px', padding: '0.75rem', display: 'flex' }}>
                                    <MapPin size={28} color="white" />
                                </div>
                                <div>
                                    <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'white', margin: 0 }}>Fiche de Sortie</h1>
                                    <p style={{ color: 'rgba(255,255,255,0.75)', margin: 0, fontSize: '0.9rem' }}>Préparez et imprimez la fiche officielle</p>
                                </div>
                            </div>
                            <div className="es-header-actions" style={{ display: 'flex', gap: '0.75rem' }}>
                                <button
                                    onClick={() => setShowPreview(true)}
                                    style={{
                                        background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
                                        color: 'white', borderRadius: '10px', padding: '0.65rem 1.25rem',
                                        fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                                        backdropFilter: 'blur(8px)', fontSize: '0.9rem'
                                    }}
                                >
                                    <Eye size={18} /> Aperçu
                                </button>
                                <button
                                    onClick={() => saveExitSheet(false)}
                                    style={{
                                        background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
                                        color: 'white', borderRadius: '10px', padding: '0.65rem 1.25rem',
                                        fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                                        backdropFilter: 'blur(8px)', fontSize: '0.9rem',
                                        opacity: saveStatus === 'saving' ? 0.7 : 1
                                    }}
                                    disabled={saveStatus === 'saving'}
                                >
                                    <Save size={18} />
                                    {saveStatus === 'saving' ? 'Enregistrement...' : saveStatus === 'saved' ? '✓ Enregistré !' : 'Enregistrer'}
                                </button>
                                <button
                                    onClick={handlePrint}
                                    style={{
                                        background: 'white', border: 'none',
                                        color: '#4f46e5', borderRadius: '10px', padding: '0.65rem 1.5rem',
                                        fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontSize: '0.9rem'
                                    }}
                                >
                                    <Printer size={18} /> Imprimer
                                </button>
                            </div>
                        </div>


                        {/* Main Grid */}
                        <div className="es-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '1.5rem', alignItems: 'start' }}>

                            {/* LEFT — Sélections */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                                {/* Animateur chips */}
                                <div style={{ ...cardStyle, padding: '1.5rem' }}>
                                    <h2 style={{ fontSize: '1rem', fontWeight: '700', color: '#1e293b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <UserCheck size={18} color="#10b981" /> Sélection des animateurs
                                    </h2>
                                    {animators.length === 0 ? (
                                        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Aucun animateur trouvé.</p>
                                    ) : (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                            {animators.map(anim => {
                                                const sel = selectedAnimators.includes(anim.id);
                                                return (
                                                    <button
                                                        key={anim.id}
                                                        onClick={() => toggleAnimator(anim.id)}
                                                        style={{
                                                            padding: '0.45rem 1rem', borderRadius: '999px',
                                                            border: `2px solid ${sel ? '#10b981' : '#e2e8f0'}`,
                                                            background: sel ? '#ecfdf5' : 'white',
                                                            color: sel ? '#065f46' : '#475569',
                                                            cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem',
                                                            transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '0.4rem'
                                                        }}
                                                    >
                                                        {sel && <CheckSquare size={14} />}
                                                        {anim.firstName} {anim.lastName}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Vacanciers list */}
                                <div style={{ ...cardStyle, overflow: 'hidden' }}>
                                    {/* Toolbar */}
                                    <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafbff' }}>
                                        <h2 style={{ fontSize: '1rem', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                                            <Users size={18} color="#6366f1" /> Vacanciers
                                            <span style={{ background: '#6366f1', color: 'white', borderRadius: '999px', padding: '1px 8px', fontSize: '0.75rem', fontWeight: '700' }}>
                                                {selectedIds.length}/{participants.filter(p => p.role === 'child').length}
                                            </span>
                                        </h2>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                                <select
                                                    value={filterGroup}
                                                    onChange={e => setFilterGroup(e.target.value)}
                                                    style={{
                                                        padding: '0.4rem 2rem 0.4rem 0.75rem', fontSize: '0.85rem',
                                                        border: '1px solid #e2e8f0', borderRadius: '8px',
                                                        background: 'white', color: '#334155', appearance: 'none',
                                                        cursor: 'pointer', outline: 'none'
                                                    }}
                                                >
                                                    <option value="all">Tous les groupes</option>
                                                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                                </select>
                                                <ChevronDown size={14} style={{ position: 'absolute', right: '6px', color: '#94a3b8', pointerEvents: 'none' }} />
                                            </div>
                                            <button
                                                onClick={toggleAllVisible}
                                                style={{
                                                    background: '#f1f5f9', border: 'none', borderRadius: '8px',
                                                    padding: '0.4rem 0.9rem', fontSize: '0.8rem',
                                                    color: '#4f46e5', fontWeight: '600', cursor: 'pointer'
                                                }}
                                            >
                                                Tout sélectionner
                                            </button>
                                        </div>
                                    </div>

                                    {/* List */}
                                    <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
                                        {filteredParticipants.length === 0 ? (
                                            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
                                                Aucun vacancier dans ce groupe.
                                            </div>
                                        ) : filteredParticipants.map((p, idx) => {
                                            const sel = selectedIds.includes(p.id);
                                            const groupName = groups.find(g => g.id === p.group)?.name;
                                            return (
                                                <div
                                                    key={p.id}
                                                    onClick={() => toggleParticipant(p.id)}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '1rem',
                                                        padding: '0.7rem 1.5rem',
                                                        borderBottom: idx < filteredParticipants.length - 1 ? '1px solid #f8fafc' : 'none',
                                                        cursor: 'pointer',
                                                        background: sel ? 'linear-gradient(90deg, #eef2ff, #f5f3ff)' : 'white',
                                                        transition: 'background 0.15s'
                                                    }}
                                                >
                                                    <div style={{ color: sel ? '#6366f1' : '#cbd5e1', transition: 'color 0.15s', flexShrink: 0 }}>
                                                        {sel ? <CheckSquare size={20} /> : <Square size={20} />}
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: '600', color: sel ? '#4338ca' : '#334155', fontSize: '0.9rem' }}>
                                                            {p.firstName} {p.lastName}
                                                        </div>
                                                        {groupName && (
                                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Groupe {groupName}</div>
                                                        )}
                                                    </div>
                                                    {sel && (
                                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1', flexShrink: 0 }}></div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT — Form + History */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                                {/* Form */}
                                <div style={{ ...cardStyle, padding: '1.5rem' }}>
                                    <h2 style={{ fontSize: '1rem', fontWeight: '700', color: '#1e293b', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <FileText size={18} color="#6366f1" /> Informations
                                    </h2>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {[
                                            { label: 'Destination', node: <input type="text" className="input-field" value={destination} onChange={e => setDestination(e.target.value)} placeholder="Ex: Piscine, 12 rue du Lac..." /> },
                                            { label: 'Date', node: <input type="date" className="input-field" value={date} onChange={e => setDate(e.target.value)} /> },
                                        ].map(({ label, node }) => (
                                            <div key={label}>
                                                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#64748b', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
                                                {node}
                                            </div>
                                        ))}

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                            {[['Départ', startTime, setStartTime], ['Retour', endTime, setEndTime]].map(([label, val, setter]) => (
                                                <div key={label}>
                                                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#64748b', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
                                                    <input type="time" className="input-field" value={val} onChange={e => setter(e.target.value)} />
                                                </div>
                                            ))}
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#64748b', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Référent</label>
                                            <select className="input-field" value={referent} onChange={e => setReferent(e.target.value)}>
                                                <option value="">Sélectionner un référent...</option>
                                                {animators.map(a => (
                                                    <option key={a.id} value={`${a.firstName} ${a.lastName}`}>{a.firstName} {a.lastName}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div style={{ paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                                            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#64748b', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nom du fichier PDF</label>
                                            <input type="text" className="input-field" value={fileName} onChange={e => setFileName(e.target.value)} placeholder="Nom_du_fichier" />
                                            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.3rem' }}>Nom suggéré pour l'enregistrement PDF.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* History */}
                                <div style={{ ...cardStyle, padding: '1.5rem' }}>
                                    <h2 style={{ fontSize: '1rem', fontWeight: '700', color: '#1e293b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Calendar size={18} color="#8b5cf6" /> Historique
                                        {history.length > 0 && (
                                            <span style={{ background: '#8b5cf6', color: 'white', borderRadius: '999px', padding: '1px 8px', fontSize: '0.75rem', fontWeight: '700' }}>
                                                {history.length}
                                            </span>
                                        )}
                                    </h2>
                                    <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {history.length === 0 ? (
                                            <p style={{ color: '#94a3b8', fontSize: '0.875rem', textAlign: 'center', padding: '1.5rem 0' }}>Aucun historique.</p>
                                        ) : history.map((sheet, idx) => (
                                            <div
                                                key={sheet.id || idx}
                                                onClick={() => loadFromHistory(sheet)}
                                                style={{
                                                    padding: '0.75rem 1rem', borderRadius: '10px',
                                                    border: '1px solid #e2e8f0', cursor: 'pointer',
                                                    background: '#fafbff', transition: 'all 0.15s',
                                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                                }}
                                                onMouseOver={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.background = '#eef2ff'; }}
                                                onMouseOut={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#fafbff'; }}
                                            >
                                                <div>
                                                    <div style={{ fontWeight: '600', fontSize: '0.875rem', color: '#334155' }}>
                                                        {sheet.destination || 'Sans destination'}
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                                                        {sheet.date ? new Date(sheet.date).toLocaleDateString('fr-FR') : '?'} · {sheet.startTime}–{sheet.endTime}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={e => deleteSheet(e, sheet.id)}
                                                    style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '4px', borderRadius: '6px', display: 'flex' }}
                                                    onMouseOver={e => e.currentTarget.style.color = '#ef4444'}
                                                    onMouseOut={e => e.currentTarget.style.color = '#cbd5e1'}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            ) : (
                /* ── SCREEN: PREVIEW VIEW ── */
                <div className="no-print" style={{ flex: 1, overflowY: 'auto', background: '#374151', padding: '2rem' }}>
                    {/* Preview Toolbar */}
                    <div style={{
                        maxWidth: '820px', margin: '0 auto 1.5rem',
                        background: 'white', borderRadius: '14px', padding: '1rem 1.5rem',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
                    }}>
                        <button
                            onClick={() => setShowPreview(false)}
                            style={{ background: '#f1f5f9', border: 'none', borderRadius: '10px', padding: '0.6rem 1.2rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569' }}
                        >
                            <ArrowLeft size={18} /> Retour
                        </button>
                        <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '1rem' }}>Aperçu — Document A4</div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button onClick={() => saveExitSheet(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '10px', padding: '0.6rem 1.2rem', fontWeight: '600', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Save size={16} /> Enregistrer
                            </button>
                            <button onClick={handlePrint} style={{ background: '#4f46e5', color: 'white', border: 'none', borderRadius: '10px', padding: '0.6rem 1.2rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(79,70,229,0.4)' }}>
                                <Printer size={16} /> Imprimer
                            </button>
                        </div>
                    </div>

                    {/* A4 Document Preview */}
                    <div style={{
                        maxWidth: '820px', margin: '0 auto',
                        background: 'white', padding: '1.5cm',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                        minHeight: '29.7cm', borderRadius: '2px'
                    }}>
                        <PrintContent
                            date={date} destination={destination} startTime={startTime} endTime={endTime}
                            selectedChildren={selectedChildren} selectedAnimatorList={selectedAnimatorList}
                            referent={referent} checklistItems={checklistItems}
                        />
                    </div>
                </div>
            )}

            {/* ── PRINT ONLY ── */}
            <div className="print-view">
                <PrintContent
                    date={date} destination={destination} startTime={startTime} endTime={endTime}
                    selectedChildren={selectedChildren} selectedAnimatorList={selectedAnimatorList}
                    referent={referent} checklistItems={checklistItems}
                />
            </div>

            <style>{`
                .print-view { display: none; }

                /* ── MOBILE RESPONSIVE ── */
                @media (max-width: 768px) {
                    .es-page-header {
                        flex-direction: column !important;
                        align-items: flex-start !important;
                        gap: 1rem !important;
                        padding: 1.25rem !important;
                        border-radius: 14px !important;
                    }
                    .es-header-actions {
                        width: 100% !important;
                        flex-wrap: wrap !important;
                    }
                    .es-header-actions button {
                        flex: 1 !important;
                        justify-content: center !important;
                        min-width: 100px !important;
                    }
                    .es-stats-grid {
                        grid-template-columns: 1fr 1fr !important;
                    }
                    .es-main-grid {
                        grid-template-columns: 1fr !important;
                    }
                }

                @media (max-width: 480px) {
                    .es-stats-grid {
                        grid-template-columns: 1fr !important;
                    }
                    .es-header-actions {
                        flex-direction: column !important;
                    }
                    .es-header-actions button {
                        width: 100% !important;
                    }
                }

                @media print {
                    body * { visibility: hidden !important; overflow: visible !important; }
                    .print-view, .print-view * { visibility: visible !important; }
                    .print-view {
                        position: absolute !important; left: 0 !important; top: 0 !important;
                        width: 100% !important; display: block !important;
                        background: white !important; padding: 1cm !important;
                    }
                    html, body, #root, .app-container, .main-content, .workspace-area, .exit-sheet-container, .animate-fade-in {
                        height: auto !important; min-height: auto !important; max-height: none !important;
                        overflow: visible !important; display: block !important;
                        background: white !important; padding: 0 !important; margin: 0 !important; transform: none !important;
                    }
                    @page { size: A4 portrait; margin: 0; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
            `}</style>
        </div>
    );
}