import React, { useEffect, useMemo, useState } from 'react';
import { Download, Upload, Trash2, Lock, Unlock, FileSpreadsheet, KeyRound, ShieldCheck, Users, FileClock, Settings2, AlertCircle, LayoutDashboard, Database, ShieldAlert, Sparkles, ChevronRight, Search, History, Power, Ban, CheckCircle2, CalendarClock } from 'lucide-react';
import { useUi } from '../ui/UiProvider';
import { v4 as uuidv4 } from 'uuid';
import { apiSend } from '../utils/api';
import { exportParticipantsCsv } from '../utils/participantsCsv';
import { exportFullArchive, importFullArchive } from '../utils/fullBackup';
import SectionHeader from './common/SectionHeader';

const SECTION_LABELS = {
    home: 'Tableau de bord',
    schedule: 'Planning',
    exitsheet: 'Fiche de sortie',
    incident: 'FEI',
    recap: 'Coordination',
    attendance: 'Pointage',
    inventory: 'Matériel',
    directory: 'Annuaire',
    health: 'Santé'
};

const SECTIONS_CONFIG = [
    { id: 'schedule', label: 'Planning', viewKey: 'viewSchedule', editKey: 'editSchedule', subSections: [
        { viewKey: 'viewScheduleActivities', editKey: 'editScheduleActivities', label: 'Activités' },
        { viewKey: 'viewScheduleMenus', editKey: 'editScheduleMenus', label: 'Menus / Repas' }
    ] },
    { id: 'exitsheet', label: 'Fiches de sortie', viewKey: 'viewExitSheet', editKey: 'editExitSheet' },
    { id: 'incident', label: 'Incidents (FEI)', viewKey: 'viewIncident', editKey: 'editIncident' },
    { id: 'recap', label: 'Coordination', viewKey: 'viewRecap', editKey: 'editRecap' },
    { id: 'attendance', label: 'Pointage', viewKey: 'viewAttendance', editKey: 'editAttendance' },
    { id: 'inventory', label: 'Matériel', viewKey: 'viewInventory', editKey: 'editInventory', extra: { key: 'searchInventoryAI', label: 'Recherche IA' } },
    { id: 'directory', label: 'Annuaire', viewKey: 'viewDirectory', editKey: 'editDirectory' },
    { id: 'health', label: 'Pôle Santé', viewKey: 'viewHealth', editKey: 'editHealth', subSections: [
        { viewKey: 'viewHealthInfovac', editKey: 'editHealthInfovac', label: 'Fiches & Suivi' },
        { viewKey: 'viewHealthMeds', editKey: 'editHealthMeds', label: 'Médicaments' },
        { viewKey: 'viewHealthTransmissions', editKey: 'editHealthTransmissions', label: 'Registre · Transmissions' },
        { viewKey: 'viewHealthRegistreMeds', editKey: 'editHealthRegistreMeds', label: 'Registre · Administration & traitements' },
        { viewKey: 'viewHealthPassages', editKey: 'editHealthPassages', label: 'Registre · Suivi passages' }
    ] },
    { id: 'settings', label: 'Paramètres', viewKey: 'viewSettings', extraKeys: [
        { key: 'manageUsers', label: 'Gérer l\'équipe (utilisateurs & PIN)' },
        { key: 'manageAccess', label: 'Gérer les accès globaux' },
        { key: 'viewLogs', label: 'Consulter le journal (logs)' }
    ]}
];

// Codes PIN trop courants : refusés à la création comme à la modification.
const WEAK_PINS = new Set([
    '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999',
    '1234', '2345', '3456', '4567', '5678', '6789', '4321', '3210', '1212', '2580', '6969', '0007'
]);
const isWeakPin = (pin) => WEAK_PINS.has(String(pin));

const emptyPermissions = () => ({
    viewSchedule: false, editSchedule: false,
    viewExitSheet: false, editExitSheet: false,
    viewIncident: false, editIncident: false,
    viewDirectory: false, editDirectory: false,
    viewAttendance: false, editAttendance: false,
    viewInventory: false, editInventory: false,
    viewHealth: false, editHealth: false,
    searchInventoryAI: false, viewSettings: false,
    manageUsers: false, manageAccess: false, viewLogs: false
});

