import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { Camera, Search, Plus, Trash2, Package, Upload, X, ChevronRight, Layers, Box, RefreshCcw, List, Sparkles, CheckCircle2, AlertCircle, ShoppingBag, ArrowRight, Users } from 'lucide-react';
import WebcamPhotoCapture from './directory/WebcamPhotoCapture';
import { useUi } from '../ui/UiProvider';

const CATEGORIES = ['vêtement', 'chaussures', 'hygiène', 'accessoire', 'autre'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function compressImage(dataUrl, maxSize = 1024, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1);
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(img.width * ratio);
            canvas.height = Math.round(img.height * ratio);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject;
        img.src = dataUrl;
    });
}

function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

const ChildCard = ({ child, itemCount, isActive, onClick, isCollapsed }) => (
    <button
        onClick={onClick}
        className={`card-glass participant-card ${isActive ? 'selected' : ''}`}
        style={{
            width: '100%',
            padding: isCollapsed ? '0.75rem' : '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            cursor: 'pointer',
            border: isActive ? '1.5px solid var(--primary-color)' : '1.5px solid var(--glass-border)',
            background: isActive ? 'white' : 'rgba(255, 255, 255, 0.4)',
            transition: 'all 0.3s var(--ease-out-expo)',
            textAlign: 'left',
            borderRadius: '20px',
            position: 'relative',
            overflow: 'hidden'
        }}
    >
        <div style={{
            width: isCollapsed ? '32px' : '44px',
            height: isCollapsed ? '32px' : '44px',
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
                </div>
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

const ItemRow = ({ item, index, onDelete, canEdit, onTakePhoto, onUpload, isMobile }) => (
    <div className="card-glass animate-fade-in" style={{
        '--i': index,
        animationDelay: `calc(var(--i) * 30ms)`,
        padding: isMobile ? '1rem' : '1.25rem 1.5rem',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 140px 140px 180px 60px',
        alignItems: 'center',
        gap: isMobile ? '1rem' : '1.5rem',
        marginBottom: '10px',
        background: 'rgba(255, 255, 255, 0.4)',
        border: '1.5px solid var(--glass-border)',
        borderRadius: '24px',
        transition: 'all 0.3s var(--ease-out-expo)'
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0, gridColumn: isMobile ? 'span 2' : 'span 1' }}>
            <div style={{ position: 'relative' }}>
                {item.photos?.length > 0 ? (
                    <img src={item.photos[0].image_base64} alt={item.label} style={{ width: '56px', height: '56px', borderRadius: '16px', objectFit: 'cover', border: '2px solid white', boxShadow: 'var(--shadow-sm)' }} />
                ) : (
                    <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'var(--bg-secondary)', border: '2px dashed var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        <Package size={24} strokeWidth={2.5} style={{ opacity: 0.3 }} />
                    </div>
                )}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: '950', fontSize: '1.1rem', color: 'var(--text-main)', letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</div>
                <div style={{ fontSize: '10px', color: 'var(--primary-color)', fontWeight: '950', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '2px' }}>{item.category}</div>
            </div>
        </div>
        
        <div className="qty-badge" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontSize: '9px', fontWeight: '950', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Arrivée</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'white', border: '1.5px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '950', fontSize: '1rem' }}>{item.arrival_qty}</div>
                <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)' }}>unités</div>
            </div>
        </div>

        <div className="qty-badge" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontSize: '9px', fontWeight: '950', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Départ</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: item.departure_qty > 0 ? 'oklch(62% 0.18 145 / 0.1)' : 'white', border: '1.5px solid', borderColor: item.departure_qty > 0 ? 'var(--success-color)' : 'var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '950', fontSize: '1rem', color: item.departure_qty > 0 ? 'var(--success-color)' : 'inherit' }}>{item.departure_qty || 0}</div>
                <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)' }}>confirmées</div>
            </div>
        </div>

        <div style={{ display: 'flex', gap: '0.625rem', justifyContent: 'flex-start' }}>
            {canEdit && (
                <>
                    <button onClick={() => onTakePhoto(item.id)} className="btn btn-secondary btn-icon-ref" style={{ flex: 1, padding: '0.5rem', borderRadius: '12px' }} title="Prendre une photo">
                        <Camera size={18} strokeWidth={2.5} />
                    </button>
                    <label className="btn btn-secondary btn-icon-ref" style={{ flex: 1, padding: '0.5rem', borderRadius: '12px', cursor: 'pointer' }} title="Téléverser une image">
                        <Upload size={18} strokeWidth={2.5} />
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => onUpload(item.id, e.target.files?.[0])} />
                    </label>
                </>
            )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            {canEdit && (
                <button onClick={() => onDelete(item.id)} className="btn-icon-ref danger" style={{ width: '38px', height: '38px', borderRadius: '12px' }}>
                    <Trash2 size={18} strokeWidth={2.5} />
                </button>
            )}
        </div>
    </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────

export default function Inventory({ participants = [], canEdit = true, canSearchAI = true, actorHeaders = { 'Content-Type': 'application/json' }, inventoryItems = [], setInventoryItems, onRefresh, isMobile }) {
    const ui = useUi();
    const allItems = inventoryItems;
    const [selectedChildId, setSelectedChildId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    
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
            if (windowWidth < 1400) setIsSidebarCollapsed(true);
            else setIsSidebarCollapsed(false);
            
            if (windowWidth < 1200) setIsActionPanelCollapsed(true);
            else setIsActionPanelCollapsed(false);
        }
    }, [windowWidth, isMobile]);

    // Form States
    const [newItem, setNewItem] = useState({ label: '', category: 'vêtement', arrival_qty: 1, departure_qty: 0, photo: '' });
    const [batchEntries, setBatchEntries] = useState([]);
    const [isProcessingBatch, setIsProcessingBatch] = useState(false);
    
    // AI States
    const [isSearchingAi, setIsSearchingAi] = useState(false);
    const [aiResults, setAiResults] = useState([]);
    const [isSearchCameraOpen, setIsSearchCameraOpen] = useState(false);
    const [cameraItemId, setCameraItemId] = useState(null);

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
        return list
            .filter(item => activeCategory === 'all' || item.category === activeCategory)
            .filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [itemsByChild, selectedChildId, activeCategory, searchQuery]);

    useEffect(() => {
        const isSelectedValid = children.some(c => c.id === selectedChildId);
        if ((!selectedChildId || !isSelectedValid) && children[0]?.id) {
            setSelectedChildId(children[0].id);
        }
    }, [children, selectedChildId]);

    const saveItem = async (payload, options = {}) => {
        if (!canEdit) return;
        const participantId = options.participantId || selectedChildId;
        const id = payload.id || `item_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`;
        
        const newItem = { ...payload, id, participant_id: participantId };
        const updatedItems = allItems.some(i => i.id === id)
            ? allItems.map(i => i.id === id ? newItem : i)
            : [...allItems, newItem];
            
        setInventoryItems(updatedItems);
        return id;
    };

    const deleteItem = async (id) => {
        if (!canEdit) return;
        const ok = await ui.confirm({ title: 'Supprimer', message: 'Supprimer cet objet ?', confirmText: 'Supprimer', danger: true });
        if (!ok) return;
        setInventoryItems(allItems.filter(i => i.id !== id));
        ui.toast('Objet supprimé.', { type: 'success' });
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

            const res = await fetch(`/api/inventory/items/${itemId}/photos`, {
                method: 'POST',
                headers: actorHeaders,
                body: JSON.stringify({ participantId: selectedChildId, imageBase64: compressed })
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
            for (const entry of batchEntries) {
                const itemId = await saveItem({
                    label: entry.label,
                    category: entry.category,
                    arrival_qty: entry.arrival_qty,
                    departure_qty: 0,
                    status: 'ok'
                }, { refresh: false });
                if (itemId) {
                    await fetch(`/api/inventory/items/${itemId}/photos`, {
                        method: 'POST',
                        headers: actorHeaders,
                        body: JSON.stringify({ participantId: selectedChildId, imageBase64: entry.imageBase64 })
                    });
                }
            }
            ui.toast('Lot importé.', { type: 'success' });
            setBatchEntries([]);
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
                    padding: '1.25rem', display: 'flex', 
                    flexDirection: isMobile ? 'row' : 'column', gap: '0.75rem'
                }} className="no-scrollbar">
                    {children.map(child => (
                        <div key={child.id} style={{ flexShrink: 0, width: isMobile ? '180px' : 'auto' }}>
                            <ChildCard child={child} isCollapsed={isSidebarCollapsed} isActive={selectedChildId === child.id} itemCount={itemsByChild[child.id]?.length || 0} onClick={() => setSelectedChildId(child.id)} />
                        </div>
                    ))}
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '2rem' }}>
                        <div style={{ position: 'relative', flex: 1, maxWidth: '520px' }}>
                            <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.6 }} />
                            <input className="glass-input" placeholder="Rechercher dans le matériel..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ paddingLeft: '48px', borderRadius: '100px', height: '48px', background: 'rgba(255,255,255,0.8)', fontWeight: '750' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button className="btn btn-secondary" style={{ padding: '0.75rem 1rem', borderRadius: '14px' }} onClick={() => onRefresh && onRefresh()}><RefreshCcw size={18} strokeWidth={2.5} /></button>
                            {isMobile && <button onClick={() => setIsControlHubOpen(true)} className="btn btn-primary" style={{ padding: '0.75rem 1.25rem', borderRadius: '14px', fontWeight: '950' }}><Plus size={18} strokeWidth={3} /> Scanner</button>}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '2px' }} className="no-scrollbar">
                        <CategoryChip category="all" count={(itemsByChild[selectedChildId] || []).length} isActive={activeCategory === 'all'} onClick={() => setActiveCategory('all')} />
                        {CATEGORIES.map(cat => <CategoryChip key={cat} category={cat} count={(itemsByChild[selectedChildId] || []).filter(i => i.category === cat).length} isActive={activeCategory === cat} onClick={() => setActiveCategory(cat)} />)}
                    </div>
                </header>

                    <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '1rem' : '2.5rem' }} className="no-scrollbar">
                    {isLoading ? (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner-small" /></div>
                    ) : activeItems.length === 0 ? (
                        <div style={{ 
                            height: '70%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
                            color: 'var(--text-muted)', border: '2px dashed var(--glass-border)', borderRadius: '40px', 
                            background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)',
                            margin: '1rem', position: 'relative', overflow: 'hidden'
                        }}>
                             <div style={{ position: 'absolute', width: '200px', height: '200px', background: 'var(--primary-gradient)', filter: 'blur(100px)', opacity: 0.1, zIndex: -1 }} />
                            <div style={{ 
                                width: '100px', height: '100px', background: 'white', borderRadius: '32px', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                boxShadow: 'var(--shadow-md)', marginBottom: '1.5rem',
                                border: '1.5px solid var(--glass-border)'
                            }}>
                                <Box size={40} strokeWidth={2.5} style={{ color: 'var(--primary-color)', opacity: 0.8 }} />
                            </div>
                            <p style={{ fontWeight: '950', fontSize: '1.25rem', color: 'var(--text-main)', opacity: 0.8, letterSpacing: '-0.02em' }}>Aucun objet inventorié</p>
                            <p style={{ fontSize: '0.85rem', fontWeight: '800', opacity: 0.5, marginTop: '0.5rem', maxWidth: '300px', textAlign: 'center' }}>
                                Sélectionnez un enfant et utilisez le panneau de droite pour ajouter des objets.
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {activeItems.map((item, idx) => <ItemRow key={item.id} index={idx} item={item} onDelete={deleteItem} canEdit={canEdit} onTakePhoto={setCameraItemId} onUpload={handleUploadAction} isMobile={isMobile} />)}
                        </div>
                    )}
                </div>
                </div>
            </main>

            {/* Right Action Panel */}
            {!isMobile ? (
                <aside style={{ 
                    width: isActionPanelCollapsed ? '80px' : 'clamp(320px, 25vw, 400px)', 
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
                            setIsSearchCameraOpen={setIsSearchCameraOpen} setCameraItemId={setCameraItemId}
                            selectedChildId={selectedChildId} onRefresh={onRefresh} actorHeaders={actorHeaders}
                        />
                    )}
                </aside>
            ) : (
                <>
                    {isControlHubOpen && <div className="modal-overlay animate-fade-in" style={{ zIndex: 100 }} onClick={() => setIsControlHubOpen(false)} />}
                    <div style={{ 
                        position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTopLeftRadius: '32px', borderTopRightRadius: '32px', 
                        zIndex: 101, transform: isControlHubOpen ? 'translateY(0)' : 'translateY(100%)', transition: 'transform 0.4s var(--ease-out-expo)', 
                        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 -20px 60px oklch(0% 0 0 / 0.15)' 
                    }} className="no-scrollbar">
                        <div style={{ width: '40px', height: '5px', background: 'var(--bg-secondary)', borderRadius: '10px', margin: '1rem auto', opacity: 0.5 }} />
                        <div style={{ padding: '0 2rem 2rem 2rem' }}>
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '950', fontFamily: 'Sora, sans-serif' }}>Scan & Ajout</h3>
                                <button className="btn-icon-ref" onClick={() => setIsControlHubOpen(false)}><X size={24} /></button>
                            </div>
                            <ControlHub 
                                newItem={newItem} setNewItem={setNewItem} saveItem={saveItem} batchEntries={batchEntries} setBatchEntries={setBatchEntries} 
                                handleBatchFiles={handleBatchFiles} processBatchImport={processBatchImport} isProcessingBatch={isProcessingBatch}
                                canSearchAI={canSearchAI} aiResults={aiResults} isSearchingAi={isSearchingAi} runAiSearch={runAiSearch} CATEGORIES={CATEGORIES}
                                setIsSearchCameraOpen={setIsSearchCameraOpen} setCameraItemId={setCameraItemId}
                                selectedChildId={selectedChildId} onRefresh={onRefresh} actorHeaders={actorHeaders}
                            />
                        </div>
                    </div>
                </>
            )}

            <WebcamPhotoCapture isOpen={!!cameraItemId} onPhotoCaptured={(photo) => { handleUploadAction(cameraItemId, photo); setCameraItemId(null); }} onClose={() => setCameraItemId(null)} />
            <WebcamPhotoCapture isOpen={isSearchCameraOpen} onPhotoCaptured={(photo) => { runAiSearch(photo); setIsSearchCameraOpen(false); }} onClose={() => setIsSearchCameraOpen(false)} />
        </div>
    );
}

