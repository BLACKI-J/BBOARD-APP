// Génère des CSV LISIBLES (Excel) des données santé, pour la sauvegarde complète.
// Le sauvegarde.json reste la source ré-importable ; ces CSV sont pour la lecture
// humaine. Toutes ces données vivent dans les participants (champs iv*, medications,
// healthLogs, registreLogs, passageLogs).
import { csvEscape as esc } from './participantsCsv';
import { SECTIONS } from '../components/health/infoVacSchema';
import { getMedicationsList, getSiBesoinList } from './meds';

const onlyChildren = (participants = []) => (participants || []).filter((p) => p.role === 'child');
const fullName = (p) => `${p.firstName || ''} ${(p.lastName || '').toUpperCase()}`.trim();
const groupNameOf = (groups) => (id) => (groups || []).find((g) => g.id === id)?.name || '';
const fmtDateTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return isNaN(d) ? '' : d.toLocaleString('fr-FR');
};

// Assemble lignes (tableaux de cellules déjà échappées) + en-têtes en CSV.
const toCsv = (headers, rows) =>
    [headers.map(esc).join(','), ...rows.map((cells) => cells.map(esc).join(','))].join('\n');

// ── Fiches sanitaires : 1 ligne par enfant, toutes les colonnes InfoVac ──────
export function healthSheetsToCsv(participants = [], groups = []) {
    const children = onlyChildren(participants);
    const groupName = groupNameOf(groups);
    const ivFields = SECTIONS.flatMap((sec) => sec.fields.map((f) => ({ key: f.key, label: `${sec.label} – ${f.label}` })));
    const headers = ['Prénom', 'Nom', 'Groupe', 'Date de naissance', 'Allergies', 'Régime', 'Contraintes', ...ivFields.map((f) => f.label)];
    const rows = children.map((c) => [
        c.firstName, c.lastName, groupName(c.group || c.groupId), c.birthDate,
        c.allergies, c.diet, c.constraints,
        ...ivFields.map((f) => c[f.key] || ''),
    ]);
    return toCsv(headers, rows);
}

// ── Médicaments programmés : 1 ligne par (enfant × médicament) ────────────────
export function medicationsToCsv(participants = []) {
    const children = onlyChildren(participants);
    const headers = ['Prénom', 'Nom', 'Médicament', 'Créneaux', 'Si besoin'];
    const rows = [];
    children.forEach((c) => {
        const meds = getMedicationsList(c);
        const prn = getSiBesoinList(c);
        meds.forEach((m) => rows.push([c.firstName, c.lastName, m.name, (m.slots || []).join(' / '), '']));
        prn.forEach((name) => rows.push([c.firstName, c.lastName, name, '', 'OUI']));
    });
    return toCsv(headers, rows);
}

// ── Registre médicaments : administrations tracées (registreLogs) ─────────────
export function registreMedsToCsv(participants = []) {
    const children = onlyChildren(participants);
    const headers = ['Date', 'Heure', 'Prénom', 'Nom', 'Médicaments', 'Traitement', 'Soignant'];
    const entries = [];
    children.forEach((c) => {
        (c.registreLogs || []).forEach((l) => {
            entries.push({ ts: l.timestamp, cells: [fmtDateTime(l.timestamp), l.heure || '', c.firstName, c.lastName, l.medicaments || '', l.traitement || '', l.soignant || ''] });
        });
    });
    entries.sort((a, b) => new Date(b.ts) - new Date(a.ts));
    return toCsv(headers, entries.map((e) => e.cells));
}

// ── Passages infirmerie (passageLogs) ────────────────────────────────────────
export function passagesToCsv(participants = []) {
    const children = onlyChildren(participants);
    const headers = ['Date', 'Prénom', 'Nom', 'Nature', 'Soins', 'Observation', 'Soignant'];
    const entries = [];
    children.forEach((c) => {
        (c.passageLogs || []).forEach((l) => {
            entries.push({ ts: l.timestamp, cells: [fmtDateTime(l.timestamp), c.firstName, c.lastName, l.nature || '', l.soins || '', l.observation || '', l.soignant || ''] });
        });
    });
    entries.sort((a, b) => new Date(b.ts) - new Date(a.ts));
    return toCsv(headers, entries.map((e) => e.cells));
}

// ── Suivi santé : historique des soins/mesures (healthLogs) ───────────────────
export function suiviSanteToCsv(participants = []) {
    const children = onlyChildren(participants);
    const headers = ['Date', 'Prénom', 'Nom', 'Type', 'Catégorie', 'Description', 'Valeur'];
    const entries = [];
    children.forEach((c) => {
        (c.healthLogs || []).forEach((l) => {
            entries.push({ ts: l.timestamp, cells: [fmtDateTime(l.timestamp), c.firstName, c.lastName, l.type || '', l.category || '', l.content || '', l.value || ''] });
        });
    });
    entries.sort((a, b) => new Date(b.ts) - new Date(a.ts));
    return toCsv(headers, entries.map((e) => e.cells));
}
