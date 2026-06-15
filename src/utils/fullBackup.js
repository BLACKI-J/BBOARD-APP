import JSZip from 'jszip';
import { apiSend } from './api';
import { participantsToCsv } from './participantsCsv';
import { healthSheetsToCsv, medicationsToCsv, registreMedsToCsv, passagesToCsv, suiviSanteToCsv } from './healthCsv';

// Collections récupérées pour la sauvegarde complète (clé → endpoint GET).
const COLLECTIONS = [
    { key: 'participants', url: '/api/participants', empty: [] },
    { key: 'groups', url: '/api/groups', empty: [] },
    { key: 'activities', url: '/api/activities', empty: [] },
    { key: 'inventory', url: '/api/inventory/items', empty: [] },
    { key: 'transmissions', url: '/api/state/transmissions', empty: [] },
    { key: 'menus', url: '/api/state/menus', empty: {} },
    { key: 'accessControl', url: '/api/state/accessControl', empty: {} },
    { key: 'meetingRecaps', url: '/api/meeting-recaps', empty: [] },
    { key: 'exitSheets', url: '/api/exit-sheets', empty: [] },
    { key: 'incidentSheets', url: '/api/incident-sheets', empty: [] },
];

async function getJson(url, headers) {
    const res = await fetch(url, { headers, credentials: 'same-origin' });
    if (!res.ok) throw new Error(`${url} → ${res.status}`);
    return res.json();
}

// data URL (data:image/...;base64,xxx) → { ext, b64 }. Toute autre forme (URL,
// blob:, chaîne quelconque) est ignorée : un faux base64 ferait échouer tout le zip.
function parseImage(s) {
    if (!s || typeof s !== 'string') return null;
    const m = s.match(/^data:image\/([a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/);
    if (m) return { ext: m[1].toLowerCase() === 'jpeg' ? 'jpg' : m[1].toLowerCase(), b64: m[2] };
    return null;
}

function safeName(s) {
    return String(s || '')
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-zA-Z0-9_-]+/g, '_').slice(0, 40) || 'sans-nom';
}

