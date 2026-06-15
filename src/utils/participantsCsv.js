// Échappement CSV partagé : guillemets doublés + anti-injection de formule Excel
// (un champ commençant par = + - @ serait exécuté comme formule à l'ouverture).
export const csvEscape = (v) => {
    let s = String(v ?? '').replace(/"/g, '""');
    if (/^[=+\-@]/.test(s)) s = `'${s}`;
    return `"${s}"`;
};

// Génère le CSV participants (chaîne, sans BOM). Source unique des colonnes.
export function participantsToCsv(participants = [], groups = [], roleLabels = {}) {
    const groupName = (id) => (groups || []).find((g) => g.id === id)?.name || '';
    const roleLabel = (r) => roleLabels[r] || r;
    const esc = csvEscape;
    const headers = ['Prénom', 'Nom', 'Rôle', 'Groupe', 'Date de naissance', 'Allergies', 'Régime', 'Contraintes', 'Fiche sanitaire', 'Téléphone', 'Contact urgence'];
    const rows = (participants || []).map((p) => [
        esc(p.firstName), esc(p.lastName), esc(roleLabel(p.role)),
        esc(groupName(p.group || p.groupId)), esc(p.birthDate), esc(p.allergies),
        esc(p.diet), esc(p.constraints),
        p.healthDocProvided ? 'OUI' : 'NON',
        esc(p.phone), esc(p.emergencyContact),
    ].join(','));
    return [headers.join(','), ...rows].join('\n');
}

// Télécharge le CSV participants (Annuaire / Paramètres).
export function exportParticipantsCsv(participants = [], groups = [], roleLabels = {}) {
    const csv = participantsToCsv(participants, groups, roleLabels);
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.body.appendChild(document.createElement('a'));
    link.href = URL.createObjectURL(blob);
    link.download = `participants-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}
