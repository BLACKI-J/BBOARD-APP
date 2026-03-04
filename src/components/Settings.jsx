import React from 'react';
import { Download, Upload, FileJson, Trash2, Archive } from 'lucide-react';

export default function Settings({ participants, setParticipants, groups, setGroups, activities, setActivities, savedViews, setSavedViews }) {
    
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
                location.reload(); // Reload to clear any lingering state/mock data
            }
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
            <h2 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Archive size={24} /> Sauvegarde et Restauration
            </h2>

            <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Sauvegarde complète</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                    Téléchargez un fichier unique contenant toutes les données de l'application : Annuaire, Groupes, Plans de transport et Emploi du temps.
                    Idéal pour transférer les données sur un autre ordinateur ou faire une copie de sécurité.
                </p>
                
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-primary" onClick={handleFullExport} style={{ padding: '0.75rem 1.5rem' }}>
                        <Download size={18} /> Télécharger la sauvegarde (.json)
                    </button>
                </div>
            </div>

            <div className="card" style={{ padding: '2rem', marginBottom: '2rem', borderLeft: '4px solid var(--primary-color)' }}>
                <h3 style={{ marginBottom: '1rem' }}>Restaurer une sauvegarde</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                    Importez un fichier de sauvegarde (.json) pour restaurer l'état complet de l'application.
                    <br/><strong>Attention :</strong> Cela écrasera toutes les données actuelles.
                </p>
                
                <label className="btn btn-outline" style={{ cursor: 'pointer', padding: '0.75rem 1.5rem', display: 'inline-flex' }}>
                    <Upload size={18} /> Sélectionner un fichier de sauvegarde
                    <input type="file" accept=".json" onChange={handleFullImport} style={{ display: 'none' }} />
                </label>
            </div>

            <div className="card" style={{ padding: '2rem', border: '1px solid var(--danger-color)' }}>
                <h3 style={{ marginBottom: '1rem', color: 'var(--danger-color)' }}>Zone de danger</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                    Réinitialiser l'application à zéro. Toutes les données seront perdues.
                </p>
                
                <button className="btn btn-danger" onClick={handleResetAll}>
                    <Trash2 size={18} /> Tout effacer et réinitialiser
                </button>
            </div>
        </div>
    );
}
