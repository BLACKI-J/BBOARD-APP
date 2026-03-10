import React, { useState } from 'react';
import { Download, Upload, FileJson, Trash2, Archive, Lock, Unlock, FileSpreadsheet, KeyRound, ShieldCheck } from 'lucide-react';

export default function Settings({
    participants, setParticipants,
    groups, setGroups,
    activities, setActivities,
    savedViews, setSavedViews,
    isAdminMode, setIsAdminMode,
    isAttendanceEnabled, setIsAttendanceEnabled,
    adminPin, setAdminPin
}) {
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [pinInput, setPinInput] = useState('');
    const [pinError, setPinError] = useState(false);

    const [isChangingPin, setIsChangingPin] = useState(false);
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');

    const handleUnlock = (e) => {
        e.preventDefault();
        if (pinInput === adminPin) {
            setIsUnlocked(true);
            setPinError(false);
        } else {
            setPinError(true);
            setPinInput('');
        }
    };

    const handleUpdatePin = (e) => {
        e.preventDefault();
        if (newPin.length < 4) {
            alert("Le code PIN doit faire au moins 4 chiffres.");
            return;
        }
        if (newPin !== confirmPin) {
            alert("Les codes PIN ne correspondent pas.");
            return;
        }
        setAdminPin(newPin);
        setIsChangingPin(false);
        setNewPin('');
        setConfirmPin('');
        alert("Code PIN mis à jour avec succès !");
    };

    const handleMedicalExport = () => {
        const children = participants.filter(p => p.role === 'child');

        // CSV Header
        let csvContent = "NOM,PRENOM,GROUPE,ALLERGIES,CONTRAINTES PARTICULIERES\n";

        children.forEach(child => {
            const groupName = groups.find(g => g.id === child.group)?.name || 'Sans groupe';
            const row = [
                `"${(child.lastName || '').toUpperCase()}"`,
                `"${child.firstName || ''}"`,
                `"${groupName}"`,
                `"${(child.allergies || '').replace(/"/g, '""')}"`,
                `"${(child.constraints || '').replace(/"/g, '""')}"`
            ].join(',');
            csvContent += row + "\n";
        });

        const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `fiche-medicale-colo-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFullExport = () => {
        const exportData = {
            version: '1.0',
            date: new Date().toISOString(),
            participants,
            groups,
            activities,
            savedViews
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `colo-backup-complet-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFullImport = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);

                if (!imported.participants || !imported.groups) {
                    alert("Format de sauvegarde invalide ou incomplet.");
                    return;
                }

                if (confirm(`ATTENTION : Cette action va REMPLACER toutes vos données actuelles par celles du fichier :\n\n- ${imported.participants.length} participants\n- ${imported.groups.length} groupes\n- ${imported.activities?.length || 0} activités\n\nContinuer ?`)) {
                    setParticipants(imported.participants || []);
                    setGroups(imported.groups || []);
                    setActivities(imported.activities || []);
                    setSavedViews(imported.savedViews || { 'Trajet Aller': {} });
                    alert("Importation réussie !");
                }
            } catch (err) {
                alert("Erreur lors de la lecture du fichier JSON.");
            }
        };
        reader.readAsText(file);
    };

    const handleResetAll = () => {
        if (confirm("DANGER : Voulez-vous vraiment TOUT effacer ?\n\nCette action est irréversible. Toutes les données (participants, groupes, plans, activités) seront supprimées.")) {
            if (confirm("Êtes-vous vraiment sûr ?")) {
                setParticipants([]);
                setGroups([]);
                setActivities([]);
                setSavedViews({ 'Trajet Aller': {} });
                localStorage.clear();
                location.reload();
            }
        }
    };

    if (!isUnlocked) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '2rem' }}>
                <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '2.5rem', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                    <div style={{ background: '#f1f5f9', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                        <Lock size={32} color="#475569" />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem', color: '#1e293b' }}>Espace Direction</h2>
                    <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '0.9rem' }}>Veuillez saisir votre code PIN pour accéder aux paramètres administratifs.</p>

                    <form onSubmit={handleUnlock}>
                        <input
                            type="password"
                            inputMode="numeric"
                            autoFocus
                            placeholder="••••"
                            value={pinInput}
                            onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 8))}
                            style={{
                                width: '100%', padding: '1rem', textAlign: 'center', fontSize: '2rem',
                                letterSpacing: '0.5rem', borderRadius: '12px', border: `2px solid ${pinError ? '#ef4444' : '#e2e8f0'}`,
                                background: '#f8fafc', marginBottom: '1rem'
                            }}
                        />
                        {pinError && <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: '600' }}>Code PIN incorrect</p>}
                        <button className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontWeight: '700' }}>
                            Déverrouiller
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '800' }}>
                    <ShieldCheck size={28} color="#4f46e5" /> Paramètres Direction
                </h2>
                <button className="btn btn-outline" onClick={() => setIsUnlocked(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Lock size={16} /> Verrouiller
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                {/* Administration Columns */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Security & Access */}
                    <div className="card" style={{ padding: '1.5rem', border: '1px solid #c7d2fe', background: '#f5f7ff' }}>
                        <h3 style={{ marginBottom: '1.25rem', color: '#3730a3', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                            <Unlock size={20} /> Accès & Visibilité
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <div>
                                    <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '0.95rem' }}>Mode Administrateur</div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Affiche les menus cachés pour tout le monde.</div>
                                </div>
                                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                    <div style={{ position: 'relative' }}>
                                        <input type="checkbox" checked={isAdminMode} onChange={(e) => setIsAdminMode(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                                        <div style={{ width: '44px', height: '24px', background: isAdminMode ? '#4f46e5' : '#cbd5e1', borderRadius: '12px', transition: '0.2s' }}></div>
                                        <div style={{ width: '18px', height: '18px', background: 'white', borderRadius: '50%', position: 'absolute', top: '3px', left: isAdminMode ? '23px' : '3px', transition: '0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}></div>
                                    </div>
                                </label>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <div>
                                    <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '0.95rem' }}>Module Pointage</div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Autorise les animateurs à pointer les enfants.</div>
                                </div>
                                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                    <div style={{ position: 'relative' }}>
                                        <input type="checkbox" checked={isAttendanceEnabled} onChange={(e) => setIsAttendanceEnabled(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                                        <div style={{ width: '44px', height: '24px', background: isAttendanceEnabled ? '#10b981' : '#cbd5e1', borderRadius: '12px', transition: '0.2s' }}></div>
                                        <div style={{ width: '18px', height: '18px', background: 'white', borderRadius: '50%', position: 'absolute', top: '3px', left: isAttendanceEnabled ? '23px' : '3px', transition: '0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}></div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div style={{ marginTop: '1.5rem', borderTop: '1px solid #e0e7ff', paddingTop: '1.5rem' }}>
                            {!isChangingPin ? (
                                <button className="btn btn-outline" onClick={() => setIsChangingPin(true)} style={{ width: '100%', fontSize: '0.9rem' }}>
                                    <KeyRound size={16} /> Changer le code PIN Direction
                                </button>
                            ) : (
                                <form onSubmit={handleUpdatePin} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <input
                                        type="password"
                                        placeholder="Nouveau PIN"
                                        value={newPin}
                                        onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                                        className="input-field"
                                        style={{ fontSize: '0.9rem', padding: '0.6rem' }}
                                    />
                                    <input
                                        type="password"
                                        placeholder="Confirmer le PIN"
                                        value={confirmPin}
                                        onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                                        className="input-field"
                                        style={{ fontSize: '0.9rem', padding: '0.6rem' }}
                                    />
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button className="btn btn-primary" style={{ flex: 1, fontSize: '0.85rem' }}>Valider</button>
                                        <button type="button" className="btn btn-outline" onClick={() => setIsChangingPin(false)} style={{ flex: 1, fontSize: '0.85rem' }}>Annuler</button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="card" style={{ padding: '1.5rem', border: '1px solid #fee2e2' }}>
                        <h3 style={{ marginBottom: '1rem', color: '#b91c1c', fontSize: '1.1rem' }}>Zone de danger</h3>
                        <p style={{ color: '#7f1d1d', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                            Réinitialisez l'application à zéro. Toutes les données seront définitivement effacées.
                        </p>
                        <button className="btn btn-danger" onClick={handleResetAll} style={{ width: '100%', padding: '0.75rem' }}>
                            <Trash2 size={18} /> Tout effacer
                        </button>
                    </div>
                </div>

                {/* Exports Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Specialized Exports */}
                    <div className="card" style={{ padding: '1.5rem', border: '1px solid #bbf7d0', background: '#f0fdf4' }}>
                        <h3 style={{ marginBottom: '1.25rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                            <FileSpreadsheet size={20} /> Exports Métiers
                        </h3>
                        <p style={{ color: '#15803d', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                            Générez des fichiers prêts à l'usage pour vos listes spécifiques (cantine, prestataires, escalade...).
                        </p>

                        <button className="btn" onClick={handleMedicalExport} style={{
                            width: '100%', padding: '1rem', background: '#10b981', color: 'white', border: 'none',
                            borderRadius: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                            boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)'
                        }}>
                            <Download size={20} /> Liste Médicale & Allergies (.csv)
                        </button>
                        <p style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#166534', textAlign: 'center' }}>
                            Fichier compatible Excel (Nom, Prénom, Groupe, Allergies, Régime).
                        </p>
                    </div>

                    {/* Backups */}
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Sauvegardes Système</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                            Téléchargez ou restaurez l'intégralité des données (Annuaire, Plans, Planning).
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <button className="btn btn-primary" onClick={handleFullExport} style={{ padding: '0.75rem' }}>
                                <Download size={18} /> Télécharger (.json)
                            </button>

                            <label className="btn btn-outline" style={{ cursor: 'pointer', padding: '0.75rem', display: 'inline-flex', justifyContent: 'center' }}>
                                <Upload size={18} /> Restaurer un fichier
                                <input type="file" accept=".json" onChange={handleFullImport} style={{ display: 'none' }} />
                            </label>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

