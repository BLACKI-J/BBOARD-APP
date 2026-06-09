// Export participants → CSV (téléchargement navigateur).
// Mêmes colonnes pour l'Annuaire et les Paramètres (source unique).
export function exportParticipantsCsv(participants = [], groups = [], roleLabels = {}) {
    const groupName = (id) => (groups || []).find((g) => g.id === id)?.name || '';
    const roleLabel = (r) => roleLabels[r] || r;
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const headers = ['Prénom', 'Nom', 'Rôle', 'Groupe', 'Date de naissance', 'Allergies', 'Régime', 'Contraintes', 'Fiche sanitaire', 'Téléphone', 'Contact urgence'];
    const rows = (participants || []).map((p) => [
        esc(p.firstName), esc(p.lastName), esc(roleLabel(p.role)),
        esc(groupName(p.group || p.groupId)), esc(p.birthDate), esc(p.allergies),
        esc(p.diet), esc(p.constraints),
        p.healthDocProvided ? 'OUI' : 'NON',
        esc(p.phone), esc(p.emergencyContact),
    ].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.body.appendChild(document.createElement('a'));
    link.href = URL.createObjectURL(blob);
    link.download = `participants-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    document.body.removeChild(link);
}
