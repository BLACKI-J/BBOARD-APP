import React, { useState } from 'react';
import { 
    MapPin, Calendar, Clock, Users, UserCheck, 
    Save, Printer, Eye, Trash2, ArrowLeft, 
    CheckSquare, Square, ChevronDown, FileText
} from 'lucide-react';
import { useUi } from '../ui/UiProvider';

function PrintContent({ date, destination, startTime, endTime, selectedChildren, selectedAnimatorList, referent, checklistItems }) {
    return (
        <div style={{ color: 'black', fontFamily: 'serif', fontSize: '11pt' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid black', paddingBottom: '0.5cm', marginBottom: '0.5cm' }}>
                <div>
                    <h1 style={{ fontSize: '24pt', margin: 0, fontWeight: 'bold' }}>FICHE DE SORTIE</h1>
                    <p style={{ margin: '5px 0 0', fontSize: '12pt' }}>Document de suivi officiel</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14pt' }}>Date: {date ? new Date(date).toLocaleDateString('fr-FR') : '________________'}</div>
                    <div style={{ marginTop: '5px' }}>Lieu: {destination || '_________________________'}</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1cm', marginBottom: '0.8cm' }}>
                <div style={{ border: '1px solid black', padding: '10px' }}>
                    <h3 style={{ margin: '0 0 8px', fontSize: '12pt', textDecoration: 'underline' }}>HORAIRES</h3>
                    <p style={{ margin: '5px 0' }}>Départ: <strong>{startTime || '____:____'}</strong></p>
                    <p style={{ margin: '5px 0' }}>Retour prévu: <strong>{endTime || '____:____'}</strong></p>
                </div>
                <div style={{ border: '1px solid black', padding: '10px' }}>
                    <h3 style={{ margin: '0 0 8px', fontSize: '12pt', textDecoration: 'underline' }}>RESPONSABLE</h3>
                    <p style={{ margin: '5px 0' }}>Référent de sortie: <strong>{referent || '________________'}</strong></p>
                </div>
            </div>

            <div style={{ marginBottom: '0.8cm' }}>
                <h3 style={{ borderBottom: '1px solid black', paddingBottom: '3px', fontSize: '12pt', marginBottom: '10px' }}>ANIMATEURS PRÉSENTS ({selectedAnimatorList.length})</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {selectedAnimatorList.map(a => (
                        <span key={a.id} style={{ border: '1px solid #ccc', padding: '3px 8px', borderRadius: '4px', fontSize: '10pt' }}>
                            {a.firstName} {a.lastName}
                        </span>
                    ))}
                    {selectedAnimatorList.length === 0 && Array.from({ length: 4 }).map((_, i) => <span key={i}>___________________ &nbsp;</span>)}
                </div>
            </div>

            <div style={{ marginBottom: '0.8cm' }}>
                <h3 style={{ borderBottom: '1px solid black', paddingBottom: '3px', fontSize: '12pt', marginBottom: '10px' }}>LISTE DES PARTICIPANTS ({selectedChildren.length})</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '5px' }}>
                    {selectedChildren.map((p, idx) => (
                        <div key={p.id} style={{ fontSize: '9pt', borderBottom: '0.5px solid #eee', paddingBottom: '2px' }}>
                            {idx + 1}. {p.lastName.toUpperCase()} {p.firstName}
                        </div>
                    ))}
                    {selectedChildren.length === 0 && <div style={{ fontStyle: 'italic', gridColumn: 'span 3' }}>Aucun enfant sélectionné.</div>}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1cm' }}>
                <div style={{ border: '0.5px solid #666', padding: '10px', fontSize: '9pt' }}>
                    <h4 style={{ margin: '0 0 5px', fontSize: '10pt', fontWeight: 'bold' }}>CHECK-LIST SÉCURITÉ</h4>
                    {checklistItems.map(item => (
                        <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                            <div style={{ width: '12px', height: '12px', border: '1px solid black' }}></div>
                            {item}
                        </div>
                    ))}
                </div>
                <div style={{ border: '0.5px solid #666', padding: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <h4 style={{ margin: '0 0 5px', fontSize: '10pt', fontWeight: 'bold' }}>VISAS / SIGNATURES</h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8pt', height: '2cm' }}>
                        <div>Signature Référent:</div>
                        <div>Visa Direction:</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ExitSheet({ participants, groups, canEdit = true, actorHeaders = { 'Content-Type': 'application/json' }, exitSheets = [], setExitSheets, isMobile }) {
    const ui = useUi();
    const [destination, setDestination] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [startTime, setStartTime] = useState('14:00');
    const [endTime, setEndTime] = useState('17:00');
    const [referent, setReferent] = useState('');
    const [fileName, setFileName] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [selectedAnimators, setSelectedAnimators] = useState([]);
    const [filterGroup, setFilterGroup] = useState('all');
    const [saveStatus, setSaveStatus] = useState(null); // null | 'saving' | 'saved' | 'error'

    const history = exitSheets;

    const checklistItems = [
        "Trousse de secours", "Eau", "Gobelet",
        "Goûter", "Traitement si besoin", "Casquette",
        "Crème solaire", "Argent de poche", "Rechange si besoin"
    ];

    // No local fetch needed, handled by App.jsx props.

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
        if (!canEdit && !silent) {
            ui.toast('Enregistrement non autorise.', { type: 'error' });
            return;
        }
        if (!silent) setSaveStatus('saving');
        const sheetId = crypto?.randomUUID?.() ?? `sheet_${Date.now()}`;
        const sheetData = { id: sheetId, destination, date, startTime, endTime, referent, fileName, selectedIds, selectedAnimators, timestamp: new Date().toISOString() };
        
        setExitSheets([...exitSheets, sheetData]);
        
        if (!silent) {
            setSaveStatus('saved');
            ui.toast('Fiche enregistrée et synchronisée.', { type: 'success' });
            setTimeout(() => setSaveStatus(null), 2500);
        }
    };

    const handlePrint = async () => {
        if (!canEdit) {
            ui.toast('Impression non autorisee.', { type: 'error' });
            return;
        }
        await saveExitSheet(true);
        const orig = document.title;
        document.title = (fileName || 'Fiche_Sortie').replace(/ /g, '_');
        setTimeout(() => { window.print(); document.title = orig; }, 500);
    };

    const deleteSheet = async (e, id) => {
        if (!canEdit) return;
        e.stopPropagation();
        const ok = await ui.confirm({
            title: 'Supprimer la fiche',
            message: 'Supprimer cette fiche ?',
            confirmText: 'Supprimer',
            danger: true
        });
        if (!ok) return;
        setExitSheets(exitSheets.filter(s => s.id !== id));
        ui.toast('Fiche supprimee.', { type: 'success' });
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
    const glassCardStyle = { 
        background: 'rgba(255, 255, 255, 0.45)', 
        backdropFilter: 'blur(var(--glass-blur))', 
        borderRadius: '24px', 
        border: '1px solid var(--glass-border)', 
        boxShadow: 'var(--shadow-md)',
        transition: 'all var(--transition-normal)'
    };

    return (
        <div className="exit-sheet-container" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

            {/* ── SCREEN: CONFIG VIEW ── */}
            {!showPreview ? (
                <div className="no-print" style={{ height: '100%', overflowY: 'auto', background: 'var(--bg-main)' }}>
                    <div style={{ maxWidth: '1600px', width: '96%', margin: '0 auto', padding: '1.5rem' }}>

                        {/* Page Header Simplifié */}
                        <div className="es-page-header" style={{
                            background: 'rgba(255, 255, 255, 0.45)', backdropFilter: 'blur(16px)', borderRadius: isMobile ? '20px' : '24px', padding: isMobile ? '1.25rem' : '1rem 1.5rem',
                            marginBottom: '1.5rem', display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between',
                            alignItems: isMobile ? 'stretch' : 'center', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-lg)', gap: isMobile ? '1.25rem' : '1rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ background: 'var(--primary-gradient)', borderRadius: '12px', padding: '0.625rem', display: 'flex' }}>
                                    <MapPin size={22} color="white" />
                                </div>
                                <div>
                                    <h1 style={{ fontSize: isMobile ? '1.15rem' : '1.3rem', fontWeight: '950', color: 'var(--text-main)', margin: 0, letterSpacing: '-0.03em' }}>Fiche de Sortie</h1>
                                    <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.75rem', fontWeight: '700' }}>Édition rapide</p>
                                </div>
                            </div>
                            <div className="es-header-actions" style={{ display: 'flex', gap: '0.5rem', justifyContent: isMobile ? 'space-between' : 'flex-end' }}>
                                <button
                                    onClick={() => setShowPreview(true)}
                                    className="btn-glass"
                                    title="Aperçu"
                                    style={{ flex: isMobile ? 1 : 'none', padding: '0.5rem 0.75rem', borderRadius: '10px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                >
                                    <Eye size={18} /> {!isMobile && <span>Aperçu</span>}
                                </button>
                                <button
                                    onClick={() => saveExitSheet(false)}
                                    className="btn-glass"
                                    style={{ flex: isMobile ? 1 : 'none', padding: '0.5rem 0.75rem', borderRadius: '10px', fontSize: '0.85rem', color: saveStatus === 'saved' ? 'var(--success-color)' : 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                    disabled={saveStatus === 'saving'}
                                >
                                    {saveStatus === 'saving' ? <Clock size={16} className="animate-spin" /> : <Save size={18} />}
                                    {!isMobile && <span>{saveStatus === 'saved' ? 'Enregistré' : 'Enregistrer'}</span>}
                                </button>
                                <button
                                    onClick={handlePrint}
                                    className="btn btn-primary"
                                    style={{ flex: isMobile ? 1.5 : 'none', padding: '0.5rem 1rem', borderRadius: '10px', fontWeight: '900', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                >
                                    <Printer size={18} /> <span>Imprimer</span>
                                </button>
                            </div>
                        </div>

                        {/* Main Grid */}
                        <div className="es-main-grid" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>

                            {/* LEFT — Sélections */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                                {/* Animateurs (Badges interactifs) */}
                                <div style={{ ...glassCardStyle, padding: '1.25rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h2 style={{ fontSize: '0.8rem', fontWeight: '900', color: 'var(--text-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            <UserCheck size={16} /> Animateurs
                                        </h2>
                                        {selectedAnimators.length > 0 && (
                                            <div style={{ background: 'var(--primary-light)', color: 'var(--primary-color)', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '900' }}>
                                                {selectedAnimators.length}
                                            </div>
                                        )}
                                    </div>
                                    {animators.length === 0 ? (
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>Aucun animateur disponible.</p>
                                    ) : (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                            {animators.map(anim => {
                                                const sel = selectedAnimators.includes(anim.id);
                                                return (
                                                    <button
                                                        key={anim.id}
                                                        onClick={() => toggleAnimator(anim.id)}
                                                        className={sel ? 'btn-primary' : 'btn-glass'}
                                                        style={{
                                                            padding: '0.4rem 0.75rem', borderRadius: '10px',
                                                            fontSize: '0.8rem', fontWeight: '750',
                                                            display: 'flex', alignItems: 'center', gap: '0.35rem',
                                                            border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                                                            background: sel ? 'var(--primary-gradient)' : 'rgba(255, 255, 255, 0.55)',
                                                            color: sel ? 'white' : 'var(--text-main)',
                                                            boxShadow: sel ? '0 4px 10px rgba(37, 99, 235, 0.2)' : 'none'
                                                        }}
                                                    >
                                                        {sel && <CheckSquare size={13} strokeWidth={3} />}
                                                        {anim.firstName} {anim.lastName.charAt(0)}.
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Vacanciers (Liste compacte) */}
                                <div style={{ ...glassCardStyle, overflow: 'hidden' }}>
                                    <div style={{ padding: isMobile ? '1rem' : '0.875rem 1.25rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', background: 'rgba(255, 255, 255, 0.2)', gap: isMobile ? '0.75rem' : '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <h2 style={{ fontSize: '0.8rem', fontWeight: '900', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                    <Users size={16} /> Enfants
                                                </h2>
                                                <div style={{ background: 'var(--primary-light)', color: 'var(--primary-color)', borderRadius: '6px', padding: '2px 8px', fontSize: '10px', fontWeight: '900' }}>
                                                    {selectedIds.length} / {participants.filter(p => p.role === 'child').length}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: isMobile ? 'space-between' : 'flex-end' }}>
                                            <select
                                                value={filterGroup}
                                                onChange={e => setFilterGroup(e.target.value)}
                                                style={{
                                                    padding: '0.4rem 0.6rem', fontSize: '11px', fontWeight: '800',
                                                    border: '1px solid var(--border-color)', borderRadius: '8px',
                                                    background: 'white', color: 'var(--text-main)', outline: 'none', flex: isMobile ? 1 : 'none'
                                                }}
                                            >
                                                <option value="all">Groupes</option>
                                                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                            </select>
                                            <button
                                                onClick={toggleAllVisible}
                                                className="btn-glass"
                                                style={{ padding: '0.4rem 0.8rem', fontSize: '11px', fontWeight: '800', flex: isMobile ? 1 : 'none' }}
                                            >
                                                Tout cocher
                                            </button>
                                        </div>
                                    </div>

                                    <div style={{ maxHeight: '450px', overflowY: 'auto' }}>
                                        {filteredParticipants.length === 0 ? (
                                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Aucun enfant ici.</div>
                                        ) : filteredParticipants.map((p, idx) => {
                                            const sel = selectedIds.includes(p.id);
                                            const groupName = groups.find(g => g.id === p.group)?.name;
                                            return (
                                                <div
                                                    key={p.id}
                                                    onClick={() => toggleParticipant(p.id)}
                                                    className="list-p-item"
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                                                        padding: '0.625rem 1.25rem',
                                                        borderBottom: idx < filteredParticipants.length - 1 ? '1px solid var(--border-color)' : 'none',
                                                        cursor: 'pointer',
                                                        background: sel ? 'var(--primary-light)' : 'transparent',
                                                        transition: 'all 0.2s',
                                                    }}
                                                >
                                                    <div style={{ color: sel ? 'var(--primary-color)' : 'var(--text-muted)', display: 'flex' }}>
                                                        {sel ? <CheckSquare size={18} strokeWidth={3} /> : <Square size={18} />}
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontWeight: '750', color: 'var(--text-main)', fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {p.firstName} {p.lastName}
                                                        </div>
                                                    </div>
                                                    {groupName && (
                                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '800', background: 'rgba(0,0,0,0.03)', padding: '2px 6px', borderRadius: '4px' }}>{groupName}</div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT — Form + History */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                                {/* Form Section */}
                                <div style={{ ...glassCardStyle, padding: '1.25rem' }}>
                                    <h2 style={{ fontSize: '0.8rem', fontWeight: '900', color: 'var(--text-muted)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        <FileText size={16} /> Informations
                                    </h2>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Destination</label>
                                            <input type="text" className="input-field" value={destination} onChange={e => setDestination(e.target.value)} placeholder="Où allez-vous ?" />
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.75rem' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Date</label>
                                                <input type="date" className="input-field" value={date} onChange={e => setDate(e.target.value)} />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Référent</label>
                                                <select className="input-field" value={referent} onChange={e => setReferent(e.target.value)} style={{ fontSize: '0.85rem' }}>
                                                    <option value="">Choisir...</option>
                                                    {animators.map(a => (
                                                        <option key={a.id} value={`${a.firstName} ${a.lastName}`}>{a.firstName} {a.lastName}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.75rem' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Départ</label>
                                                <input type="time" className="input-field" value={startTime} onChange={e => setStartTime(e.target.value)} />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Retour</label>
                                                <input type="time" className="input-field" value={endTime} onChange={e => setEndTime(e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* History Section */}
                                <div style={{ ...glassCardStyle, padding: '1.25rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h2 style={{ fontSize: '0.8rem', fontWeight: '900', color: 'var(--text-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            <Clock size={16} /> Récents
                                        </h2>
                                        {history.length > 0 && <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)' }}>{history.length}</span>}
                                    </div>
                                    <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {history.length === 0 ? (
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center', padding: '1.5rem 0' }}>Aucun historique.</p>
                                        ) : history.slice(0, 5).map((sheet, idx) => (
                                            <div
                                                key={sheet.id || idx}
                                                onClick={() => loadFromHistory(sheet)}
                                                style={{
                                                    padding: '0.75rem 1rem', borderRadius: '14px',
                                                    border: '1px solid var(--border-color)', cursor: 'pointer',
                                                    background: 'rgba(255, 255, 255, 0.5)', transition: 'all 0.2s',
                                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                }}
                                                className="history-item-mini"
                                            >
                                                <div style={{ minWidth: 0 }}>
                                                    <div style={{ fontWeight: '750', fontSize: '0.82rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {sheet.destination || 'Sortie'}
                                                    </div>
                                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' }}>
                                                        {sheet.date ? new Date(sheet.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) : '?'} · {sheet.startTime}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={e => deleteSheet(e, sheet.id)}
                                                    style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '4px', display: 'flex' }}
                                                    className="delete-icon-hover"
                                                >
                                                    <Trash2 size={14} />
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
                <div className="no-print" style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-main)', padding: '2rem' }}>
                    {/* Preview Toolbar */}
                    <div style={{
                        maxWidth: '840px', margin: '0 auto 1.5rem',
                        background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(20px)', borderRadius: '24px', padding: '1rem 1.5rem',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-lg)'
                    }}>
                        <button
                            onClick={() => setShowPreview(false)}
                            className="btn-glass"
                            style={{ padding: '0.6rem 1.2rem', fontWeight: '800', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <ArrowLeft size={18} /> Retour
                        </button>
                        <div style={{ fontWeight: '950', color: 'var(--text-main)', fontSize: '1rem', letterSpacing: '-0.02em' }}>Aperçu Fiche Officielle</div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button onClick={handlePrint} className="btn btn-primary" style={{ padding: '0.6rem 1.5rem', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Printer size={16} /> Imprimer
                            </button>
                        </div>
                    </div>

                    {/* A4 Document Preview */}
                    <div style={{
                        maxWidth: '820px', margin: '0 auto',
                        background: 'white', padding: '1.5cm',
                        boxShadow: '0 30px 60px rgba(0,0,0,0.12)',
                        minHeight: '29.7cm', borderRadius: '4px', border: '1px solid #eee'
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
                
                .history-item-mini:hover {
                    border-color: var(--primary-color) !important;
                    background: white !important;
                    transform: translateX(4px);
                }
                
                .delete-icon-hover:hover {
                    color: var(--error-color) !important;
                }

                /* ── MOBILE RESPONSIVE ── */
                @media (max-width: 768px) {
                    .es-page-header {
                        flex-flow: row wrap !important;
                        padding: 1rem !important;
                    }
                    .es-header-actions {
                        width: 100% !important;
                        justify-content: space-between !important;
                        margin-top: 0.5rem;
                    }
                    .es-header-actions button {
                        flex: 1 !important;
                    }
                    .es-main-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
                
                @media (max-width: 1024px) {
                    .es-main-grid {
                        grid-template-columns: 1fr !important;
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
                    html, body, #root, .app-container, .main-content, .workspace-area, .exit-sheet-container {
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

