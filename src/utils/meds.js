export const ALL_SLOTS = ['Matin', 'Midi', 'Goûter', 'Soir', 'Coucher'];

export const getMedicationsList = (child) => {
    // New format: child.medications is an array of { name: '...', slots: ['...', '...'] }
    if (Array.isArray(child.medications) && child.medications.length > 0) {
        // Guard: every consumer calls m.slots.includes(...), so ensure slots is always an array
        // Filter out 'Si besoin' from the regular slots so it doesn't break daily dashboards
        return child.medications.map(m => ({ 
            ...m, 
            slots: Array.isArray(m.slots) ? m.slots.filter(s => s !== 'Si besoin') : [] 
        }));
    }

    // Legacy fallback: parse dailyMeds string and apply medSlots to all of them
    if (child.dailyMeds && child.dailyMeds.trim() !== '') {
        const names = child.dailyMeds.split(/,|\n/).map(s => s.trim()).filter(Boolean);
        const slots = (Array.isArray(child.medSlots) && child.medSlots.length > 0) ? child.medSlots : ALL_SLOTS;
        return names.map(name => ({ name, slots }));
    }

    return [];
};

export const getSiBesoinList = (child) => {
    let prns = [];
    if (child.sibesoin) {
        prns = child.sibesoin.split(/,|\n/).map(s => s.trim()).filter(Boolean);
    }
    
    // Also include unified medications that have 'Si besoin' checked
    if (Array.isArray(child.medications)) {
        child.medications.forEach(m => {
            if (Array.isArray(m.slots) && m.slots.includes('Si besoin')) {
                prns.push(m.name);
            }
        });
    }
    
    return prns;
};