export default function Settings({
    participants, setParticipants,
    groups, setGroups,
    activities, setActivities,
    isAttendanceEnabled, setIsAttendanceEnabled,
    accessControl, setAccessControl,
    actorHeaders,
    currentUser,
    permissions,
    isMobile
}) {
    const ui = useUi();
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [pinInput, setPinInput] = useState('');
    const [pinError, setPinError] = useState(false);
    const [isChangingPin, setIsChangingPin] = useState(false);
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [logs, setLogs] = useState([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [userSearch, setUserSearch] = useState('');
    const [newUser, setNewUser] = useState({ firstName: '', lastName: '', role: 'animator', pin: '' });
    const [pinDrafts, setPinDrafts] = useState({});
    const [archiveBusy, setArchiveBusy] = useState(false);
    
    // Custom roles states
    const [newRoleName, setNewRoleName] = useState('');
    const [selectedConfigRole, setSelectedConfigRole] = useState('animator');
    const [editingUserPermId, setEditingUserPermId] = useState(null);
    // Filtres équipe + journal + suivi des sauvegardes
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all'); // all | nopin | disabled
    const [logFilter, setLogFilter] = useState('');
    const [lastBackup, setLastBackup] = useState(() => {
        try { return localStorage.getItem('colo-last-backup') || ''; } catch { return ''; }
    });
    // Affichage : « réduire la transparence » (verre → aplats). Persisté + appliqué sur <body>.
    const [uiSolid, setUiSolid] = useState(() => typeof document !== 'undefined' && document.body.classList.contains('ui-solid'));
    const toggleUiSolid = (on) => {
        setUiSolid(on);
        try { localStorage.setItem('colo-ui-solid', on ? '1' : '0'); } catch { /* storage indispo */ }
        document.body.classList.toggle('ui-solid', on);
    };

    const disabledUsers = accessControl?.disabledUsers || {};

    const staffUsers = useMemo(
        () => (participants || []).filter((p) => p && p.role !== 'child'),
        [participants]
    );

    const staffNoPin = useMemo(() => staffUsers.filter(u => u.hasPin === false).length, [staffUsers]);
    const staffDisabled = useMemo(() => staffUsers.filter(u => disabledUsers[u.id]).length, [staffUsers, disabledUsers]);

    const filteredUsers = useMemo(() => {
        let list = staffUsers;
        if (userSearch) list = list.filter(u => `${u.firstName} ${u.lastName}`.toLowerCase().includes(userSearch.toLowerCase()));
        if (roleFilter !== 'all') list = list.filter(u => u.role === roleFilter);
        if (statusFilter === 'nopin') list = list.filter(u => u.hasPin === false);
        else if (statusFilter === 'disabled') list = list.filter(u => disabledUsers[u.id]);
        return list;
    }, [staffUsers, userSearch, roleFilter, statusFilter, disabledUsers]);

    // Ancienneté de la dernière sauvegarde locale (rappel maintenance).
    const backupAge = useMemo(() => {
        if (!lastBackup) return null;
        return Math.floor((Date.now() - new Date(lastBackup).getTime()) / 86400000);
    }, [lastBackup]);
    const backupStale = !lastBackup || (backupAge !== null && backupAge > 7);

    const filteredLogs = useMemo(() => {
        if (!logFilter.trim()) return logs;
        const q = logFilter.toLowerCase();
        return logs.filter(l => `${l.action || ''} ${l.actor_name || ''} ${l.resource || ''}`.toLowerCase().includes(q));
    }, [logs, logFilter]);

    const canManageAccess = !!permissions?.manageAccess;
    const canManageUsers = !!permissions?.manageUsers;
    const canViewLogs = !!permissions?.viewLogs;

    const rolesList = useMemo(() => {
        return accessControl.roles || [
            { id: 'direction', label: 'Direction', base: true },
            { id: 'animator', label: 'Animateur', base: true },
            { id: 'child', label: 'Enfant', base: true }
        ];
    }, [accessControl.roles]);

    const roleLabels = useMemo(() => {
        const labels = {};
        rolesList.forEach(r => { labels[r.id] = r.label; });
        return labels;
    }, [rolesList]);

    const updateUserPermission = (userId, perm, value) => {
        // Écrit dans accessControl → côté serveur gated manageAccess. Aligner le gate client.
        if (!canManageAccess) { ui.toast('Droits insuffisants.', { type: 'error' }); return; }
        setAccessControl(prev => ({
            ...prev,
            userPermissions: {
                ...prev.userPermissions,
                [userId]: { ...(prev.userPermissions?.[userId] || {}), [perm]: value }
            }
        }));
    };

    const updateUserPin = async (userId, newPin) => {
        if (!canManageUsers) return;
        if (!/^\d{4}$/.test(newPin)) return;
        if (isWeakPin(newPin)) {
            ui.toast('Code PIN trop courant (ex : 1234, 0000). Choisissez-en un autre.', { type: 'error' });
            setPinDrafts(prev => ({ ...prev, [userId]: '' }));
            return;
        }
        try {
            const res = await fetch(`/api/users/${userId}/pin`, {
                method: 'POST',
                headers: actorHeaders,
                body: JSON.stringify({ newPin })
            });
            if (!res.ok) throw new Error(`Server returned ${res.status}`);
            setPinDrafts(prev => ({ ...prev, [userId]: '' }));
            ui.toast('Code PIN mis à jour.', { type: 'success' });
        } catch (err) {
            ui.toast('Impossible de modifier ce PIN.', { type: 'error' });
        }
    };

    const updateRolePermission = (role, perm, value) => {
        if (!canManageAccess) return;
        setAccessControl(prev => ({
            ...prev,
            rolePermissions: {
                ...prev.rolePermissions,
                [role]: { ...(prev.rolePermissions?.[role] || {}), [perm]: value }
            }
        }));
    };

    const updateUserRole = async (userId, newRole) => {
        if (!canManageUsers) return;
        // Promouvoir/rétrograder en Direction exige manageAccess (anti-escalade)
        const target = participants.find(p => p.id === userId);
        if ((newRole === 'direction' || target?.role === 'direction') && !canManageAccess) {
            ui.toast('Seule la Direction peut gérer le rôle Direction.', { type: 'error' });
            return;
        }
        const ok = await setParticipants(prev => prev.map(p => p.id === userId ? { ...p, role: newRole } : p));
        if (ok === false) return; // échec serveur : pas de faux succès
        ui.toast('Rôle de l\'utilisateur mis à jour.', { type: 'success' });
    };

    const handleCreateRole = () => {
        if (!canManageAccess) { ui.toast('Droits insuffisants.', { type: 'error' }); return; }
        const name = newRoleName.trim();
        if (!name) return;
        const key = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        if (!key) { ui.toast('Nom de rôle invalide.', { type: 'error' }); return; }
        if (rolesList.find(r => r.id === key)) {
            ui.toast('Ce rôle existe déjà.', { type: 'error' });
            return;
        }
        
        const newRole = { id: key, label: name, base: false };
        const updatedRoles = [...rolesList, newRole];
        
        const updatedPermissions = {
            ...(accessControl.rolePermissions || {}),
            [key]: emptyPermissions()
        };

        setAccessControl({
            ...accessControl,
            roles: updatedRoles,
            rolePermissions: updatedPermissions
        });
        setNewRoleName('');
        setSelectedConfigRole(key);
        ui.toast(`Rôle "${name}" créé avec succès.`, { type: 'success' });
    };

    const handleDeleteRole = async (key) => {
        if (!canManageAccess) { ui.toast('Droits insuffisants.', { type: 'error' }); return; }
        const roleToDelete = rolesList.find(r => r.id === key);
        if (roleToDelete?.base) {
            ui.toast('Les rôles par défaut ne peuvent pas être supprimés.', { type: 'error' });
            return;
        }
        
        const ok = await ui.confirm({
            title: 'Supprimer le rôle',
            message: `Voulez-vous vraiment supprimer le rôle "${roleLabels[key] || key}" ? Tous les utilisateurs ayant ce rôle repasseront en Animateur.`,
            confirmText: 'Supprimer',
            danger: true
        });
        if (!ok) return;

        const updatedRoles = rolesList.filter(r => r.id !== key);
        const updatedPermissions = { ...accessControl.rolePermissions };
        delete updatedPermissions[key];

        // Réassigner les membres AVANT de retirer le rôle : si l'écriture échoue,
        // on n'orpheline pas des membres sur un rôle supprimé.
        const saved = await setParticipants(prev => prev.map(p => p.role === key ? { ...p, role: 'animator' } : p));
        if (saved === false) return;

        if (selectedConfigRole === key) {
            setSelectedConfigRole('animator');
        }

        setAccessControl({
            ...accessControl,
            roles: updatedRoles,
            rolePermissions: updatedPermissions
        });
        ui.toast('Rôle supprimé.', { type: 'success' });
    };

    const handleResetUserPermissions = (userId) => {
        // Écrit dans accessControl → gated manageAccess côté serveur.
        if (!canManageAccess) { ui.toast('Droits insuffisants.', { type: 'error' }); return; }
        setAccessControl(prev => {
            const copy = { ...prev.userPermissions };
            delete copy[userId];
            return { ...prev, userPermissions: copy };
        });
        ui.toast('Droits réinitialisés selon le rôle.', { type: 'success' });
    };

    // Active/désactive un compte staff. Le serveur honore déjà disabledUsers
    // (login → 403, permissions vidées) : on écrit juste dans accessControl.
    const toggleUserDisabled = async (userId) => {
        if (!canManageAccess) { ui.toast('Droits insuffisants.', { type: 'error' }); return; }
        if (userId === currentUser?.id) { ui.toast('Vous ne pouvez pas désactiver votre propre compte.', { type: 'error' }); return; }
        const willDisable = !disabledUsers[userId];
        if (willDisable) {
            const ok = await ui.confirm({
                title: 'Désactiver le compte',
                message: 'Ce membre ne pourra plus se connecter (le compte et ses données sont conservés). Réactivable à tout moment.',
                confirmText: 'Désactiver', danger: true,
            });
            if (!ok) return;
        }
        setAccessControl(prev => {
            const next = { ...(prev.disabledUsers || {}) };
            if (willDisable) next[userId] = true; else delete next[userId];
            return { ...prev, disabledUsers: next };
        });
        ui.toast(willDisable ? 'Compte désactivé.' : 'Compte réactivé.', { type: 'success' });
    };

    const handleDeleteUser = async (userId) => {
        if (!canManageUsers) { ui.toast('Droits insuffisants.', { type: 'error' }); return; }
        if (userId === currentUser?.id) { ui.toast('Vous ne pouvez pas supprimer votre propre compte.', { type: 'error' }); return; }
        const u = staffUsers.find(x => x.id === userId);
        const ok = await ui.confirm({
            title: 'Supprimer le membre',
            message: `Supprimer définitivement ${u?.firstName || ''} ${u?.lastName || ''} ? Cette action est irréversible.`,
            confirmText: 'Supprimer', danger: true,
        });
        if (!ok) return;
        const res = await setParticipants(prev => prev.filter(p => p.id !== userId));
        if (res === false) return;
        // Nettoie les traces du membre dans accessControl + brouillons de PIN.
        setAccessControl(prev => {
            const userPermissions = { ...(prev.userPermissions || {}) };
            const disabled = { ...(prev.disabledUsers || {}) };
            delete userPermissions[userId]; delete disabled[userId];
            return { ...prev, userPermissions, disabledUsers: disabled };
        });
        setPinDrafts(prev => { const c = { ...prev }; delete c[userId]; return c; });
        if (editingUserPermId === userId) setEditingUserPermId(null);
        ui.toast('Membre supprimé.', { type: 'success' });
    };

    // Horodate la dernière sauvegarde (rappel maintenance).
    const markBackup = () => {
        const now = new Date().toISOString();
        try { localStorage.setItem('colo-last-backup', now); } catch { /* quota */ }
        setLastBackup(now);
    };

    const exportLogsCsv = () => {
        if (!canViewLogs) { ui.toast('Droits insuffisants.', { type: 'error' }); return; }
        if (!logs.length) { ui.toast('Aucun log à exporter.', { type: 'error' }); return; }
        const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const header = ['Date', 'Heure', 'Action', 'Auteur', 'Ressource'];
        const lines = logs.map(l => [
            new Date(l.created_at).toLocaleDateString('fr-FR'),
            new Date(l.created_at).toLocaleTimeString('fr-FR'),
            l.action, l.actor_name, l.resource,
        ].map(esc).join(','));
        const bom = String.fromCharCode(0xFEFF); // Excel lit l'UTF-8 (accents)
        const csv = bom + [header.map(esc).join(','), ...lines].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.body.appendChild(document.createElement('a'));
        link.href = url; link.download = `journal-${new Date().toISOString().split('T')[0]}.csv`;
        link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        if (!canManageUsers) { ui.toast('Droits insuffisants.', { type: 'error' }); return; }
        // Anti-escalade : créer un compte Direction exige manageAccess (cf. updateUserRole).
        if (newUser.role === 'direction' && !canManageAccess) {
            ui.toast('Seule la Direction peut créer un compte Direction.', { type: 'error' });
            return;
        }
        if (!newUser.firstName || !newUser.lastName) {
            ui.toast('Prénom et nom sont requis.', { type: 'error' });
            return;
        }
        if (!/^\d{4}$/.test(newUser.pin)) {
            ui.toast('Le code PIN doit contenir exactement 4 chiffres.', { type: 'error' });
            return;
        }
        if (isWeakPin(newUser.pin)) {
            ui.toast('Code PIN trop courant (ex : 1234, 0000). Choisissez-en un autre.', { type: 'error' });
            return;
        }

        const id = uuidv4();
        // pin reste au niveau racine : le serveur le hache puis le retire (sanitizeParticipant).
        // Pas de `data` embarqué (redondant + éviterait de figer le PIN en clair).
        const userToAdd = {
            ...newUser,
            id,
            healthDocProvided: true,
            group: '', // l'app lit `group` partout (pas `groupId`)
            allergies: '',
            constraints: '',
        };

        const name = newUser.firstName;
        // Attend le résultat réel du serveur : en cas d'échec, mutateCollection a déjà
        // affiché l'erreur — on n'annonce pas un faux succès ni ne vide le formulaire.
        const ok = await setParticipants(prev => [...prev, userToAdd]);
        if (ok === false) return;

        setNewUser({ firstName: '', lastName: '', role: 'animator', pin: '' });
        setActiveTab('users');
        ui.toast(`Utilisateur ${name} créé avec succès.`, { type: 'success' });
    };

    const handleResetAll = async () => {
        if (!canManageAccess) { ui.toast('Droits insuffisants.', { type: 'error' }); return; }
        // Saisie explicite « RESET » : garde-fou contre un clic accidentel (irréversible).
        const value = await ui.prompt({
            title: 'Réinitialisation totale',
            message: 'Participants, groupes et activités seront effacés définitivement (fiches, inventaire et journal conservés). Action IRRÉVERSIBLE. Tapez RESET pour confirmer.',
            placeholder: 'RESET',
            confirmText: 'Tout réinitialiser',
            validate: (v) => (String(v || '').trim().toUpperCase() === 'RESET' ? null : 'Tapez RESET en majuscules pour confirmer.'),
        });
        if (value === null) return;
        setParticipants([]);
        setGroups([]);
        setActivities([]);
        // Ne vider que les clés de l'app (pas localStorage.clear() qui touche tout l'origine)
        Object.keys(localStorage).filter(k => k.startsWith('colo-')).forEach(k => localStorage.removeItem(k));
        setLastBackup(''); // la clé colo-last-backup vient d'être effacée
        ui.toast('Réinitialisation effectuée.', { type: 'success' });
    };

    const blockingAlerts = useMemo(() => {
        const alerts = [];
        const children = (participants || []).filter((p) => p?.role === 'child');
        const missingHealth = children.filter((p) => !p.healthDocProvided).length;
        const noGroup = children.filter((p) => !(p.group || p.groupId)).length;
        if (missingHealth > 0) alerts.push(`${missingHealth} enfant(s) sans fiche sanitaire.`);
        if (noGroup > 0) alerts.push(`${noGroup} enfant(s) sans groupe.`);
        return alerts;
    }, [participants]);

    // Vigilance affichée en Vue d'ensemble : enfants + sécurité comptes + sauvegarde.
    const vigilance = useMemo(() => {
        const a = [...blockingAlerts];
        if (staffNoPin > 0) a.push(`${staffNoPin} membre(s) sans code PIN — connexion impossible tant qu'il n'est pas défini.`);
        if (backupStale) a.push(lastBackup
            ? `Dernière sauvegarde il y a ${backupAge} jour(s) — pensez à exporter une archive.`
            : 'Aucune sauvegarde locale enregistrée — exportez une archive.');
        return a;
    }, [blockingAlerts, staffNoPin, backupStale, backupAge, lastBackup]);

    const fetchLogs = async () => {
        if (!canViewLogs) return;
        setLogsLoading(true);
        try {
            const res = await fetch('/api/action-logs?limit=200');
            if (res.ok) {
                const data = await res.json();
                setLogs(Array.isArray(data) ? data : []);
            } else {
                ui.toast('Impossible de charger le journal.', { type: 'error' });
            }
        } catch (err) { console.error(err); ui.toast('Impossible de charger le journal.', { type: 'error' }); }
        finally { setLogsLoading(false); }
    };

    useEffect(() => { fetchLogs(); }, [canViewLogs]);

    const handleClearLogs = async () => {
        if (!canManageAccess) { ui.toast('Droits insuffisants.', { type: 'error' }); return; }
        const ok = await ui.confirm({
            title: 'Effacer le journal',
            message: 'Supprimer définitivement tout le journal d\'activité ?',
            confirmText: 'Effacer', danger: true
        });
        if (!ok) return;
        try {
            await apiSend('DELETE', '/api/action-logs', { headers: actorHeaders });
            setLogs([]);
            ui.toast('Journal effacé.', { type: 'success' });
        } catch (err) { ui.toast('Échec de la suppression.', { type: 'error' }); }
    };

    const handleUnlock = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/auth/verify-admin-pin', {
                method: 'POST',
                headers: actorHeaders,
                body: JSON.stringify({ pin: pinInput })
            });
            if (!response.ok) throw new Error(`Server returned ${response.status}`);
            setIsUnlocked(true);
            setPinError(false);
            setPinInput('');
        } catch (err) {
            setPinError(true);
            setPinInput('');
        }
    };

    const handleUpdatePin = async (e) => {
        e.preventDefault();
        if (!/^\d{4}$/.test(newPin)) { ui.toast('Le code PIN doit contenir exactement 4 chiffres.', { type: 'error' }); return; }
        if (newPin !== confirmPin) { ui.toast('Les codes PIN ne correspondent pas.', { type: 'error' }); return; }
        if (isWeakPin(newPin)) { ui.toast('Code PIN trop courant (ex : 1234, 0000). Choisissez-en un autre.', { type: 'error' }); return; }
        try {
            const response = await fetch('/api/auth/admin-pin', {
                method: 'POST',
                headers: actorHeaders,
                body: JSON.stringify({ newPin })
            });
            if (!response.ok) throw new Error(`Server returned ${response.status}`);
        } catch (err) {
            ui.toast('Vérifiez de nouveau le PIN administrateur avant de le modifier.', { type: 'error' });
            return;
        }
        setIsChangingPin(false); setNewPin(''); setConfirmPin('');
        ui.toast('Code PIN mis à jour.', { type: 'success' });
    };

    const handleFullExport = () => {
        // Annuaire complet (PII enfants) → même gate que l'archive complète.
        if (!canManageAccess) { ui.toast('Droits insuffisants.', { type: 'error' }); return; }
        const exportData = { version: '1.0', date: new Date().toISOString(), participants, groups, activities };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.body.appendChild(document.createElement('a'));
        link.href = url; link.download = `colo-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click(); document.body.removeChild(link);
        URL.revokeObjectURL(url);
        markBackup();
    };

    const handleRestoreFile = async (file) => {
        if (!canManageAccess) { ui.toast('Droits insuffisants.', { type: 'error' }); return; }
        let imported;
        try {
            imported = JSON.parse(await file.text());
        } catch {
            ui.toast('Fichier illisible (JSON invalide).', { type: 'error' }); return;
        }
        if (!imported || typeof imported !== 'object' ||
            (!Array.isArray(imported.participants) && !Array.isArray(imported.groups) && !Array.isArray(imported.activities))) {
            ui.toast('Fichier de sauvegarde non reconnu.', { type: 'error' }); return;
        }
        // Ne restaure que les sections présentes (évite d'écraser le reste avec du vide).
        const sections = [
            Array.isArray(imported.participants) && { url: '/api/participants', data: imported.participants, label: 'participants' },
            Array.isArray(imported.groups) && { url: '/api/groups', data: imported.groups, label: 'groupes' },
            Array.isArray(imported.activities) && { url: '/api/activities', data: imported.activities, label: 'activités' },
        ].filter(Boolean);
        const ok = await ui.confirm({
            title: 'Restaurer la sauvegarde',
            message: `Remplacer ${sections.map(s => s.label).join(', ')} par le contenu du fichier ? Les données actuelles seront écrasées.`,
            confirmText: 'Restaurer', danger: true
        });
        if (!ok) return;
        for (const s of sections) {
            try {
                await apiSend('POST', s.url, { headers: actorHeaders, body: s.data });
            } catch (err) {
                // Le serveur renvoie déjà un message clair (ex. permission manageUsers
                // requise pour le staff, ou PIN manquant).
                ui.toast(`Échec (${s.label}) : ${err.message}`, { type: 'error' });
                return;
            }
        }
        // Le serveur émet 'data_updated' → le store se rafraîchit tout seul.
        ui.toast('Restauration réussie.', { type: 'success' });
    };

    const handleExportCsv = () => {
        // Mêmes PII enfants que l'export JSON → même gate.
        if (!canManageAccess) { ui.toast('Droits insuffisants.', { type: 'error' }); return; }
        exportParticipantsCsv(participants, groups, roleLabels);
        markBackup();
    };

    // Sauvegarde complète .zip (données + photos + CSV). Réservé Direction.
    const handleFullArchiveExport = async () => {
        if (!canManageAccess) { ui.toast('Droits insuffisants.', { type: 'error' }); return; }
        if (archiveBusy) return; // anti double-clic (export complet = lourd)
        setArchiveBusy(true);
        try {
            await exportFullArchive({ headers: actorHeaders, roleLabels });
            markBackup();
            ui.toast('Archive complète téléchargée.', { type: 'success' });
        } catch (err) {
            ui.toast(`Échec de l'export : ${err.message}`, { type: 'error' });
        } finally {
            setArchiveBusy(false);
        }
    };

    // Restauration complète depuis un .zip (remplace tout). Réservé Direction.
    // Exige AUSSI manageUsers : le serveur le demande pour remplacer le staff —
    // sinon l'import écraserait les permissions puis échouerait sur les participants
    // (état mixte destructeur).
    const handleFullArchiveImport = async (file) => {
        if (!canManageAccess || !canManageUsers) { ui.toast('Droits insuffisants (gestion des accès ET des utilisateurs requis).', { type: 'error' }); return; }
        if (archiveBusy) return; // pas de double restauration entrelacée
        const ok = await ui.confirm({
            title: 'Tout importer',
            message: 'Restaurer la totalité depuis cette archive ? Les données actuelles seront remplacées.',
            confirmText: 'Importer', danger: true,
        });
        if (!ok) return;
        setArchiveBusy(true);
        try {
            const { restored, failed } = await importFullArchive(file, { headers: actorHeaders, actorId: currentUser?.id });
            if (failed.length) {
                ui.toast(`Import partiel — échecs : ${failed.map(f => f.label).join(', ')}.`, { type: 'error' });
            } else {
                ui.toast(`Import réussi (${restored.length} sections restaurées).`, { type: 'success' });
            }
        } catch (err) {
            ui.toast(`Échec de l'import : ${err.message}`, { type: 'error' });
        } finally {
            setArchiveBusy(false);
        }
    };

    if (!isUnlocked) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '2rem' }}>
                <div className="card-glass animate-scale-in" style={{ maxWidth: '440px', width: '100%', padding: isMobile ? '2rem 1.5rem' : '3.5rem 2.5rem', textAlign: 'center', borderRadius: isMobile ? '28px' : '40px' }}>
                    <div style={{ background: 'var(--primary-gradient)', width: '80px', height: '80px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', color: 'white', transform: 'rotate(-5deg)', boxShadow: '0 12px 32px var(--shadow-color)' }}>
                        <Lock size={36} strokeWidth={2} />
                    </div>
                    <h2 style={{ fontSize: '1.85rem', fontWeight: '800', marginBottom: '0.75rem', color: 'var(--text-main)', fontFamily: 'Bricolage Grotesque, sans-serif', letterSpacing: '-0.04em' }}>Espace Direction</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '0.95rem', fontWeight: '850', lineHeight: '1.5' }}>Authentification requise pour accéder aux paramètres de sécurité et droits d'accès.</p>
                    <form onSubmit={handleUnlock}>
                        <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                            <input type="password" inputMode="numeric" autoFocus placeholder="••••" value={pinInput} onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 8))}
                                style={{ width: '100%', padding: '1.25rem', textAlign: 'center', fontSize: '2.5rem', letterSpacing: '0.625rem', borderRadius: '20px', border: `2.5px solid ${pinError ? 'var(--danger-color)' : 'var(--bg-secondary)'}`, background: 'var(--bg-secondary)', fontWeight: '950', transition: 'all 0.3s' }} />
                        </div>
                        {pinError && <p style={{ color: 'var(--danger-color)', fontSize: '0.85rem', marginBottom: '1.25rem', fontWeight: '950', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Code PIN invalide</p>}
                        <button className="btn btn-primary" style={{ width: '100%', padding: '1.25rem', fontWeight: '950', fontSize: '1rem', borderRadius: '18px' }}>Déverrouiller l'accès</button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'transparent', padding: isMobile ? '1rem' : '0' }}>
            {/* Header Area */}
            <div className="glass-card" style={{
                padding: isMobile ? '1rem' : '1.25rem 2rem',
                marginBottom: isMobile ? '1rem' : '2rem',
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'flex-start' : 'center',
                borderRadius: '24px',
                gap: '1rem'
            }}>
                <SectionHeader icon={ShieldCheck} title="Paramètres" subtitle={currentUser?.firstName} />
                <div style={{ display: 'flex', gap: '0.75rem', width: isMobile ? '100%' : 'auto' }}>
                    <button className="btn btn-secondary" style={{ flex: isMobile ? 1 : 'none', padding: '0.625rem 1rem', borderRadius: '12px', fontWeight: '950', fontSize: '0.85rem', minHeight: '44px' }} onClick={() => setIsUnlocked(false)}>
                        <Lock size={16} strokeWidth={2} /> Verrouiller
                    </button>
                </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '1.5rem' : '2.5rem', overflow: isMobile ? 'visible' : 'hidden' }}>
                {/* Sidebar Navigation */}
                <div style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'row' : 'column',
                    gap: '0.5rem',
                    overflowX: isMobile ? 'auto' : 'visible',
                    paddingBottom: isMobile ? '0.5rem' : '0',
                    flexShrink: 0
                }} className="no-scrollbar">
                    {[
                        { id: 'overview', label: 'Vue d\'ensemble', icon: <LayoutDashboard size={18} strokeWidth={2} /> },
                        { id: 'users', label: 'Équipe & Droits', icon: <Users size={18} strokeWidth={2} /> },
                        { id: 'create_user', label: 'Créer Utilisateur', icon: <Sparkles size={18} strokeWidth={2} /> },
                        { id: 'roles', label: 'Gestion des Rôles', icon: <Unlock size={18} strokeWidth={2} /> },
                        { id: 'sections', label: 'Modules Visibles', icon: <Settings2 size={18} strokeWidth={2} /> },
                        { id: 'security', label: 'Sécurité & PIN', icon: <KeyRound size={18} strokeWidth={2} /> },
                        { id: 'maintenance', label: 'Maintenance & Logs', icon: <Database size={18} strokeWidth={2} /> },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.75rem 1rem',
                                border: 'none', background: activeTab === tab.id ? 'var(--primary-light)' : 'transparent',
                                color: activeTab === tab.id ? 'var(--primary-color)' : 'var(--text-muted)',
                                borderRadius: '14px', fontWeight: '950', cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                textAlign: 'left', fontSize: '12px', whiteSpace: 'nowrap',
                                flexShrink: 0, minHeight: '44px'
                            }}
                        >
                            <span style={{ display: 'flex', flexShrink: 0 }}>{tab.icon}</span>
                            <span>{tab.label}</span>
                            {activeTab === tab.id && !isMobile && <ChevronRight size={14} style={{ marginLeft: 'auto' }} strokeWidth={2} />}
                        </button>
                    ))}
                </div>

                {/* Main Tab Content */}
                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }} className="no-scrollbar">

                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && (
                        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
                                {[
                                    { label: 'Personnel', value: staffUsers.length, color: 'var(--primary-color)', icon: <Users size={18} /> },
                                    { label: 'Modules Actifs', value: Object.keys(SECTION_LABELS).length - (Object.values(accessControl?.hiddenSections || {}).filter(Boolean).length), color: 'var(--success-color)', icon: <LayoutDashboard size={18} /> },
                                    { label: 'Actions Logs', value: logs.length, color: 'var(--text-main)', icon: <History size={18} /> },
                                    { label: 'Sans PIN', value: staffNoPin, color: staffNoPin > 0 ? 'var(--danger-color)' : 'var(--success-color)', icon: <KeyRound size={18} /> }
                                ].map((stat, i) => (
                                    <div key={i} className="glass-card" style={{ padding: '1.75rem', borderRadius: '24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                            <div style={{ background: 'var(--bg-secondary)', padding: '6px', borderRadius: '8px', color: stat.color }}>{stat.icon}</div>
                                            <div style={{ fontSize: '10px', fontWeight: '950', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>{stat.label}</div>
                                        </div>
                                        <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.04em', fontFamily: 'Bricolage Grotesque, sans-serif' }}>{stat.value}</div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) 400px', gap: '2rem' }}>
                                <div className="glass-card" style={{ padding: isMobile ? '1.25rem' : '2rem', borderRadius: isMobile ? '22px' : '32px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                                        <div style={{ background: 'oklch(62% 0.18 20 / 0.1)', padding: '8px', borderRadius: '10px', color: 'var(--danger-color)' }}><ShieldAlert size={20} strokeWidth={2} /></div>
                                        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>Points de Vigilance</h4>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {vigilance.length === 0 ? (
                                            <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: '20px', border: '1.5px dashed var(--glass-border)', color: 'var(--success-color)', fontWeight: '950', fontSize: '0.9rem' }}>
                                                <Sparkles size={24} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                                                <p>État du système nominal. Aucune alerte critique détectée.</p>
                                            </div>
                                        ) : (
                                            vigilance.map((msg, i) => (
                                                <div key={i} style={{ padding: '1rem 1.25rem', background: 'oklch(62% 0.18 20 / 0.05)', borderRadius: '16px', border: '1.5px solid oklch(62% 0.18 20 / 0.1)', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                                    <AlertCircle size={18} style={{ color: 'var(--danger-color)', flexShrink: 0, marginTop: '2px' }} />
                                                    <span style={{ fontSize: '0.95rem', fontWeight: '850', color: 'oklch(20% 0.05 20)' }}>{msg}</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                                <div className="glass-card" style={{ padding: isMobile ? '1.25rem' : '2rem', borderRadius: isMobile ? '22px' : '32px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                                        <div style={{ background: 'var(--bg-secondary)', padding: '8px', borderRadius: '10px', color: 'var(--text-main)' }}><History size={20} strokeWidth={2} /></div>
                                        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>Audit Récent</h4>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {logs.slice(0, 6).map((log, i) => (
                                            <div key={log.id || i} style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--bg-secondary)', paddingBottom: '10px' }}>
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-color)', marginTop: '6px', opacity: 0.6 }} />
                                                <div>
                                                    <div style={{ fontSize: '13px', fontWeight: '950', color: 'var(--text-main)' }}>{log.action}</div>
                                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '900', textTransform: 'uppercase', marginTop: '2px' }}>{log.actor_name} · {new Date(log.created_at).toLocaleTimeString('fr-FR')}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* USERS TAB */}
                    {activeTab === 'users' && (
                        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{
                                background: 'var(--surface-color)', borderRadius: '24px', padding: isMobile ? '1rem' : '1.25rem 1.75rem',
                                border: '1.5px solid var(--glass-border)', display: 'flex', flexDirection: isMobile ? 'column' : 'row',
                                gap: '1rem', alignItems: isMobile ? 'stretch' : 'center', position: 'sticky', top: 0, zIndex: 10, boxShadow: 'var(--shadow-lg)'
                            }}>
                                <div style={{ flex: 1, position: 'relative' }}>
                                    <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                                    <input className="glass-input" placeholder="Filtrer par nom ou prénom..." value={userSearch} onChange={e => setUserSearch(e.target.value)} style={{ paddingLeft: '48px', height: '52px', background: 'var(--bg-secondary)', borderRadius: '16px', fontWeight: '800' }} />
                                </div>
                                <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="glass-input"
                                    style={{ height: '52px', borderRadius: '16px', background: 'var(--bg-secondary)', fontWeight: '800', padding: '0 1rem', maxWidth: isMobile ? '100%' : '180px' }}>
                                    <option value="all">Tous les rôles</option>
                                    {rolesList.filter(r => r.id !== 'child').map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                                </select>
                                <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-secondary)', borderRadius: '14px', padding: '4px', flexShrink: 0 }}>
                                    {[['all', 'Tous'], ['nopin', 'Sans PIN'], ['disabled', `Désactivés${staffDisabled ? ` (${staffDisabled})` : ''}`]].map(([val, lab]) => (
                                        <button key={val} type="button" onClick={() => setStatusFilter(val)}
                                            style={{ padding: '0.5rem 0.75rem', borderRadius: '10px', fontSize: '0.72rem', fontWeight: '900', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', background: statusFilter === val ? 'var(--surface-color)' : 'transparent', color: statusFilter === val ? 'var(--primary-color)' : 'var(--text-muted)', boxShadow: statusFilter === val ? 'var(--shadow-sm)' : 'none' }}>
                                            {lab}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                                {filteredUsers.length === 0 && (
                                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', background: 'var(--bg-secondary)', borderRadius: '24px', border: '1.5px dashed var(--glass-border)', color: 'var(--text-muted)', fontWeight: '850' }}>
                                        Aucun membre pour ce filtre.
                                    </div>
                                )}
                                {filteredUsers.map((user, idx) => {
                                    const hasCustomPerms = accessControl?.userPermissions?.[user.id] && Object.keys(accessControl.userPermissions[user.id]).length > 0;
                                    const isEditingThisUser = editingUserPermId === user.id;
                                    const isDisabled = !!disabledUsers[user.id];
                                    const canAccountActions = user.id !== 'director' && user.id !== currentUser?.id;

                                    return (
                                        <div key={user.id} className="glass-card animate-fade-in" style={{
                                            '--i': idx,
                                            animationDelay: `calc(var(--i) * 30ms)`,
                                            padding: '1.75rem', borderRadius: '28px',
                                            outline: isEditingThisUser ? '2.5px solid var(--primary-color)' : 'none', outlineOffset: '-2px',
                                            opacity: isDisabled ? 0.62 : 1,
                                        }}>
                                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.25rem' }}>
                                                <div style={{ width: '44px', height: '44px', background: 'var(--primary-gradient)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '950', fontSize: '1.1rem' }}>
                                                    {(user.firstName?.[0] || '') + (user.lastName?.[0] || '') || '?'}
                                                </div>
                                                <div style={{ minWidth: 0, flex: 1 }}>
                                                    <div style={{ fontWeight: '950', fontSize: '1rem', color: 'var(--text-main)', letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.firstName} {user.lastName}</div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '4px', flexWrap: 'wrap' }}>
                                                        <select
                                                            value={user.role}
                                                            onChange={e => updateUserRole(user.id, e.target.value)}
                                                            disabled={!canManageUsers || user.id === 'director'}
                                                            style={{
                                                                padding: '4px 8px', borderRadius: '8px', border: 'none',
                                                                background: 'var(--bg-secondary)', color: 'var(--primary-color)',
                                                                fontSize: '0.78rem', fontWeight: '900', cursor: 'pointer'
                                                            }}
                                                        >
                                                            {rolesList.filter(r => r.id !== 'child').map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                                                        </select>
                                                        {user.hasPin === false ? (
                                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.64rem', fontWeight: '950', padding: '3px 7px', borderRadius: '7px', background: 'oklch(95% 0.05 28)', color: 'var(--danger-color)' }}>
                                                                <AlertCircle size={10} strokeWidth={2} /> Aucun PIN
                                                            </span>
                                                        ) : user.hasPin === true ? (
                                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.64rem', fontWeight: '950', padding: '3px 7px', borderRadius: '7px', background: 'oklch(95% 0.06 145)', color: 'oklch(46% 0.16 145)' }}>
                                                                <CheckCircle2 size={10} strokeWidth={2} /> PIN défini
                                                            </span>
                                                        ) : null}
                                                        {isDisabled && (
                                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.64rem', fontWeight: '950', padding: '3px 7px', borderRadius: '7px', background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                                                                <Ban size={10} strokeWidth={2} /> Désactivé
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* PIN Change box */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'var(--bg-main)', borderRadius: '16px', border: '1px solid var(--glass-border)', marginBottom: '1rem' }}>
                                                <KeyRound size={14} style={{ opacity: 0.5 }} />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '9px', fontWeight: '950', color: 'var(--text-muted)', textTransform: 'uppercase' }}>CODE PIN</div>
                                                    <input
                                                        type="password" inputMode="numeric" maxLength={4}
                                                        value={pinDrafts[user.id] || ''}
                                                        onChange={e => {
                                                            const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                                                            setPinDrafts(prev => ({ ...prev, [user.id]: value }));
                                                            if (value.length === 4) updateUserPin(user.id, value);
                                                        }}
                                                        placeholder="••••"
                                                        style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-main)', fontWeight: '950', fontSize: '0.9rem', letterSpacing: '0.2rem' }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Action buttons (override accessControl → manageAccess requis) */}
                                            {canManageAccess && <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                <button
                                                    onClick={() => setEditingUserPermId(isEditingThisUser ? null : user.id)}
                                                    className="btn btn-secondary"
                                                    style={{ flex: 1, padding: '0.5rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '900' }}
                                                >
                                                    {isEditingThisUser ? 'Masquer accès' : hasCustomPerms ? 'Accès personnalisés' : 'Personnaliser accès'}
                                                </button>
                                                {hasCustomPerms && (
                                                    <button
                                                        onClick={() => handleResetUserPermissions(user.id)}
                                                        className="btn btn-secondary"
                                                        style={{ padding: '0.5rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '900', color: 'var(--danger-color)' }}
                                                        title="Réinitialiser les permissions selon le rôle"
                                                    >
                                                        Rétablir Rôle
                                                    </button>
                                                )}
                                            </div>}

                                            {canAccountActions && (canManageAccess || canManageUsers) && (
                                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                                                    {canManageAccess && (
                                                        <button type="button" onClick={() => toggleUserDisabled(user.id)} className="btn btn-secondary"
                                                            style={{ flex: 1, padding: '0.5rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '900', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px', color: isDisabled ? 'var(--success-color)' : 'var(--text-muted)' }}>
                                                            <Power size={13} strokeWidth={2} /> {isDisabled ? 'Réactiver' : 'Désactiver'}
                                                        </button>
                                                    )}
                                                    {canManageUsers && (
                                                        <button type="button" onClick={() => handleDeleteUser(user.id)} className="btn btn-secondary"
                                                            style={{ padding: '0.5rem 0.7rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '900', color: 'var(--danger-color)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                                                            title="Supprimer ce membre">
                                                            <Trash2 size={13} strokeWidth={2} />
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                            {/* User permission overriding panel */}
                                            {isEditingThisUser && (
                                                <div className="animate-scale-in" style={{ marginTop: '1.25rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1.5px solid var(--glass-border)' }}>
                                                    <div style={{ fontSize: '10px', fontWeight: '950', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
                                                        <span>Accès personnalisés</span>
                                                        <span style={{ color: hasCustomPerms ? 'var(--primary-color)' : 'var(--text-softer)' }}>{hasCustomPerms ? 'Surchargé' : 'Hérité du rôle'}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '280px', overflowY: 'auto' }} className="no-scrollbar">
                                                        {SECTIONS_CONFIG.map(sec => {
                                                            const baseline = accessControl.rolePermissions?.[user.role] || accessControl.rolePermissions?.animator || {};
                                                            const roleView = !!baseline[sec.viewKey];
                                                            const userView = accessControl.userPermissions?.[user.id]?.[sec.viewKey];
                                                            const activeView = userView !== undefined ? userView : roleView;

                                                            const roleEdit = sec.editKey ? !!baseline[sec.editKey] : false;
                                                            const userEdit = sec.editKey ? accessControl.userPermissions?.[user.id]?.[sec.editKey] : undefined;
                                                            const activeEdit = userEdit !== undefined ? userEdit : roleEdit;

                                                            return (
                                                                <div key={sec.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '6px' }}>
                                                                    <div style={{ fontSize: '0.8rem', fontWeight: '900', color: 'var(--text-main)' }}>{sec.label}</div>
                                                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                                                        {sec.viewKey && (
                                                                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '800', color: userView !== undefined ? 'var(--primary-color)' : 'var(--text-muted)' }}>
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={activeView}
                                                                                    onChange={e => updateUserPermission(user.id, sec.viewKey, e.target.checked)}
                                                                                />
                                                                                <span>Voir</span>
                                                                            </label>
                                                                        )}
                                                                        {sec.editKey && (
                                                                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '800', color: userEdit !== undefined ? 'var(--primary-color)' : 'var(--text-muted)' }}>
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={activeEdit}
                                                                                    onChange={e => updateUserPermission(user.id, sec.editKey, e.target.checked)}
                                                                                />
                                                                                <span>Modifier</span>
                                                                            </label>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* CREATE USER TAB */}
                    {activeTab === 'create_user' && (
                        <div className="glass-card animate-fade-in" style={{ padding: isMobile ? '1.25rem' : '3rem', borderRadius: isMobile ? '22px' : '32px', maxWidth: '600px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                                <div style={{ background: 'var(--primary-light)', padding: '10px', borderRadius: '12px', color: 'var(--primary-color)' }}><Sparkles size={24} strokeWidth={2} /></div>
                                <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', fontFamily: 'Bricolage Grotesque, sans-serif' }}>Nouveau Membre</h3>
                            </div>

                            <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div>
                                    <label className="input-label" style={{ display: 'block', fontSize: '0.78rem', fontWeight: '950', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Prénom</label>
                                    <input className="glass-input" required value={newUser.firstName} onChange={e => setNewUser(p => ({ ...p, firstName: e.target.value }))} placeholder="Ex: Jean" style={{ height: '48px', fontWeight: '800' }} />
                                </div>
                                <div>
                                    <label className="input-label" style={{ display: 'block', fontSize: '0.78rem', fontWeight: '950', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Nom</label>
                                    <input className="glass-input" required value={newUser.lastName} onChange={e => setNewUser(p => ({ ...p, lastName: e.target.value }))} placeholder="Ex: Dupont" style={{ height: '48px', fontWeight: '800' }} />
                                </div>
                                <div>
                                    <label className="input-label" style={{ display: 'block', fontSize: '0.78rem', fontWeight: '950', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Rôle</label>
                                    <select className="glass-input" value={newUser.role} onChange={e => setNewUser(p => ({ ...p, role: e.target.value }))} style={{ height: '48px', fontWeight: '800' }}>
                                        {rolesList.filter(r => r.id !== 'child' && (r.id !== 'direction' || canManageAccess)).map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="input-label" style={{ display: 'block', fontSize: '0.78rem', fontWeight: '950', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Code PIN (4 chiffres)</label>
                                    <input
                                        type="password" inputMode="numeric" maxLength={4} required
                                        className="glass-input" value={newUser.pin}
                                        onChange={e => setNewUser(p => ({ ...p, pin: e.target.value.replace(/\D/g, '') }))}
                                        placeholder="4 chiffres"
                                        style={{ textAlign: 'center', letterSpacing: '0.5rem', fontSize: '1.25rem', height: '48px', fontWeight: '800' }}
                                    />
                                </div>
                                <div style={{ marginTop: '1rem', padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '850', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                                        <ShieldCheck size={14} /> Les nouveaux membres recevront les droits d'accès associés à leur rôle.
                                    </p>
                                </div>
                                <button type="submit" className="btn btn-primary" style={{ height: '56px', borderRadius: '16px', fontWeight: '950', fontSize: '1rem', marginTop: '1rem' }}>
                                    Créer le profil
                                </button>
                            </form>
                        </div>
                    )}

                    {/* ROLES TAB */}
                    {activeTab === 'roles' && (
                        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            {/* Role management card */}
                            <div className="glass-card" style={{ padding: isMobile ? '1.25rem' : '2rem', borderRadius: isMobile ? '20px' : '28px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div style={{ background: 'var(--primary-light)', padding: '8px', borderRadius: '10px', color: 'var(--primary-color)' }}><Sparkles size={20} strokeWidth={2} /></div>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800' }}>Ajouter un Rôle personnalisé</h3>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', flexDirection: isMobile ? 'column' : 'row' }}>
                                    <input
                                        className="glass-input"
                                        placeholder="Ex: Adjoint Pédagogique, Santé..."
                                        value={newRoleName}
                                        onChange={e => setNewRoleName(e.target.value)}
                                        style={{ height: '48px', fontWeight: '800', flex: 1 }}
                                    />
                                    <button className="btn btn-primary" onClick={handleCreateRole} style={{ height: '48px', padding: '0 1.5rem', borderRadius: '12px', fontWeight: '950', fontSize: '0.85rem' }}>
                                        Créer le rôle
                                    </button>
                                </div>
                            </div>

                            {/* Configuration split layout */}
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '280px 1fr', gap: '2rem', alignItems: 'flex-start' }}>
                                {/* Role list */}
                                <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <div style={{ fontSize: '10px', fontWeight: '950', color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0.5rem', letterSpacing: '0.05em' }}>Liste des Rôles</div>
                                    {rolesList.filter(r => r.id !== 'child').map(role => {
                                        const roleKey = role.id;
                                        const isSelected = selectedConfigRole === roleKey;
                                        const isDefault = role.base;
                                        return (
                                            <div
                                                key={roleKey}
                                                onClick={() => setSelectedConfigRole(roleKey)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                    padding: '0.75rem 1rem', borderRadius: '14px', cursor: 'pointer',
                                                    background: isSelected ? 'var(--primary-light)' : 'transparent',
                                                    border: isSelected ? '1.5px solid var(--primary-color)' : '1.5px solid transparent',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <span style={{ fontSize: '0.9rem', fontWeight: '950', color: isSelected ? 'var(--primary-color)' : 'var(--text-main)' }}>
                                                    {role.label}
                                                </span>
                                                {!isDefault && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteRole(roleKey); }}
                                                        style={{ background: 'transparent', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', display: 'flex', padding: '4px' }}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Permissions configuration panel */}
                                <div className="glass-card" style={{ padding: isMobile ? '1.25rem' : '2rem', borderRadius: isMobile ? '20px' : '28px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '800', fontFamily: 'Bricolage Grotesque, sans-serif' }}>
                                            Configuration : {roleLabels[selectedConfigRole] || selectedConfigRole}
                                        </h3>
                                        <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '850' }}>
                                            Définissez précisément les droits d'accès globaux pour ce rôle.
                                        </p>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                        {SECTIONS_CONFIG.map(sec => (
                                            <div key={sec.id} style={{ padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                <div style={{ fontWeight: '950', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                                                    {sec.label}
                                                </div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
                                                    {sec.viewKey && (
                                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '800' }}>
                                                            <input type="checkbox"
                                                                checked={!!accessControl.rolePermissions?.[selectedConfigRole]?.[sec.viewKey]}
                                                                onChange={e => updateRolePermission(selectedConfigRole, sec.viewKey, e.target.checked)}
                                                            />
                                                            <span>Voir</span>
                                                        </label>
                                                    )}
                                                    {sec.editKey && (
                                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '800' }}>
                                                            <input type="checkbox"
                                                                checked={!!accessControl.rolePermissions?.[selectedConfigRole]?.[sec.editKey]}
                                                                onChange={e => updateRolePermission(selectedConfigRole, sec.editKey, e.target.checked)}
                                                            />
                                                            <span>Modifier / Écrire</span>
                                                        </label>
                                                    )}
                                                    {sec.extra && (
                                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '800' }}>
                                                            <input type="checkbox"
                                                                checked={!!accessControl.rolePermissions?.[selectedConfigRole]?.[sec.extra.key]}
                                                                onChange={e => updateRolePermission(selectedConfigRole, sec.extra.key, e.target.checked)}
                                                            />
                                                            <span>{sec.extra.label}</span>
                                                        </label>
                                                    )}
                                                    {sec.extraKeys && sec.extraKeys.map(extra => (
                                                        <label key={extra.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '800' }}>
                                                            <input type="checkbox"
                                                                checked={!!accessControl.rolePermissions?.[selectedConfigRole]?.[extra.key]}
                                                                onChange={e => updateRolePermission(selectedConfigRole, extra.key, e.target.checked)}
                                                            />
                                                            <span>{extra.label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                                {sec.subSections && (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '0.85rem', borderTop: '1px dashed var(--glass-border)' }}>
                                                        <span style={{ fontSize: '0.72rem', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sous-sections détaillées</span>
                                                        {sec.subSections.map(sub => (
                                                            <div key={sub.viewKey} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.25rem', paddingLeft: '0.25rem' }}>
                                                                <span style={{ flex: '1 1 200px', fontSize: '0.82rem', fontWeight: '850', color: 'var(--text-main)' }}>{sub.label}</span>
                                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '800' }}>
                                                                    <input type="checkbox"
                                                                        checked={accessControl.rolePermissions?.[selectedConfigRole]?.[sub.viewKey] !== false}
                                                                        onChange={e => updateRolePermission(selectedConfigRole, sub.viewKey, e.target.checked)}
                                                                    />
                                                                    <span>Voir</span>
                                                                </label>
                                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '800' }}>
                                                                    <input type="checkbox"
                                                                        checked={accessControl.rolePermissions?.[selectedConfigRole]?.[sub.editKey] !== false}
                                                                        onChange={e => updateRolePermission(selectedConfigRole, sub.editKey, e.target.checked)}
                                                                    />
                                                                    <span>Modifier</span>
                                                                </label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECTIONS TAB */}
                    {activeTab === 'sections' && (
                        <div className="glass-card" style={{ padding: isMobile ? '1.25rem' : '3rem', borderRadius: isMobile ? '22px' : '32px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div style={{ background: 'var(--primary-light)', padding: '10px', borderRadius: '12px', color: 'var(--primary-color)' }}><Settings2 size={24} strokeWidth={2} /></div>
                                <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', fontFamily: 'Bricolage Grotesque, sans-serif' }}>Modules de l'Interface</h3>
                            </div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '3rem', fontWeight: '850', maxWidth: '600px', lineHeight: '1.6' }}>Masquez les modules non-essentiels pour optimiser le workflow de l'équipe d'animation pendant le séjour.</p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
                                {Object.entries(SECTION_LABELS).map(([key, label]) => (
                                    <label key={key} className="glass-card" style={{
                                        padding: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
                                        background: accessControl?.hiddenSections?.[key] ? 'var(--bg-secondary)' : undefined,
                                        opacity: accessControl?.hiddenSections?.[key] ? 0.6 : 1,
                                        border: accessControl?.hiddenSections?.[key] ? undefined : '1.5px solid var(--primary-color)',
                                        borderRadius: '24px', transition: 'all 0.3s var(--ease-out-expo)'
                                    }}>
                                        <span style={{ fontWeight: '950', fontSize: '1.1rem', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>{label}</span>
                                        <input
                                            type="checkbox"
                                            checked={!accessControl?.hiddenSections?.[key]}
                                            onChange={e => { if (!canManageAccess) { ui.toast('Droits insuffisants.', { type: 'error' }); return; } setAccessControl(prev => ({ ...prev, hiddenSections: { ...prev.hiddenSections, [key]: !e.target.checked } })); }}
                                            style={{ width: '24px', height: '24px' }}
                                        />
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* SECURITY TAB */}
                    {activeTab === 'security' && (
                        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div className="glass-card" style={{ padding: isMobile ? '1.25rem' : '3rem', borderRadius: isMobile ? '22px' : '32px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                                    <div style={{ background: 'var(--primary-light)', padding: '10px', borderRadius: '12px', color: 'var(--primary-color)' }}><KeyRound size={24} strokeWidth={2} /></div>
                                    <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', fontFamily: 'Bricolage Grotesque, sans-serif' }}>Paramètres de Sécurité</h3>
                                </div>

                                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', padding: '1.75rem 2rem', background: 'var(--bg-secondary)', borderRadius: '24px', marginBottom: '2.5rem', cursor: 'pointer' }}>
                                    <div>
                                        <div style={{ fontWeight: '950', fontSize: '1.1rem', color: 'var(--text-main)' }}>Alertes de pointage</div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '850', marginTop: '4px' }}>Afficher le nombre d'absents sur le Tableau de bord</div>
                                    </div>
                                    <input type="checkbox" checked={isAttendanceEnabled} onChange={e => setIsAttendanceEnabled(e.target.checked)} style={{ width: '28px', height: '28px', flexShrink: 0, cursor: 'pointer', accentColor: 'var(--primary-color)' }} />
                                </label>

                                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', padding: '1.75rem 2rem', background: 'var(--bg-secondary)', borderRadius: '24px', marginBottom: '2.5rem', cursor: 'pointer' }}>
                                    <div>
                                        <div style={{ fontWeight: '950', fontSize: '1.1rem', color: 'var(--text-main)' }}>Réduire la transparence</div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '850', marginTop: '4px' }}>Remplace l'effet verre par des fonds pleins (lisibilité + fluidité sur appareils plus lents).</div>
                                    </div>
                                    <input type="checkbox" checked={uiSolid} onChange={e => toggleUiSolid(e.target.checked)} style={{ width: '28px', height: '28px', flexShrink: 0, cursor: 'pointer', accentColor: 'var(--primary-color)' }} />
                                </label>

                                <div style={{ background: 'var(--surface-color)', border: '2px solid var(--glass-border)', padding: isMobile ? '1.25rem' : '2.5rem', borderRadius: isMobile ? '20px' : '28px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                        <Lock size={18} strokeWidth={2} style={{ color: 'var(--text-muted)' }} />
                                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '800' }}>Modifier le code PIN d'accès Direction</h4>
                                    </div>
                                    {!isChangingPin ? (
                                        <button className="btn btn-primary" onClick={() => setIsChangingPin(true)} style={{ width: '100%', height: '54px', borderRadius: '16px', fontWeight: '950' }}>Modifier mon code PIN</button>
                                    ) : (
                                        <form onSubmit={handleUpdatePin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            <input type="password" inputMode="numeric" maxLength={4} placeholder="Nouveau code PIN" value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))} className="glass-input" style={{ background: 'var(--bg-secondary)', height: '54px', borderRadius: '16px', textAlign: 'center', fontSize: '1.25rem', fontWeight: '950', letterSpacing: '0.5rem' }} />
                                            <input type="password" inputMode="numeric" maxLength={4} placeholder="Confirmer le nouveau code" value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))} className="glass-input" style={{ background: 'var(--bg-secondary)', height: '54px', borderRadius: '16px', textAlign: 'center', fontSize: '1.25rem', fontWeight: '950', letterSpacing: '0.5rem' }} />
                                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                                <button className="btn btn-primary" style={{ flex: 1, height: '54px', borderRadius: '16px', fontWeight: '950' }}>Valider le changement</button>
                                                <button type="button" className="btn btn-secondary" style={{ flex: 1, height: '54px', borderRadius: '16px', fontWeight: '950' }} onClick={() => setIsChangingPin(false)}>Annuler</button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* MAINTENANCE TAB */}
                    {activeTab === 'maintenance' && (
                        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1.25rem', borderRadius: '18px', background: backupStale ? 'oklch(96% 0.06 75)' : 'var(--bg-secondary)', border: `1.5px solid ${backupStale ? 'oklch(82% 0.12 75)' : 'var(--glass-border)'}`, fontWeight: '850', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                                <CalendarClock size={18} style={{ color: backupStale ? 'var(--warning-color)' : 'var(--text-muted)', flexShrink: 0 }} />
                                {lastBackup ? (
                                    <span>Dernière sauvegarde : <b>{new Date(lastBackup).toLocaleDateString('fr-FR')}</b>{backupAge > 0 ? ` (il y a ${backupAge} j)` : ' (aujourd\'hui)'}.{backupStale ? ' Pensez à exporter une archive.' : ''}</span>
                                ) : (
                                    <span>Aucune sauvegarde locale enregistrée. Exportez une archive pour garder une copie.</span>
                                )}
                            </div>
                            <div className="glass-card" style={{ padding: isMobile ? '1.25rem' : '3rem', borderRadius: isMobile ? '22px' : '32px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                                    <div style={{ background: 'var(--primary-light)', padding: '10px', borderRadius: '12px', color: 'var(--primary-color)' }}><Database size={24} strokeWidth={2} /></div>
                                    <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', fontFamily: 'Bricolage Grotesque, sans-serif' }}>Maintenance & Data</h3>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                                    {canManageAccess && (
                                        <button className="btn-maintenance" onClick={handleFullArchiveExport} disabled={archiveBusy} style={archiveBusy ? { opacity: 0.6, pointerEvents: 'none' } : undefined}>
                                            <Database size={32} strokeWidth={2} />
                                            <span>{archiveBusy ? 'En cours…' : 'Tout télécharger'}</span>
                                            <small>Archive .zip (données + photos)</small>
                                        </button>
                                    )}
                                    {canManageAccess && canManageUsers && (
                                        <label className="btn-maintenance outline" style={archiveBusy ? { opacity: 0.6, pointerEvents: 'none' } : undefined}>
                                            <Upload size={32} strokeWidth={2} />
                                            <span>{archiveBusy ? 'En cours…' : 'Tout importer'}</span>
                                            <small>Archive .zip complète</small>
                                            <input type="file" accept=".zip" disabled={archiveBusy} onChange={(e) => {
                                                const file = e.target.files[0];
                                                e.target.value = '';
                                                if (file) handleFullArchiveImport(file);
                                            }} style={{ display: 'none' }} />
                                        </label>
                                    )}
                                    <button className="btn-maintenance" onClick={handleExportCsv}>
                                        <FileSpreadsheet size={32} strokeWidth={2} />
                                        <span>Exporter CSV</span>
                                        <small>Participants (Excel)</small>
                                    </button>
                                    {canManageAccess && (
                                        <button className="btn-maintenance" onClick={handleFullExport}>
                                            <Download size={32} strokeWidth={2} />
                                            <span>Exporter JSON</span>
                                            <small>Participants, groupes, activités</small>
                                        </button>
                                    )}
                                    <label className="btn-maintenance outline">
                                        <Upload size={32} strokeWidth={2} />
                                        <span>Restaurer</span>
                                        <small>Fichier .json uniquement</small>
                                        <input type="file" accept=".json" onChange={(e) => {
                                            const file = e.target.files[0];
                                            e.target.value = '';
                                            if (file) handleRestoreFile(file);
                                        }} style={{ display: 'none' }} />
                                    </label>
                                    <button className="btn-maintenance danger" onClick={handleResetAll}>
                                        <Trash2 size={32} strokeWidth={2} />
                                        <span>Full Reset</span>
                                        <small>Action irréversible</small>
                                    </button>
                                </div>
                            </div>

                            <div className="glass-card" style={{ padding: isMobile ? '1.25rem' : '3rem', borderRadius: isMobile ? '22px' : '32px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ background: 'var(--bg-secondary)', padding: '10px', borderRadius: '12px', color: 'var(--text-main)' }}><FileClock size={24} strokeWidth={2} /></div>
                                        <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', fontFamily: 'Bricolage Grotesque, sans-serif' }}>Journal d'Activité</h3>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                        <button className="btn btn-secondary" style={{ padding: '0.75rem 1.25rem', borderRadius: '12px', fontWeight: '950', fontSize: '13px' }} onClick={fetchLogs}>Actualiser</button>
                                        <button className="btn btn-secondary" style={{ padding: '0.75rem 1.25rem', borderRadius: '12px', fontWeight: '950', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={exportLogsCsv}><Download size={15} strokeWidth={2} /> Exporter CSV</button>
                                        {canManageAccess && <button className="btn btn-secondary" style={{ padding: '0.75rem 1.25rem', borderRadius: '12px', fontWeight: '950', fontSize: '13px', color: 'var(--danger-color)' }} onClick={handleClearLogs}>Effacer</button>}
                                    </div>
                                </div>
                                {logs.length > 0 && (
                                    <div style={{ position: 'relative', marginBottom: '1rem' }}>
                                        <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                                        <input className="glass-input" placeholder="Filtrer le journal (action, auteur, ressource)…" value={logFilter} onChange={e => setLogFilter(e.target.value)} style={{ paddingLeft: '40px', height: '44px', background: 'var(--bg-secondary)', borderRadius: '12px', fontWeight: '700' }} />
                                    </div>
                                )}
                                <div style={{ maxHeight: '600px', overflowY: 'auto', paddingRight: '0.5rem' }} className="no-scrollbar">
                                    {logsLoading ? (
                                        <div style={{ textAlign: 'center', padding: '4rem' }}><div className="spinner-small" /></div>
                                    ) : logs.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--bg-secondary)', borderRadius: '24px', border: '1.5px dashed var(--glass-border)', color: 'var(--text-muted)', fontWeight: '850' }}>Aucun log disponible.</div>
                                    ) : filteredLogs.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--bg-secondary)', borderRadius: '24px', border: '1.5px dashed var(--glass-border)', color: 'var(--text-muted)', fontWeight: '850' }}>Aucun résultat pour ce filtre.</div>
                                    ) : (
                                        filteredLogs.map((log, i) => (
                                            <div key={log.id || i} style={{ padding: '1.5rem', borderBottom: '1.5px solid var(--bg-secondary)', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--text-muted)' }}>
                                                    <FileClock size={22} strokeWidth={2} />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: '950', fontSize: '0.95rem', color: 'var(--text-main)', letterSpacing: '-0.01em' }}>{log.action}</div>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '900', textTransform: 'uppercase', marginTop: '4px', letterSpacing: '0.04em' }}>
                                                        {log.actor_name} · <span style={{ color: 'var(--primary-color)' }}>{log.resource}</span>
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right', fontSize: '10px', color: 'var(--text-muted)', fontWeight: '950', textTransform: 'uppercase' }}>
                                                    {new Date(log.created_at).toLocaleDateString()}<br/>{new Date(log.created_at).toLocaleTimeString()}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .perm-row:hover { background: var(--bg-secondary); }
                .btn-maintenance {
                    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.75rem;
                    padding: 2.5rem; background: var(--primary-light); color: var(--primary-color); border: none;
                    border-radius: 28px; cursor: pointer; transition: all 0.3s var(--ease-out-expo);
                }
                .btn-maintenance:hover { transform: translateY(-4px); box-shadow: 0 16px 32px var(--shadow-color); background: white; border: 1.5px solid var(--primary-color); }
                .btn-maintenance.outline { background: white; border: 2px dashed var(--glass-border); color: var(--text-muted); }
                .btn-maintenance.outline:hover { border-color: var(--primary-color); color: var(--primary-color); background: var(--primary-light); }
                .btn-maintenance.danger { background: oklch(62% 0.18 20 / 0.1); color: var(--danger-color); }
                .btn-maintenance.danger:hover { background: var(--danger-color); color: white; border: none; }
            `}</style>
        </div>
    );
}
