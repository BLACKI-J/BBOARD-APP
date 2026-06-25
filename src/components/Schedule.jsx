import React, { useState, useMemo, useEffect } from 'react';
import {
    ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, MapPin,
    Users, X, Trash2, Edit2, Star, Utensils,
    Coffee, Sun, Zap, Moon, Copy, LayoutGrid, Printer, AlertTriangle, MoreHorizontal
} from 'lucide-react';
import useIsMobile from '../utils/useIsMobile';
import { v4 as uuidv4 } from 'uuid';
import Menus from './Menus';
import { printHtml } from '../utils/printHtml';
import { useUi } from '../ui/UiProvider';
import { useScrollCollapse } from '../utils/useScrollCollapse';
import { parseISO, isActivityPast } from '../utils/dates';

// ─── Constants ───────────────────────────────────────────────────────────────

// Date locale (PAS toISOString/UTC : décalait d'un jour près de minuit hors UTC+).
const formatDate = (date) => {
    const p = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
};

// Lundi de la semaine contenant `date`.
const startOfWeek = (date) => {
    const d = new Date(date);
    const dow = d.getDay(); // 0=dim
    d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
    d.setHours(0, 0, 0, 0);
    return d;
};
const addDays = (date, n) => { const d = new Date(date); d.setDate(d.getDate() + n); return d; };

// Une activité « concerne » un groupe si elle le cible explicitement (activity.groups)
// OU si au moins un de ses participants y est rattaché. Une activité SANS ciblage
// (ni groupe ni participant) est GÉNÉRALE → visible quel que soit le filtre (sinon
// toutes les activités disparaissaient dès qu'on choisit un groupe).
const activityMatchesGroup = (activity, groupId, participants) => {
    if (!groupId || groupId === 'all') return true;
    const grpIds = Array.isArray(activity.groups) ? activity.groups : [];
    const partIds = Array.isArray(activity.participants) ? activity.participants : [];
    if (grpIds.length === 0 && partIds.length === 0) return true; // activité générale
    if (grpIds.includes(groupId)) return true;
    const inGroup = new Set(participants.filter(p => p.group === groupId).map(p => p.id));
    return partIds.some(id => inGroup.has(id));
};

// Chevauchement horaire entre deux activités qui PARTAGENT au moins un participant.
const timesOverlap = (a, b) => {
    const as = a.startTime || a.time, ae = a.endTime;
    const bs = b.startTime || b.time, be = b.endTime;
    if (!as || !ae || !bs || !be) return false;
    return as < be && bs < ae;
};
// Deux activités « se disputent » du public si elles partagent un participant OU un groupe ciblé.
const shareParticipant = (a, b) => {
    const ap = Array.isArray(a.participants) ? a.participants : [];
    const bp = new Set(Array.isArray(b.participants) ? b.participants : []);
    if (ap.some(id => bp.has(id))) return true;
    const ag = Array.isArray(a.groups) ? a.groups : [];
    const bg = new Set(Array.isArray(b.groups) ? b.groups : []);
    return ag.some(id => bg.has(id));
};

const COMMON_ACTIVITIES = [
    "Petit déjeuner", "Déjeuner", "Dîner", "Goûter",
    "Réveil", "Toilette", "Temps calme", "Douches", "Coucher",
    "Rassemblement", "Veillée", "Grand jeu", "Atelier manuel", "Sport",
    "Baignade", "Randonnée", "Animation", "Temps libre"
];

const ACTIVITY_COLORS = [
    { label: 'Violet', value: 'oklch(62% 0.18 258)', bg: 'oklch(96% 0.02 258)' },
    { label: 'Bleu', value: 'oklch(62% 0.18 232)', bg: 'oklch(96% 0.02 232)' },
    { label: 'Vert', value: 'oklch(68% 0.16 145)', bg: 'oklch(97% 0.02 145)' },
    { label: 'Orange', value: 'oklch(71% 0.19 45)', bg: 'oklch(97% 0.03 45)' },
    { label: 'Rouge', value: 'oklch(62% 0.18 25)', bg: 'oklch(96% 0.02 25)' },
    { label: 'Rose', value: 'oklch(65% 0.18 340)', bg: 'oklch(96% 0.02 340)' },
    { label: 'Gris', value: 'oklch(55% 0.02 232)', bg: 'oklch(94% 0.02 232)' },
];

const DEFAULT_COLOR = ACTIVITY_COLORS[0];

// ─── Time helpers ─────────────────────────────────────────────────────────────

const getTimeSlotLabel = (startTime) => {
    if (!startTime) return null;
    const h = parseInt(startTime.split(':')[0], 10);
    if (h < 10) return { icon: <Coffee size={14} />, label: 'Matin' };
    if (h < 13) return { icon: <Sun size={14} />, label: 'Midi' };
    if (h < 18) return { icon: <Zap size={14} />, label: 'Après-midi' };
    return { icon: <Moon size={14} />, label: 'Soir' };
};

const getDuration = (start, end) => {
    if (!start || !end) return null;
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const minutes = (eh * 60 + em) - (sh * 60 + sm);
    if (minutes <= 0) return null;
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
};

// ─── ActivityCard ─────────────────────────────────────────────────────────────

const WATER_KEYWORDS = ['baignade', 'piscine', 'natation', 'aquatique', 'mer', 'lac', 'rivière', 'plage', 'snorkeling'];