// ─── Export ZIP complet ──────────────────────────────────────────────────────
export async function exportFullArchive({ headers, roleLabels = {} } = {}) {
    const data = {};
    const failures = [];
    for (const c of COLLECTIONS) {
        try {
            const result = await getJson(c.url, headers);
            // Une clé state jamais écrite renvoie null → forme vide explicite, sinon
            // la section serait silencieusement sautée à l'import.
            data[c.key] = result ?? c.empty;
        } catch { failures.push(c.key); }
    }
    // Échec dur : une archive avec des sections silencieusement vides serait
    // ré-importable et EFFACERAIT les collections concernées.
    if (failures.length) {
        throw new Error(`Sections inaccessibles : ${failures.join(', ')}. Archive non générée (elle serait incomplète).`);
    }

    const zip = new JSZip();
    const backup = { version: '1.0', date: new Date().toISOString(), ...data };
    zip.file('sauvegarde.json', JSON.stringify(backup, null, 2));
    zip.file('participants.csv', '﻿' + participantsToCsv(data.participants || [], data.groups || [], roleLabels));

    // CSV santé LISIBLES (Excel). Toutes ces données vivent dans les participants ;
    // ces fichiers les rendent exploitables sans ouvrir le JSON. BOM (﻿) pour Excel.
    const p = data.participants || [];
    const g = data.groups || [];
    zip.file('sante/fiches-sanitaires.csv', '﻿' + healthSheetsToCsv(p, g));
    zip.file('sante/medicaments.csv', '﻿' + medicationsToCsv(p));
    zip.file('sante/registre-medicaments.csv', '﻿' + registreMedsToCsv(p));
    zip.file('sante/passages-infirmerie.csv', '﻿' + passagesToCsv(p));
    zip.file('sante/suivi-sante.csv', '﻿' + suiviSanteToCsv(p));

    // Compteur global dans les noms de fichiers : les ids serveur partagent souvent
    // leur préfixe (timestamp) → collisions silencieuses dans le zip sinon.
    const pPhotos = zip.folder('photos/participants');
    let pIdx = 0;
    for (const p of (data.participants || [])) {
        const img = parseImage(p.photo);
        if (img) pPhotos.file(`${safeName(p.lastName)}_${safeName(p.firstName)}_${++pIdx}.${img.ext}`, img.b64, { base64: true });
    }
    const iPhotos = zip.folder('photos/inventaire');
    let iIdx = 0;
    for (const item of (data.inventory || [])) {
        for (const ph of (item.photos || [])) {
            const img = parseImage(ph.image_base64);
            if (img) iPhotos.file(`${safeName(item.label)}_${++iIdx}.${img.ext}`, img.b64, { base64: true });
        }
    }
    zip.file('LISEZMOI.txt', [
        'Sauvegarde complète BBOARD',
        `Date : ${new Date().toLocaleString('fr-FR')}`,
        '',
        'Contenu :',
        '- sauvegarde.json : toutes les données (ré-importable via Paramètres > Tout importer)',
        '- participants.csv : liste ouvrable dans Excel',
        '- sante/ : données santé lisibles dans Excel',
        '    • fiches-sanitaires.csv : toutes les fiches sanitaires (InfoVac)',
        '    • medicaments.csv : médicaments programmés par enfant',
        '    • registre-medicaments.csv : administrations tracées',
        '    • passages-infirmerie.csv : passages / soins',
        '    • suivi-sante.csv : historique des soins et mesures',
        '- photos/ : photos des participants et du matériel (vraies images)',
        '',
        'Restauration : Paramètres > Maintenance > Tout importer, puis choisir ce fichier .zip.',
        '',
        'Non inclus : le journal d\'activité (trace d\'audit, non restaurable), les codes PIN',
        'et l\'historique des validations de la recherche IA (matériel).',
        '',
        'IMPORTANT — codes PIN : les PIN du staff ne sont jamais exportés (sécurité).',
        'Restauré sur la MÊME base, chaque staff garde son PIN. Restauré sur une base',
        'NEUVE, les comptes staff existent mais sans PIN : la Direction (PIN du .env)',
        'doit leur en redéfinir un dans Paramètres > Utilisateurs.',
    ].join('\n'));

    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
    const link = document.body.appendChild(document.createElement('a'));
    link.href = URL.createObjectURL(blob);
    link.download = `bboard-export-${new Date().toISOString().split('T')[0]}.zip`;
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}

