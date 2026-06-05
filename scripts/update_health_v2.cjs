const fs = require('fs');
const file = '/home/jathur/projects/colo-app/src/components/HealthCenter.jsx';
let content = fs.readFileSync(file, 'utf8');

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

    const childrenWithMeds = children.filter(c => {
        const hasMedName = c.dailyMeds && c.dailyMeds.trim() !== '';
        const hasSlots = Array.isArray(c.medSlots) && c.medSlots.length > 0;
        const hasSiBesoin = c.sibesoin && c.sibesoin.trim() !== '';
        return hasMedName || hasSlots || hasSiBesoin;
    });

    // Kids who have meds for the current slot OR have "si besoin"
    const displayChildren = childrenWithMeds.filter(c => {
        const slots = (Array.isArray(c.medSlots) && c.medSlots.length > 0) ? c.medSlots : ALL_SLOTS;
        const isSlotMatch = slots.includes(activeSlot) && (c.dailyMeds && c.dailyMeds.trim() !== '');
        const hasSiBesoin = c.sibesoin && c.sibesoin.trim() !== '';
        return isSlotMatch || hasSiBesoin;
    });

    const getValidated = (child) => child.medsValidated?.[today] || {};

    const toggleSlot = (child, slot) => {
        if (!canEdit) return;
        const current = getValidated(child);
        const updated = { ...child.medsValidated, [today]: { ...current, [slot]: !current[slot] } };
        updateParticipantHealth(child.id, 'medsValidated', updated);
    };

    const activeConfig = SLOT_CONFIG[activeSlot] || SLOT_CONFIG['Matin'];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2rem' }}>
            
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
            <div style={{ padding: '0 0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: '950', color: activeConfig.color, margin: 0, letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {activeConfig.icon} Traitements du {activeSlot}
                    </h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700', margin: '4px 0 0' }}>
                        {displayChildren.length} vacancier{displayChildren.length !== 1 ? 's' : ''} concerné{displayChildren.length !== 1 ? 's' : ''}
                    </p>
                </div>
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
                        const isDone = !!validated[activeSlot];
                        const slots = (Array.isArray(child.medSlots) && child.medSlots.length > 0) ? child.medSlots : ALL_SLOTS;
                        const hasMedThisSlot = slots.includes(activeSlot) && (child.dailyMeds && child.dailyMeds.trim() !== '');

                        return (
                            <div key={child.id} style={{
                                borderRadius: '24px', overflow: 'hidden', background: 'white',
                                border: \`2px solid \${isDone ? activeConfig.color : 'var(--glass-border)'}\`,
                                boxShadow: isDone ? \`0 8px 32px \${activeConfig.color}25\` : '0 2px 12px rgba(0,0,0,0.04)',
                                transition: 'all 0.3s',
                                position: 'relative',
                                display: 'flex', flexDirection: 'column'
                            }}>
                                {isDone && (
                                    <div style={{ position: 'absolute', top: '1rem', right: '1rem', color: activeConfig.color, background: activeConfig.colorLight, padding: '4px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: '950', display: 'flex', alignItems: 'center', gap: '4px', zIndex: 10 }}>
                                        <Check size={12} strokeWidth={4} /> VALIDÉ
                                    </div>
                                )}
                                <div style={{ padding: '1.25rem 1.5rem', borderBottom: (child.sibesoin && child.sibesoin.trim() !== '') ? '1px solid var(--glass-border)' : 'none', flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                        <Avatar participant={child} size={48} />
                                        <div>
                                            <div style={{ fontWeight: '950', fontSize: '1.05rem', color: 'var(--text-main)', letterSpacing: '-0.02em', paddingRight: '40px' }}>
                                                {child.firstName} {child.lastName.toUpperCase()}
                                            </div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '800' }}>
                                                {groups.find(g => g.id === child.group)?.name || ''}
                                            </div>
                                        </div>
                                    </div>

                                    {hasMedThisSlot && (
                                        <div style={{ background: 'var(--bg-main)', padding: '0.875rem 1rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ background: 'white', width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: activeConfig.color, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', flexShrink: 0 }}>
                                                <Pill size={16} strokeWidth={3} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '0.65rem', fontWeight: '950', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Traitement de fond</div>
                                                <div style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-main)', lineHeight: 1.3 }}>{child.dailyMeds}</div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {child.sibesoin && child.sibesoin.trim() !== '' && (
                                    <div style={{ padding: '1rem 1.5rem', background: 'oklch(62% 0.22 145 / 0.05)' }}>
                                        <div style={{ fontSize: '0.65rem', fontWeight: '950', color: 'oklch(52% 0.22 145)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <AlertCircle size={10} strokeWidth={3} /> En cas de besoin (PRN)
                                        </div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', lineHeight: 1.4 }}>
                                            {child.sibesoin}
                                        </div>
                                    </div>
                                )}

                                {hasMedThisSlot && (
                                    <div style={{ padding: '1.25rem 1.5rem', background: isDone ? activeConfig.colorLight : 'transparent', transition: 'background 0.3s' }}>
                                        <button
                                            onClick={() => toggleSlot(child, activeSlot)}
                                            disabled={!canEdit}
                                            style={{
                                                width: '100%', minHeight: '52px', borderRadius: '16px', border: 'none',
                                                background: isDone ? activeConfig.gradient : 'var(--primary-light)',
                                                color: isDone ? 'white' : 'var(--primary-color)',
                                                fontWeight: '950', fontSize: '0.85rem', cursor: canEdit ? 'pointer' : 'default',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                                boxShadow: isDone ? \`0 4px 16px \${activeConfig.color}40\` : 'none',
                                                transition: 'all 0.2s',
                                                transform: isDone ? 'scale(1)' : 'scale(1)',
                                            }}
                                        >
                                            <Check size={18} strokeWidth={isDone ? 4 : 3} />
                                            {isDone ? 'Administré' : 'Marquer comme donné'}
                                        </button>
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
