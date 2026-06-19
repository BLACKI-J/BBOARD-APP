import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { Camera, Search, Plus, Trash2, Package, Upload, X, ChevronRight, Layers, Box, RefreshCcw, List, Sparkles, ShoppingBag, Users, Check, Minus, Pencil, FileText, Printer, Download, UserPlus, PackageCheck, ClipboardCheck, PackageSearch } from 'lucide-react';
import WebcamPhotoCapture from './directory/WebcamPhotoCapture';
import { canUseWebcam } from '../utils/camera';
import { useUi } from '../ui/UiProvider';
import { apiSend } from '../utils/api';
import { compressImage, fileToDataUrl } from '../utils/image';

const CATEGORIES = ['vêtement', 'chaussures', 'hygiène', 'accessoire', 'autre'];
const UNASSIGNED = 'unassigned_stock';

// Un objet est « rendu » quand la quantité au départ couvre celle d'arrivée.
const isReturned = (item) => (item.arrival_qty || 0) > 0 && (item.departure_qty || 0) >= (item.arrival_qty || 0);
// Compteur rendu / total pour un lot d'objets.
const returnStats = (items = []) => {
    const total = items.length;
    const done = items.filter(isReturned).length;
    return { total, done, pending: total - done };
};
const escapeHtml = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const tabStyle = (active) => ({ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '0.5rem 0.85rem', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: '900', fontSize: '0.78rem', whiteSpace: 'nowrap', background: active ? 'white' : 'transparent', color: active ? 'var(--primary-color)' : 'var(--text-muted)', boxShadow: active ? 'var(--shadow-sm)' : 'none' });

