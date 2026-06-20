import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
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

// Normalise une date d'import CSV vers ISO (YYYY-MM-DD) : un format FR JJ/MM/AAAA
// cassait getAge, l'input type=date et la clé de dédoublonnage.
const toIsoDate = (raw) => {
    const s = (raw || '').trim();
    if (!s) return '';
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    const m = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
    if (m) {
        let [, d, mo, y] = m;
        if (y.length === 2) y = (Number(y) > 50 ? '19' : '20') + y;
        return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    return s;
};

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
        // Comparer l'APPARTENANCE des lignes visibles (pas juste le compte) : sinon
        // un filtre changé avec le même nombre d'éléments vidait la sélection à tort.
        const visibleIds = sortedParticipants.map(p => p.id);
        const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedParticipants.includes(id));
        setSelectedParticipants(allVisibleSelected
            ? selectedParticipants.filter(id => !visibleIds.includes(id))   // désélectionne les visibles, garde le reste
            : [...new Set([...selectedParticipants, ...visibleIds])]);       // ajoute les visibles
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

        const SHERIFF_STAR = (color) => `<svg width="18" height="18" viewBox="0 0 100 100" style="vertical-align:middle;margin:0 4px"><polygon points="50,2 61,35 96,35 68,57 79,91 50,69 21,91 32,57 4,35 39,35" fill="${color}" stroke="${color.replace(/[^#a-fA-F0-9]/g,'')||color}" stroke-width="2" stroke-linejoin="round"/><circle cx="50" cy="50" r="15" fill="none" stroke="#ffffffaa" stroke-width="3"/></svg>`;
        const CACTUS_SVG = (flip) => `<svg width="40" height="58" viewBox="0 0 44 62" fill="#3a6b2a" opacity=".7" style="display:inline-block;${flip?'transform:scaleX(-1)':''}"><rect x="17" y="14" width="10" height="48" rx="5"/><rect x="3" y="26" width="17" height="8" rx="4"/><rect x="24" y="33" width="17" height="8" rx="4"/><rect x="3" y="17" width="8" height="17" rx="4"/><rect x="33" y="25" width="8" height="16" rx="4"/></svg>`;
        const HORIZON_SVG = `<svg width="100%" height="30" viewBox="0 0 600 30" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"><polygon points="0,30 0,18 40,18 55,8 70,18 120,18 130,12 140,18 200,18 200,30" fill="#2c1505" opacity=".5"/><polygon points="400,30 400,18 440,18 460,5 480,18 520,18 535,10 550,18 600,18 600,30" fill="#2c1505" opacity=".5"/><rect x="270" y="10" width="6" height="20" rx="3" fill="#3a6b2a" opacity=".65"/><rect x="262" y="15" width="6" height="4" rx="2" fill="#3a6b2a" opacity=".65"/><rect x="276" y="17" width="6" height="4" rx="2" fill="#3a6b2a" opacity=".65"/><rect x="310" y="13" width="5" height="17" rx="2.5" fill="#3a6b2a" opacity=".55"/><rect x="303" y="17" width="5" height="3" rx="2" fill="#3a6b2a" opacity=".55"/><rect x="315" y="19" width="5" height="3" rx="2" fill="#3a6b2a" opacity=".55"/></svg>`;

        const cardHtml = (p) => {
            const firstName = esc(p.firstName || '');
            const lastName = esc((p.lastName || '').toUpperCase());
            const initials = `${p.firstName?.[0] || ''}${p.lastName?.[0] || ''}`.toUpperCase() || '?';
            const group = groupMap[p.group];
            const photoEl = p.photo
                ? `<img src="${p.photo}" class="photo" alt="${firstName}" />`
                : `<div class="initials">${esc(initials)}</div>`;
            const badgeEl = group
                ? `<div class="card-badge" style="color:${esc(group.color)}">${SHERIFF_STAR(esc(group.color))}${esc(group.name)}</div>`
                : '';
            const birthEl = p.birthDate
                ? `<div class="card-birth">né(e) le ${new Date(p.birthDate).toLocaleDateString('fr-FR')}</div>`
                : '';
            return `<div class="card"><div class="wanted-stamp">WANTED</div>${photoEl}<div class="card-name">${firstName}<br><strong>${lastName}</strong></div>${birthEl}${badgeEl}</div>`;
        };

        const sectionHtml = (members, groupObj) => {
            const color = groupObj?.color || '#8b5c2a';
            const name = groupObj ? esc(groupObj.name) : 'Sans Groupe';
            return `
            <div class="section">
                <div class="section-title">
                    ${SHERIFF_STAR(color)}
                    <span style="color:${esc(color)};border-bottom:2px solid ${esc(color)};padding:0 .5rem">${name}</span>
                    ${SHERIFF_STAR(color)}
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
<link href="https://fonts.googleapis.com/css2?family=Rye&family=Special+Elite&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  html,body{background:#d6b87a}
  body{
    font-family:'Special Elite',Georgia,serif;color:#2c1505;padding:6px;
    background-image:
      radial-gradient(ellipse at 4% 3%,rgba(80,40,8,.45) 0%,transparent 30%),
      radial-gradient(ellipse at 96% 3%,rgba(80,40,8,.4) 0%,transparent 30%),
      radial-gradient(ellipse at 4% 97%,rgba(80,40,8,.4) 0%,transparent 30%),
      radial-gradient(ellipse at 96% 97%,rgba(80,40,8,.45) 0%,transparent 30%),
      radial-gradient(ellipse at 50% 50%,rgba(220,180,100,.35) 0%,transparent 65%),
      radial-gradient(circle at 30% 60%,rgba(160,100,40,.1) 0%,transparent 20%),
      radial-gradient(circle at 72% 25%,rgba(160,100,40,.08) 0%,transparent 18%);
  }
  /* ── Outer frame: rope braid ── */
  .page{
    border:5px solid #6b3d18;padding:6px;
    background:
      repeating-linear-gradient(45deg,#8b5c2a 0,#8b5c2a 3px,transparent 3px,transparent 12px),
      repeating-linear-gradient(-45deg,#8b5c2a 0,#8b5c2a 3px,transparent 3px,transparent 12px);
    background-size:16px 16px;
  }
  .page-inner{
    background:#e8cfa0;
    background-image:
      radial-gradient(ellipse at 4% 3%,rgba(80,40,8,.35) 0%,transparent 28%),
      radial-gradient(ellipse at 96% 3%,rgba(80,40,8,.3) 0%,transparent 28%),
      radial-gradient(ellipse at 4% 97%,rgba(80,40,8,.3) 0%,transparent 28%),
      radial-gradient(ellipse at 96% 97%,rgba(80,40,8,.35) 0%,transparent 28%),
      radial-gradient(circle at 25% 55%,rgba(120,70,20,.12) 0%,transparent 18%),
      radial-gradient(circle at 78% 30%,rgba(120,70,20,.1) 0%,transparent 15%);
    border:3px solid #6b3d18;
    padding:12px;
  }
  /* ── Header ── */
  .header{text-align:center;margin-bottom:1.2rem}
  .header-band{height:8px;background:repeating-linear-gradient(90deg,#2c1505 0,#2c1505 10px,#8b5c2a 10px,#8b5c2a 20px,#2c1505 20px)}
  .header-eyebrow{
    background:#2c1505;padding:3px 0;
    font-size:9px;letter-spacing:.55em;color:#d4a96a;text-transform:uppercase;
  }
  .header-main{
    background:linear-gradient(180deg,#1a0a02 0%,#3d1c08 50%,#1a0a02 100%);
    padding:10px 20px 6px;border-left:4px solid #c2703d;border-right:4px solid #c2703d;
    position:relative;
  }
  .wanted-big{
    font-family:'Rye',Georgia,serif;font-size:52px;color:#e8cfa0;
    letter-spacing:.18em;text-transform:uppercase;line-height:1;
    text-shadow:3px 3px 0 #6b3d18,-1px -1px 0 #8b5c2a;
    display:block;
  }
  .dead-or-alive{
    font-family:'Special Elite',Georgia,serif;font-size:11px;
    color:#c2703d;letter-spacing:.5em;text-transform:uppercase;
    border-top:1px solid #c2703d;border-bottom:1px solid #c2703d;
    padding:3px 0;margin:4px 0;display:block;
  }
  .header-title{
    font-family:'Rye',Georgia,serif;font-size:22px;color:#f2deb8;
    letter-spacing:.08em;text-transform:uppercase;
    text-shadow:1px 1px 0 #6b3d18;
  }
  .header-sub{font-size:10px;color:#a87040;letter-spacing:.3em;text-transform:uppercase;margin-top:3px}
  .header-deco{display:flex;align-items:flex-end;justify-content:space-between;margin-top:4px}
  .header-horizon{margin:0;line-height:0}
  /* ── Sections ── */
  .section{margin-bottom:1.4rem}
  .section-title{
    text-align:center;font-family:'Rye',Georgia,serif;
    font-size:13px;letter-spacing:.35em;text-transform:uppercase;
    margin-bottom:.7rem;padding:.4rem 0;
    display:flex;align-items:center;justify-content:center;gap:.4rem;
  }
  /* ── Grid ── */
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:1.1rem}
  /* ── Cards ── */
  .card{
    text-align:center;
    background:linear-gradient(160deg,#fdf5e0 0%,#f5e8c0 100%);
    border:2px solid #6b3d18;border-radius:4px;
    padding:.6rem .35rem .55rem;break-inside:avoid;
    box-shadow:0 0 0 1px #e8cfa0,0 0 0 4px #8b5c2a,0 0 0 6px #e8cfa0,
               2px 4px 10px rgba(44,21,5,.4),inset 0 1px 0 rgba(255,255,255,.4);
    position:relative;overflow:visible;
  }
  .card::before{
    content:'';position:absolute;inset:4px;
    border:1px dashed rgba(107,61,24,.3);border-radius:2px;pointer-events:none;
  }
  .wanted-stamp{
    position:absolute;top:5px;right:-4px;
    font-family:'Special Elite',Georgia,serif;
    font-size:6.5px;font-weight:bold;color:#aa1111;
    letter-spacing:.12em;border:1.5px solid #aa1111;
    padding:1px 4px;transform:rotate(12deg);opacity:.82;
    text-transform:uppercase;background:rgba(255,255,255,.6);
    border-radius:1px;
  }
  .photo{
    width:74px;height:74px;border-radius:50%;object-fit:cover;
    border:3px solid #6b3d18;display:block;margin:0 auto .45rem;
    filter:sepia(25%) contrast(1.08) brightness(.97);
    box-shadow:0 2px 6px rgba(0,0,0,.35),0 0 0 2px #d4a96a;
  }
  .initials{
    width:74px;height:74px;border-radius:50%;
    background:linear-gradient(135deg,#8b4513 0%,#5a2d0c 100%);
    border:3px solid #3d1c08;
    display:flex;align-items:center;justify-content:center;
    margin:0 auto .45rem;font-size:24px;font-weight:bold;color:#e8cfa0;
    font-family:'Rye',Georgia,serif;
    box-shadow:0 2px 6px rgba(0,0,0,.35),0 0 0 2px #d4a96a;
  }
  .card-name{
    font-size:9.5px;color:#2c1505;letter-spacing:.05em;
    line-height:1.3;text-transform:uppercase;margin-bottom:4px;
    font-family:'Special Elite',Georgia,serif;
  }
  .card-birth{font-size:8px;color:#6b3d18;letter-spacing:.03em;margin-bottom:3px;font-style:italic}
  .card-badge{
    display:inline-flex;align-items:center;
    font-size:7.5px;font-weight:bold;letter-spacing:.05em;
    text-transform:uppercase;margin-top:2px;
  }
  /* ── Footer ── */
  .footer{
    text-align:center;margin-top:1rem;padding-top:.5rem;
    font-size:8.5px;color:#6b3d18;letter-spacing:.5em;text-transform:uppercase;
  }
  .footer-rule{height:4px;margin-bottom:.5rem;
    background:repeating-linear-gradient(90deg,#6b3d18 0,#6b3d18 8px,#d4a96a 8px,#d4a96a 14px,#6b3d18 14px)}
  @media print{
    @page{size:A4 portrait;margin:5mm}
    html,body{margin:0;padding:0}
    .page{min-height:287mm}
    .section{break-inside:avoid-page}
    .card{break-inside:avoid}
  }
</style></head><body>
<div class="page"><div class="page-inner">
  <div class="header">
    <div class="header-band"></div>
    <div class="header-eyebrow">✦ &nbsp; Territoire de l'Ouest &nbsp; ✦ &nbsp; Bureau du Shérif &nbsp; ✦</div>
    <div class="header-main">
      <div class="header-deco">
        ${CACTUS_SVG(false)}
        <div style="flex:1;text-align:center">
          <span class="wanted-big">Wanted</span>
          <span class="dead-or-alive">— Avis de Recherche —</span>
          <div class="header-title">${esc(title)}</div>
          <div class="header-sub">${esc(subtitle)} &nbsp;·&nbsp; ${source.length} desperado${source.length > 1 ? 's' : ''}</div>
        </div>
        ${CACTUS_SVG(true)}
      </div>
    </div>
    <div class="header-horizon">${HORIZON_SVG}</div>
    <div class="header-band"></div>
  </div>
  ${sectionsHtml}
  <div class="footer">
    <div class="footer-rule"></div>
    ✦ &nbsp; B B O A R D &nbsp;—&nbsp; Plateforme de Gestion de Colonie &nbsp; ✦
  </div>
</div></div>
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
                        birthDate: toIsoDate(parseCell(cells, iNaissance)),
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
            setSelectedParticipants(prev => prev.filter(x => x !== id)); // ne pas garder un id supprimé sélectionné
            if (viewingParticipant && viewingParticipant.id === id) setViewingParticipant(null);
            ui.toast('Membre supprimé.', { type: 'success' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canEdit) return;
        // setParticipants (mutateCollection) renvoie true/false et ne jette pas :
        // ne fermer le formulaire qu'en cas de succès, sinon afficher l'erreur.
        const next = editingId
            ? safeParticipants.map(p => p.id === editingId ? { ...formData, id: editingId } : p)
            : [...safeParticipants, { ...formData, id: uuidv4() }];
        const ok = await setParticipants(next);
        if (ok !== false) resetForm();
        else ui.alert({ title: 'Erreur', message: 'Impossible d\'enregistrer. Vérifiez les informations (ex : PIN manquant pour un compte adulte).', type: 'error' });
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
                        <h3 style={{ color: 'var(--text-main)', fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.75rem', letterSpacing: '-0.03em' }}>Aucun résultat</h3>
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
                    <div className="modal-content animate-scale-in" style={{ background: 'var(--surface-color)', borderRadius: '28px', padding: '2rem', maxWidth: '440px', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: '0 32px 80px rgba(0,0,0,0.25)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ background: 'linear-gradient(135deg,#c2703d,#8b5c2a)', borderRadius: '14px', padding: '10px', color: '#f2deb8', fontSize: '22px', lineHeight: 1 }}>🤠</div>
                            <div>
                                <div style={{ fontWeight: '800', fontSize: '1.15rem', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>Trombinoscope</div>
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
