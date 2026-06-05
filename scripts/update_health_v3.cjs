const fs = require('fs');
const file = '/home/jathur/projects/colo-app/src/components/HealthCenter.jsx';
let content = fs.readFileSync(file, 'utf8');

// Add import for Printer icon and MedsPdfExport
if (!content.includes('Printer')) {
    content = content.replace('import {', "import { Printer,\n");
}
if (!content.includes('MedsPdfExport')) {
    content = content.replace("import Avatar from './common/Avatar';", "import Avatar from './common/Avatar';\nimport MedsPdfExport from './MedsPdfExport';");
}

const medsDashboardStart = 'const MedsDashboard = ({ children, updateParticipantHealth, canEdit, isMobile, groups }) => {';
const medsDashboardEnd = 'const LogTypeButton = ({ active, onClick, icon, label, color }) => (';

const newMedsDashboard = `const MedsDashboard = ({ children, updateParticipantHealth, canEdit, isMobile, groups }) => {
    const [activeSlot, setActiveSlot] = useState(() => {
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 11) return 'Matin';
        if (hour >= 11 && hour < 15) return 'Midi';
        if (hour >= 15 && hour < 18) return 'Goûter';
        return 'Soir';
    });
    
    const today = new Date().toISOString().split('T')[0];

    const getMedsList = (medsStr) => {
        if (!medsStr) return [];
        return medsStr.split(/,|\\n/).map(s => s.trim()).filter(Boolean);
    };

    const childrenWithMeds = children.filter(c => {
        const hasMedName = c.dailyMeds && c.dailyMeds.trim() !== '';
        const hasSlots = Array.isArray(c.medSlots) && c.medSlots.length > 0;
        const hasSiBesoin = c.sibesoin && c.sibesoin.trim() !== '';
        return hasMedName || hasSlots || hasSiBesoin;
    });

    const displayChildren = childrenWithMeds.filter(c => {
        const slots = (Array.isArray(c.medSlots) && c.medSlots.length > 0) ? c.medSlots : ALL_SLOTS;
        const isSlotMatch = slots.includes(activeSlot) && (c.dailyMeds && c.dailyMeds.trim() !== '');
        const hasSiBesoin = c.sibesoin && c.sibesoin.trim() !== '';
        return isSlotMatch || hasSiBesoin;
    });

    const getValidated = (child) => child.medsValidated?.[today] || {};

    const toggleMed = (child, slot, medName) => {
        if (!canEdit) return;
        const currentDay = getValidated(child);
        const currentSlot = currentDay[slot];
        
        let newSlot;
        if (currentSlot === true) {
            const medsList = getMedsList(child.dailyMeds);
            newSlot = {};
            medsList.forEach(m => newSlot[m] = true);
            newSlot[medName] = false;
        } else if (typeof currentSlot === 'object') {
            newSlot = { ...currentSlot, [medName]: !currentSlot[medName] };
        } else {
            newSlot = { [medName]: true };
        }
        
        const updated = { ...child.medsValidated, [today]: { ...currentDay, [slot]: newSlot } };
        updateParticipantHealth(child.id, 'medsValidated', updated);
    };

    const validateAllMeds = (child, slot) => {
        if (!canEdit) return;
        const medsList = getMedsList(child.dailyMeds);
        const currentDay = getValidated(child);
        
        const newSlot = {};
        medsList.forEach(m => newSlot[m] = true);
        
        const updated = { ...child.medsValidated, [today]: { ...currentDay, [slot]: newSlot } };
        updateParticipantHealth(child.id, 'medsValidated', updated);
    };

    const toggleSiBesoin = (child, slot, medName) => {
        if (!canEdit) return;
        const currentDay = getValidated(child);
        const currentSlot = currentDay[slot] === true ? {} : (currentDay[slot] || {});
        
        const newSlot = { ...currentSlot, [medName]: !currentSlot[medName] };
        const updated = { ...child.medsValidated, [today]: { ...currentDay, [slot]: newSlot } };
        updateParticipantHealth(child.id, 'medsValidated', updated);
    };

    const activeConfig = SLOT_CONFIG[activeSlot] || SLOT_CONFIG['Matin'];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2rem' }}>
            <MedsPdfExport children={children} />
            
            {/* Slot Selector */}
            <div style={{
                position: 'sticky', top: 0, zIndex: 20,
                background: 'white',
                borderRadius: '24px', padding: '0.5rem',
                border: '1.5px solid var(--glass-border)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
                display: 'flex', gap: '0.5rem',
                flexWrap: isMobile ? 'wrap' : 'nowrap'
            }}>
                {ALL_SLOTS.map(slot => {
                    const cfg = SLOT_CONFIG[slot];
                    const isActive = activeSlot === slot;
                    return (
                        <button key={slot} onClick={() => setActiveSlot(slot)} style={{
                            flex: 1, padding: '0.75rem 1rem', borderRadius: '18px', border: 'none',
                            background: isActive ? cfg.gradient : 'transparent',
                            color: isActive ? 'white' : 'var(--text-muted)',
                            fontWeight: '950', fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.3s',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                            boxShadow: isActive ? \`0 4px 16px \${cfg.color}40\` : 'none'
                        }}>
                            <span style={{ fontSize: '1.2rem', filter: isActive ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' : 'grayscale(0.5) opacity(0.6)' }}>
                                {cfg.icon}
                            </span>
                            {slot}
                        </button>
                    );
                })}
            </div>

            {/* Header info */}
            <div style={{ padding: '0 0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: '950', color: activeConfig.color, margin: 0, letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {activeConfig.icon} Traitements du {activeSlot}
                    </h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700', margin: '4px 0 0' }}>
                        {displayChildren.length} vacancier{displayChildren.length !== 1 ? 's' : ''} concerné{displayChildren.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <button onClick={() => window.print()} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', borderRadius: '12px', fontWeight: '800', gap: '0.5rem', border: '1.5px solid var(--glass-border)', background: 'white' }}>
                    <Printer size={16} /> Imprimer les fiches PDF
                </button>
            </div>

            {/* Cards */}
            {displayChildren.length === 0 ? (
                <div style={{ padding: '4rem', textAlign: 'center', opacity: 0.5 }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{activeConfig.icon}</div>
                    <p style={{ fontWeight: '900', fontSize: '0.9rem' }}>Aucun traitement prévu pour ce créneau.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                    {displayChildren.map(child => {
                        const validated = getValidated(child);
                        const slotData = validated[activeSlot];
                        const isAllLegacyDone = slotData === true;
                        
                        const slots = (Array.isArray(child.medSlots) && child.medSlots.length > 0) ? child.medSlots : ALL_SLOTS;
                        const hasMedThisSlot = slots.includes(activeSlot) && (child.dailyMeds && child.dailyMeds.trim() !== '');
                        
                        const dailyMedsList = hasMedThisSlot ? getMedsList(child.dailyMeds) : [];
                        const siBesoinList = getMedsList(child.sibesoin);
                        
                        const isAllDailyDone = hasMedThisSlot && (isAllLegacyDone || (dailyMedsList.length > 0 && dailyMedsList.every(m => slotData && slotData[m])));
                        const hasPendingDaily = hasMedThisSlot && dailyMedsList.length > 0 && !isAllDailyDone;

                        return (
                            <div key={child.id} style={{
                                borderRadius: '24px', overflow: 'hidden', background: 'white',
                                border: \`2px solid \${isAllDailyDone ? activeConfig.color : 'var(--glass-border)'}\`,
                                boxShadow: isAllDailyDone ? \`0 8px 32px \${activeConfig.color}25\` : '0 2px 12px rgba(0,0,0,0.04)',
                                transition: 'all 0.3s',
                                position: 'relative',
                                display: 'flex', flexDirection: 'column'
                            }}>
                                {isAllDailyDone && (
                                    <div style={{ position: 'absolute', top: '1rem', right: '1rem', color: activeConfig.color, background: activeConfig.colorLight, padding: '4px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: '950', display: 'flex', alignItems: 'center', gap: '4px', zIndex: 10 }}>
                                        <Check size={12} strokeWidth={4} /> COMPLET
                                    </div>
                                )}
                                <div style={{ padding: '1.25rem 1.5rem', borderBottom: (dailyMedsList.length > 0 || siBesoinList.length > 0) ? '1px solid var(--glass-border)' : 'none', flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <Avatar participant={child} size={48} />
                                        <div>
                                            <div style={{ fontWeight: '950', fontSize: '1.05rem', color: 'var(--text-main)', letterSpacing: '-0.02em', paddingRight: '60px' }}>
                                                {child.firstName} {child.lastName.toUpperCase()}
                                            </div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '800' }}>
                                                {groups.find(g => g.id === child.group)?.name || ''}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Daily Meds Individual Checkboxes */}
                                {hasMedThisSlot && dailyMedsList.length > 0 && (
                                    <div style={{ padding: '0.5rem 1.5rem' }}>
                                        <div style={{ fontSize: '0.65rem', fontWeight: '950', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0.5rem 0' }}>
                                            Traitement Quotidien
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {dailyMedsList.map((med, idx) => {
                                                const isMedDone = isAllLegacyDone || (slotData && slotData[med]);
                                                return (
                                                    <div key={idx} 
                                                        onClick={() => toggleMed(child, activeSlot, med)}
                                                        style={{ 
                                                            display: 'flex', alignItems: 'center', gap: '0.75rem', 
                                                            padding: '0.6rem 0.8rem', background: isMedDone ? activeConfig.colorLight : 'var(--bg-main)', 
                                                            borderRadius: '12px', cursor: canEdit ? 'pointer' : 'default',
                                                            border: \`1.5px solid \${isMedDone ? activeConfig.color : 'transparent'}\`
                                                        }}
                                                    >
                                                        <div style={{ 
                                                            width: '20px', height: '20px', borderRadius: '6px', 
                                                            border: \`2px solid \${isMedDone ? activeConfig.color : 'var(--glass-border)'}\`,
                                                            background: isMedDone ? activeConfig.color : 'white',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                                                        }}>
                                                            {isMedDone && <Check size={14} strokeWidth={4} />}
                                                        </div>
                                                        <span style={{ fontSize: '0.85rem', fontWeight: '800', color: isMedDone ? activeConfig.color : 'var(--text-main)' }}>
                                                            {med}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {hasPendingDaily && canEdit && dailyMedsList.length > 1 && (
                                            <button 
                                                onClick={() => validateAllMeds(child, activeSlot)}
                                                style={{
                                                    marginTop: '0.75rem', width: '100%', padding: '0.5rem', borderRadius: '10px',
                                                    background: 'transparent', border: '1.5px solid var(--glass-border)',
                                                    color: 'var(--text-main)', fontWeight: '800', fontSize: '0.8rem', cursor: 'pointer'
                                                }}
                                            >
                                                Tout valider d'un coup
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* PRN Meds */}
                                {siBesoinList.length > 0 && (
                                    <div style={{ padding: '0.5rem 1.5rem 1.5rem 1.5rem', background: 'oklch(62% 0.22 145 / 0.03)' }}>
                                        <div style={{ fontSize: '0.65rem', fontWeight: '950', color: 'oklch(52% 0.22 145)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <AlertCircle size={10} strokeWidth={3} /> En cas de besoin (PRN)
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {siBesoinList.map((med, idx) => {
                                                const prnKey = \`prn_\${med}\`;
                                                const isMedDone = slotData && slotData[prnKey];
                                                return (
                                                    <div key={idx} 
                                                        onClick={() => toggleSiBesoin(child, activeSlot, prnKey)}
                                                        style={{ 
                                                            display: 'flex', alignItems: 'center', gap: '0.75rem', 
                                                            padding: '0.6rem 0.8rem', background: isMedDone ? 'oklch(62% 0.22 145 / 0.15)' : 'white', 
                                                            borderRadius: '12px', cursor: canEdit ? 'pointer' : 'default',
                                                            border: \`1.5px solid \${isMedDone ? 'oklch(52% 0.22 145)' : 'var(--glass-border)'}\`
                                                        }}
                                                    >
                                                        <div style={{ 
                                                            width: '20px', height: '20px', borderRadius: '6px', 
                                                            border: \`2px solid \${isMedDone ? 'oklch(52% 0.22 145)' : 'var(--glass-border)'}\`,
                                                            background: isMedDone ? 'oklch(52% 0.22 145)' : 'white',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                                                        }}>
                                                            {isMedDone && <Check size={14} strokeWidth={4} />}
                                                        </div>
                                                        <span style={{ fontSize: '0.85rem', fontWeight: '800', color: isMedDone ? 'oklch(42% 0.22 145)' : 'var(--text-main)' }}>
                                                            {med}
                                                        </span>
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
            )}
        </div>
    );
};
`;

const startIndex = content.indexOf(medsDashboardStart);
const endIndex = content.indexOf(medsDashboardEnd);
if (startIndex !== -1 && endIndex !== -1) {
    content = content.substring(0, startIndex) + newMedsDashboard + '\n\n' + content.substring(endIndex);
    fs.writeFileSync(file, content);
    console.log('Update successful');
} else {
    console.log('Error finding markers');
}