const EmptyPanel = ({ icon: Icon = Box, title, text }) => (
    <div style={{ height: '70%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', border: '2px dashed var(--glass-border)', borderRadius: '40px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', margin: '1rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: '200px', height: '200px', background: 'var(--primary-gradient)', filter: 'blur(100px)', opacity: 0.1, zIndex: -1 }} />
        <div style={{ width: '100px', height: '100px', background: 'white', borderRadius: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-md)', marginBottom: '1.5rem', border: '1.5px solid var(--glass-border)' }}>
            <Icon size={40} strokeWidth={2.5} style={{ color: 'var(--primary-color)', opacity: 0.8 }} />
        </div>
        <p style={{ fontWeight: '950', fontSize: '1.25rem', color: 'var(--text-main)', opacity: 0.8, letterSpacing: '-0.02em' }}>{title}</p>
        <p style={{ fontSize: '0.85rem', fontWeight: '800', opacity: 0.5, marginTop: '0.5rem', maxWidth: '320px', textAlign: 'center' }}>{text}</p>
    </div>
);

// ─── Sub-Components ──────────────────────────────────────────────────────────

const ChildCard = ({ child, itemCount, isActive, onClick, isCollapsed, progress }) => (
    <button
        onClick={onClick}
        className={`card-glass participant-card ${isActive ? 'selected' : ''}`}
        style={{
            width: '100%',
            padding: isCollapsed ? '0.5rem' : '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            gap: isCollapsed ? '0' : '1rem',
            cursor: 'pointer',
            border: isActive ? '1.5px solid var(--primary-color)' : '1.5px solid var(--glass-border)',
            background: isActive ? 'white' : 'rgba(255, 255, 255, 0.4)',
            transition: 'all 0.3s var(--ease-out-expo)',
            textAlign: 'left',
            borderRadius: isCollapsed ? '16px' : '20px',
            position: 'relative',
            overflow: 'hidden'
        }}
    >
        <div style={{
            width: isCollapsed ? '40px' : '44px',
            height: isCollapsed ? '40px' : '44px',
            borderRadius: '14px',
            background: child.photo ? `url(${child.photo}) center/cover` : 'var(--primary-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: '950',
            flexShrink: 0,
            fontSize: isCollapsed ? '12px' : '14px',
            boxShadow: 'var(--shadow-sm)',
            border: '2px solid white'
        }}>
            {!child.photo && (child.firstName?.[0] || child.lastName?.[0] || '?').toUpperCase()}
        </div>
        
        {!isCollapsed && (
            <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: '950', fontSize: '0.95rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.02em' }}>
                    {child.firstName} <span style={{ textTransform: 'uppercase', fontSize: '0.85em', opacity: 0.7 }}>{child.lastName}</span>
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ShoppingBag size={10} strokeWidth={3} /> {itemCount} objets
                    {progress && progress.total > 0 && (
                        <span style={{ marginLeft: 'auto', color: progress.done === progress.total ? 'var(--success-color)' : 'var(--text-muted)' }}>{progress.done}/{progress.total}</span>
                    )}
                </div>
                {progress && progress.total > 0 && (
                    <div style={{ height: '4px', borderRadius: '4px', background: 'var(--bg-secondary)', marginTop: '6px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.round(progress.done / progress.total * 100)}%`, background: progress.done === progress.total ? 'var(--success-color)' : 'var(--primary-color)', borderRadius: '4px', transition: 'width 0.3s var(--ease-out-expo)' }} />
                    </div>
                )}
            </div>
        )}
        
        {isActive && !isCollapsed && <ChevronRight size={18} strokeWidth={3} style={{ color: 'var(--primary-color)' }} />}
    </button>
);

const CategoryChip = ({ category, isActive, onClick, count }) => (
    <button
        onClick={onClick}
        className="category-chip"
        style={{
            padding: '0.625rem 1.25rem',
            borderRadius: '100px',
            fontSize: '11px',
            fontWeight: '950',
            cursor: 'pointer',
            border: '1.5px solid',
            borderColor: isActive ? 'var(--primary-color)' : 'var(--glass-border)',
            background: isActive ? 'white' : 'rgba(255, 255, 255, 0.5)',
            color: isActive ? 'var(--primary-color)' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            transition: 'all 0.3s var(--ease-out-expo)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            whiteSpace: 'nowrap',
            boxShadow: isActive ? 'var(--shadow-sm)' : 'none'
        }}
    >
        {category === 'all' ? 'Tous' : category}
        <span style={{ 
            fontSize: '10px', 
            background: isActive ? 'var(--primary-color)' : 'rgba(0,0,0,0.06)', 
            color: isActive ? 'white' : 'inherit',
            padding: '2px 8px', 
            borderRadius: '8px',
            fontWeight: '950'
        }}>
            {count}
        </span>
    </button>
);

const ItemRow = ({ item, index, onDelete, onPatch, canEdit, onTakePhoto, onUpload, isMobile, childName, onAssign }) => {
    const photo = item.photos?.length > 0 ? item.photos[0].image_base64 : null;
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(null);
    const arr = item.arrival_qty || 0;
    const dep = item.departure_qty || 0;
    const returned = isReturned(item);

    const openEdit = () => { setDraft({ label: item.label, category: item.category, arrival_qty: arr || 1, notes: item.notes || '' }); setEditing(true); };
    const saveEdit = () => {
        const label = (draft.label || '').trim();
        if (!label) return;
        onPatch(item, { label, category: draft.category, arrival_qty: Math.max(1, Number(draft.arrival_qty) || 1), notes: (draft.notes || '').trim() });
        setEditing(false);
    };
    const setDep = (v) => onPatch(item, { departure_qty: Math.max(0, Math.min(arr, v)) });

    // ── Stepper de retour (départ), partagé mobile/desktop ──
    const stepper = (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button type="button" disabled={!canEdit || dep <= 0} onClick={() => setDep(dep - 1)} className="btn-icon-ref" style={{ width: '30px', height: '30px', borderRadius: '9px', background: 'white', opacity: (!canEdit || dep <= 0) ? 0.4 : 1 }}><Minus size={15} strokeWidth={3} /></button>
            <div style={{ minWidth: '44px', textAlign: 'center', fontWeight: '950', fontSize: '0.95rem', color: returned ? 'var(--success-color)' : 'var(--text-main)' }}>{dep}/{arr}</div>
            <button type="button" disabled={!canEdit || dep >= arr} onClick={() => setDep(dep + 1)} className="btn-icon-ref" style={{ width: '30px', height: '30px', borderRadius: '9px', background: 'white', opacity: (!canEdit || dep >= arr) ? 0.4 : 1 }}><Plus size={15} strokeWidth={3} /></button>
            <button type="button" disabled={!canEdit} onClick={() => setDep(returned ? 0 : arr)} title={returned ? 'Annuler le retour' : 'Tout rendu'} style={{ marginLeft: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '7px 11px', borderRadius: '10px', border: 'none', cursor: canEdit ? 'pointer' : 'default', fontWeight: '950', fontSize: '0.72rem', background: returned ? 'var(--success-color)' : 'var(--bg-secondary)', color: returned ? 'white' : 'var(--text-muted)' }}>
                <Check size={13} strokeWidth={3.5} /> {returned ? 'Rendu' : 'Rendre'}
            </button>
        </div>
    );

    // ── Méta (catégorie, enfant en vue globale, note) ──
    const meta = (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '3px', flexWrap: 'wrap' }}>
            {childName && <span style={{ fontSize: '9px', fontWeight: '950', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--cta-color)', background: 'oklch(60% 0.12 230 / 0.12)', padding: '2px 7px', borderRadius: '7px' }}>{childName}</span>}
            <span style={{ fontSize: '9px', color: 'var(--primary-color)', fontWeight: '950', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.category}</span>
            <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)' }}>· {arr} arr.</span>
            {item.notes && <span title={item.notes} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '10px', fontWeight: '800', color: 'var(--warning-color)' }}><FileText size={11} strokeWidth={2.8} />{item.notes.length > 22 ? item.notes.slice(0, 22) + '…' : item.notes}</span>}
        </div>
    );

    const editPanel = editing && (
        <div style={{ flex: '1 1 100%', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--glass-border)' }}>
            <input autoFocus value={draft.label} onChange={e => setDraft(d => ({ ...d, label: e.target.value }))} placeholder="Désignation" style={{ flex: '2 1 160px', height: '40px', borderRadius: '12px', border: '1.5px solid var(--glass-border)', padding: '0 0.75rem', fontWeight: '800', background: 'white' }} />
            <select value={draft.category} onChange={e => setDraft(d => ({ ...d, category: e.target.value }))} style={{ flex: '1 1 110px', height: '40px', borderRadius: '12px', border: '1.5px solid var(--glass-border)', fontWeight: '800', background: 'white' }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="number" min="1" value={draft.arrival_qty} onChange={e => setDraft(d => ({ ...d, arrival_qty: e.target.value }))} title="Quantité à l'arrivée" style={{ flex: '0 0 68px', height: '40px', borderRadius: '12px', border: '1.5px solid var(--glass-border)', textAlign: 'center', fontWeight: '950', background: 'white' }} />
            <input value={draft.notes} onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))} placeholder="Note (ex : prénom marqué, tache…)" style={{ flex: '1 1 100%', height: '40px', borderRadius: '12px', border: '1.5px solid var(--glass-border)', padding: '0 0.75rem', fontWeight: '700', background: 'white' }} />
            <div style={{ display: 'flex', gap: '0.5rem', flex: '1 1 100%' }}>
                <button onClick={saveEdit} className="btn btn-primary" style={{ flex: 1, height: '40px', borderRadius: '12px', fontWeight: '900' }}>Enregistrer</button>
                <button onClick={() => setEditing(false)} className="btn btn-secondary" style={{ flex: 1, height: '40px', borderRadius: '12px', fontWeight: '900' }}>Annuler</button>
            </div>
        </div>
    );

    const thumb = photo ? (
        <img src={photo} alt={item.label} style={{ width: isMobile ? '52px' : '56px', height: isMobile ? '52px' : '56px', borderRadius: '16px', objectFit: 'cover', flexShrink: 0, border: '2px solid white', boxShadow: 'var(--shadow-sm)' }} />
    ) : (
        <div style={{ width: isMobile ? '52px' : '56px', height: isMobile ? '52px' : '56px', borderRadius: '16px', flexShrink: 0, background: 'var(--bg-secondary)', border: '2px dashed var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}><Package size={isMobile ? 22 : 24} strokeWidth={2.5} style={{ opacity: 0.3 }} /></div>
    );

    // ── Mobile : carte compacte ──
    if (isMobile) {
        return (
            <div className="animate-fade-in" style={{
                '--i': index, animationDelay: `calc(var(--i) * 30ms)`,
                padding: '0.75rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.625rem',
                background: returned ? 'oklch(62% 0.18 145 / 0.06)' : 'white', border: `1.5px solid ${returned ? 'var(--success-color)' : 'var(--glass-border)'}`, borderRadius: '18px', marginBottom: '8px'
            }}>
                {thumb}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '950', fontSize: '0.95rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</div>
                    {meta}
                </div>
                {canEdit && (
                    <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
                        {onAssign && <button onClick={() => onAssign(item)} className="btn-icon-ref" style={{ width: '40px', height: '40px', borderRadius: '11px', background: 'white' }} title="Attribuer"><UserPlus size={17} strokeWidth={2.5} /></button>}
                        <button onClick={openEdit} className="btn-icon-ref" style={{ width: '40px', height: '40px', borderRadius: '11px', background: 'white' }} title="Modifier"><Pencil size={16} strokeWidth={2.5} /></button>
                        <button onClick={() => onTakePhoto(item.id)} className="btn-icon-ref" style={{ width: '40px', height: '40px', borderRadius: '11px', background: 'white' }} title="Photo"><Camera size={17} strokeWidth={2.5} /></button>
                        <button onClick={() => onDelete(item.id)} className="btn-icon-ref danger" style={{ width: '40px', height: '40px', borderRadius: '11px', background: 'white' }} title="Supprimer"><Trash2 size={17} strokeWidth={2.5} /></button>
                    </div>
                )}
                <div style={{ flex: '1 1 100%' }}>{stepper}</div>
                {editPanel}
            </div>
        );
    }

    // ── Desktop : ligne détaillée ──
    return (
        <div className="glass-card animate-fade-in" style={{
            '--i': index, animationDelay: `calc(var(--i) * 30ms)`,
            padding: '1rem 1.25rem', display: 'flex', flexWrap: 'wrap',
            alignItems: 'center', gap: '1.25rem', marginBottom: '10px', borderRadius: '20px',
            boxShadow: returned ? 'inset 0 0 0 1.5px var(--success-color), var(--lg-edge), var(--lg-drop)' : undefined
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '200px', flex: '1 1 auto' }}>
                {thumb}
                <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: '950', fontSize: '1.05rem', color: 'var(--text-main)', letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</div>
                    {meta}
                </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '9px', fontWeight: '950', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Retour (départ)</div>
                {stepper}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
                {canEdit && (
                    <>
                        {onAssign && <button onClick={() => onAssign(item)} className="btn btn-secondary btn-icon-ref" style={{ padding: '0.5rem 0.65rem', borderRadius: '12px' }} title="Attribuer à un enfant"><UserPlus size={17} strokeWidth={2.5} /></button>}
                        <button onClick={openEdit} className="btn btn-secondary btn-icon-ref" style={{ padding: '0.5rem 0.65rem', borderRadius: '12px' }} title="Modifier"><Pencil size={16} strokeWidth={2.5} /></button>
                        <button onClick={() => onTakePhoto(item.id)} className="btn btn-secondary btn-icon-ref" style={{ padding: '0.5rem 0.65rem', borderRadius: '12px' }} title="Prendre une photo"><Camera size={17} strokeWidth={2.5} /></button>
                        <label className="btn btn-secondary btn-icon-ref" style={{ padding: '0.5rem 0.65rem', borderRadius: '12px', cursor: 'pointer' }} title="Téléverser une image">
                            <Upload size={17} strokeWidth={2.5} />
                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => onUpload(item.id, e.target.files?.[0])} />
                        </label>
                        <button onClick={() => onDelete(item.id)} className="btn-icon-ref danger" style={{ width: '38px', height: '38px', borderRadius: '12px' }} title="Supprimer"><Trash2 size={17} strokeWidth={2.5} /></button>
                    </>
                )}
            </div>
            {editPanel}
        </div>
    );
};

// ─── Main Component ──────────────────────────────────────────────────────────

export default function Inventory({ participants = [], canEdit = true, canSearchAI = true, actorHeaders = { 'Content-Type': 'application/json' }, inventoryItems = [], onRefresh, isMobile }) {
    const ui = useUi();
    const allItems = inventoryItems;
    const [selectedChildId, setSelectedChildId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [viewMode, setViewMode] = useState('inventory'); // inventory | departure | found
    const [globalSearch, setGlobalSearch] = useState(false);
    
    // UI States
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isActionPanelCollapsed, setIsActionPanelCollapsed] = useState(false);
    const [isControlHubOpen, setIsControlHubOpen] = useState(false);
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!isMobile) {
            setIsSidebarCollapsed(windowWidth < 1300);
            setIsActionPanelCollapsed(windowWidth < 1100);
        }
    }, [windowWidth, isMobile]);

    // Form States
    const [newItem, setNewItem] = useState({ label: '', category: 'vêtement', arrival_qty: 1, departure_qty: 0, photo: '' });
    const [batchEntries, setBatchEntries] = useState([]);
    const [isProcessingBatch, setIsProcessingBatch] = useState(false);
    
    // AI States
    const [isSearchingAi, setIsSearchingAi] = useState(false);
    const [aiResults, setAiResults] = useState([]);

    // ── Capture photo unifiée, choisie par CAPACITÉ (pas par largeur d'écran) :
    //    contexte sécurisé + getUserMedia → webcam intégrée ; sinon (HTTP/LAN) → appli photo native.
    const [webcamOpen, setWebcamOpen] = useState(false);
    const photoCbRef = useRef(null);
    const nativeCamRef = useRef(null);

    const requestCapture = useCallback((cb) => {
        photoCbRef.current = cb;
        if (canUseWebcam()) setWebcamOpen(true);
        else nativeCamRef.current?.click();
    }, []);

    const onNativeCapture = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        const dataUrl = await fileToDataUrl(file);
        photoCbRef.current?.(dataUrl);
        photoCbRef.current = null;
    };

    const children = useMemo(() => (participants || []).filter(p => p?.role === 'child'), [participants]);
    const itemsByChild = useMemo(() => {
        const map = {};
        allItems.forEach(item => {
            if (!map[item.participant_id]) map[item.participant_id] = [];
            map[item.participant_id].push(item);
        });
        return map;
    }, [allItems]);

    const activeItems = useMemo(() => {
        const list = itemsByChild[selectedChildId] || [];
        const q = searchQuery.toLowerCase();
        return list
            .filter(item => activeCategory === 'all' || item.category === activeCategory)
            .filter(item => (item.label || '').toLowerCase().includes(q) || (item.notes || '').toLowerCase().includes(q));
    }, [itemsByChild, selectedChildId, activeCategory, searchQuery]);

    const childNameById = useMemo(() => {
        const m = {};
        children.forEach(c => { m[c.id] = `${c.firstName} ${c.lastName || ''}`.trim(); });
        return m;
    }, [children]);

    // Objets non attribués (« trouvés »).
    const foundItems = useMemo(() => (itemsByChild[UNASSIGNED] || []), [itemsByChild]);

    // Recherche globale tous enfants (activée par le toggle).
    const globalResults = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return [];
        return allItems
            .filter(i => i.participant_id !== UNASSIGNED)
            .filter(i => (i.label || '').toLowerCase().includes(q) || (i.notes || '').toLowerCase().includes(q))
            .filter(i => activeCategory === 'all' || i.category === activeCategory);
    }, [allItems, searchQuery, activeCategory]);

    // Mode départ : enfants ayant au moins un objet non rendu.
    const departureGroups = useMemo(() => children
        .map(c => ({ child: c, items: (itemsByChild[c.id] || []).filter(i => !isReturned(i)) }))
        .filter(g => g.items.length > 0), [children, itemsByChild]);

    // Progression de retour globale (objets attribués).
    const globalProgress = useMemo(() => returnStats(allItems.filter(i => i.participant_id !== UNASSIGNED)), [allItems]);

    useEffect(() => {
        const isSelectedValid = children.some(c => c.id === selectedChildId);
        if ((!selectedChildId || !isSelectedValid) && children[0]?.id) {
            setSelectedChildId(children[0].id);
        }
    }, [children, selectedChildId]);

    const saveItem = async (payload, options = {}) => {
        if (!canEdit) return null;
        const participantId = options.participantId || selectedChildId;
        const id = payload.id || `item_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`;
        // La photo base64 n'est PAS stockée par /items (table séparée, envoyée via
        // /photos). L'inclure ici gonflait le POST → 413 nginx. On l'exclut.
        const { photo, ...rest } = payload;
        // arrival_qty ≥ 1 : un 0 (saisie rapide) rendrait l'objet impossible à marquer « rendu » (isReturned).
        const newItem = { ...rest, id, participant_id: participantId, arrival_qty: Math.max(1, Number(rest.arrival_qty) || 1) };
        // Backend attend UN objet par requête (pas le tableau complet).
        try {
            await apiSend('POST', '/api/inventory/items', { headers: actorHeaders, body: newItem });
            // Le rafraîchissement est géré par l'appelant (une seule fois, après la photo / le lot).
            return id;
        } catch (err) {
            ui.toast(`Échec d'enregistrement : ${err.message}`, { type: 'error' });
            return null;
        }
    };

    const deleteItem = async (id) => {
        if (!canEdit) return;
        const ok = await ui.confirm({ title: 'Supprimer', message: 'Supprimer cet objet ?', confirmText: 'Supprimer', danger: true });
        if (!ok) return;
        try {
            await apiSend('DELETE', `/api/inventory/items/${id}`, { headers: actorHeaders });
            onRefresh?.();
            ui.toast('Objet supprimé.', { type: 'success' });
        } catch (err) {
            ui.toast(`Échec de suppression : ${err.message}`, { type: 'error' });
        }
    };

    // Mise à jour partielle d'un objet via l'upsert serveur (POST = INSERT OR REPLACE).
    // Sert au pointage retour, à l'édition en ligne, aux notes et à l'attribution.
    const patchItem = async (item, changes) => {
        if (!canEdit) return;
        const body = {
            id: item.id,
            participant_id: changes.participant_id ?? item.participant_id,
            label: changes.label ?? item.label,
            category: changes.category ?? item.category,
            quantity: changes.quantity ?? item.quantity ?? 1,
            arrival_qty: changes.arrival_qty ?? item.arrival_qty ?? 0,
            departure_qty: changes.departure_qty ?? item.departure_qty ?? 0,
            status: changes.status ?? item.status ?? 'ok',
            notes: changes.notes ?? item.notes ?? '',
        };
        try {
            await apiSend('POST', '/api/inventory/items', { headers: actorHeaders, body });
            await onRefresh?.();
        } catch (err) {
            ui.toast(`Échec : ${err.message}`, { type: 'error' });
        }
    };

    // Attribue un objet (trouvé / non attribué, ou d'un autre enfant) à un enfant.
    const assignItem = async (item) => {
        if (!canEdit) return;
        const options = children.map(c => ({ value: c.id, label: `${c.firstName} ${c.lastName || ''}`.trim() }));
        if (!options.length) { ui.toast('Aucun enfant disponible.', { type: 'error' }); return; }
        const choice = await ui.prompt({
            title: 'Attribuer l\'objet',
            message: `À qui attribuer « ${item.label} » ? Tapez le nom de l'enfant.`,
            placeholder: 'Prénom Nom',
            confirmText: 'Attribuer',
            validate: (v) => options.some(o => o.label.toLowerCase() === String(v || '').trim().toLowerCase()) ? null : 'Enfant introuvable (saisir Prénom Nom exact).',
        });
        if (choice === null) return;
        const target = options.find(o => o.label.toLowerCase() === choice.trim().toLowerCase());
        await patchItem(item, { participant_id: target.value });
        ui.toast(`Attribué à ${target.label}.`, { type: 'success' });
    };

    // Marque tous les objets d'un enfant comme rendus (un seul rafraîchissement).
    const markGroupReturned = async (items) => {
        if (!canEdit || !items.length) return;
        try {
            for (const it of items) {
                await apiSend('POST', '/api/inventory/items', { headers: actorHeaders, body: {
                    id: it.id, participant_id: it.participant_id, label: it.label, category: it.category,
                    quantity: it.quantity || 1, arrival_qty: it.arrival_qty || 0, departure_qty: it.arrival_qty || 0,
                    status: it.status || 'ok', notes: it.notes || '',
                } });
            }
            await onRefresh?.();
            ui.toast('Tout rendu pour cet enfant.', { type: 'success' });
        } catch (err) { ui.toast(`Échec : ${err.message}`, { type: 'error' }); }
    };

    // ── Export / impression du trousseau (check-list parents) ──
    const buildCsv = (items) => {
        const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const header = ['Enfant', 'Objet', 'Catégorie', 'Arrivée', 'Départ', 'Rendu', 'Note'];
        const rows = items.map(i => [
            childNameById[i.participant_id] || (i.participant_id === UNASSIGNED ? 'Objets trouvés' : i.participant_id),
            i.label, i.category, i.arrival_qty || 0, i.departure_qty || 0, isReturned(i) ? 'oui' : 'non', i.notes || '',
        ].map(esc).join(','));
        return String.fromCharCode(0xFEFF) + [header.map(esc).join(','), ...rows].join('\n');
    };
    const downloadCsv = (csv, name) => {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.body.appendChild(document.createElement('a'));
        link.href = url; link.download = name; link.click();
        document.body.removeChild(link); URL.revokeObjectURL(url);
    };
    const exportChildCsv = () => {
        const items = itemsByChild[selectedChildId] || [];
        if (!items.length) { ui.toast('Aucun objet à exporter.', { type: 'error' }); return; }
        downloadCsv(buildCsv(items), `trousseau-${(childNameById[selectedChildId] || 'enfant').replace(/\s+/g, '-')}.csv`);
    };
    const exportAllCsv = () => {
        if (!allItems.length) { ui.toast('Inventaire vide.', { type: 'error' }); return; }
        downloadCsv(buildCsv(allItems), 'inventaire-complet.csv');
    };
    const printChild = () => {
        const items = itemsByChild[selectedChildId] || [];
        if (!items.length) { ui.toast('Aucun objet à imprimer.', { type: 'error' }); return; }
        const name = childNameById[selectedChildId] || 'Enfant';
        const rows = items.map(i => `<tr><td style="text-align:center">☐</td><td>${escapeHtml(i.label)}</td><td>${escapeHtml(i.category)}</td><td style="text-align:center">${i.arrival_qty || 0}</td><td>${escapeHtml(i.notes || '')}</td></tr>`).join('');
        const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Trousseau ${escapeHtml(name)}</title>`
            + `<style>body{font-family:system-ui,Segoe UI,sans-serif;padding:28px;color:#222}h1{font-size:20px;margin:0 0 4px}p{color:#666;margin:0 0 16px;font-size:13px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:8px;font-size:13px;text-align:left}th{background:#f3f3f3}</style>`
            + `</head><body><h1>Trousseau — ${escapeHtml(name)}</h1><p>Check-list de départ : cochez chaque objet remis à l'enfant.</p>`
            + `<table><thead><tr><th>✓</th><th>Objet</th><th>Catégorie</th><th>Qté</th><th>Note</th></tr></thead><tbody>${rows}</tbody></table>`
            + `<script>window.onload=function(){window.print()}</script></body></html>`;
        const w = window.open('', '_blank');
        if (!w) { ui.toast('Pop-up bloquée par le navigateur.', { type: 'error' }); return; }
        w.document.write(html); w.document.close();
    };

    const handleUploadAction = async (itemId, file) => {
        if (!canEdit || !file) return;
        try {
            const dataUrl = typeof file === 'string' ? file : await fileToDataUrl(file);
            const compressed = await compressImage(dataUrl);

            if (itemId === 'quick-add') {
                setNewItem(prev => ({ ...prev, photo: compressed }));
                if (canSearchAI) {
                    setIsSearchingAi(true);
                    fetch('/api/inventory/search', {
                        method: 'POST',
                        headers: actorHeaders,
                        body: JSON.stringify({ imageBase64: compressed })
                    })
                    .then(r => r.json())
                    .then(data => {
                        if (data.matches?.length > 0) {
                            const best = data.matches[0];
                            if (best.score > 0.45) {
                                setNewItem(prev => ({ ...prev, label: best.label, category: best.category || prev.category }));
                                ui.toast(`Suggéré : ${best.label}`, { type: 'info' });
                            }
                        }
                    })
                    .catch(err => console.error('AI Suggestion failed:', err))
                    .finally(() => setIsSearchingAi(false));
                }
                return;
            }

            // Rattache la photo au PROPRIÉTAIRE de l'objet (pas à l'enfant sélectionné) :
            // en mode Départ / Trouvés / recherche globale, l'objet peut être à un autre enfant.
            const ownerId = allItems.find(i => i.id === itemId)?.participant_id || selectedChildId;
            const res = await fetch(`/api/inventory/items/${itemId}/photos`, {
                method: 'POST',
                headers: actorHeaders,
                body: JSON.stringify({ participantId: ownerId, imageBase64: compressed })
            });
            if (res.ok) { 
                if (onRefresh) await onRefresh();
                ui.toast('Photo ajoutée.', { type: 'success' }); 
            }
        } catch (err) { ui.toast('Erreur photo.', { type: 'error' }); }
    };

    const handleBatchFiles = async (files) => {
        if (!canEdit || !files?.length) return;
        setIsProcessingBatch(true);
        try {
            const next = await Promise.all(Array.from(files).map(async (file) => {
                const raw = await fileToDataUrl(file);
                const compressed = await compressImage(raw);
                return {
                    id: `batch_${Date.now()}_${Math.random()}`,
                    imageBase64: compressed,
                    label: file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' '),
                    category: 'vêtement',
                    arrival_qty: 1
                };
            }));
            setBatchEntries(p => [...p, ...next]);
            ui.toast(`${next.length} photos prêtes.`, { type: 'success' });
        } catch (err) { ui.toast('Erreur lot.', { type: 'error' }); }
        finally { setIsProcessingBatch(false); }
    };

    const processBatchImport = async () => {
        if (!canEdit || batchEntries.length === 0) return;
        setIsProcessingBatch(true);
        try {
            let ok = 0, fail = 0, photoFail = 0;
            for (const entry of batchEntries) {
                const itemId = await saveItem({
                    label: entry.label,
                    category: entry.category,
                    arrival_qty: entry.arrival_qty,
                    departure_qty: 0,
                    status: 'ok'
                });
                if (itemId) {
                    ok++;
                    try {
                        await apiSend('POST', `/api/inventory/items/${itemId}/photos`, {
                            headers: actorHeaders,
                            body: { participantId: selectedChildId, imageBase64: entry.imageBase64 }
                        });
                    } catch {
                        photoFail++; // objet créé, mais la photo n'a pas pu être envoyée
                    }
                } else {
                    fail++;
                }
            }
            if (fail === 0 && photoFail === 0) {
                ui.toast(`Lot importé (${ok}).`, { type: 'success' });
                setBatchEntries([]); // ne vide que si tout a réussi (sinon on garde pour réessayer)
            } else if (fail === 0) {
                ui.toast(`${ok} importé(s), ${photoFail} photo(s) en échec.`, { type: 'error' });
                setBatchEntries([]); // objets créés : ne pas re-importer (doublons)
            } else {
                ui.toast(`${ok} importé(s), ${fail} échec(s).`, { type: 'error' });
            }
            if (onRefresh) await onRefresh();
        } finally { setIsProcessingBatch(false); }
    };

    const runAiSearch = useCallback(async (imageDataUrl) => {
        if (!canSearchAI || !imageDataUrl) return;
        setIsSearchingAi(true);
        try {
            const res = await fetch('/api/inventory/search', {
                method: 'POST',
                headers: actorHeaders,
                body: JSON.stringify({ imageBase64: imageDataUrl })
            });
            const data = await res.json();
            setAiResults(data.matches || []);
            ui.toast('Analyse terminée.', { type: 'success' });
        } catch (err) { ui.toast('Erreur IA.', { type: 'error' }); }
        finally { setIsSearchingAi(false); }
    }, [canSearchAI, actorHeaders, ui]);

    return (
        <div style={{ height: '100%', display: 'flex', background: 'transparent', overflow: 'hidden', flexDirection: isMobile ? 'column' : 'row' }}>
            {/* Sidebar: Child Selector */}
            <aside style={{ 
                width: isMobile ? '100%' : (isSidebarCollapsed ? '80px' : 'clamp(240px, 18vw, 300px)'),
                borderRight: '1px solid var(--glass-border)',
                background: 'rgba(255, 255, 255, 0.4)',
                backdropFilter: 'blur(12px)',
                display: 'flex', flexDirection: 'column', transition: 'width 0.4s var(--ease-out-expo)',
                flexShrink: 0, maxHeight: isMobile ? '120px' : 'none', position: 'relative', zIndex: 10
            }}>
                <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className={isMobile ? 'desktop-only' : ''}>
                    {!isSidebarCollapsed && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ background: 'var(--primary-gradient)', borderRadius: '10px', padding: '6px', color: 'white', display: 'flex' }}>
                                <Users size={16} strokeWidth={2.5} />
                            </div>
                            <h3 style={{ margin: 0, fontSize: '11px', fontWeight: '950', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.12em' }}>Participants</h3>
                        </div>
                    )}
                    <button className="btn-icon-ref" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}><List size={20} strokeWidth={2.5} /></button>
                </div>
                <div style={{ 
                    flex: 1, 
                    overflowY: isMobile ? 'hidden' : 'auto',
                    overflowX: isMobile ? 'auto' : 'hidden',
                    WebkitOverflowScrolling: 'touch',
                    padding: isSidebarCollapsed ? '12px' : '1.25rem', display: 'flex',
                    flexDirection: isMobile ? 'row' : 'column', gap: '0.75rem'
                }} className="no-scrollbar">
                    {children.map(child => (
                        <div key={child.id} style={{ flexShrink: 0, width: isMobile ? '180px' : 'auto' }}>
                            <ChildCard child={child} isCollapsed={isSidebarCollapsed} isActive={viewMode === 'inventory' && !globalSearch && selectedChildId === child.id} itemCount={itemsByChild[child.id]?.length || 0} progress={returnStats(itemsByChild[child.id] || [])} onClick={() => { setSelectedChildId(child.id); setViewMode('inventory'); setGlobalSearch(false); }} />
                        </div>
                    ))}
                    {foundItems.length > 0 && !isSidebarCollapsed && (
                        <button onClick={() => setViewMode('found')} style={{ width: isMobile ? '180px' : '100%', flexShrink: 0, padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', borderRadius: '20px', border: viewMode === 'found' ? '1.5px solid var(--cta-color)' : '1.5px dashed var(--glass-border)', background: viewMode === 'found' ? 'oklch(60% 0.12 230 / 0.08)' : 'rgba(255,255,255,0.4)', textAlign: 'left' }}>
                            <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'oklch(60% 0.12 230 / 0.15)', color: 'var(--cta-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><PackageSearch size={20} strokeWidth={2.5} /></div>
                            <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: '950', fontSize: '0.9rem', color: 'var(--text-main)' }}>Objets trouvés</div>
                                <div style={{ fontSize: '10px', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{foundItems.length} non attribué(s)</div>
                            </div>
                        </button>
                    )}
                </div>
            </aside>

            {/* Main Center Area */}
            <main style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
                <div style={{ maxWidth: '1440px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                    <header style={{ 
                        padding: isMobile ? '1rem' : '1.5rem 2.5rem', 
                        borderBottom: '1.5px solid var(--glass-border)', 
                        background: 'rgba(255, 255, 255, 0.6)',
                        backdropFilter: 'blur(20px)',
                        display: 'flex', flexDirection: 'column', gap: isMobile ? '1rem' : '1.5rem', zIndex: 5
                    }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative', flex: 1, minWidth: '240px', maxWidth: '520px' }}>
                            <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.6 }} />
                            <input className="glass-input" placeholder={globalSearch ? 'Rechercher chez TOUS les enfants…' : 'Rechercher dans le matériel…'} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ paddingLeft: '48px', paddingRight: '110px', borderRadius: '100px', height: '48px', background: 'rgba(255,255,255,0.8)', fontWeight: '750' }} />
                            <button onClick={() => setGlobalSearch(v => !v)} title="Chercher chez tous les enfants" style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', height: '36px', padding: '0 12px', borderRadius: '100px', border: 'none', cursor: 'pointer', fontWeight: '900', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '5px', background: globalSearch ? 'var(--primary-color)' : 'var(--bg-secondary)', color: globalSearch ? 'white' : 'var(--text-muted)' }}><Users size={13} strokeWidth={2.8} /> Tous</button>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button className="btn btn-secondary" style={{ padding: '0.75rem 1rem', borderRadius: '14px' }} onClick={() => onRefresh && onRefresh()} title="Actualiser"><RefreshCcw size={18} strokeWidth={2.5} /></button>
                            {canEdit && <button className="btn btn-secondary" style={{ padding: '0.75rem 1rem', borderRadius: '14px' }} onClick={printChild} title="Imprimer le trousseau (enfant sélectionné)"><Printer size={18} strokeWidth={2.5} /></button>}
                            {canEdit && <button className="btn btn-secondary" style={{ padding: '0.75rem 1rem', borderRadius: '14px' }} onClick={exportChildCsv} title="Exporter le trousseau (CSV)"><Download size={18} strokeWidth={2.5} /></button>}
                            {isMobile && <button onClick={() => setIsControlHubOpen(true)} className="btn btn-primary" style={{ padding: '0.75rem 1.25rem', borderRadius: '14px', fontWeight: '950' }}><Plus size={18} strokeWidth={3} /> Scanner</button>}
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-secondary)', borderRadius: '14px', padding: '4px' }}>
                            <button onClick={() => { setViewMode('inventory'); setGlobalSearch(false); }} style={tabStyle(viewMode === 'inventory' && !globalSearch)}><Package size={14} strokeWidth={2.8} /> Inventaire</button>
                            <button onClick={() => { setViewMode('departure'); setGlobalSearch(false); }} style={tabStyle(viewMode === 'departure')}><ClipboardCheck size={14} strokeWidth={2.8} /> Mode départ{departureGroups.length > 0 ? ` (${departureGroups.length})` : ''}</button>
                        </div>
                        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', fontWeight: '900', color: 'var(--text-muted)' }}>
                            <PackageCheck size={15} strokeWidth={2.8} style={{ color: 'var(--success-color)' }} /> {globalProgress.done}/{globalProgress.total} rendus
                            {canEdit && <button onClick={exportAllCsv} title="Exporter tout l'inventaire (CSV)" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', display: 'inline-flex', padding: '4px' }}><Download size={15} strokeWidth={2.8} /></button>}
                        </div>
                    </div>
                    {viewMode === 'inventory' && !globalSearch && (
                        <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '2px' }} className="no-scrollbar">
                            <CategoryChip category="all" count={(itemsByChild[selectedChildId] || []).length} isActive={activeCategory === 'all'} onClick={() => setActiveCategory('all')} />
                            {CATEGORIES.map(cat => <CategoryChip key={cat} category={cat} count={(itemsByChild[selectedChildId] || []).filter(i => i.category === cat).length} isActive={activeCategory === cat} onClick={() => setActiveCategory(cat)} />)}
                        </div>
                    )}
                </header>

                    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', padding: isMobile ? '1rem' : '2.5rem' }} className="no-scrollbar">
                    {isLoading ? (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner-small" /></div>
                    ) : globalSearch ? (
                        !searchQuery.trim()
                            ? <EmptyPanel icon={Search} title="Recherche globale" text="Tapez un mot pour retrouver un objet chez n'importe quel enfant." />
                            : globalResults.length === 0
                                ? <EmptyPanel icon={Search} title="Aucun résultat" text={`Rien ne correspond à « ${searchQuery} ».`} />
                                : <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {globalResults.map((item, idx) => <ItemRow key={item.id} index={idx} item={item} childName={childNameById[item.participant_id]} onPatch={patchItem} onDelete={deleteItem} canEdit={canEdit} onTakePhoto={(id) => requestCapture(p => handleUploadAction(id, p))} onUpload={handleUploadAction} isMobile={isMobile} />)}
                                  </div>
                    ) : viewMode === 'found' ? (
                        foundItems.length === 0
                            ? <EmptyPanel icon={PackageSearch} title="Aucun objet trouvé" text="Les objets non attribués (scan IA ou ajout sans enfant) apparaîtront ici." />
                            : <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {foundItems.map((item, idx) => <ItemRow key={item.id} index={idx} item={item} onAssign={assignItem} onPatch={patchItem} onDelete={deleteItem} canEdit={canEdit} onTakePhoto={(id) => requestCapture(p => handleUploadAction(id, p))} onUpload={handleUploadAction} isMobile={isMobile} />)}
                              </div>
                    ) : viewMode === 'departure' ? (
                        departureGroups.length === 0
                            ? <EmptyPanel icon={PackageCheck} title="Départ terminé" text="Tous les objets inventoriés ont été rendus." />
                            : <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                                {departureGroups.map(g => (
                                    <div key={g.child.id}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                            <div style={{ fontWeight: '950', fontSize: '1rem', color: 'var(--text-main)' }}>{childNameById[g.child.id]}</div>
                                            <span style={{ fontSize: '0.72rem', fontWeight: '900', color: 'var(--danger-color)', background: 'oklch(62% 0.18 20 / 0.1)', padding: '2px 8px', borderRadius: '8px' }}>{g.items.length} à rendre</span>
                                            {canEdit && <button onClick={() => markGroupReturned(g.items)} style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: '900', fontSize: '0.74rem', background: 'var(--success-color)', color: 'white' }}><Check size={14} strokeWidth={3} /> Tout rendu</button>}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            {g.items.map((item, idx) => <ItemRow key={item.id} index={idx} item={item} onPatch={patchItem} onDelete={deleteItem} canEdit={canEdit} onTakePhoto={(id) => requestCapture(p => handleUploadAction(id, p))} onUpload={handleUploadAction} isMobile={isMobile} />)}
                                        </div>
                                    </div>
                                ))}
                              </div>
                    ) : activeItems.length === 0 ? (
                        <EmptyPanel title="Aucun objet inventorié" text="Sélectionnez un enfant et utilisez le panneau de droite pour ajouter des objets." />
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {activeItems.map((item, idx) => <ItemRow key={item.id} index={idx} item={item} onPatch={patchItem} onDelete={deleteItem} canEdit={canEdit} onTakePhoto={(id) => requestCapture(p => handleUploadAction(id, p))} onUpload={handleUploadAction} isMobile={isMobile} />)}
                        </div>
                    )}
                </div>
                </div>
            </main>

            {/* Right Action Panel */}
            {!isMobile ? (
                <aside style={{ 
                    width: isActionPanelCollapsed ? '80px' : 'clamp(300px, 23vw, 360px)', 
                    background: 'rgba(255, 255, 255, 0.4)', 
                    borderLeft: '1.5px solid var(--glass-border)', 
                    display: 'flex', flexDirection: 'column', 
                    overflowY: 'auto', overflowX: 'hidden', position: 'relative', zIndex: 10,
                    transition: 'width 0.4s var(--ease-out-expo)',
                    flexShrink: 0
                }}>
                    <div style={{ 
                        padding: '1.5rem', borderBottom: '1.5px solid var(--glass-border)', 
                        display: 'flex', justifyContent: isActionPanelCollapsed ? 'center' : 'space-between', alignItems: 'center'
                    }}>
                        <button className="btn-icon-ref" onClick={() => setIsActionPanelCollapsed(!isActionPanelCollapsed)}>
                            <RefreshCcw size={20} strokeWidth={2.5} style={{ transform: isActionPanelCollapsed ? 'rotate(90deg)' : 'none', transition: 'transform 0.3s' }} />
                        </button>
                        {!isActionPanelCollapsed && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ background: 'oklch(62% 0.18 20 / 0.1)', borderRadius: '8px', padding: '6px', color: 'oklch(62% 0.18 20)' }}>
                                    <Sparkles size={16} strokeWidth={2.5} />
                                </div>
                                <h3 style={{ margin: 0, fontSize: '11px', fontWeight: '950', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.12em' }}>Actions & Scan</h3>
                            </div>
                        )}
                    </div>
                    {!isActionPanelCollapsed && (
                        <ControlHub 
                            newItem={newItem} setNewItem={setNewItem} saveItem={saveItem} batchEntries={batchEntries} setBatchEntries={setBatchEntries} 
                            handleBatchFiles={handleBatchFiles} processBatchImport={processBatchImport} isProcessingBatch={isProcessingBatch}
                            canSearchAI={canSearchAI} aiResults={aiResults} isSearchingAi={isSearchingAi} runAiSearch={runAiSearch} CATEGORIES={CATEGORIES}
                            onScanObject={() => requestCapture(photo => handleUploadAction('quick-add', photo))}
                            onScanSearch={() => requestCapture(photo => runAiSearch(photo))}
                            selectedChildId={selectedChildId} onRefresh={onRefresh} actorHeaders={actorHeaders} childNameById={childNameById}
                        />
                    )}
                </aside>
            ) : (
                <>
                    {isControlHubOpen && <div className="modal-overlay animate-fade-in" style={{ zIndex: 100 }} onClick={() => setIsControlHubOpen(false)} />}
                    <div style={{ 
                        position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTopLeftRadius: '32px', borderTopRightRadius: '32px', 
                        zIndex: 101, transform: isControlHubOpen ? 'translateY(0)' : 'translateY(100%)', transition: 'transform 0.4s var(--ease-out-expo)',
                        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 -20px 60px oklch(0% 0 0 / 0.15)',
                        paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))'
                    }} className="no-scrollbar">
                        <div style={{ width: '40px', height: '5px', background: 'var(--bg-secondary)', borderRadius: '10px', margin: '1rem auto', opacity: 0.5 }} />
                        <div style={{ padding: '0 2rem 2rem 2rem' }}>
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '950', fontFamily: 'Bricolage Grotesque, sans-serif' }}>Scan & Ajout</h3>
                                <button className="btn-icon-ref" onClick={() => setIsControlHubOpen(false)}><X size={24} /></button>
                            </div>
                            <ControlHub
                                newItem={newItem} setNewItem={setNewItem} saveItem={saveItem} batchEntries={batchEntries} setBatchEntries={setBatchEntries}
                                handleBatchFiles={handleBatchFiles} processBatchImport={processBatchImport} isProcessingBatch={isProcessingBatch}
                                canSearchAI={canSearchAI} aiResults={aiResults} isSearchingAi={isSearchingAi} runAiSearch={runAiSearch} CATEGORIES={CATEGORIES}
                                onScanObject={() => requestCapture(photo => handleUploadAction('quick-add', photo))}
                                onScanSearch={() => requestCapture(photo => runAiSearch(photo))}
                                selectedChildId={selectedChildId} onRefresh={onRefresh} actorHeaders={actorHeaders}
                            />
                        </div>
                    </div>
                </>
            )}

            {/* Native camera input — mobile, works over HTTP/LAN */}
            <input ref={nativeCamRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={onNativeCapture} />
            {/* In-app webcam — desktop */}
            <WebcamPhotoCapture isOpen={webcamOpen} onPhotoCaptured={(photo) => { setWebcamOpen(false); const cb = photoCbRef.current; photoCbRef.current = null; cb?.(photo); }} onClose={() => { setWebcamOpen(false); photoCbRef.current = null; }} />
        </div>
    );
}

