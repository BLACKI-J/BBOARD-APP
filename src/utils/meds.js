export const ALL_SLOTS = ['Matin', 'Midi', 'Goûter', 'Soir'];

export const getMedicationsList = (child) => {
    // New format: child.medications is an array of { name: '...', slots: ['...', '...'] }
    if (Array.isArray(child.medications) && child.medications.length > 0) {
        return child.medications;
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
    if (!child.sibesoin) return [];
    return child.sibesoin.split(/,|\n/).map(s => s.trim()).filter(Boolean);
};
