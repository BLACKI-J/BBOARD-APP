import React, { useState } from 'react';
import { Printer, Calendar, MapPin, Users, CheckSquare, Square, Filter, Tent, Trash2, Save } from 'lucide-react';

const PrintContent = ({ date, destination, startTime, endTime, selectedChildren, selectedAnimatorList, referent, checklistItems }) => (
    <div style={{ fontFamily: 'Arial, sans-serif', color: 'black' }}>
        {/* Header with Logos */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ textAlign: 'center', width: '80px' }}>
                <Tent size={40} />
                <div style={{ fontSize: '10px', fontWeight: 'bold' }}>Colo App</div>
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', textShadow: '2px 2px 0 #ddd', margin: 0, letterSpacing: '1px' }}>Fiche de sortie</h1>
            <div style={{ textAlign: 'center', width: '80px' }}>
                <Tent size={40} />
                <div style={{ fontSize: '10px', fontWeight: 'bold' }}>Colo App</div>
            </div>
        </div>

        {/* Info Table */}
        <div style={{ border: '1px solid #000', marginBottom: '1rem' }}>
            {/* Row 1 */}
            <div style={{ display: 'flex', borderBottom: '1px solid #000' }}>
                <div style={{ flex: 1, padding: '8px', borderRight: '1px solid #000' }}>
                    <strong>Date de la sortie :</strong> {new Date(date).toLocaleDateString('fr-FR')}
                </div>
                <div style={{ flex: 1, padding: '8px' }}>
                    <strong>Destination (adresse) :</strong> {destination}
                </div>
            </div>
            {/* Row 2 */}
            <div style={{ display: 'flex', borderBottom: '1px solid #000' }}>
                <div style={{ flex: 1, padding: '8px', borderRight: '1px solid #000' }}>
                    <strong>Heure du départ :</strong> {startTime}
                </div>
                <div style={{ flex: 1, padding: '8px' }}>
                    <strong>Heure du retour :</strong> {endTime}
                </div>
            </div>
            {/* Row 3 */}
            <div style={{ display: 'flex', borderBottom: '1px solid #000' }}>
                <div style={{ flex: 1, padding: '8px', borderRight: '1px solid #000' }}>
                    <strong>Effectifs vacanciers :</strong> {selectedChildren.length}
                </div>
                <div style={{ flex: 1, padding: '8px' }}>
                    <strong>Effectifs animateurs :</strong> {selectedAnimatorList.length}
                </div>
            </div>
            {/* Row 4: Animators List */}
            <div style={{ padding: '8px', minHeight: '40px', background: '#f0f0f0' }}>
                <strong>Liste des animateurs :</strong><br />
                {selectedAnimatorList.map(a => `${a.firstName} ${a.lastName}`).join(', ')}
            </div>
        </div>

        {/* Vacanciers List Header */}
        <div style={{ background: '#999', color: 'black', fontWeight: 'bold', textAlign: 'center', padding: '5px', border: '1px solid #000', borderBottom: 'none' }}>
            Liste des vacanciers
        </div>

        {/* Vacanciers Grid */}
        <div style={{ border: '1px solid #000', display: 'flex', flexWrap: 'wrap' }}>
            {Array.from({ length: Math.max(selectedChildren.length, 24) }).map((_, i) => {
                const child = selectedChildren[i];
                return (
                    <div key={i} style={{
                        width: '33.33%',
                        borderRight: (i + 1) % 3 === 0 ? 'none' : '1px solid #000',
                        borderBottom: '1px solid #000',
                        padding: '6px',
                        height: '30px',
                        boxSizing: 'border-box',
                        fontSize: '12px',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap'
                    }}>
                        {child ? `${child.lastName.toUpperCase()} ${child.firstName}` : ''}
                    </div>
                );
            })}
        </div>

        {/* Footer Section */}
        <div style={{ marginTop: '1rem', background: '#f0f0f0', padding: '10px', border: '1px solid #000' }}>
            <div style={{ marginBottom: '1rem', fontWeight: 'bold' }}>
                Référent de la sortie : <span style={{ fontWeight: 'normal' }}>{referent}</span>
            </div>

            <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '0.5rem', fontFamily: 'Comic Sans MS, cursive' }}>
                Ma check liste :
            </div>

            {/* Checklist Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', border: '1px solid #000' }}>
                {checklistItems.map((item, i) => (
                    <div key={i} style={{
                        padding: '5px',
                        borderRight: (i + 1) % 3 === 0 ? 'none' : '1px solid #000',
                        borderBottom: i < 6 ? '1px solid #000' : 'none',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <div style={{ width: '12px', height: '12px', border: '1px solid #000', borderRadius: '50%' }}></div>
                        {item}
                    </div>
                ))}
            </div>
        </div>

        <div style={{ marginTop: '1rem', fontWeight: 'bold', textDecoration: 'underline' }}>
            Signature d'un membre de la direction :
        </div>
    </div>
);

export default function ExitSheet({ participants, groups }) {
    // Form State
    const [destination, setDestination] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [startTime, setStartTime] = useState('14:00');
    const [endTime, setEndTime] = useState('17:00');
    const [referent, setReferent] = useState('');
    const [fileName, setFileName] = useState('');
    const [history, setHistory] = useState([]);
    const [showPreview, setShowPreview] = useState(false);

    // Fetch history
    const fetchHistory = async () => {
        try {
            const res = await fetch('/api/exit-sheets');
            const data = await res.json();
            setHistory(data);
        } catch (err) {
            console.error('Error fetching history:', err);
        }
    };

    React.useEffect(() => {
        fetchHistory();
    }, []);

    // Auto-generate filename
    React.useEffect(() => {
        const safeDestination = destination.trim().replace(/[^a-z0-9]/gi, '_');
        const defaultName = `Fiche_Sortie_${safeDestination || 'Sans_Nom'}_${date}`;
        setFileName(defaultName);
    }, [destination, date]);

    // Selection State
    const [selectedIds, setSelectedIds] = useState([]);
    const [selectedAnimators, setSelectedAnimators] = useState([]);
    const [filterGroup, setFilterGroup] = useState('all');

    // Checklist Items
    const checklistItems = [
        "Trousse de secours", "EAU", "Gobelet",
        "Gouter", "Traitement si besoin", "Casquette",
        "Crème solaire", "Argent de poche", "Rechange et change si besoin"
    ];

    // Handlers
    const toggleParticipant = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(pid => pid !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const toggleAnimator = (id) => {
        if (selectedAnimators.includes(id)) {
            setSelectedAnimators(selectedAnimators.filter(pid => pid !== id));
        } else {
            setSelectedAnimators([...selectedAnimators, id]);
        }
    };

    const toggleAllVisible = () => {
        const visibleParticipants = getFilteredParticipants();
        const visibleIds = visibleParticipants.map(p => p.id);
        const allSelected = visibleIds.every(id => selectedIds.includes(id));

        if (allSelected) {
            setSelectedIds(selectedIds.filter(id => !visibleIds.includes(id)));
        } else {
            const newIds = [...new Set([...selectedIds, ...visibleIds])];
            setSelectedIds(newIds);
        }
    };

    const getFilteredParticipants = () => {
        let list = participants.filter(p => p.role === 'child');
        if (filterGroup !== 'all') {
            list = list.filter(p => p.group === filterGroup);
        }
        return list.sort((a, b) => a.lastName.localeCompare(b.lastName));
    };

    const saveExitSheet = async () => {
        const sheetId = (typeof crypto !== 'undefined' && crypto.randomUUID)
            ? crypto.randomUUID()
            : `sheet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const sheetData = {
            id: sheetId,
            destination,
            date,
            startTime,
            endTime,
            referent,
            fileName,
            selectedIds,
            selectedAnimators,
            timestamp: new Date().toISOString()
        };

        try {
            const res = await fetch('/api/exit-sheets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sheetData)
            });
            if (res.ok) {
                await fetchHistory();
                alert('Fiche de sortie enregistrée avec succès !');
            }
        } catch (err) {
            console.error('Error saving sheet:', err);
            alert('Erreur lors de l\'enregistrement de la fiche.');
        }
    };

    const handlePrint = async () => {
        // Save first to ensure it's recorded even if print fails/blocks
        await saveExitSheet();

        const originalTitle = document.title;
        document.title = fileName || 'Fiche_Sortie';
        window.print();
        document.title = originalTitle;
    };

    const deleteSheet = async (e, id) => {
        e.stopPropagation(); // Prevent loading the sheet
        if (!window.confirm('Voulez-vous vraiment supprimer cet historique ?')) return;

        try {
            const res = await fetch(`/api/exit-sheets/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                await fetchHistory();
            }
        } catch (err) {
            console.error('Error deleting sheet:', err);
        }
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

    // Stats for Print
    const selectedChildren = participants.filter(p => selectedIds.includes(p.id)).sort((a, b) => a.lastName.localeCompare(b.lastName));
    const selectedAnimatorList = participants.filter(p => selectedAnimators.includes(p.id));

    return (
        <div className="exit-sheet-container" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: showPreview ? '#525659' : 'transparent' }}>

            {/* --- Screen View (Configuration) --- */}
            {!showPreview ? (
                <div className="no-print" style={{ padding: '2rem', height: '100%', overflowY: 'auto', background: '#f8fafc' }}>
                    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

                        <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                    <div style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', padding: '0.6rem', borderRadius: '12px', color: 'white', display: 'flex' }}>
                                        <MapPin size={24} />
                                    </div>
                                    Fiche de Sortie
                                </h1>
                                <p style={{ color: '#64748b', fontSize: '1rem', marginLeft: '3.5rem' }}>
                                    Préparez votre fiche de sortie selon le modèle officiel.
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    className="btn btn-outline"
                                    onClick={saveExitSheet}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', fontSize: '1rem' }}
                                >
                                    <Save size={20} /> Enregistrer
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handlePrint}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', fontSize: '1rem' }}
                                >
                                    <Printer size={20} /> Imprimer
                                </button>
                            </div>
                        </header>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 450px', gap: '2rem', alignItems: 'start' }}>

                            {/* Left: Selection */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                                {/* Animators Selection */}
                                <div className="card" style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                                    <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem', color: '#334155' }}>Sélection des Animateurs</h2>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        {animators.map(anim => {
                                            const isSelected = selectedAnimators.includes(anim.id);
                                            return (
                                                <button
                                                    key={anim.id}
                                                    onClick={() => toggleAnimator(anim.id)}
                                                    style={{
                                                        padding: '0.5rem 1rem', borderRadius: '20px', border: '1px solid',
                                                        borderColor: isSelected ? '#3b82f6' : '#e2e8f0',
                                                        background: isSelected ? '#eff6ff' : 'white',
                                                        color: isSelected ? '#3b82f6' : '#64748b',
                                                        cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem'
                                                    }}
                                                >
                                                    {anim.firstName} {anim.lastName}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Children Selection */}
                                <div className="card" style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                                    <div style={{ padding: '1rem 1.5rem', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#334155' }}>Sélection des Vacanciers</h2>
                                        <select
                                            value={filterGroup}
                                            onChange={(e) => setFilterGroup(e.target.value)}
                                            className="input-field"
                                            style={{ padding: '0.4rem', fontSize: '0.9rem', width: 'auto' }}
                                        >
                                            <option value="all">Tous les groupes</option>
                                            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                        </select>
                                    </div>

                                    <div style={{ padding: '0.5rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <button onClick={toggleAllVisible} style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: '600', cursor: 'pointer' }}>
                                            Tout sélectionner
                                        </button>
                                        <span style={{ fontSize: '0.9rem', color: '#64748b' }}>{selectedIds.length} sélectionnés</span>
                                    </div>

                                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                        {filteredParticipants.map(p => (
                                            <div
                                                key={p.id}
                                                onClick={() => toggleParticipant(p.id)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '1rem',
                                                    padding: '0.75rem 1.5rem', borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
                                                    background: selectedIds.includes(p.id) ? '#eff6ff' : 'white'
                                                }}
                                            >
                                                <div style={{ color: selectedIds.includes(p.id) ? '#3b82f6' : '#cbd5e1' }}>
                                                    {selectedIds.includes(p.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '600', color: '#334155' }}>{p.firstName} {p.lastName}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Groupe {groups.find(g => g.id === p.group)?.name || '?'}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Info Form */}
                            <div className="card" style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', position: 'sticky', top: '2rem' }}>
                                <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem', color: '#334155' }}>Informations de la sortie</h2>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#64748b', marginBottom: '0.5rem' }}>Destination (adresse)</label>
                                        <input type="text" className="input-field" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Ex: Piscine, 12 rue du Lac..." />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#64748b', marginBottom: '0.5rem' }}>Date</label>
                                        <input type="date" className="input-field" value={date} onChange={(e) => setDate(e.target.value)} />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#64748b', marginBottom: '0.5rem' }}>Départ</label>
                                            <input type="time" className="input-field" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#64748b', marginBottom: '0.5rem' }}>Retour</label>
                                            <input type="time" className="input-field" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#64748b', marginBottom: '0.5rem' }}>Référent de la sortie</label>
                                        <select className="input-field" value={referent} onChange={(e) => setReferent(e.target.value)}>
                                            <option value="">Sélectionner...</option>
                                            {animators.map(a => (
                                                <option key={a.id} value={`${a.firstName} ${a.lastName}`}>{a.firstName} {a.lastName}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div style={{ marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#64748b', marginBottom: '0.5rem' }}>Nom du fichier PDF</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            value={fileName}
                                            onChange={(e) => setFileName(e.target.value)}
                                            placeholder="Nom_du_fichier"
                                        />
                                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                                            C'est le nom suggéré lors de l'enregistrement en PDF.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom: History Section */}
                        <div style={{ marginTop: '2rem' }}>
                            <div className="card" style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                                <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Calendar size={20} /> Historique des sorties
                                </h2>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                                    gap: '1rem',
                                    maxHeight: '400px',
                                    overflowY: 'auto',
                                    padding: '0.25rem'
                                }}>
                                    {history.length === 0 ? (
                                        <p style={{ color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center', padding: '1rem', gridColumn: '1 / -1' }}>Aucun historique disponible.</p>
                                    ) : (
                                        history.map((sheet, idx) => (
                                            <div
                                                key={sheet.id || idx}
                                                onClick={() => loadFromHistory(sheet)}
                                                style={{
                                                    padding: '0.75rem',
                                                    borderRadius: '8px',
                                                    border: '1px solid #e2e8f0',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    background: '#f8fafc',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                }}
                                                onMouseOver={(e) => {
                                                    e.currentTarget.style.borderColor = '#3b82f6';
                                                    e.currentTarget.style.background = '#eff6ff';
                                                }}
                                                onMouseOut={(e) => {
                                                    e.currentTarget.style.borderColor = '#e2e8f0';
                                                    e.currentTarget.style.background = '#f8fafc';
                                                }}
                                            >
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: '600', fontSize: '0.9rem', color: '#334155' }}>{sheet.destination}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', gap: '1rem' }}>
                                                        <span>{new Date(sheet.date).toLocaleDateString('fr-FR')}</span>
                                                        <span>{sheet.startTime} - {sheet.endTime}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={(e) => deleteSheet(e, sheet.id)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: '#94a3b8',
                                                        cursor: 'pointer',
                                                        padding: '4px',
                                                        display: 'flex',
                                                        borderRadius: '4px'
                                                    }}
                                                    onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'}
                                                    onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* --- On-Screen Preview Mode --- */
                <div className="no-print" style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
                    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', background: '#fff', padding: '1rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                            <button
                                onClick={() => setShowPreview(false)}
                                className="btn btn-outline"
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                ← Retour à l'édition
                            </button>
                            <div style={{ fontWeight: '700', color: '#1e293b' }}>Aperçu du document</div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    onClick={saveExitSheet}
                                    className="btn btn-outline"
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    <Save size={18} /> Enregistrer
                                </button>
                                <button
                                    onClick={handlePrint}
                                    className="btn btn-primary"
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    <Printer size={18} /> Imprimer
                                </button>
                            </div>
                        </div>

                        <div style={{ background: 'white', padding: '1.5cm', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', minHeight: '29.7cm' }}>
                            <PrintContent
                                date={date}
                                destination={destination}
                                startTime={startTime}
                                endTime={endTime}
                                selectedChildren={selectedChildren}
                                selectedAnimatorList={selectedAnimatorList}
                                referent={referent}
                                checklistItems={checklistItems}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* --- Print View (Exact Layout Replica) --- */}
            <div className="print-only" style={{ display: 'none' }}>
                <PrintContent
                    date={date}
                    destination={destination}
                    startTime={startTime}
                    endTime={endTime}
                    selectedChildren={selectedChildren}
                    selectedAnimatorList={selectedAnimatorList}
                    referent={referent}
                    checklistItems={checklistItems}
                />
            </div>

            <style>{`
                @media print {
                    @page { size: A4 portrait; margin: 1cm; }
                    .no-print, .content-header, .sidebar, .sidebar-overlay { display: none !important; }
                    .print-only { display: block !important; position: static !important; width: 100% !important; background: white !important; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    body { background: white !important; font-family: Arial, sans-serif !important; }
                    .exit-sheet-container { background: white !important; height: auto !important; width: 100% !important; display: block !important; color: black !important; }
                }
            `}</style>
        </div>
    );
}