// ─── Import ZIP complet ──────────────────────────────────────────────────────
// Renvoie { restored: [labels], failed: [{label, error}] } pour un rapport clair.
export async function importFullArchive(file, { headers, actorId } = {}) {
    const zip = await JSZip.loadAsync(file);
    const entry = zip.file('sauvegarde.json');
    if (!entry) throw new Error('Archive invalide : « sauvegarde.json » introuvable dans le .zip.');
    let backup;
    try {
        backup = JSON.parse(await entry.async('string'));
    } catch {
        throw new Error('Archive invalide : « sauvegarde.json » illisible (JSON corrompu).');
    }
    if (!backup || typeof backup !== 'object') {
        throw new Error('Archive invalide : contenu de sauvegarde non reconnu.');
    }

    // Garde-fous : un staff réel qui restaure une archive ne contenant pas son propre
    // compte (ou le désactivant) serait SUPPRIMÉ/verrouillé en plein import.
    // Le compte virtuel « director » survit toujours, lui.
    if (actorId && actorId !== 'director') {
        const selfMissing = Array.isArray(backup.participants)
            && !backup.participants.some((p) => p && p.id === actorId);
        const selfDisabled = !!backup.accessControl?.disabledUsers?.[actorId];
        if (selfMissing || selfDisabled) {
            throw new Error("Cette archive supprimerait ou désactiverait votre propre compte en plein import. Connectez-vous avec le profil Direction pour restaurer.");
        }
    }

    // Les participants ne peuvent être restaurés sans les permissions de l'archive :
    // le serveur rétrograderait tout rôle custom inconnu en « enfant ».
    const acShapeOk = backup.accessControl && typeof backup.accessControl === 'object' && !Array.isArray(backup.accessControl);
    if (Array.isArray(backup.participants) && backup.participants.length && !acShapeOk) {
        throw new Error('Archive sans permissions valides : les rôles du staff ne pourraient pas être restaurés correctement.');
    }

    // Ordre IMPORTANT : accessControl en PREMIER. Le serveur valide les rôles des
    // participants contre l'accessControl courant — sans les rôles custom restaurés
    // d'abord, tout staff à rôle custom serait rétrogradé en « enfant ».
    const steps = [
        ['Permissions', '/api/state/accessControl', backup.accessControl, 'object'],
        ['Participants', '/api/participants', backup.participants, 'array'],
        ['Groupes', '/api/groups', backup.groups, 'array'],
        ['Activités', '/api/activities', backup.activities, 'array'],
        ['Transmissions', '/api/state/transmissions', backup.transmissions, 'array'],
        ['Menus', '/api/state/menus', backup.menus, 'object'],
        ['Comptes-rendus', '/api/meeting-recaps', backup.meetingRecaps, 'array'],
        ['Fiches de sortie', '/api/exit-sheets', backup.exitSheets, 'array'],
        ['Fiches FEI', '/api/incident-sheets', backup.incidentSheets, 'array'],
    ];
    const restored = [];
    const failed = [];
    for (const [label, url, payload, shape] of steps) {
        if (payload === undefined || payload === null) continue;
        const shapeOk = shape === 'array' ? Array.isArray(payload) : (typeof payload === 'object' && !Array.isArray(payload));
        if (!shapeOk) { failed.push({ label, error: 'format inattendu dans la sauvegarde' }); continue; }
        try {
            await apiSend('POST', url, { headers, body: payload });
            restored.push(label);
        } catch (err) {
            failed.push({ label, error: err.message });
            // Étapes critiques : sans Permissions, les rôles custom seraient rétrogradés ;
            // sans Participants, tout le reste référencerait des comptes absents. On s'arrête.
            if (label === 'Permissions' || label === 'Participants') {
                failed.push({ label: 'Import interrompu', error: `l'étape « ${label} » a échoué — la suite aurait produit un état incohérent` });
                return { restored, failed };
            }
        }
    }

    // Inventaire : remplacement réel (sinon ré-importer DUPLIQUE les photos —
    // chaque POST photo génère un nouvel id). On supprime l'existant d'abord.
    // Un tableau VIDE dans l'archive vide aussi l'inventaire (sémantique « remplacer »).
    if (Array.isArray(backup.inventory)) {
        let purgeOk = true;
        try {
            const existing = await getJson('/api/inventory/items', headers);
            for (const item of (Array.isArray(existing) ? existing : [])) {
                await apiSend('DELETE', `/api/inventory/items/${item.id}`, { headers });
            }
        } catch (err) {
            purgeOk = false;
            failed.push({ label: 'Inventaire', error: `purge impossible (${err.message}) — import inventaire annulé pour éviter les doublons` });
        }
        if (purgeOk && backup.inventory.length) {
            let okItems = 0;
            let skipped = 0;
            let photoFails = 0;
            for (const item of backup.inventory) {
                const { photos, ...itemData } = item;
                if (!itemData.id || !itemData.label) { skipped++; continue; }
                try {
                    await apiSend('POST', '/api/inventory/items', { headers, body: itemData });
                    okItems++;
                    for (const ph of (photos || [])) {
                        if (!ph?.image_base64) continue;
                        try {
                            await apiSend('POST', `/api/inventory/items/${item.id}/photos`, {
                                headers, body: { participantId: ph.participant_id || item.participant_id, imageBase64: ph.image_base64 },
                            });
                        } catch { photoFails++; }
                    }
                } catch (err) {
                    failed.push({ label: `Inventaire (${item.label || item.id})`, error: err.message });
                }
            }
            if (okItems) restored.push(`Inventaire (${okItems})`);
            if (skipped) failed.push({ label: 'Inventaire', error: `${skipped} objet(s) sans id/désignation ignoré(s)` });
            if (photoFails) failed.push({ label: `Photos inventaire`, error: `${photoFails} photo(s) non restaurée(s)` });
        } else if (purgeOk) {
            restored.push('Inventaire (vidé)');
        }
    }

    return { restored, failed };
}
