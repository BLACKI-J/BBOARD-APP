import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus } from 'lucide-react';
import { useScrollCollapse } from '../utils/useScrollCollapse';
import useIsMobile from '../utils/useIsMobile';
import { exportParticipantsCsv } from '../utils/participantsCsv';
import { printHtml } from '../utils/printHtml';
import { v4 as uuidv4 } from 'uuid';
import { useUi } from '../ui/UiProvider';

// Components
import DirectoryHeader from './directory/DirectoryHeader';
import DirectoryFilters from './directory/DirectoryFilters';
import ParticipantTable from './directory/ParticipantTable';
import ParticipantCard from './directory/ParticipantCard';
import ParticipantDetails from './directory/ParticipantDetails';
import ParticipantForm from './directory/ParticipantForm';
import GroupManager from './directory/GroupManager';

export default function Directory({ participants = [], setParticipants, groups = [], setGroups, canEdit = true, roles = [] }) {
    const ui = useUi();
    const safeParticipants = Array.isArray(participants) ? participants : [];
    const safeGroups = Array.isArray(groups) ? groups : [];

    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'firstName', direction: 'ascending' });
    const [viewMode, setViewMode] = useState('table');
    const [filterRole, setFilterRole] = useState('all');
    const [filterGroup, setFilterGroup] = useState('all');

    // Selection State
    const [selectedParticipants, setSelectedParticipants] = useState([]);

    // Viewing State - Drawer Mode
    const [viewingParticipant, setViewingParticipant] = useState(null);

    // Form States
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', birthDate: '', allergies: '', constraints: '', photo: '', role: 'child', group: '', healthDocProvided: false,
        training: '', phone: '', email: '', address: '', emergencyContact: '', pin: '',
        pocketMoney: { initial: 0, current: 0, history: [] }
    });

    // Group Management State
    const [isGroupManagerOpen, setIsGroupManagerOpen] = useState(false);
    const [newGroupData, setNewGroupData] = useState({ name: '', color: '#c2703d' });

    // Trombinoscope modal state
    const [trombiConfig, setTrombiConfig] = useState(null);

    const toggleSelection = (id) => {
        if (!canEdit) {
            ui.toast('Droits de modification insuffisants.', { type: 'error' });
            return;
        }
        setSelectedParticipants(prev => prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (!canEdit) return;
        setSelectedParticipants(selectedParticipants.length === sortedParticipants.length ? [] : sortedParticipants.map(p => p.id));
    };

    const handleBulkDelete = async () => {
        if (!canEdit) {
            ui.toast('Droits de suppression insuffisants.', { type: 'error' });
            return;
        }
        const ok = await ui.confirm({
            title: 'Supprimer la sélection',
            message: `Voulez-vous vraiment supprimer ces ${selectedParticipants.length} participants ?`,
            confirmText: 'Supprimer Tout',
            danger: true
        });
        if (ok) {
            setParticipants(safeParticipants.filter(p => !selectedParticipants.includes(p.id)));
            setSelectedParticipants([]);
            ui.toast('Participants supprimés.', { type: 'success' });
        }
    };

    const handleAddGroup = (e) => {
        e.preventDefault();
        if (!canEdit) return;
        if (newGroupData.name) {
            setGroups([...safeGroups, { id: uuidv4(), ...newGroupData }]);
            setNewGroupData({ name: '', color: '#c2703d' });
        }
    };

    const handleDeleteGroup = async (groupId) => {
        if (!canEdit) return;
        const ok = await ui.confirm({
            title: 'Supprimer le groupe',
            message: "Supprimer ce groupe ? Les membres seront dissociés.",
            confirmText: 'Supprimer',
            danger: true
        });
        if (ok) {
            setGroups(safeGroups.filter(g => g.id !== groupId));
            setParticipants(safeParticipants.map(p => p.group === groupId ? { ...p, group: '' } : p));
            ui.toast('Groupe supprimé.', { type: 'success' });
        }
    };

    const handleExport = () => {
        const dataStr = JSON.stringify(safeParticipants, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `bboard-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportCsv = () => {
        const baseLabels = { child: 'Enfant', animator: 'Animateur', direction: 'Direction' };
        const roleLabels = { ...baseLabels, ...Object.fromEntries((roles || []).map(r => [r.id, r.label])) };
        exportParticipantsCsv(safeParticipants, safeGroups, roleLabels);
    };

    const openTrombiModal = () => {
        const year = new Date().getFullYear();
        setTrombiConfig({
            title: 'Trombinoscope',
            subtitle: `BBOARD · Session ${year}`,
            useSelection: false,
        });
    };

    const handlePrintTrombinoscope = (config) => {
        const { title, subtitle, useSelection } = config;
        const source = useSelection && selectedParticipants.length > 0
            ? safeParticipants.filter(p => selectedParticipants.includes(p.id))
            : safeParticipants.filter(p => p.role === 'child');

        const groupMap = Object.fromEntries(safeGroups.map(g => [g.id, g]));
        const sortAlpha = (a, b) => (a.lastName || '').localeCompare(b.lastName || '') || (a.firstName || '').localeCompare(b.firstName || '');

        const grouped = {};
        const ungrouped = [];
        source.forEach(p => {
            if (p.group && groupMap[p.group]) {
                if (!grouped[p.group]) grouped[p.group] = [];
                grouped[p.group].push(p);
            } else {
                ungrouped.push(p);
            }
        });

        const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

        const STAR_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:middle;margin:0 5px"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17.3l-6.2 4 2.4-7.4L2 9.4h7.6z"/></svg>`;
        const CACTUS_SVG = (flip) => `<svg width="44" height="62" viewBox="0 0 44 62" fill="#4a7a3a" opacity=".55" style="display:inline-block;${flip?'transform:scaleX(-1)':''}"><rect x="17" y="14" width="10" height="48" rx="5"/><rect x="3" y="26" width="17" height="8" rx="4"/><rect x="24" y="33" width="17" height="8" rx="4"/><rect x="3" y="17" width="8" height="17" rx="4"/><rect x="33" y="25" width="8" height="16" rx="4"/></svg>`;
        const SUN_SVG = `<svg width="48" height="48" viewBox="0 0 48 48" fill="#d4a96a" opacity=".4"><circle cx="24" cy="24" r="8"/><g stroke="#d4a96a" stroke-width="3" stroke-linecap="round">${[0,45,90,135,180,225,270,315].map(a=>`<line x1="${24+12*Math.cos(a*Math.PI/180)}" y1="${24+12*Math.sin(a*Math.PI/180)}" x2="${24+19*Math.cos(a*Math.PI/180)}" y2="${24+19*Math.sin(a*Math.PI/180)}"/>`).join('')}</g></svg>`;

        const cardHtml = (p) => {
            const firstName = esc(p.firstName || '');
            const lastName = esc((p.lastName || '').toUpperCase());
            const initials = `${p.firstName?.[0] || ''}${p.lastName?.[0] || ''}`.toUpperCase() || '?';
            const group = groupMap[p.group];
            const photoEl = p.photo
                ? `<img src="${p.photo}" class="photo" alt="${firstName}" />`
                : `<div class="initials">${esc(initials)}</div>`;
            const badgeEl = group
                ? `<div class="card-badge" style="background:${esc(group.color)}25;border-color:${esc(group.color)};color:${esc(group.color)}">${esc(group.name)}</div>`
                : '';
            return `<div class="card">${photoEl}<div class="card-name">${firstName}<br><strong>${lastName}</strong></div>${badgeEl}</div>`;
        };

        const sectionHtml = (members, groupObj) => {
            const color = groupObj?.color || '#c2703d';
            const name = groupObj ? esc(groupObj.name) : 'Sans groupe';
            return `
            <div class="section">
                <div class="section-title" style="border-color:${esc(color)};color:${esc(color)}">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="${esc(color)}" style="vertical-align:middle;margin:0 5px"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17.3l-6.2 4 2.4-7.4L2 9.4h7.6z"/></svg>
                    ${name}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="${esc(color)}" style="vertical-align:middle;margin:0 5px"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17.3l-6.2 4 2.4-7.4L2 9.4h7.6z"/></svg>
                </div>
                <div class="grid">${[...members].sort(sortAlpha).map(cardHtml).join('')}</div>
            </div>`;
        };

        let sectionsHtml = '';
        safeGroups.filter(g => grouped[g.id]).forEach(g => { sectionsHtml += sectionHtml(grouped[g.id], g); });
        if (ungrouped.length) sectionsHtml += sectionHtml(ungrouped, null);

        printHtml(`<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8">
<title>${esc(title)}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Rye&family=Special+Elite&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{
    background:#f2deb8;
    -webkit-print-color-adjust:exact;print-color-adjust:exact;
  }
  body{
    font-family:'Special Elite',Georgia,'Times New Roman',serif;
    color:#3d2008;padding:8px;
    background-image:
      radial-gradient(ellipse at 15% 15%,rgba(194,112,61,.12) 0%,transparent 55%),
      radial-gradient(ellipse at 85% 85%,rgba(194,112,61,.12) 0%,transparent 55%);
  }
  /* ── Page wrapper (replaces body::before fixed) ── */
  .page{
    border:3px solid #8b5c2a;
    padding:14px;
    min-height:260mm;
    box-shadow:inset 0 0 0 2px #f2deb8,inset 0 0 0 5px #c2703d,inset 0 0 0 7px #f2deb8;
  }
  /* ── Header ── */
  .header{text-align:center;margin-bottom:1.4rem;padding:0}
  .header-inner{
    background:#2c1505;border:4px solid #c2703d;
    border-top:none;border-bottom:none;
    padding:1rem 3rem;position:relative;overflow:hidden;
  }
  .header-inner::before,.header-inner::after{
    content:'';position:absolute;top:0;bottom:0;width:60px;
    background:repeating-linear-gradient(90deg,#c2703d 0,#c2703d 4px,transparent 4px,transparent 12px);
    opacity:.35;
  }
  .header-inner::before{left:0}
  .header-inner::after{right:0}
  .header-band{
    background:#8b5c2a;height:6px;
    background-image:repeating-linear-gradient(90deg,#6b3d18 0,#6b3d18 8px,#a87040 8px,#a87040 16px);
  }
  .header-stars{color:#c2703d;font-size:11px;letter-spacing:.6em;padding:4px 0;background:#2c1505;text-align:center}
  .main-title{
    font-family:'Rye',Georgia,serif;font-size:42px;color:#f2deb8;
    letter-spacing:.12em;text-transform:uppercase;line-height:1.05;
    text-shadow:2px 2px 0 #8b5c2a;
  }
  .sub-title{font-size:11px;color:#d4a96a;letter-spacing:.3em;text-transform:uppercase;margin-top:4px;font-weight:bold}
  .deco-row{display:flex;align-items:center;justify-content:space-between;padding:4px 1rem 0}
  /* ── Section ── */
  .section{margin-bottom:1.5rem}
  .section-title{
    text-align:center;font-family:'Rye',Georgia,serif;
    font-size:14px;letter-spacing:.55em;text-transform:uppercase;
    margin-bottom:.8rem;padding:.35rem 0;color:#5a3410;
  }
  .section-title::before,.section-title::after{
    content:'';display:block;height:2px;
    background:repeating-linear-gradient(90deg,currentColor 0,currentColor 6px,transparent 6px,transparent 12px);
    margin:3px 0;opacity:.55;
  }
  /* ── Grid: auto-fill so row fills naturally ── */
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:1.4rem}
  /* ── Cards ── */
  .card{
    text-align:center;background:#fffcf4;
    border:2px solid #8b5c2a;border-radius:6px;
    padding:.75rem .4rem .65rem;break-inside:avoid;
    box-shadow:0 0 0 2px #f2deb8,0 0 0 5px #c2703d,0 0 0 7px #f2deb8,3px 4px 8px rgba(61,32,8,.25);
    position:relative;
  }
  .card::after{
    content:'';position:absolute;top:5px;left:5px;right:5px;bottom:5px;
    border:1px dashed rgba(139,92,42,.22);border-radius:3px;pointer-events:none;
  }
  .photo{
    width:80px;height:80px;border-radius:50%;object-fit:cover;
    border:3px solid #8b5c2a;display:block;margin:0 auto .5rem;
    filter:sepia(15%) contrast(1.05);box-shadow:0 2px 5px rgba(0,0,0,.25);
  }
  .initials{
    width:80px;height:80px;border-radius:50%;
    background:linear-gradient(135deg,#c2703d,#8b5c2a);
    border:3px solid #5a3410;
    display:flex;align-items:center;justify-content:center;
    margin:0 auto .5rem;font-size:26px;font-weight:bold;color:#f2deb8;
    font-family:'Rye',Georgia,serif;box-shadow:0 2px 5px rgba(0,0,0,.25);
  }
  .card-name{font-size:10.5px;color:#3d2008;letter-spacing:.04em;line-height:1.35;text-transform:uppercase;margin-bottom:4px}
  .card-badge{display:inline-block;font-size:8px;font-weight:bold;letter-spacing:.07em;text-transform:uppercase;padding:2px 7px;border-radius:100px;border:1px solid;margin-top:2px}
  /* ── Footer ── */
  .footer{text-align:center;margin-top:1.25rem;padding-top:.65rem;font-size:9px;color:#8b5c2a;letter-spacing:.55em;text-transform:uppercase}
  .footer::before{content:'';display:block;height:3px;margin-bottom:.5rem;
    background:repeating-linear-gradient(90deg,#8b5c2a 0,#8b5c2a 6px,transparent 6px,transparent 12px)}
  @media print{
    @page{size:A4 portrait;margin:6mm}
    body{padding:4px}
    .section{break-inside:avoid-page}
    .card{break-inside:avoid}
  }
</style></head><body>
<div class="page">
  <div class="header">
    <div class="header-band"></div>
    <div class="header-stars">✦ &nbsp; ✦ &nbsp; ✦ &nbsp; ✦ &nbsp; ✦</div>
    <div class="header-inner">
      <div class="deco-row">
        ${CACTUS_SVG(false)}
        <div>
          <div class="main-title">${esc(title)}</div>
          <div class="sub-title">${esc(subtitle)} · ${source.length} participant${source.length > 1 ? 's' : ''}</div>
        </div>
        ${CACTUS_SVG(true)}
      </div>
    </div>
    <div class="header-stars">✦ &nbsp; ✦ &nbsp; ✦ &nbsp; ✦ &nbsp; ✦</div>
    <div class="header-band"></div>
  </div>
  ${sectionsHtml}
  <div class="footer">✦ &nbsp; BBOARD — Plateforme de Gestion de Colonie &nbsp; ✦</div>
</div>
</body></html>`);
    };

    const handleImportCsv = (event) => {
        if (!canEdit) { ui.toast('Import bloqué : droits insuffisants.', { type: 'error' }); return; }
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target.result.replace(/^﻿/, '');
                const sep = text.includes(';') ? ';' : ',';
                const lines = text.split(/\r?\n/).filter(l => l.trim());
                if (lines.length < 2) { ui.alert({ title: 'Fichier vide', message: 'Le CSV doit contenir au moins un en-tête et une ligne.' }); return; }

                const headers = lines[0].split(sep).map(h => h.replace(/^"|"$/g, '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''));
                const col = (aliases) => aliases.reduce((found, a) => found !== -1 ? found : headers.indexOf(a), -1);

                const iPrenom   = col(['prenom', 'firstname', 'first_name', 'first name', 'nom de l enfant', 'nom enfant']);
                const iNom      = col(['nom', 'lastname', 'last_name', 'last name', 'famille']);
                const iRole     = col(['role', 'rôle', 'statut', 'type']);
                const iGroupe   = col(['groupe', 'group', 'team', 'equipe', 'équipe']);
                const iNaissance = col(['date de naissance', 'naissance', 'birthdate', 'birth_date', 'dob', 'date naissance']);
                const iAllergies = col(['allergies', 'allergie', 'allergy']);
                const iRegime   = col(['regime', 'régime', 'diet', 'alimentation']);
                const iConstraintes = col(['contraintes', 'constraint', 'constraints', 'notes sante', 'notes santé']);

                if (iPrenom === -1 && iNom === -1) {
                    ui.alert({ title: 'Colonnes introuvables', message: 'Le CSV doit avoir au minimum une colonne "Prénom" et/ou "Nom".' });
                    return;
                }

                const parseCell = (cells, idx) => idx !== -1 ? (cells[idx] || '').replace(/^"|"$/g, '').trim() : '';
                const parseRole = (raw) => {
                    const r = raw.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
                    if (r.includes('anim')) return 'animator';
                    if (r.includes('direct') || r.includes('resp') || r.includes('chef')) return 'direction';
                    return 'child';
                };

                const newParticipants = lines.slice(1).map(line => {
                    const cells = line.split(sep);
                    const groupRaw = parseCell(cells, iGroupe);
                    const matchedGroup = safeGroups.find(g => g.name.toLowerCase() === groupRaw.toLowerCase());
                    return {
                        id: crypto.randomUUID(),
                        firstName: parseCell(cells, iPrenom),
                        lastName: parseCell(cells, iNom),
                        role: iRole !== -1 ? parseRole(parseCell(cells, iRole)) : 'child',
                        group: matchedGroup ? matchedGroup.id : '',
                        birthDate: parseCell(cells, iNaissance),
                        allergies: parseCell(cells, iAllergies),
                        diet: parseCell(cells, iRegime),
                        constraints: parseCell(cells, iConstraintes),
                        photo: '', healthDocProvided: false,
                        pocketMoney: { initial: 0, current: 0, history: [] }
                    };
                }).filter(p => p.firstName || p.lastName);

                // Fusion non destructive + dédoublonnage (prénom + nom + date de naissance)
                const norm = (s) => (s || '').toString().trim().toLowerCase()
                    .normalize('NFD').replace(/\p{Diacritic}/gu, '');
                const keyOf = (p) => `${norm(p.firstName)}|${norm(p.lastName)}|${norm(p.birthDate)}`;
                const existingKeys = new Set(safeParticipants.map(keyOf));
                const toAdd = [];
                let skipped = 0;
                for (const p of newParticipants) {
                    const k = keyOf(p);
                    if (existingKeys.has(k)) { skipped++; continue; }
                    existingKeys.add(k);
                    toAdd.push(p);
                }
                if (toAdd.length === 0) {
                    ui.toast(`Aucun nouveau participant à ajouter (${skipped} déjà présent${skipped > 1 ? 's' : ''}).`);
                    return;
                }
                const ok = await ui.confirm({
                    title: 'Import CSV',
                    message: `Ajouter ${toAdd.length} nouveau${toAdd.length > 1 ? 'x' : ''} participant${toAdd.length > 1 ? 's' : ''} à la liste existante (${safeParticipants.length}) ?` + (skipped ? ` ${skipped} déjà présent${skipped > 1 ? 's' : ''} ignoré${skipped > 1 ? 's' : ''}.` : ''),
                    confirmText: 'Ajouter'
                });
                if (ok) {
                    setParticipants([...safeParticipants, ...toAdd]);
                    ui.toast(`Import terminé : ${toAdd.length} ajouté${toAdd.length > 1 ? 's' : ''}${skipped ? `, ${skipped} ignoré${skipped > 1 ? 's' : ''}` : ''}.`, { type: 'success' });
                }
            } catch (err) {
                ui.alert({ title: 'Erreur', message: 'Impossible de lire le fichier CSV.' });
            }
        };
        reader.readAsText(file, 'utf-8');
        event.target.value = '';
    };

    const handleImport = (event) => {
        if (!canEdit) {
            ui.toast('Import bloqué: droits insuffisants.', { type: 'error' });
            return;
        }
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const parsed = JSON.parse(e.target.result);
                // Accepte un tableau brut OU une sauvegarde { participants: [...] }
                const imported = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.participants) ? parsed.participants : null);
                if (imported) {
                    // Fusion NON destructive : on conserve la liste actuelle et on n'ajoute
                    // que les participants absents. Dédoublonnage par prénom + nom + date de
                    // naissance (insensible casse/accents) → ré-importer le même fichier
                    // n'écrase rien et ne crée pas de doublon.
                    const norm = (s) => (s || '').toString().trim().toLowerCase()
                        .normalize('NFD').replace(/\p{Diacritic}/gu, '');
                    const keyOf = (p) => `${norm(p.firstName)}|${norm(p.lastName)}|${norm(p.birthDate)}`;
                    const existingKeys = new Set(safeParticipants.map(keyOf));
                    const existingIds = new Set(safeParticipants.map((p) => p.id));
                    const toAdd = [];
                    let skipped = 0;
                    for (const p of imported) {
                        const k = keyOf(p);
                        if (existingKeys.has(k)) { skipped++; continue; } // déjà présent → conservé tel quel
                        existingKeys.add(k);
                        // id unique garanti (évite toute collision avec un existant)
                        const id = (p.id && !existingIds.has(p.id)) ? p.id : uuidv4();
                        existingIds.add(id);
                        toAdd.push({ ...p, id });
                    }
                    if (toAdd.length === 0) {
                        ui.toast(`Aucun nouveau participant à ajouter (${skipped} déjà présent${skipped > 1 ? 's' : ''}).`);
                    } else {
                        const ok = await ui.confirm({
                            title: 'Importer les participants',
                            message: `Ajouter ${toAdd.length} nouveau${toAdd.length > 1 ? 'x' : ''} participant${toAdd.length > 1 ? 's' : ''} à la liste actuelle (${safeParticipants.length}) ?` + (skipped ? ` ${skipped} déjà présent${skipped > 1 ? 's' : ''} seront conservés.` : ''),
                            confirmText: 'Ajouter'
                        });
                        if (ok) {
                            setParticipants([...safeParticipants, ...toAdd]);
                            ui.toast(`Import terminé : ${toAdd.length} ajouté${toAdd.length > 1 ? 's' : ''}${skipped ? `, ${skipped} conservé${skipped > 1 ? 's' : ''}` : ''}.`, { type: 'success' });
                        }
                    }
                } else {
                    ui.alert({ title: 'Import invalide', message: 'Le fichier doit contenir un tableau JSON, ou un objet avec une clé "participants".' });
                }
            } catch (err) {
                ui.alert({ title: 'Erreur', message: 'Erreur lors de la lecture du JSON.' });
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    const resetForm = () => {
        setFormData({
            firstName: '', lastName: '', birthDate: '', allergies: '', constraints: '', photo: '', role: 'child', group: '', healthDocProvided: false,
            training: '', phone: '', email: '', address: '', emergencyContact: '', pin: '',
            pocketMoney: { initial: 0, current: 0, history: [] }
        });
        setEditingId(null);
        setIsFormOpen(false);
    };

    const isMobile = useIsMobile();
    const { scrollRef, isScrolled, onScroll } = useScrollCollapse(60);

    const handleEdit = (participant) => {
        if (!canEdit) return;
        setFormData({
            ...participant,
            role: participant.role || 'child',
            firstName: participant.firstName || '',
            lastName: participant.lastName || '',
            birthDate: participant.birthDate || '',
            allergies: participant.allergies || '',
            constraints: participant.constraints || '',
            photo: participant.photo || '',
            group: participant.group || '',
            healthDocProvided: !!participant.healthDocProvided,
            training: participant.training || '',
            phone: participant.phone || '',
            email: participant.email || '',
            address: participant.address || '',
            emergencyContact: participant.emergencyContact || '',
            pin: ''
        });
        setEditingId(participant.id);
        setIsFormOpen(true);
    };

    const handleDelete = async (id) => {
        if (!canEdit) return;
        const ok = await ui.confirm({
            title: 'Supprimer',
            message: 'Voulez-vous vraiment supprimer ce membre ?',
            confirmText: 'Supprimer',
            danger: true
        });
        if (ok) {
            setParticipants(safeParticipants.filter(p => p.id !== id));
            if (viewingParticipant && viewingParticipant.id === id) setViewingParticipant(null);
            ui.toast('Membre supprimé.', { type: 'success' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canEdit) return;
        try {
            if (editingId) {
                await setParticipants(safeParticipants.map(p => p.id === editingId ? { ...formData, id: editingId } : p));
            } else {
                await setParticipants([...safeParticipants, { ...formData, id: uuidv4() }]);
            }
            resetForm();
        } catch (err) {
            ui.alert({ title: 'Erreur', message: 'Impossible d\'enregistrer. Veuillez vérifier les informations (ex: PIN manquant pour un compte adulte).', type: 'error' });
        }
    };

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
        setSortConfig({ key, direction });
    };

    const filteredParticipants = useMemo(() => {
        return safeParticipants.filter(p => {
            const fName = (p.firstName || '').toLowerCase();
            const lName = (p.lastName || '').toLowerCase();
            const role = (p.role || '').toLowerCase();
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = (fName + ' ' + lName).includes(searchLower) || role.includes(searchLower);
            const matchesRole = filterRole === 'all' || p.role === filterRole;
            const matchesGroup = filterGroup === 'all' || (filterGroup === 'none' ? !p.group : p.group === filterGroup);
            return matchesSearch && matchesRole && matchesGroup;
        });
    }, [safeParticipants, searchTerm, filterRole, filterGroup]);

    const sortedParticipants = useMemo(() => {
        let sortableItems = [...filteredParticipants];
        sortableItems.sort((a, b) => {
            let aValue = a[sortConfig.key] || '';
            let bValue = b[sortConfig.key] || '';
            if (sortConfig.key === 'age') { aValue = a.birthDate || ''; bValue = b.birthDate || ''; }
            if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });
        return sortableItems;
    }, [filteredParticipants, sortConfig]);

    const stats = useMemo(() => ({
        total: safeParticipants.length,
        children: safeParticipants.filter(p => p.role === 'child').length,
        animators: safeParticipants.filter(p => p.role === 'animator').length,
        direction: safeParticipants.filter(p => p.role === 'direction').length
    }), [safeParticipants]);

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'transparent', overflow: 'hidden', position: 'relative' }}>
            <div style={{ maxWidth: '1600px', width: '96%', margin: '0 auto', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

            <div style={{overflow:'hidden', maxHeight: isScrolled ? '0' : '300px', opacity: isScrolled ? 0 : 1, transition:'max-height 0.3s ease,opacity 0.2s', pointerEvents: isScrolled ? 'none' : 'auto'}}>
                <DirectoryHeader
                    stats={stats}
                    selectedCount={selectedParticipants.length}
                    handleBulkDelete={handleBulkDelete}
                    openGroupManager={() => setIsGroupManagerOpen(true)}
                    openNewForm={() => { resetForm(); setIsFormOpen(true); }}
                    handleExport={handleExport}
                    handleExportCsv={handleExportCsv}
                    handleImport={handleImport}
                    handleImportCsv={handleImportCsv}
                    openTrombiModal={openTrombiModal}
                    hasSelection={selectedParticipants.length > 0}
                    isMobile={isMobile}
                    canEdit={canEdit}
                />
            </div>
            {/* Recherche compacte sticky retirée : DirectoryFilters (recherche + filtres) reste déjà épinglé hors du scroll → évite le doublon de barre de recherche. */}

            <DirectoryFilters
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filterRole={filterRole}
                setFilterRole={setFilterRole}
                filterGroup={filterGroup}
                setFilterGroup={setFilterGroup}
                viewMode={viewMode}
                setViewMode={setViewMode}
                groups={safeGroups}
                isMobile={isMobile}
            />

            <div style={{ flex: 1, overflowY: 'auto' }} className="no-scrollbar" ref={scrollRef} onScroll={onScroll}>
                <div style={{ padding: isMobile ? '1rem' : '1.5rem 2.5rem' }}>
                {/* Result count + active filter chips */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.875rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '900', color: 'var(--text-main)' }}>
                        {sortedParticipants.length} membre{sortedParticipants.length !== 1 ? 's' : ''}
                    </span>
                    {filterRole !== 'all' && (
                        <button onClick={() => setFilterRole('all')} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: '800', minHeight: '36px', padding: '0.4rem 0.85rem', borderRadius: '100px', background: 'var(--primary-light)', color: 'var(--primary-color)', border: '1px solid var(--primary-color)', cursor: 'pointer' }}>
                            {({ child: 'Enfants', animator: 'Animateurs', direction: 'Direction' }[filterRole])} ✕
                        </button>
                    )}
                    {filterGroup !== 'all' && (
                        <button onClick={() => setFilterGroup('all')} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: '800', minHeight: '36px', padding: '0.4rem 0.85rem', borderRadius: '100px', background: 'var(--primary-light)', color: 'var(--primary-color)', border: '1px solid var(--primary-color)', cursor: 'pointer' }}>
                            {filterGroup === 'none' ? 'Sans groupe' : (safeGroups.find(g => g.id === filterGroup)?.name || 'Groupe')} ✕
                        </button>
                    )}
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: '800', minHeight: '36px', padding: '0.4rem 0.85rem', borderRadius: '100px', background: 'var(--bg-secondary)', color: 'var(--text-muted)', border: '1px solid var(--glass-border)', cursor: 'pointer' }}>
                            "{searchTerm}" ✕
                        </button>
                    )}
                </div>
                {sortedParticipants.length === 0 ? (
                    <div className="card-glass" style={{ textAlign: 'center', padding: '6rem 2rem', maxWidth: '600px', margin: '4rem auto', border: '2.5px dashed var(--glass-border)' }}>
                        <div style={{ width: '90px', height: '90px', background: 'var(--bg-secondary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                            <Search size={44} style={{ opacity: 0.15 }} />
                        </div>
                        <h3 style={{ color: 'var(--text-main)', fontSize: '1.5rem', fontWeight: '950', marginBottom: '0.75rem', letterSpacing: '-0.03em' }}>Aucun résultat</h3>
                        <p style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: '600' }}>Modifiez vos filtres pour voir plus de membres.</p>
                        {(searchTerm || filterGroup !== 'all' || filterRole !== 'all') && (
                            <button onClick={() => { setSearchTerm(''); setFilterGroup('all'); setFilterRole('all'); }} className="btn btn-primary" style={{ marginTop: '2rem', padding: '0.85rem 2rem', fontWeight: '950' }}>Réinitialiser</button>
                        )}
                    </div>
                ) : (
                    <>
                        {viewMode === 'grid' ? (
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))', gap: isMobile ? '0.75rem' : '1.25rem', paddingBottom: '4rem' }}>
                                {sortedParticipants.map((p, idx) => (
                                    <ParticipantCard
                                        key={p.id}
                                        participant={p}
                                        index={idx}
                                        isSelected={selectedParticipants.includes(p.id)}
                                        toggleSelection={toggleSelection}
                                        handleViewDetails={() => setViewingParticipant(p)}
                                        handleEdit={handleEdit}
                                        handleDelete={handleDelete}
                                        groups={safeGroups}
                                        isMobile={isMobile}
                                        canEdit={canEdit}
                                    />
                                ))}
                            </div>
                        ) : (
                            <ParticipantTable
                                participants={sortedParticipants}
                                selectedParticipants={selectedParticipants}
                                toggleSelection={toggleSelection}
                                toggleSelectAll={toggleSelectAll}
                                sortConfig={sortConfig}
                                requestSort={requestSort}
                                handleViewDetails={(p) => setViewingParticipant(p)}
                                handleEdit={handleEdit}
                                handleDelete={handleDelete}
                                groups={safeGroups}
                                canEdit={canEdit}
                                isMobile={isMobile}
                            />
                        )}
                    </>
                )}
                </div>
            </div>

            <GroupManager
                isOpen={isGroupManagerOpen}
                onClose={() => setIsGroupManagerOpen(false)}
                groups={safeGroups}
                setGroups={setGroups}
                participants={safeParticipants}
                setParticipants={setParticipants}
                newGroupData={newGroupData}
                setNewGroupData={setNewGroupData}
                onAddGroup={handleAddGroup}
                onDeleteGroup={handleDeleteGroup}
                canEdit={canEdit}
            />

            <ParticipantDetails
                viewingParticipant={viewingParticipant}
                setViewingParticipant={setViewingParticipant}
                handleEdit={handleEdit}
                groups={safeGroups}
                canEdit={canEdit}
            />

            <ParticipantForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleSubmit}
                editingId={editingId}
                groups={safeGroups}
                canEdit={canEdit}
                roles={roles}
            />

            {/* ── Modal Trombinoscope ── */}
            {trombiConfig && (
                <div className="modal-overlay animate-fade-in" style={{ zIndex: 1100, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)' }}>
                    <div className="modal-content animate-scale-in" style={{ background: 'white', borderRadius: '28px', padding: '2rem', maxWidth: '440px', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: '0 32px 80px rgba(0,0,0,0.25)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ background: 'linear-gradient(135deg,#c2703d,#8b5c2a)', borderRadius: '14px', padding: '10px', color: '#f2deb8', fontSize: '22px', lineHeight: 1 }}>🤠</div>
                            <div>
                                <div style={{ fontWeight: '950', fontSize: '1.15rem', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>Trombinoscope</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700' }}>Impression thème cowboy</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '950', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Titre principal</label>
                                <input className="glass-input" value={trombiConfig.title} onChange={e => setTrombiConfig(c => ({ ...c, title: e.target.value }))} style={{ height: '44px', fontWeight: '850' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '950', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Sous-titre</label>
                                <input className="glass-input" value={trombiConfig.subtitle} onChange={e => setTrombiConfig(c => ({ ...c, subtitle: e.target.value }))} style={{ height: '44px', fontWeight: '850' }} />
                            </div>
                            {selectedParticipants.length > 0 && (
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem', background: 'var(--bg-secondary)', borderRadius: '14px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={trombiConfig.useSelection}
                                        onChange={e => setTrombiConfig(c => ({ ...c, useSelection: e.target.checked }))}
                                        style={{ width: '18px', height: '18px', accentColor: 'var(--primary-color)', flexShrink: 0 }}
                                    />
                                    <span style={{ fontWeight: '850', fontSize: '0.88rem', color: 'var(--text-main)' }}>
                                        Seulement la sélection
                                        <span style={{ marginLeft: '0.5rem', fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)' }}>({selectedParticipants.length} personne{selectedParticipants.length > 1 ? 's' : ''})</span>
                                    </span>
                                </label>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => setTrombiConfig(null)} className="btn btn-secondary" style={{ padding: '0.75rem 1.25rem', borderRadius: '14px', fontWeight: '900' }}>Annuler</button>
                            <button
                                onClick={() => { handlePrintTrombinoscope(trombiConfig); setTrombiConfig(null); }}
                                className="btn btn-primary"
                                style={{ padding: '0.75rem 1.5rem', borderRadius: '14px', fontWeight: '950', gap: '0.5rem' }}
                            >
                                🤠 Imprimer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .btn-icon-ref {
                    width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center;
                    background: white; border: 1.5px solid var(--glass-border); color: var(--text-muted); transition: all 0.2s; cursor: pointer;
                }
                .btn-icon-ref:hover { border-color: var(--primary-color); color: var(--primary-color); transform: translateY(-2px); }
                .btn-icon-ref.danger:hover { border-color: var(--danger-color); color: var(--danger-color); background: oklch(62% 0.2 28 / 0.05); }

                .badge-pill {
                   padding: 0.5rem 1rem; border-radius: 30px; font-size: 0.8rem; font-weight: 900;
                   display: flex; align-items: center; gap: 0.625rem; background: white; border: 1.5px solid var(--glass-border);
                }
            `}</style>
            </div>
        </div>
    );
}
