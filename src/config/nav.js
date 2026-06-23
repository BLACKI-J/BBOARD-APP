// Configuration de la navigation latérale (sidebar) — source unique partagée
// entre App.jsx (rendu) et l'éditeur d'ordre dans Paramètres.

// Regroupement des sections en catégories. L'ordre ici est l'ordre PAR DÉFAUT ;
// il peut être surchargé par `accessControl.navOrder` (réglage admin global).
export const NAV_GROUPS = [
    { id: 'pilotage',   label: 'Pilotage',   items: ['home', 'schedule', 'recap'] },
    { id: 'terrain',    label: 'Terrain',    items: ['attendance', 'exitsheet', 'incident', 'health'] },
    { id: 'ressources', label: 'Ressources', items: ['directory', 'inventory'] },
];

// Tonalité des badges : 'alert' = compteur problème (rouge doux), 'info' = simple décompte (ambre).
export const BADGE_TONE = { health: 'alert', attendance: 'info' };

// Applique un ordre personnalisé (navOrder) par-dessus la structure NAV_GROUPS.
// Robuste : ignore les ids inconnus, ajoute en fin les sections/groupes nouveaux
// non encore présents dans l'ordre sauvegardé, et filtre par `accessibleIds`
// (Set des sections autorisées) si fourni — sinon montre tout (pour l'éditeur).
// Renvoie [{ id, label, items: [sectionId, …] }] (groupes vides retirés).
export function resolveNavGroups(navOrder = {}, accessibleIds = null) {
    const order = navOrder && typeof navOrder === 'object' ? navOrder : {};
    const isOk = (id) => !accessibleIds || accessibleIds.has(id);
    const baseGroupIds = NAV_GROUPS.map((g) => g.id);
    const savedGroups = Array.isArray(order.groups) ? order.groups : [];
    const groupOrder = [
        ...savedGroups.filter((id) => baseGroupIds.includes(id)),
        ...baseGroupIds.filter((id) => !savedGroups.includes(id)),
    ];
    return groupOrder
        .map((gid) => {
            const def = NAV_GROUPS.find((g) => g.id === gid);
            if (!def) return null;
            const savedItems = order.items && Array.isArray(order.items[gid]) ? order.items[gid] : [];
            const itemOrder = [
                ...savedItems.filter((id) => def.items.includes(id)),
                ...def.items.filter((id) => !savedItems.includes(id)),
            ];
            return { id: def.id, label: def.label, items: itemOrder.filter(isOk) };
        })
        .filter((g) => g && g.items.length > 0);
}