const ActivityCard = ({ activity, index, onEdit, onDelete, onDuplicate, onShowNonTested, hasConflict, isMobile, canEdit, participants = [], now }) => {
    const color = activity.color || DEFAULT_COLOR.value;
    const timeSlot = getTimeSlotLabel(activity.startTime);
    const duration = getDuration(activity.startTime, activity.endTime);
    const isDone = isActivityPast(activity, now);

    const combined = `${activity.title} ${activity.description || ''}`.toLowerCase();
    const isWaterActivity = WATER_KEYWORDS.some(kw => combined.includes(kw));
    const nonTestedCount = isWaterActivity
        ? participants.filter(p => p.role === 'child' && p.ivNage !== 'OUI').length
        : 0;

    return (
        <div className="sc-activity-item animate-fade-in"
            draggable="true"
            onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', activity.id);
                e.currentTarget.style.opacity = '0.4';
            }}
            onDragEnd={(e) => {
                e.currentTarget.style.opacity = isDone ? '0.6' : '1';
            }}
            style={{
                '--i': index,
                animationDelay: `calc(var(--i, 0) * 60ms)`,
                position: 'relative',
                display: 'flex',
                gap: isMobile ? '1rem' : '2rem',
                paddingBottom: isMobile ? '1.5rem' : '2.5rem',
                opacity: isDone ? 0.6 : 1,
                cursor: 'grab',
                transition: 'all 0.4s var(--ease-out-expo)'
            }}>
            
            {/* Timeline Vertical Line */}
            <div style={{
                position: 'absolute',
                left: isMobile ? '38px' : '46px',
                top: isMobile ? '44px' : '56px',
                bottom: 0,
                width: '3px',
                borderRadius: '10px',
                background: isDone ? 'var(--glass-border)' : `oklch(from ${color} 90% 0.05 h / 0.4)`,
                zIndex: 0
            }} />

            {/* Time Marker Side */}
            <div style={{
                width: isMobile ? '80px' : '94px',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                zIndex: 1,
                paddingTop: '6px'
            }}>
                <div style={{
                    minWidth: isMobile ? '60px' : '70px',
                    padding: isMobile ? '6px 8px' : '8px 12px',
                    borderRadius: isMobile ? '12px' : '16px',
                    background: isDone ? 'rgba(255,255,255,0.45)' : 'var(--surface-color)',
                    border: '2px solid',
                    borderColor: isDone ? 'var(--glass-border)' : color,
                    color: isDone ? 'var(--text-muted)' : 'var(--text-main)',
                    fontWeight: '950',
                    fontFamily: 'Bricolage Grotesque, sans-serif',
                    fontSize: isMobile ? '0.85rem' : '1rem',
                    lineHeight: 1,
                    textAlign: 'center',
                    boxShadow: isDone ? 'none' : `0 12px 30px oklch(from ${color} l c h / 0.15)`,
                    transition: 'all 0.3s'
                }}>
                    {activity.startTime || '—'}
                </div>
                {duration && !isDone && (
                    <div style={{
                        marginTop: '0.5rem',
                        fontSize: '9px',
                        fontWeight: '950',
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        background: 'oklch(0% 0 0 / 0.03)',
                        padding: '2px 8px',
                        borderRadius: '20px'
                    }}>
                        {duration}
                    </div>
                )}
            </div>

            {/* Content Display */}
            <div style={{ 
                flex: 1, 
                padding: '0.5rem 0',
                minWidth: 0,
                display: 'flex',
                gap: isMobile ? '0.75rem' : '1.5rem',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'stretch' : 'flex-start'
            }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{
                        margin: 0,
                        fontSize: isMobile ? '1.1rem' : '1.25rem',
                        fontWeight: '800',
                        fontFamily: 'Bricolage Grotesque, sans-serif',
                        color: isDone ? 'var(--text-muted)' : 'var(--text-main)',
                        lineHeight: '1.2',
                        letterSpacing: '-0.04em',
                    }}>
                        {activity.title}
                    </h3>
                    
                    <div style={{ 
                        display: 'flex', 
                        gap: isMobile ? '0.5rem' : '1.25rem', 
                        alignItems: 'center', 
                        marginTop: isMobile ? '0.5rem' : '0.75rem',
                        flexWrap: 'wrap'
                    }}>
                        {timeSlot && (
                            <span style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontWeight: '800' }}>
                                <div style={{ color: isDone ? 'inherit' : color, display: 'flex', padding: '3px', borderRadius: '6px', background: isDone ? 'transparent' : `oklch(from ${color} 98% calc(c / 8) h / 0.1)` }}>{timeSlot.icon}</div> {timeSlot.label}
                            </span>
                        )}
                        {activity.description && (
                            <span style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontWeight: '750' }}>
                                <MapPin size={12} strokeWidth={2} style={{ color: 'var(--accent-color)' }} /> {activity.description}
                            </span>
                        )}
                        {activity.participants && activity.participants.length > 0 && (
                            <span style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontWeight: '750' }}>
                                <Users size={12} strokeWidth={2} style={{ color: 'var(--secondary-color)' }} /> {activity.participants.length}
                            </span>
                        )}
                        {hasConflict && (
                            <span style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '950', color: 'var(--danger-color)', background: 'color-mix(in oklch, var(--danger-color) 12%, white)', padding: '3px 10px', borderRadius: '20px', border: '1.5px solid var(--danger-color)' }}>
                                <AlertTriangle size={12} strokeWidth={2} /> Chevauchement
                            </span>
                        )}
                        {isWaterActivity && nonTestedCount > 0 && (
                            <button type="button" onClick={() => onShowNonTested?.()} title="Voir les enfants non testés"
                                style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '950', color: 'var(--danger-color)', background: 'color-mix(in oklch, var(--danger-color) 12%, white)', padding: '3px 10px', borderRadius: '20px', border: '1.5px solid var(--danger-color)', cursor: 'pointer' }}>
                                {nonTestedCount} non-testé{nonTestedCount > 1 ? 's' : ''}
                            </button>
                        )}
                        {isWaterActivity && nonTestedCount === 0 && participants.filter(p => p.role === 'child').length > 0 && (
                            <span style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '950', color: 'var(--success-color)', background: 'color-mix(in oklch, var(--success-color) 12%, white)', padding: '3px 10px', borderRadius: '20px', border: '1.5px solid var(--success-color)' }}>
                                Tous testés
                            </span>
                        )}
                    </div>
                </div>

                {/* Inline Actions */}
                {canEdit && (
                    <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, alignItems: 'center', marginTop: isMobile ? '0.5rem' : 0, justifyContent: isMobile ? 'flex-end' : 'flex-start' }}>
                        <button aria-label="Modifier l'activité" onClick={() => onEdit(activity)} className="btn-icon" style={{ width: isMobile ? '40px' : '42px', height: isMobile ? '40px' : '42px', background: 'var(--surface-color)', border: '1.5px solid var(--glass-border)' }}>
                            <Edit2 size={16} strokeWidth={2} />
                        </button>
                        <button aria-label="Dupliquer l'activité" onClick={() => onDuplicate(activity)} className="btn-icon" style={{ width: isMobile ? '40px' : '42px', height: isMobile ? '40px' : '42px', background: 'var(--surface-color)', border: '1.5px solid var(--glass-border)' }}>
                            <Copy size={15} strokeWidth={2} />
                        </button>
                        <button aria-label="Supprimer l'activité" onClick={() => onDelete(activity.id)} className="btn-icon" style={{ width: isMobile ? '40px' : '42px', height: isMobile ? '40px' : '42px', background: 'var(--surface-color)', border: '1.5px solid var(--glass-border)', color: 'var(--danger-color)' }}>
                            <Trash2 size={16} strokeWidth={2} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Main Component ────────────────────────────────────────────────────────────