const ControlHub = ({ 
    newItem, setNewItem, saveItem, batchEntries, setBatchEntries, handleBatchFiles, 
    processBatchImport, isProcessingBatch, canSearchAI, aiResults, isSearchingAi, 
    runAiSearch, CATEGORIES, setIsSearchCameraOpen, setCameraItemId,
    selectedChildId, onRefresh, actorHeaders
}) => {
    const ui = useUi();
    const nameInputRef = useRef(null);

    useEffect(() => {
        if (newItem.photo && !newItem.label && !isSearchingAi) { nameInputRef.current?.focus(); }
    }, [newItem.photo, isSearchingAi, newItem.label]);

    return (
        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <div style={{ background: 'var(--primary-light)', padding: '6px', borderRadius: '8px', color: 'var(--primary-color)' }}><Plus size={16} strokeWidth={3} /></div>
                    <h4 style={{ margin: 0, fontSize: '11px', fontWeight: '950', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>Saisie Directe</h4>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {!newItem.photo ? (
                        <button 
                            className="btn btn-secondary" 
                            style={{ 
                                width: '100%', height: '120px', border: '2px dashed var(--glass-border)', background: 'rgba(255,255,255,0.5)', 
                                borderRadius: '24px', gap: '0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                            }}
                            onClick={() => setCameraItemId('quick-add')}
                        >
                            <Camera size={32} strokeWidth={1.5} style={{ opacity: 0.5 }} />
                            <span style={{ fontWeight: '900', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Scanner un objet</span>
                        </button>
                    ) : (
                        <div style={{ position: 'relative', width: '100%', height: '200px', borderRadius: '24px', overflow: 'hidden', border: '2px solid white', boxShadow: 'var(--shadow-lg)' }}>
                            <img src={newItem.photo} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.4), transparent)', padding: '1.25rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ background: 'white', padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: '950', color: 'var(--primary-color)' }}>
                                        {isSearchingAi ? 'Analyse IA...' : 'Objet détecté'}
                                    </div>
                                    <button onClick={() => setNewItem(prev => ({ ...prev, photo: '', label: '' }))} style={{ background: 'white', color: 'var(--danger-color)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                            const savedId = await saveItem(newItem, { refresh: false }); 
                            if (savedId && newItem.photo) {
                                await fetch(`/api/inventory/items/${savedId}/photos`, {
                                    method: 'POST', headers: actorHeaders, body: JSON.stringify({ participantId: selectedChildId, imageBase64: newItem.photo })
                                });
                            }
                            if (onRefresh) await onRefresh(); 
                            setNewItem({ label: '', category: 'vêtement', arrival_qty: 1, departure_qty: 0, photo: '' }); 
                            ui.toast('Objet enregistré.', { type: 'success' }); 
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
                            <button onClick={() => setIsSearchCameraOpen(true)} className="btn btn-secondary" style={{ padding: '0.75rem', borderRadius: '12px' }}><Camera size={16} strokeWidth={2.5} /></button>
                            <label className="btn btn-secondary" style={{ padding: '0.75rem', borderRadius: '12px', cursor: 'pointer' }}><Upload size={16} strokeWidth={2.5} /><input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = (ev) => runAiSearch(ev.target.result); r.readAsDataURL(f); } }} /></label>
                        </div>
                        {isSearchingAi && <div style={{ textAlign: 'center' }}><div className="spinner-small" style={{ width: '18px', height: '18px', margin: '0 auto' }} /></div>}
                        {aiResults.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {aiResults.map((res, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: 'white', borderRadius: '16px', border: '1.5px solid var(--glass-border)' }}>
                                        <img src={res.imageBase64} alt="Match" style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover' }} />
                                        <div style={{ minWidth: 0, flex: 1 }}>
                                            <div style={{ fontWeight: '950', fontSize: '0.85rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{res.label}</div>
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