const ControlHub = ({
    newItem, setNewItem, saveItem, batchEntries, setBatchEntries, handleBatchFiles,
    processBatchImport, isProcessingBatch, canSearchAI, aiResults, isSearchingAi,
    runAiSearch, CATEGORIES, onScanObject, onScanSearch,
    selectedChildId, onRefresh, actorHeaders, childNameById = {}
}) => {
    const ui = useUi();
    const nameInputRef = useRef(null);
    const focusScrollTimer = useRef(null);

    useEffect(() => {
        if (newItem.photo && !newItem.label && !isSearchingAi) { nameInputRef.current?.focus(); }
    }, [newItem.photo, isSearchingAi, newItem.label]);

    // Nettoyage du timer de scroll au démontage (évite un scrollIntoView orphelin)
    useEffect(() => () => clearTimeout(focusScrollTimer.current), []);

    return (
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <div style={{ background: 'var(--primary-light)', padding: '6px', borderRadius: '8px', color: 'var(--primary-color)' }}><Plus size={16} strokeWidth={3} /></div>
                    <h4 style={{ margin: 0, fontSize: '11px', fontWeight: '950', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>Saisie Directe</h4>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {!newItem.photo ? (
                        <button
                            className="btn btn-secondary"
                            style={{ width: '100%', minHeight: '110px', border: '2px dashed var(--glass-border)', background: 'rgba(255,255,255,0.5)', borderRadius: '20px', gap: '0.4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                            onClick={onScanObject}
                        >
                            <Camera size={28} strokeWidth={1.5} style={{ opacity: 0.6 }} />
                            <span style={{ fontWeight: '900', fontSize: '0.82rem', color: 'var(--text-muted)' }}>Ajouter une photo</span>
                            <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-softer)' }}>Caméra ou galerie</span>
                        </button>
                    ) : (
                        <div style={{ position: 'relative', width: '100%', height: '200px', borderRadius: '24px', overflow: 'hidden', border: '2px solid white', boxShadow: 'var(--shadow-lg)' }}>
                            <img src={newItem.photo} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.4), transparent)', padding: '1.25rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ background: 'white', padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: '950', color: 'var(--primary-color)' }}>
                                        {isSearchingAi ? 'Analyse IA...' : 'Objet détecté'}
                                    </div>
                                    <button onClick={() => setNewItem(prev => ({ ...prev, photo: '', label: '' }))} aria-label="Retirer la photo" style={{ background: 'white', color: 'var(--danger-color)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <X size={18} strokeWidth={3} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ position: 'relative' }}>
                            <input 
                                className="glass-input" placeholder={isSearchingAi ? "L'intelligence artificielle analyse..." : "Désignation (ex: T-shirt bleu)..."}
                                ref={nameInputRef} value={newItem.label} onChange={(e) => setNewItem(p => ({ ...p, label: e.target.value }))}
                                onFocus={(e) => {
                                    // Recentrage utile uniquement sur mobile/tablette (clavier virtuel)
                                    if (!window.matchMedia('(max-width: 1024px)').matches) return;
                                    clearTimeout(focusScrollTimer.current);
                                    focusScrollTimer.current = setTimeout(() => e.target.scrollIntoView({ block: 'center', behavior: 'smooth' }), 250);
                                }}
                                style={{ height: '52px', background: 'white', borderRadius: '16px', border: '1.5px solid var(--glass-border)', paddingLeft: '1.25rem', fontWeight: '800' }}
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 90px', gap: '0.75rem' }}>
                            <select className="glass-input" value={newItem.category} onChange={(e) => setNewItem(p => ({ ...p, category: e.target.value }))} style={{ height: '52px', background: 'white', borderRadius: '16px', border: '1.5px solid var(--glass-border)', fontWeight: '800', cursor: 'pointer', paddingRight: '2rem' }}>
                                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat.toUpperCase()}</option>)}
                            </select>
                            <div style={{ position: 'relative' }}>
                                <input className="glass-input" type="number" value={newItem.arrival_qty} onChange={(e) => setNewItem(p => ({ ...p, arrival_qty: Number(e.target.value) }))} style={{ height: '52px', background: 'white', borderRadius: '16px', border: '1.5px solid var(--glass-border)', textAlign: 'center', fontWeight: '950', padding: '0 5px' }} />
                                <div style={{ position: 'absolute', top: '-8px', right: '10px', background: 'white', padding: '0 4px', fontSize: '9px', fontWeight: '950', color: 'var(--text-muted)' }}>QTY</div>
                            </div>
                        </div>
                    </div>

                    <button 
                        className="btn btn-primary" disabled={isSearchingAi}
                        style={{ width: '100%', height: '56px', borderRadius: '18px', fontWeight: '950', fontSize: '1rem', marginTop: '0.5rem' }} 
                        onClick={async () => { 
                            if (!newItem.label.trim()) { ui.toast('Veuillez entrer une désignation.', { type: 'error' }); nameInputRef.current?.focus(); return; }
                            const savedId = await saveItem(newItem);
                            if (!savedId) return; // échec déjà signalé par saveItem
                            let photoOk = true;
                            if (newItem.photo) {
                                try {
                                    await apiSend('POST', `/api/inventory/items/${savedId}/photos`, {
                                        headers: actorHeaders,
                                        body: { participantId: selectedChildId, imageBase64: newItem.photo }
                                    });
                                } catch { photoOk = false; }
                            }
                            if (onRefresh) await onRefresh();
                            setNewItem({ label: '', category: 'vêtement', arrival_qty: 1, departure_qty: 0, photo: '' });
                            ui.toast(photoOk ? 'Objet enregistré.' : 'Objet enregistré (photo en échec).', { type: photoOk ? 'success' : 'error' });
                        }}
                    >
                        {isSearchingAi ? 'Analyse...' : (newItem.photo ? 'Confirmer l\'ajout' : 'Enregistrer cet objet')}
                    </button>
                </div>
            </section>

            <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <div style={{ background: 'oklch(62% 0.18 20 / 0.1)', padding: '6px', borderRadius: '8px', color: 'oklch(62% 0.18 20)' }}><Layers size={16} strokeWidth={3} /></div>
                    <h4 style={{ margin: 0, fontSize: '11px', fontWeight: '950', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>Import Express (Lot)</h4>
                </div>
                <label style={{ 
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100px', 
                    background: 'white', borderRadius: '24px', border: '2px dashed var(--glass-border)', cursor: 'pointer', transition: 'all 0.3s'
                }}>
                    <Upload size={24} style={{ opacity: 0.3, marginBottom: '8px' }} />
                    <span style={{ fontSize: '11px', fontWeight: '950', color: 'var(--text-muted)' }}>Télécharger les photos</span>
                    <input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={(e) => handleBatchFiles(e.target.files)} />
                </label>
                {batchEntries.length > 0 && (
                    <div style={{ marginTop: '1rem' }}>
                         <button className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', borderRadius: '14px', background: 'var(--cta-color)' }} onClick={processBatchImport} disabled={isProcessingBatch}>
                             {isProcessingBatch ? 'Traitement...' : `Importer ${batchEntries.length} objets`}
                         </button>
                    </div>
                )}
            </section>

            {canSearchAI && (
                <section>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        <div style={{ background: 'oklch(62% 0.18 232 / 0.1)', padding: '6px', borderRadius: '8px', color: 'oklch(62% 0.18 232)' }}><Search size={16} strokeWidth={3} /></div>
                        <h4 style={{ margin: 0, fontSize: '11px', fontWeight: '950', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>Scan Perdu (IA)</h4>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.6)', padding: '1.5rem', borderRadius: '24px', border: '1.5px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <button onClick={onScanSearch} className="btn btn-secondary" style={{ padding: '0.75rem', borderRadius: '12px', minHeight: '44px' }}><Camera size={16} strokeWidth={2.5} /></button>
                            <label className="btn btn-secondary" style={{ padding: '0.75rem', borderRadius: '12px', cursor: 'pointer' }}><Upload size={16} strokeWidth={2.5} /><input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = (ev) => runAiSearch(ev.target.result); r.readAsDataURL(f); } }} /></label>
                        </div>
                        {isSearchingAi && <div style={{ textAlign: 'center' }}><div className="spinner-small" style={{ width: '18px', height: '18px', margin: '0 auto' }} /></div>}
                        {aiResults.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {aiResults.map((res, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: 'white', borderRadius: '16px', border: '1.5px solid var(--glass-border)' }}>
                                        <img src={res.imageBase64} alt="Match" style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover' }} />
                                        <div style={{ minWidth: 0, flex: 1 }}>
                                            <div style={{ fontWeight: '950', fontSize: '0.85rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{res.label || 'Sans nom'}</div>
                                            <div style={{ fontSize: '10px', fontWeight: '900', color: 'var(--cta-color)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {res.participantId && res.participantId !== UNASSIGNED ? (childNameById[res.participantId] || 'Enfant inconnu') : 'Objet trouvé (non attribué)'}
                                            </div>
                                            <div style={{ fontSize: '10px', color: 'var(--success-color)', fontWeight: '900' }}>Confiance: {Math.round(res.score * 100)}%</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            )}
        </div>
    );
};
