import React, { useEffect, useMemo, useState } from 'react';
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, FolderOpen } from 'lucide-react';
import { resolveNavGroups } from '../../config/nav';

// Recompose un objet navOrder complet à partir de la structure courante,
// pour que l'ordre soit toujours stocké en entier (stable, pas d'ambiguïté).
const buildNavOrder = (groups) => ({
    groups: groups.map((g) => g.id),
    items: Object.fromEntries(groups.map((g) => [g.id, g.items])),
});

// ── Ligne section déplaçable ──
const SortableRow = ({ id, label, canEdit }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled: !canEdit });
    const style = {
        transform: CSS.Transform.toString(transform), transition,
        display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 0.75rem',
        background: 'var(--surface-color)', border: '1px solid var(--glass-border)', borderRadius: '12px',
        fontWeight: '800', fontSize: '0.9rem', color: 'var(--text-main)',
        boxShadow: isDragging ? '0 8px 22px oklch(20% 0 0 / 0.16)' : 'none',
        opacity: isDragging ? 0.9 : 1, zIndex: isDragging ? 2 : 1,
    };
    return (
        <div ref={setNodeRef} style={style}>
            {canEdit && (
                <span {...attributes} {...listeners} style={{ display: 'inline-flex', color: 'var(--text-softer)', cursor: 'grab', touchAction: 'none' }} aria-label="Déplacer">
                    <GripVertical size={16} strokeWidth={2} />
                </span>
            )}
            <span>{label}</span>
        </div>
    );
};

// ── Carte groupe déplaçable (avec liste interne déplaçable) ──
const SortableGroup = ({ group, sectionLabels, canEdit, onItemsReorder }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: group.id, disabled: !canEdit });
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );
    const style = {
        transform: CSS.Transform.toString(transform), transition,
        background: 'var(--bg-secondary)', border: '1.5px solid var(--glass-border)', borderRadius: '18px',
        padding: '1rem', boxShadow: isDragging ? '0 16px 36px oklch(20% 0 0 / 0.18)' : 'none',
        opacity: isDragging ? 0.95 : 1, zIndex: isDragging ? 3 : 1,
    };
    const handleItemDragEnd = ({ active, over }) => {
        if (!over || active.id === over.id) return;
        const oldIdx = group.items.indexOf(active.id);
        const newIdx = group.items.indexOf(over.id);
        if (oldIdx < 0 || newIdx < 0) return;
        onItemsReorder(group.id, arrayMove(group.items, oldIdx, newIdx));
    };
    return (
        <div ref={setNodeRef} style={style}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                {canEdit && (
                    <span {...attributes} {...listeners} style={{ display: 'inline-flex', color: 'var(--text-muted)', cursor: 'grab', touchAction: 'none' }} aria-label="Déplacer le groupe">
                        <GripVertical size={18} strokeWidth={2.5} />
                    </span>
                )}
                <FolderOpen size={16} strokeWidth={2} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontSize: '0.72rem', fontWeight: '950', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{group.label}</span>
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleItemDragEnd}>
                <SortableContext items={group.items} strategy={verticalListSortingStrategy}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {group.items.map((id) => (
                            <SortableRow key={id} id={id} label={sectionLabels[id] || id} canEdit={canEdit} />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
};

// ── Éditeur : ordre des groupes + ordre des sections dans chaque groupe ──
const NavOrderEditor = ({ navOrder, sectionLabels, canEdit, onChange }) => {
    const serialized = JSON.stringify(navOrder || {});
    // État de travail local, resynchronisé si navOrder change côté serveur (autre admin).
    const [groups, setGroups] = useState(() => resolveNavGroups(navOrder, null));
    useEffect(() => { setGroups(resolveNavGroups(navOrder, null)); }, [serialized]); // eslint-disable-line react-hooks/exhaustive-deps

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const commit = (next) => { setGroups(next); onChange(buildNavOrder(next)); };

    const handleGroupDragEnd = ({ active, over }) => {
        if (!over || active.id === over.id) return;
        const oldIdx = groups.findIndex((g) => g.id === active.id);
        const newIdx = groups.findIndex((g) => g.id === over.id);
        if (oldIdx < 0 || newIdx < 0) return;
        commit(arrayMove(groups, oldIdx, newIdx));
    };

    const handleItemsReorder = (groupId, newItems) => {
        commit(groups.map((g) => (g.id === groupId ? { ...g, items: newItems } : g)));
    };

    const groupIds = useMemo(() => groups.map((g) => g.id), [groups]);

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleGroupDragEnd}>
            <SortableContext items={groupIds} strategy={verticalListSortingStrategy}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {groups.map((group) => (
                        <SortableGroup key={group.id} group={group} sectionLabels={sectionLabels} canEdit={canEdit} onItemsReorder={handleItemsReorder} />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
};

export default NavOrderEditor;