export default function Schedule({ activities, setActivities, participants, groups, canEdit = true, menus = {}, setMenus, permissions = {} }) {
    const ui = useUi();

    // Sous-sections du Planning : visibilité + édition par rôle (clé absente/true → autorisé).
    const can = (key) => permissions?.[key] !== false;
    const canViewActivities = can('viewScheduleActivities');
    const canViewMenus = can('viewScheduleMenus');
    const canEditActivities = canEdit && can('editScheduleActivities');
    const canEditMenus = canEdit && can('editScheduleMenus');

    const [viewMode, setViewMode] = useState(canViewActivities ? 'activities' : (canViewMenus ? 'menus' : 'activities'));
    const [schedMenuOpen, setSchedMenuOpen] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [repeatDays, setRepeatDays] = useState([]); // jours (ds) où créer l'activité d'un coup
    const [editingId, setEditingId] = useState(null);
    // Horloge légère (tick 60 s) → grise les activités dont l'heure est passée.
    const [nowMs, setNowMs] = useState(() => Date.now());
    useEffect(() => { const id = setInterval(() => setNowMs(Date.now()), 60000); return () => clearInterval(id); }, []);
    const [formData, setFormData] = useState({
        date: formatDate(new Date()),
        startTime: '09:00', endTime: '10:00',
        title: '', description: '', participants: [],
        color: DEFAULT_COLOR.value,
    });

    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [calendarMonth, setCalendarMonth] = useState(new Date());
    const [scheduleView, setScheduleView] = useState('day'); // 'day' (défaut) | 'week'
    const [groupFilter, setGroupFilter] = useState('all');
    const isMobile = useIsMobile();

    // Bascule l'onglet courant si sa sous-section devient masquée par les droits.
    useEffect(() => {
        if (viewMode === 'activities' && !canViewActivities && canViewMenus) setViewMode('menus');
        else if (viewMode === 'menus' && !canViewMenus && canViewActivities) setViewMode('activities');
    }, [canViewActivities, canViewMenus, viewMode]);
    const { scrollRef: schedScrollRef, isScrolled: schedScrolled, onScroll: schedOnScroll } = useScrollCollapse(60);

    const navigateDay = (dir) => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() + dir * (scheduleView === 'week' ? 7 : 1)); // semaine entière en vue semaine
        setCurrentDate(d);
        if (d.getMonth() !== calendarMonth.getMonth()) setCalendarMonth(d);
    };

    const goToToday = () => { const t = new Date(); setCurrentDate(t); setCalendarMonth(t); };

    const dayActivities = useMemo(() =>
        activities
            .filter(a => a.date === formatDate(currentDate))
            .filter(a => activityMatchesGroup(a, groupFilter, participants))
            .sort((a, b) => (a.startTime || a.time || '').localeCompare(b.startTime || b.time || '')),
        [activities, currentDate, groupFilter, participants]
    );

    // Conflits : activités du jour qui se chevauchent ET partagent un participant.
    const conflictIds = useMemo(() => {
        const set = new Set();
        for (let i = 0; i < dayActivities.length; i++) {
            for (let j = i + 1; j < dayActivities.length; j++) {
                if (timesOverlap(dayActivities[i], dayActivities[j]) && shareParticipant(dayActivities[i], dayActivities[j])) {
                    set.add(dayActivities[i].id); set.add(dayActivities[j].id);
                }
            }
        }
        return set;
    }, [dayActivities]);

    const weekStart = useMemo(() => startOfWeek(currentDate), [currentDate]);
    const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => {
        const day = addDays(weekStart, i);
        const ds = formatDate(day);
        return {
            date: day, ds,
            items: activities
                .filter(a => a.date === ds && activityMatchesGroup(a, groupFilter, participants))
                .sort((a, b) => (a.startTime || a.time || '').localeCompare(b.startTime || b.time || '')),
        };
    }), [activities, weekStart, groupFilter, participants]);


    const handleEdit = (activity) => {
        if (!canEditActivities) {
            ui.toast('Edition non autorisée.', { type: 'error' });
            return;
        }
        setFormData({
            ...activity,
            startTime: activity.startTime || activity.time || '09:00',
            endTime: activity.endTime || '10:00',
            color: activity.color || DEFAULT_COLOR.value,
        });
        setEditingId(activity.id);
        setIsFormOpen(true);
    };

    const handleDelete = async (id) => {
        if (!canEditActivities) return;
        const ok = await ui.confirm({
            title: 'Supprimer l\'activité',
            message: 'Êtes-vous sûr de vouloir supprimer cette activité ?',
            confirmText: 'Supprimer',
            danger: true
        });
        if (ok) setActivities(prev => prev.filter(a => a.id !== id));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!canEditActivities) return;
        const baseActivity = {
            ...formData,
            time: formData.startTime,
        };

        if (editingId) {
            setActivities(prev => prev.map(a => a.id === editingId ? { ...baseActivity, id: editingId } : a));
        } else {
            const targetDays = repeatDays.length ? Array.from(new Set(repeatDays)) : [formData.date];
            const created = targetDays.map(ds => ({ ...baseActivity, date: ds, id: uuidv4() }));
            setActivities(prev => [...prev, ...created]);
            if (created.length > 1) ui.toast(`Activité ajoutée sur ${created.length} jours.`, { type: 'success' });
        }
        setIsFormOpen(false);
    };

    const handleMoveActivity = (activityId, newDateStr) => {
        if (!canEditActivities) return;
        setActivities(prev => prev.map(a => a.id === activityId ? { ...a, date: newDateStr } : a));
    };

    const handleDuplicate = (activity) => {
        if (!canEditActivities) return;
        const { id, done, ...rest } = activity;
        setActivities(prev => [...prev, { ...rest, id: uuidv4(), title: `${activity.title} (copie)` }]);
        ui.toast('Activité dupliquée — glissez-la sur un autre jour si besoin.', { type: 'success' });
    };

    const handleDuplicateDay = async () => {
        if (!canEditActivities) return;
        const src = activities.filter(a => a.date === formatDate(currentDate));
        if (src.length === 0) { ui.toast('Aucune activité à dupliquer ce jour.', { type: 'error' }); return; }
        const target = await ui.prompt({
            title: 'Dupliquer la journée',
            message: `Copier les ${src.length} activité(s) vers quelle date ?`,
            placeholder: 'AAAA-MM-JJ', defaultValue: formatDate(addDays(currentDate, 1)),
            confirmText: 'Dupliquer',
            validate: (v) => {
                const s = String(v || '').trim();
                if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return 'Format attendu : AAAA-MM-JJ.';
                // Rejette aussi les dates calendaires inexistantes (ex. 2026-02-31) :
                // le round-trip parseISO→formatDate ne correspond plus si la date déborde.
                const d = parseISO(s);
                if (isNaN(d.getTime()) || formatDate(d) !== s) return "Cette date n'existe pas.";
                return null;
            },
        });
        if (target === null) return;
        const ds = target.trim();
        const copies = src.map(a => { const { id, done, ...rest } = a; return { ...rest, id: uuidv4(), date: ds }; });
        setActivities(prev => [...prev, ...copies]);
        ui.toast(`${copies.length} activité(s) copiée(s) vers le ${ds}.`, { type: 'success' });
    };

    const showNonTested = () => {
        const names = participants
            .filter(p => p.role === 'child' && p.ivNage !== 'OUI')
            .map(p => `${p.firstName} ${p.lastName || ''}`.trim());
        ui.alert({
            title: `Baignade — ${names.length} enfant(s) non testé(s)`,
            message: names.length ? names.join('\n') : 'Tous les enfants ont validé le test de baignade.',
        });
    };

    const escapeHtml = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const printSchedule = () => {
        const isWeek = scheduleView === 'week';
        const fmtT = (a) => `${a.startTime || a.time || ''}${a.endTime ? '–' + a.endTime : ''}`;
        const sortIt = (arr) => [...(arr || [])].sort((x, y) => (x.startTime || x.time || '').localeCompare(y.startTime || y.time || ''));
        // Couleur validée avant insertion dans l'attribut style (anti-injection CSS/HTML).
        const safeColor = (c) => (/^(#[0-9a-fA-F]{3,8}|oklch\([^"<>;]*\))$/.test(c || '') ? c : '#888');
        // Carte activité : accent couleur à gauche (couleur de l'activité), heure + titre + lieu.
        const chip = (a) => `<div class="ev" style="border-left-color:${safeColor(a.color)}">`
            + `<div class="ev-h"><span class="tm">${escapeHtml(fmtT(a))}</span><span class="ti">${escapeHtml(a.title || '')}</span></div>`
            + `${a.description ? `<div class="ev-d">${escapeHtml(a.description)}</div>` : ''}</div>`;
        const evs = (items) => items.length ? sortIt(items).map(chip).join('') : '<div class="libre">Journée libre</div>';

        const body = isWeek
            ? `<div class="week">${weekDays.map(d => {
                const wd = d.date.toLocaleDateString('fr-FR', { weekday: 'long' });
                const dm = d.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
                return `<div class="col"><div class="ch"><span class="wd">${escapeHtml(wd)}</span><span class="dm">${escapeHtml(dm)}</span></div><div class="evs">${evs(d.items)}</div></div>`;
            }).join('')}</div>`
            : `<div class="day"><div class="evs day-evs">${evs(dayActivities)}</div></div>`;

        const group = groupFilter !== 'all' ? (groups.find(g => g.id === groupFilter)?.name || '') : '';
        const rangeLabel = isWeek
            ? (weekDays.length ? `${weekDays[0].date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} – ${weekDays[weekDays.length - 1].date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}` : '')
            : currentDateLabel;

        printHtml(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Planning</title>
            <style>
                * { box-sizing: border-box; }
                body { font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; padding: 20px; }
                .hd { display: flex; justify-content: space-between; align-items: flex-end; background: #20242e; color: #fff; padding: 14px 18px; border-radius: 10px; margin-bottom: 16px; }
                .hd h1 { font-size: 20px; margin: 0; letter-spacing: -0.01em; }
                .hd .meta { text-align: right; font-size: 12px; line-height: 1.5; opacity: 0.92; }
                .hd .meta b { font-size: 13px; text-transform: capitalize; }
                .grp { display: inline-block; margin-top: 2px; padding: 1px 8px; background: rgba(255,255,255,0.18); border-radius: 100px; font-size: 11px; font-weight: 700; }

                .week { display: grid; grid-template-columns: repeat(7, 1fr); gap: 7px; }
                .col { border: 1px solid #dcdcdc; border-radius: 8px; overflow: hidden; min-height: 120px; }
                .ch { background: #f2f3f5; border-bottom: 1px solid #dcdcdc; padding: 6px 8px; text-align: center; }
                .ch .wd { display: block; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.03em; }
                .ch .dm { display: block; font-size: 10px; color: #777; text-transform: capitalize; }
                .evs { padding: 6px; display: flex; flex-direction: column; gap: 6px; }
                .day-evs { max-width: 620px; }

                .ev { border: 1px solid #e3e3e3; border-left: 4px solid #888; border-radius: 7px; padding: 6px 8px; background: #fff; page-break-inside: avoid; }
                .ev-h { display: flex; gap: 6px; align-items: baseline; }
                .ev .tm { font-size: 10px; font-weight: 800; color: #555; white-space: nowrap; }
                .ev .ti { font-size: 12px; font-weight: 700; line-height: 1.25; }
                .ev-d { font-size: 10px; color: #777; margin-top: 2px; }
                .libre { font-size: 10px; color: #b0b0b0; font-style: italic; text-align: center; padding: 10px 0; }

                @media print {
                    @page { size: A4 ${isWeek ? 'landscape' : 'portrait'}; margin: 10mm; }
                    body { padding: 0; }
                    .hd, .ch, .ev { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .col { break-inside: avoid; }
                }
            </style></head><body>
            <div class="hd">
                <h1>Planning${group ? ` — ${escapeHtml(group)}` : ''}</h1>
                <div class="meta"><b>${escapeHtml(rangeLabel)}</b>${group ? `<br><span class="grp">${escapeHtml(group)}</span>` : ''}</div>
            </div>
            ${body}
            </body></html>`);
    };

    const handleTitleChange = (e) => {
        const value = e.target.value;
        setFormData({ ...formData, title: value });
        if (value.length > 0) {
            const existingTitles = [...new Set(activities.map(a => a.title))];
            const all = [...new Set([...COMMON_ACTIVITIES, ...existingTitles])];
            setSuggestions(all.filter(s => s.toLowerCase().includes(value.toLowerCase())));
            setShowSuggestions(true);
        } else setShowSuggestions(false);

        const lower = value.toLowerCase();
        let autoColor = formData.color;
        if (lower.includes('sport') || lower.includes('foot') || lower.includes('basket') || lower.includes('jeu') || lower.includes('olympiade')) autoColor = 'oklch(62% 0.18 25)';
        else if (lower.includes('repas') || lower.includes('déjeuner') || lower.includes('dîner') || lower.includes('goûter') || lower.includes('petit déj')) autoColor = 'oklch(71% 0.19 45)';
        else if (lower.includes('veillée') || lower.includes('réveil') || lower.includes('coucher') || lower.includes('nuit') || lower.includes('calme') || lower.includes('film')) autoColor = 'oklch(62% 0.18 258)';
        else if (lower.includes('baignade') || lower.includes('piscine') || lower.includes('mer') || lower.includes('douche') || lower.includes('eau')) autoColor = 'oklch(62% 0.18 232)';
        else if (lower.includes('randonnée') || lower.includes('nature') || lower.includes('forêt') || lower.includes('balade') || lower.includes('marche')) autoColor = 'oklch(68% 0.16 145)';

        if (autoColor !== formData.color) setFormData(prev => ({ ...prev, color: autoColor }));
    };

    const renderCalendar = () => {
        const y = calendarMonth.getFullYear(), m = calendarMonth.getMonth();
        const daysInMonth = new Date(y, m + 1, 0).getDate();
        const startDow = new Date(y, m, 1).getDay();
        const offset = startDow === 0 ? 6 : startDow - 1;
        const todayStr = formatDate(new Date());
        const selectedStr = formatDate(currentDate);

        const cells = [];
        for (let i = 0; i < offset; i++) cells.push(<div key={`e-${i}`} />);
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const isSel = dateStr === selectedStr;
            const isToday = dateStr === todayStr;
            const count = activities.filter(a => a.date === dateStr).length;
            cells.push(
                <button key={d} onClick={() => setCurrentDate(parseISO(dateStr))}
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.transform = 'scale(1.2)'; e.currentTarget.style.zIndex = '10'; }}
                    onDragLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.zIndex = '1'; }}
                    onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.zIndex = '1';
                        const activityId = e.dataTransfer.getData('text/plain');
                        if (activityId) handleMoveActivity(activityId, dateStr);
                    }}
                    style={{
                        aspectRatio: '1', cursor: 'pointer', borderRadius: '12px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                        background: isSel ? 'var(--primary-color)' : isToday ? 'color-mix(in oklch, var(--primary-color) 9%, transparent)' : 'transparent',
                        color: isSel ? 'white' : isToday ? 'var(--primary-color)' : 'var(--text-main)',
                        fontWeight: (isSel || isToday) ? '950' : '650',
                        fontSize: '0.8rem', transition: 'all 0.2s',
                        border: isSel ? 'none' : '1px solid transparent'
                    }}>
                    {d}
                    {count > 0 && !isSel && (
                        <div style={{ position: 'absolute', bottom: '4px', width: '4px', height: '4px', borderRadius: '50%', background: 'var(--primary-color)' }} />
                    )}
                </button>
            );
        }
        return cells;
    };

    // Semaine du formulaire (pour répéter une activité sur plusieurs jours).
    const repeatWeek = useMemo(() => {
        const base = formData.date ? parseISO(formData.date) : currentDate;
        const s = startOfWeek(base);
        return Array.from({ length: 7 }, (_, i) => {
            const dd = addDays(s, i);
            return { ds: formatDate(dd), letter: dd.toLocaleDateString('fr-FR', { weekday: 'narrow' }).toUpperCase(), num: dd.getDate() };
        });
    }, [formData.date, currentDate]);
    const toggleRepeatDay = (ds) => setRepeatDays(prev => prev.includes(ds) ? prev.filter(x => x !== ds) : [...prev, ds]);
    const selectWholeWeek = () => {
        const all = repeatWeek.map(d => d.ds);
        setRepeatDays(prev => prev.length === all.length ? [formData.date] : all);
    };

    const openNewForm = () => {
        setFormData({
            date: formatDate(currentDate),
            startTime: '09:00', endTime: '10:00',
            title: '', description: '', participants: [], groups: [],
            color: DEFAULT_COLOR.value,
        });
        setRepeatDays([formatDate(currentDate)]);
        setEditingId(null);
        setIsFormOpen(true);
    };

    const currentDateLabel = currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>

            {/* View Toggle Bar */}
            <div style={{
                padding: isMobile && schedScrolled ? '0' : (isMobile ? '0.85rem 1rem' : '1.25rem 2.5rem'),
                maxHeight: isMobile && schedScrolled ? '0' : '120px',
                overflow: 'hidden',
                opacity: isMobile && schedScrolled ? 0 : 1,
                transition: 'max-height 0.3s ease, opacity 0.2s, padding 0.3s',
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(var(--glass-blur))',
                borderBottom: isMobile && schedScrolled ? 'none' : '1.5px solid var(--glass-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 20,
                pointerEvents: isMobile && schedScrolled ? 'none' : 'auto'
            }}>
                <div style={{ display: 'flex', flex: isMobile ? 1 : 'none', background: 'oklch(0% 0 0 / 0.05)', padding: '5px', borderRadius: '16px', backdropFilter: 'blur(10px)' }}>
                     {canViewActivities && (
                     <button
                        onClick={() => setViewMode('activities')}
                        style={{
                            padding: '0.625rem 1.25rem', borderRadius: '12px', gap: '0.5rem', display: 'flex', alignItems: 'center', flex: isMobile ? 1 : 'none', justifyContent: 'center',
                            background: viewMode === 'activities' ? 'white' : 'transparent',
                            color: viewMode === 'activities' ? 'var(--primary-color)' : 'var(--text-muted)',
                            fontWeight: '950', fontSize: '0.85rem', transition: 'all 0.3s',
                            boxShadow: viewMode === 'activities' ? 'var(--shadow-sm)' : 'none'
                        }}>
                        <CalendarIcon size={18} strokeWidth={2} /> Activités
                    </button>
                    )}
                    {canViewMenus && (
                    <button
                        onClick={() => setViewMode('menus')}
                        style={{
                            padding: '0.625rem 1.25rem', borderRadius: '12px', gap: '0.5rem', display: 'flex', alignItems: 'center', flex: isMobile ? 1 : 'none', justifyContent: 'center',
                            background: viewMode === 'menus' ? 'white' : 'transparent',
                            color: viewMode === 'menus' ? 'var(--cta-color)' : 'var(--text-muted)',
                            fontWeight: '950', fontSize: '0.85rem', transition: 'all 0.3s',
                            boxShadow: viewMode === 'menus' ? 'var(--shadow-sm)' : 'none'
                        }}>
                        <Utensils size={18} strokeWidth={2} /> Menus
                    </button>
                    )}
                </div>

                {!isMobile && (
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <button aria-label="Aller à aujourd'hui" onClick={goToToday} className="btn-icon" style={{ width: '44px', height: '44px', background: 'var(--surface-color)', border: '1.5px solid var(--glass-border)' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-color)' }} />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-color)', borderRadius: '14px', border: '1.5px solid var(--glass-border)', overflow: 'hidden' }}>
                        <button aria-label="Jour précédent" onClick={() => navigateDay(-1)} style={{ padding: '0.75rem', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex' }}><ChevronLeft size={18} /></button>
                        <div style={{ width: '1px', height: '20px', background: 'var(--glass-border)' }} />
                        <button aria-label="Jour suivant" onClick={() => navigateDay(1)} style={{ padding: '0.75rem', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex' }}><ChevronRight size={18} /></button>
                    </div>
                </div>
                )}
            </div>

            {/* Compact sticky bar — mobile scrolled */}
            {isMobile && schedScrolled && (
                <div style={{ position: 'sticky', top: 0, zIndex: 22, background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '8px 12px' }}>
                    <div style={{ display: 'flex', background: 'oklch(0% 0 0 / 0.06)', padding: '3px', borderRadius: '10px', flexShrink: 0 }}>
                        {canViewActivities && <button aria-label="Vue activités" onClick={() => setViewMode('activities')} style={{ padding: '5px 10px', minWidth: '40px', minHeight: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '900', border: 'none', cursor: 'pointer', background: viewMode === 'activities' ? 'white' : 'transparent', color: viewMode === 'activities' ? 'var(--primary-color)' : 'var(--text-muted)' }}><CalendarIcon size={14} /></button>}
                        {canViewMenus && <button aria-label="Vue repas" onClick={() => setViewMode('menus')} style={{ padding: '5px 10px', minWidth: '40px', minHeight: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '900', border: 'none', cursor: 'pointer', background: viewMode === 'menus' ? 'white' : 'transparent', color: viewMode === 'menus' ? 'var(--cta-color)' : 'var(--text-muted)' }}><Utensils size={14} /></button>}
                    </div>
                    <div style={{ flex: 1, textAlign: 'center', fontSize: '0.82rem', fontWeight: '900', color: 'var(--text-main)', textTransform: 'capitalize', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {currentDate.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </div>
                    <div style={{ display: 'flex', background: 'var(--surface-color)', borderRadius: '10px', border: '1px solid var(--glass-border)', overflow: 'hidden', flexShrink: 0 }}>
                        <button aria-label="Jour précédent" onClick={() => navigateDay(-1)} style={{ padding: '6px 10px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '44px', minHeight: '44px' }}><ChevronLeft size={15} /></button>
                        <div style={{ width: '1px', background: 'var(--glass-border)' }} />
                        <button aria-label="Jour suivant" onClick={() => navigateDay(1)} style={{ padding: '6px 10px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '44px', minHeight: '44px' }}><ChevronRight size={15} /></button>
                    </div>
                </div>
            )}

            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                <div ref={schedScrollRef} onScroll={schedOnScroll} style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, padding: isMobile ? '1.25rem' : '2.5rem', background: 'transparent', overflowY: 'auto', overflowX: 'hidden' }} className="no-scrollbar">
                    
                    {(!canViewActivities && !canViewMenus) ? (
                        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)', fontWeight: 800 }}>
                            Aucune sous-section du Planning n'est accessible avec votre rôle.
                        </div>
                    ) : viewMode === 'activities' ? (
                        <div style={{ maxWidth: scheduleView === 'week' ? '1500px' : '1000px', width: '100%', margin: '0 auto' }}>
                            {/* Date Header Card */}
                            <div className="card-glass" style={{
                                padding: isMobile ? '0.85rem' : '1.5rem 2rem', marginBottom: isMobile ? '1.25rem' : '3rem', borderLeft: isMobile ? 'none' : '8px solid var(--primary-color)',
                                display: 'flex', flexDirection: 'column', gap: isMobile ? '0.7rem' : 0,
                                position: 'relative', zIndex: 20
                            }}>
                                {isMobile ? (
                                    <>
                                        {/* Stepper : ‹ date › centré */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                            <button aria-label="Jour précédent" onClick={() => navigateDay(-1)} style={{ width: '42px', height: '42px', flexShrink: 0, borderRadius: '14px', background: 'var(--bg-secondary)', border: 'none', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronLeft size={20} strokeWidth={2.5} /></button>
                                            <h2 onClick={goToToday} title="Revenir à aujourd'hui" style={{ margin: 0, flex: 1, textAlign: 'center', fontSize: '1.15rem', fontWeight: '800', fontFamily: 'Bricolage Grotesque, sans-serif', letterSpacing: '-0.03em', color: 'var(--text-main)', textTransform: 'capitalize', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}>
                                                {scheduleView === 'week'
                                                    ? `Sem. ${weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} – ${addDays(weekStart, 6).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`
                                                    : currentDate.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' })}
                                            </h2>
                                            <button aria-label="Jour suivant" onClick={() => navigateDay(1)} style={{ width: '42px', height: '42px', flexShrink: 0, borderRadius: '14px', background: 'var(--bg-secondary)', border: 'none', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronRight size={20} strokeWidth={2.5} /></button>
                                        </div>
                                        {/* Vue (Jour/Semaine) + menu ⋯ */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ display: 'flex', gap: '3px', background: 'oklch(0% 0 0 / 0.05)', borderRadius: '13px', padding: '3px', flex: 1, minWidth: 0 }}>
                                                {[['day', 'Jour', <CalendarIcon size={13} strokeWidth={2} key="d" />], ['week', 'Semaine', <LayoutGrid size={13} strokeWidth={2} key="w" />]].map(([v, label, icon]) => (
                                                    <button key={v} onClick={() => setScheduleView(v)} style={{ flex: 1, minWidth: 0, padding: '0.5rem 0.4rem', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: '900', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px', whiteSpace: 'nowrap', background: scheduleView === v ? 'var(--surface-color)' : 'transparent', color: scheduleView === v ? 'var(--primary-color)' : 'var(--text-muted)', boxShadow: scheduleView === v ? 'var(--shadow-sm)' : 'none', transition: 'all 0.25s' }}>
                                                        {icon} {label}
                                                    </button>
                                                ))}
                                            </div>
                                            <div style={{ position: 'relative', flexShrink: 0 }}>
                                                <button aria-label="Plus d'options" onClick={() => setSchedMenuOpen(o => !o)} style={{ width: '42px', height: '42px', borderRadius: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: schedMenuOpen ? 'var(--primary-light)' : 'var(--bg-secondary)', border: 'none', color: schedMenuOpen ? 'var(--primary-color)' : 'var(--text-main)', transition: 'all 0.2s' }}><MoreHorizontal size={19} strokeWidth={2} /></button>
                                                {schedMenuOpen && (
                                                    <>
                                                        <div onClick={() => setSchedMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                                                        <div className="animate-scale-in" style={{ position: 'absolute', top: '46px', right: 0, zIndex: 41, width: '230px', maxWidth: 'calc(100vw - 1.8rem)', padding: '0.5rem', borderRadius: '18px', background: 'var(--surface-color)', border: '1.5px solid var(--glass-border)', boxShadow: '0 20px 50px oklch(20% 0 0 / 0.22)' }}>
                                                            {groups.length > 0 && (
                                                                <div style={{ padding: '0.35rem 0.4rem 0.5rem' }}>
                                                                    <div style={{ fontSize: '10px', fontWeight: '950', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '5px' }}>Filtrer par groupe</div>
                                                                    <select value={groupFilter} onChange={e => setGroupFilter(e.target.value)} className="glass-input" style={{ width: '100%', borderRadius: '12px', border: '1.5px solid var(--glass-border)', background: 'var(--surface-color)', fontWeight: '800', fontSize: '0.82rem' }}>
                                                                        <option value="all">Tous les groupes</option>
                                                                        {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                                                    </select>
                                                                </div>
                                                            )}
                                                            <button onClick={() => { goToToday(); setSchedMenuOpen(false); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.65rem 0.5rem', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontWeight: '850', fontSize: '0.85rem', color: 'var(--text-main)', borderRadius: '10px' }}><span style={{ width: '9px', height: '9px', borderRadius: '50%', background: 'var(--primary-color)', flexShrink: 0 }} /> Aujourd'hui</button>
                                                            <button onClick={() => { printSchedule(); setSchedMenuOpen(false); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.65rem 0.5rem', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontWeight: '850', fontSize: '0.85rem', color: 'var(--text-main)', borderRadius: '10px' }}><Printer size={15} strokeWidth={2} /> Imprimer</button>
                                                            {canEditActivities && scheduleView === 'day' && (
                                                                <button onClick={() => { handleDuplicateDay(); setSchedMenuOpen(false); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.65rem 0.5rem', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontWeight: '850', fontSize: '0.85rem', color: 'var(--text-main)', borderRadius: '10px' }}><Copy size={15} strokeWidth={2} /> Dupliquer la journée</button>
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        {canEditActivities && (
                                            <button onClick={openNewForm} className="btn btn-primary" style={{ width: '100%', height: '46px', padding: 0, fontWeight: '950', gap: '0.5rem', borderRadius: '14px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Plus size={19} strokeWidth={2.5} /> Nouvelle activité
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', width: '100%', flexWrap: 'wrap' }}>
                                        <div>
                                            <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: '800', fontFamily: 'Bricolage Grotesque, sans-serif', letterSpacing: '-0.05em', color: 'var(--text-main)', textTransform: 'capitalize' }}>
                                                {scheduleView === 'week'
                                                    ? `Semaine du ${weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} au ${addDays(weekStart, 6).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`
                                                    : currentDateLabel}
                                            </h2>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            <div style={{ display: 'flex', gap: '3px', background: 'oklch(0% 0 0 / 0.05)', borderRadius: '12px', padding: '3px' }}>
                                                {[['day', 'Jour', <CalendarIcon size={13} strokeWidth={2} key="d" />], ['week', 'Semaine', <LayoutGrid size={13} strokeWidth={2} key="w" />]].map(([v, label, icon]) => (
                                                    <button key={v} onClick={() => setScheduleView(v)} style={{ padding: '0.4rem 0.7rem', borderRadius: '9px', border: 'none', cursor: 'pointer', fontWeight: '900', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap', background: scheduleView === v ? 'white' : 'transparent', color: scheduleView === v ? 'var(--primary-color)' : 'var(--text-muted)', boxShadow: scheduleView === v ? 'var(--shadow-sm)' : 'none' }}>
                                                        {icon} {label}
                                                    </button>
                                                ))}
                                            </div>
                                            {groups.length > 0 && (
                                                <select value={groupFilter} onChange={e => setGroupFilter(e.target.value)} title="Filtrer par groupe" style={{ height: '38px', borderRadius: '12px', border: '1.5px solid var(--glass-border)', background: 'var(--surface-color)', fontWeight: '800', fontSize: '0.8rem', padding: '0 0.6rem', cursor: 'pointer', maxWidth: '160px' }}>
                                                    <option value="all">Tous les groupes</option>
                                                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                                </select>
                                            )}
                                            <button onClick={printSchedule} className="btn-icon" title="Imprimer le planning" style={{ width: '38px', height: '38px', background: 'var(--surface-color)', border: '1.5px solid var(--glass-border)' }}><Printer size={16} strokeWidth={2} /></button>
                                            {canEditActivities && scheduleView === 'day' && (
                                                <button onClick={handleDuplicateDay} className="btn-icon" title="Dupliquer la journée vers une autre date" style={{ width: '38px', height: '38px', background: 'var(--surface-color)', border: '1.5px solid var(--glass-border)' }}><Copy size={16} strokeWidth={2} /></button>
                                            )}
                                            {canEditActivities && (
                                                <button onClick={openNewForm} className="btn btn-primary" style={{ padding: '0.7rem 1.2rem', fontWeight: '950', gap: '0.5rem', borderRadius: '14px', fontSize: '0.88rem' }}>
                                                    <Plus size={18} strokeWidth={2} /> Nouvelle Activité
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Vue semaine : 7 colonnes, glisser une activité d'un jour à l'autre = replanifier */}
                            {scheduleView === 'week' ? (
                                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(7, minmax(0, 1fr))', gap: '0.6rem' }}>
                                    {weekDays.map(({ date, ds, items }) => {
                                        const isToday = ds === formatDate(new Date());
                                        const isSel = ds === formatDate(currentDate);
                                        return (
                                            <div key={ds}
                                                onDragOver={canEditActivities ? (e) => { e.preventDefault(); e.currentTarget.style.boxShadow = 'inset 0 0 0 2px var(--primary-color)'; } : undefined}
                                                onDragLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                                                onDrop={canEditActivities ? (e) => { e.preventDefault(); e.currentTarget.style.boxShadow = 'none'; const id = e.dataTransfer.getData('text/plain'); if (id) handleMoveActivity(id, ds); } : undefined}
                                                style={{ background: 'var(--surface-color)', border: `1.5px solid ${isSel ? 'var(--primary-color)' : 'var(--glass-border)'}`, borderRadius: '16px', padding: '0.65rem 0.6rem', minHeight: '130px', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                                                <button onClick={() => { setCurrentDate(new Date(date)); setScheduleView('day'); }} title="Ouvrir cette journée"
                                                    style={{ border: 'none', background: isToday ? 'color-mix(in oklch, var(--primary-color) 9%, transparent)' : 'transparent', cursor: 'pointer', textAlign: 'left', padding: '0.3rem 0.4rem', borderRadius: '9px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontWeight: '950', fontSize: '0.8rem', textTransform: 'capitalize', color: isToday ? 'var(--primary-color)' : 'var(--text-main)' }}>
                                                        {date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}
                                                    </span>
                                                    {items.length > 0 && <span style={{ fontSize: '0.62rem', fontWeight: '900', color: 'var(--text-muted)' }}>{items.length}</span>}
                                                </button>
                                                {items.map(a => (
                                                    <div key={a.id} draggable={canEditActivities}
                                                        onDragStart={(e) => { e.dataTransfer.setData('text/plain', a.id); }}
                                                        onClick={() => canEditActivities && handleEdit(a)}
                                                        style={{ border: '1px solid var(--glass-border)', borderLeft: `4px solid ${a.color || DEFAULT_COLOR.value}`, background: isActivityPast(a, nowMs) ? 'var(--bg-secondary)' : 'var(--surface-color)', borderRadius: '10px', padding: '0.5rem 0.6rem', display: 'flex', flexDirection: 'column', gap: '3px', cursor: canEditActivities ? 'grab' : 'default', opacity: isActivityPast(a, nowMs) ? 0.55 : 1 }}>
                                                        <div style={{ fontSize: '0.7rem', fontWeight: '900', color: 'var(--text-muted)', letterSpacing: '0.01em' }}>{a.startTime || a.time || '—'}</div>
                                                        <div style={{ fontSize: '0.82rem', fontWeight: '850', color: 'var(--text-main)', lineHeight: 1.3, overflowWrap: 'break-word' }}>{a.title}</div>
                                                    </div>
                                                ))}
                                                {items.length === 0 && <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', opacity: 0.4, textAlign: 'center', padding: '0.75rem 0' }}>—</div>}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : dayActivities.length === 0 ? (
                                <div className="card-glass" style={{ textAlign: 'center', padding: '6rem 2rem', border: '2.5px dashed var(--glass-border)' }}>
                                    <div style={{ width: '90px', height: '90px', background: 'var(--bg-secondary)', borderRadius: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2.5rem', opacity: 0.5 }}>
                                        <CalendarIcon size={44} />
                                    </div>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.03em' }}>Journée Libre</h3>
                                    <p style={{ color: 'var(--text-muted)', fontWeight: '700', marginTop: '0.5rem' }}>Profitez-en pour vous reposer ou préparer la suite.</p>
                                </div>
                            ) : (
                                <div style={{ paddingLeft: '20px' }}>
                                    {dayActivities.map((activity, idx) => (
                                        <ActivityCard key={activity.id} activity={activity} index={idx}
                                            onEdit={handleEdit} onDelete={handleDelete}
                                            onDuplicate={handleDuplicate} onShowNonTested={showNonTested} hasConflict={conflictIds.has(activity.id)}
                                            isMobile={isMobile} canEdit={canEditActivities} participants={participants} now={nowMs} />
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                         <div style={{ maxWidth: '1000px', width: '100%', margin: '0 auto' }}>
                           <Menus participants={participants} currentDate={currentDate} isMobile={isMobile} menus={menus} setMenus={setMenus} canEdit={canEditMenus} groups={groups} />
                         </div>
                    )}
                </div>

                {/* Sidebar Calendar */}
                {!isMobile && (
                    <div style={{ 
                        width: '320px', flexShrink: 0,
                        borderLeft: '1.5px solid var(--glass-border)',
                        background: 'rgba(255, 255, 255, 0.45)', 
                        backdropFilter: 'blur(10px)',
                        display: 'flex', flexDirection: 'column', 
                        overflowY: 'auto' 
                    }} className="no-scrollbar">
                        <div style={{ padding: '2.5rem 1.5rem' }}>
                            <div className="card-glass" style={{ padding: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <h4 style={{ margin: 0, fontWeight: '800', fontSize: '1rem', textTransform: 'capitalize', letterSpacing: '-0.02em' }}>
                                        {calendarMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                                    </h4>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button aria-label="Mois précédent" onClick={() => { const d = new Date(calendarMonth); d.setMonth(d.getMonth() - 1); setCalendarMonth(d); }} className="btn-icon" style={{ width: '32px', height: '32px' }}><ChevronLeft size={14} /></button>
                                        <button aria-label="Mois suivant" onClick={() => { const d = new Date(calendarMonth); d.setMonth(d.getMonth() + 1); setCalendarMonth(d); }} className="btn-icon" style={{ width: '32px', height: '32px' }}><ChevronRight size={14} /></button>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '1rem' }}>
                                    {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
                                        <div key={i} style={{ color: 'var(--text-muted)', fontWeight: '950', fontSize: '10px', opacity: 0.5 }}>{d}</div>
                                    ))}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
                                    {renderCalendar()}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Form */}
            {isFormOpen && (
                <div className="modal-overlay animate-fade-in" onClick={(e) => e.target === e.currentTarget && setIsFormOpen(false)} style={{ zIndex: 1000, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}>
                    <div className="modal-content animate-scale-in" style={{ width: '100%', maxWidth: '560px', borderRadius: '32px', padding: '0', overflow: 'hidden' }}>
                        <div style={{ padding: '1.5rem 2rem', background: 'var(--surface-color)', color: 'var(--text-main)', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                <div style={{ width: '40px', height: '40px', background: 'var(--primary-color)', color: 'white', borderRadius: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Plus size={22} strokeWidth={2.5} />
                                </div>
                                <h3 style={{ margin: 0, fontWeight: '800', fontSize: '1.2rem', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
                                    {editingId ? 'Modifier l\'activité' : 'Nouvelle activité'}
                                </h3>
                            </div>
                            <button aria-label="Fermer" onClick={() => setIsFormOpen(false)} style={{ background: 'var(--bg-secondary)', border: 'none', borderRadius: '12px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-main)', flexShrink: 0 }}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ padding: isMobile ? '1.5rem' : '2rem', display: 'flex', flexDirection: 'column', gap: isMobile ? '1.25rem' : '1.5rem', flex: 1, minHeight: 0, overflowY: 'auto' }} className="no-scrollbar">
                            <div>
                                <label className="form-label">Titre de l'activité</label>
                                <div style={{ position: 'relative' }}>
                                    <input type="text" required value={formData.title} onChange={handleTitleChange}
                                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                        placeholder="Ex: Petit déjeuner, Football..."
                                        style={{ width: '100%', padding: '0.85rem 1.25rem', borderRadius: '16px', border: '1.5px solid var(--glass-border)', fontSize: '0.95rem', fontWeight: '700', outline: 'none', background: 'var(--bg-secondary)' }}
                                        autoFocus
                                    />
                                    {showSuggestions && suggestions.length > 0 && (
                                        <div className="card-glass" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200, marginTop: '8px', padding: '8px' }}>
                                            {suggestions.slice(0, 8).map((s, i) => (
                                                <div key={i} onClick={() => { setFormData({ ...formData, title: s }); setShowSuggestions(false); }}
                                                    style={{ padding: '0.75rem 1rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '800', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.75rem', transition: 'all 0.2s' }}
                                                    onMouseEnter={e => e.currentTarget.style.background = 'oklch(0% 0 0 / 0.05)'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                    <Star size={14} style={{ color: 'var(--primary-color)' }} /> {s}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.5fr 1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label className="form-label">Date</label>
                                    <input type="date" required value={formData.date}
                                        onChange={e => { setFormData({ ...formData, date: e.target.value }); setRepeatDays([e.target.value]); }}
                                        style={{ width: '100%', padding: '0.85rem', borderRadius: '16px', border: '1.5px solid var(--glass-border)', fontWeight: '700', background: 'var(--surface-color)' }}
                                    />
                                </div>
                                <div>
                                    <label className="form-label">Début</label>
                                    <input type="time" required value={formData.startTime}
                                        onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                        style={{ width: '100%', padding: '0.85rem', borderRadius: '16px', border: '1.5px solid var(--glass-border)', fontWeight: '700' }}
                                    />
                                </div>
                                <div>
                                    <label className="form-label">Fin</label>
                                    <input type="time" required value={formData.endTime}
                                        onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                        style={{ width: '100%', padding: '0.85rem', borderRadius: '16px', border: '1.5px solid var(--glass-border)', fontWeight: '700' }}
                                    />
                                </div>
                            </div>

                            {!editingId && (
                                <div>
                                    <label className="form-label">Répéter sur <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>(crée l'activité sur chaque jour coché)</span></label>
                                    <div style={{ display: 'flex', gap: '5px', alignItems: 'stretch', flexWrap: 'wrap' }}>
                                        {repeatWeek.map(d => {
                                            const sel = repeatDays.includes(d.ds);
                                            return (
                                                <button key={d.ds} type="button" onClick={() => toggleRepeatDay(d.ds)}
                                                    style={{ flex: '1 1 0', minWidth: '36px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px', padding: '0.4rem 0', borderRadius: '12px', cursor: 'pointer', border: `1.5px solid ${sel ? 'var(--primary-color)' : 'var(--glass-border)'}`, background: sel ? 'var(--primary-color)' : 'var(--surface-color)', color: sel ? 'white' : 'var(--text-muted)', fontWeight: '900', transition: 'all 0.15s' }}>
                                                    <span style={{ fontSize: '0.78rem', lineHeight: 1 }}>{d.letter}</span>
                                                    <span style={{ fontSize: '0.6rem', opacity: 0.8, lineHeight: 1 }}>{d.num}</span>
                                                </button>
                                            );
                                        })}
                                        <button type="button" onClick={selectWholeWeek}
                                            style={{ flexShrink: 0, padding: '0.5rem 0.85rem', borderRadius: '12px', cursor: 'pointer', border: '1.5px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)', fontWeight: '850', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                                            Toute la semaine
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="form-label">Couleur & Catégorie</label>
                                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', padding: '10px', background: 'var(--bg-secondary)', borderRadius: '18px' }}>
                                    {ACTIVITY_COLORS.map(c => (
                                        <button key={c.value} type="button" onClick={() => setFormData({ ...formData, color: c.value })}
                                            style={{
                                                width: '32px', height: '32px', borderRadius: '50%', background: c.value,
                                                border: '3px solid white',
                                                boxShadow: formData.color === c.value ? `0 0 0 3px ${c.value}` : 'none',
                                                cursor: 'pointer', transition: 'all 0.2s', transform: formData.color === c.value ? 'scale(1.1)' : 'none'
                                            }} />
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="form-label">Lieu / Description</label>
                                <div style={{ position: 'relative' }}>
                                    <MapPin size={18} style={{ position: 'absolute', top: '15px', left: '15px', color: 'var(--text-muted)' }} />
                                    <input type="text" value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Réfectoire, Piscine, Salle commune..."
                                        style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 2.8rem', borderRadius: '16px', border: '1.5px solid var(--glass-border)', fontWeight: '700' }}
                                    />
                                </div>
                            </div>

                            {groups.length > 0 && (
                                <div>
                                    <label className="form-label">Groupes concernés <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>(aucun = toute la colo)</span></label>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', padding: '10px', background: 'var(--bg-secondary)', borderRadius: '18px' }}>
                                        {groups.map(g => {
                                            const sel = Array.isArray(formData.groups) && formData.groups.includes(g.id);
                                            return (
                                                <button key={g.id} type="button"
                                                    onClick={() => setFormData(prev => {
                                                        const cur = Array.isArray(prev.groups) ? prev.groups : [];
                                                        return { ...prev, groups: cur.includes(g.id) ? cur.filter(x => x !== g.id) : [...cur, g.id] };
                                                    })}
                                                    style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '100px', cursor: 'pointer', fontWeight: '800', fontSize: '0.82rem',
                                                        border: `1.5px solid ${sel ? (g.color || 'var(--primary-color)') : 'var(--glass-border)'}`,
                                                        background: sel ? `color-mix(in oklch, ${g.color || 'var(--primary-color)'} 16%, white)` : 'var(--surface-color)',
                                                        color: sel ? `color-mix(in oklch, ${g.color || 'var(--primary-color)'} 55%, black)` : 'var(--text-muted)',
                                                    }}>
                                                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: g.color || 'var(--primary-color)', flexShrink: 0 }} />
                                                    {g.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                                <button type="button" onClick={() => setIsFormOpen(false)} className="btn btn-secondary" style={{ flex: 1, padding: '1rem' }}>Annuler</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 2, padding: '1rem', fontWeight: '950' }}>{editingId ? 'Enregistrer les modifications' : 'Créer l\'activité'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                @media (hover: hover) {
                    .sc-activity-item:hover {
                        transform: translateX(10px);
                    }
                }
                .form-label {
                    display: block;
                    font-size: 11px;
                    font-weight: 950;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.12em;
                    margin-bottom: 0.75rem;
                }
            `}</style>
        </div>
    );
}
