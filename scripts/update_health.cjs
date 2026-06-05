const fs = require('fs');
const file = '/home/jathur/projects/colo-app/src/components/HealthCenter.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. In HealthCenter main component, add `groups` to MedsDashboard if needed
content = content.replace(
    '<MedsDashboard children={children} updateParticipantHealth={updateParticipantHealth} canEdit={canEdit} isMobile={isMobile} />',
    '<MedsDashboard children={children} updateParticipantHealth={updateParticipantHealth} canEdit={canEdit} isMobile={isMobile} groups={groups} />'
);

// 2. Replace MedsDashboard
const medsDashboardStart = 'const MedsDashboard = ({ children, updateParticipantHealth, canEdit, isMobile }) => {';
const medsDashboardEnd = '};\n\n\n\nconst LogTypeButton =';

const newMedsDashboard = `const MedsDashboard = ({ children, updateParticipantHealth, canEdit, isMobile, groups }) => {
    const [viewMode, setViewMode] = useState('grid');
    const today = new Date().toISOString().split('T')[0];

    const childrenWithMeds = children.filter(c => {
        const hasMedName = c.dailyMeds && c.dailyMeds.trim() !== '';
        const hasSlots = Array.isArray(c.medSlots) && c.medSlots.length > 0;
        const hasSiBesoin = c.sibesoin && c.sibesoin.trim() !== '';
        return hasMedName || hasSlots || hasSiBesoin;
    });

    const getSlots = (child) => {
        if (Array.isArray(child.medSlots) && child.medSlots.length > 0) return child.medSlots;
        return ALL_SLOTS;
    };

    const getValidated = (child) => child.medsValidated?.[today] || {};

    const toggleSlot = (child, slot) => {
        if (!canEdit) return;
        const current = getValidated(child);
        const updated = { ...child.medsValidated, [today]: { ...current, [slot]: !current[slot] } };
        updateParticipantHealth(child.id, 'medsValidated', updated);
    };

    const validateAll = (child) => {
        if (!canEdit) return;
        const slots = getSlots(child);
        const updated = { ...child.medsValidated, [today]: slots.reduce((acc, s) => ({ ...acc, [s]: true }), {}) };
        updateParticipantHealth(child.id, 'medsValidated', updated);
    };

    const totalDoses = childrenWithMeds.reduce((sum, c) => sum + getSlots(c).length, 0);
    const doneDoses  = childrenWithMeds.reduce((sum, c) => {
        const v = getValidated(c);
        return sum + getSlots(c).filter(s => v[s]).length;
    }, 0);
    const pct = totalDoses > 0 ? Math.round((doneDoses / totalDoses) * 100) : 0;
    const allComplete = childrenWithMeds.length > 0 && childrenWithMeds.every(c => {
        const v = getValidated(c); return getSlots(c).every(s => v[s]);
    });

    const initials = (child) => \`\${child.firstName?.[0] || ''}\${child.lastName?.[0] || ''}\`.toUpperCase();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2rem' }}>
            <div style={{
                position: 'sticky', top: 0, zIndex: 20,
                background: allComplete
                    ? 'linear-gradient(135deg, oklch(55% 0.2 145), oklch(65% 0.18 160))'
                    : 'linear-gradient(135deg, var(--primary-color), oklch(62% 0.2 220))',
                borderRadius: '20px', padding: '1.25rem 1.5rem',
                boxShadow: '0 8px 32px oklch(0% 0 0 / 0.15)',
                transition: 'background 0.6s ease',
                display: 'flex', flexDirection: 'column', gap: '1rem'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <div style={{ fontWeight: '950', fontSize: '1.1rem', color: 'white', letterSpacing: '-0.03em' }}>
                            {allComplete ? '✅ Tout est validé !' : 'Traitements du jour'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.75)', fontWeight: '700', marginTop: '2px' }}>
                            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '12px' }}>
                            <button onClick={() => setViewMode('grid')} style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', border: 'none', background: viewMode === 'grid' ? 'white' : 'transparent', color: viewMode === 'grid' ? 'var(--primary-color)' : 'rgba(255,255,255,0.7)', fontWeight: '900', fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s' }}>Grille</button>
                            <button onClick={() => setViewMode('cards')} style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', border: 'none', background: viewMode === 'cards' ? 'white' : 'transparent', color: viewMode === 'cards' ? 'var(--primary-color)' : 'rgba(255,255,255,0.7)', fontWeight: '900', fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s' }}>Cartes</button>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '2rem', fontWeight: '950', color: 'white', lineHeight: 1, letterSpacing: '-0.04em' }}>{pct}<span style={{ fontSize: '1rem' }}>%</span></div>
                        </div>
                    </div>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.25)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: \`\${pct}%\`, background: 'rgba(255,255,255,0.9)', transition: 'width 0.7s' }} />
                </div>
            </div>

            {viewMode === 'grid' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="card-glass" style={{ overflowX: 'auto', borderRadius: '24px', border: '1.5px solid var(--glass-border)', background: 'white' }}>
                        {childrenWithMeds.length === 0 ? (
                            <div style={{ padding: '3rem', textAlign: 'center', opacity: 0.5 }}><p style={{fontWeight:'900'}}>Aucun traitement de fond enregistré.</p></div>
                        ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                            <thead>
                                <tr style={{ background: 'var(--bg-main)', borderBottom: '1.5px solid var(--glass-border)' }}>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Vacancier / Traitement de fond</th>
                                    {ALL_SLOTS.map(slot => (
                                        <th key={slot} style={{ padding: '1rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{slot}</th>
                                    ))}
                                    <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {childrenWithMeds.filter(c => c.dailyMeds || (Array.isArray(c.medSlots) && c.medSlots.length > 0)).map(child => {
                                    const slots = getSlots(child);
                                    const validated = getValidated(child);
                                    const childDone = slots.every(s => validated[s]);
                                    return (
                                        <tr key={child.id} style={{ borderBottom: '1px solid var(--glass-border)' }} className="hover-row">
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <Avatar participant={child} size={36} />
                                                    <div>
                                                        <div style={{ fontWeight: '950', fontSize: '0.95rem' }}>{child.firstName} {child.lastName.toUpperCase()}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', fontWeight: '700' }}>{child.dailyMeds || 'Aucun traitement'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            {ALL_SLOTS.map(slot => {
                                                const isActiveSlot = slots.includes(slot);
                                                const isDone = !!validated[slot];
                                                return (
                                                    <td key={slot} style={{ padding: '0.5rem', textAlign: 'center', verticalAlign: 'middle' }}>
                                                        {isActiveSlot ? (
                                                            <button
                                                                onClick={() => toggleSlot(child, slot)}
                                                                disabled={!canEdit}
                                                                style={{
                                                                    width: '44px', height: '44px', borderRadius: '12px', border: '1.5px solid', margin: '0 auto',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: canEdit ? 'pointer' : 'default', transition: 'all 0.2s',
                                                                    borderColor: isDone ? 'var(--primary-color)' : 'var(--glass-border)',
                                                                    background: isDone ? 'var(--primary-color)' : 'rgba(0,0,0,0.02)',
                                                                    color: isDone ? 'white' : 'var(--text-muted)'
                                                                }}
                                                            >
                                                                {isDone ? <Check size={20} strokeWidth={3} /> : <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor', opacity: 0.2 }} />}
                                                            </button>
                                                        ) : (
                                                            <div style={{ width: '44px', height: '44px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>-</div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                            <td style={{ padding: '0.5rem', textAlign: 'center', verticalAlign: 'middle' }}>
                                                {!childDone && canEdit && (
                                                    <button onClick={() => validateAll(child)} style={{ padding: '0.5rem 0.75rem', borderRadius: '10px', border: 'none', background: 'var(--primary-light)', color: 'var(--primary-color)', fontWeight: '900', fontSize: '0.75rem', cursor: 'pointer' }}>
                                                        Tout Valider
                                                    </button>
                                                )}
                                                {childDone && <Check size={20} color="var(--primary-color)" style={{ margin: '0 auto' }} />}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        )}
                    </div>

                    <div className="card-glass" style={{ borderRadius: '24px', overflow: 'hidden', background: 'white', border: '1.5px solid var(--glass-border)' }}>
                        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-main)' }}>
                            <div style={{ background: 'oklch(62% 0.22 145 / 0.1)', padding: '10px', borderRadius: '12px', color: 'oklch(52% 0.22 145)' }}>
                                <Pill size={20} strokeWidth={2.5} />
                            </div>
                            <div>
                                <div style={{ fontWeight: '950', fontSize: '1.05rem', color: 'var(--text-main)' }}>Traitements "Si besoin"</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700' }}>Traitements ponctuels (PRN) par enfant</div>
                            </div>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(0,0,0,0.02)' }}>
                                        <th style={thStyle}>Enfant</th>
                                        <th style={thStyle}>Traitement "Si besoin" (PRN)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {children.map(child => (
                                        <tr key={child.id} style={{ borderTop: '1px solid var(--glass-border)' }} className="hover-row">
                                            <td style={tdStyle}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <Avatar participant={child} size={36} />
                                                    <div style={{ fontWeight: '900', fontSize: '0.9rem' }}>{child.firstName} {child.lastName.toUpperCase()}</div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.5rem 1.5rem' }}>
                                                <input
                                                    type="text" className="inline-input"
                                                    placeholder="Ex: Ventoline si crise, Doliprane si fièvre…"
                                                    value={child.sibesoin || ''}
                                                    onChange={e => updateParticipantHealth(child.id, 'sibesoin', e.target.value)}
                                                    disabled={!canEdit}
                                                    style={{ width: '100%', fontSize: '0.85rem', fontWeight: '700', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid transparent', background: 'var(--bg-main)', minWidth: '300px' }}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {childrenWithMeds.map(child => {
                        const slots = getSlots(child);
                        const validated = getValidated(child);
                        const childDone = slots.every(s => validated[s]);
                        const childDoneCount = slots.filter(s => validated[s]).length;

                        return (
                            <div key={child.id} style={{
                                borderRadius: '24px', overflow: 'hidden',
                                border: \`2px solid \${childDone ? 'oklch(62% 0.18 145 / 0.35)' : 'var(--glass-border)'}\`,
                                background: 'white',
                                boxShadow: childDone ? '0 8px 32px oklch(62% 0.18 145 / 0.12)' : '0 2px 12px rgba(0,0,0,0.06)',
                                transition: 'all 0.4s'
                            }}>
                                <div style={{
                                    padding: '1rem 1.25rem',
                                    background: childDone
                                        ? 'linear-gradient(135deg, oklch(55% 0.2 145), oklch(65% 0.18 160))'
                                        : 'linear-gradient(135deg, oklch(25% 0.05 240), oklch(35% 0.08 250))',
                                    display: 'flex', alignItems: 'center', gap: '1rem',
                                    transition: 'background 0.5s'
                                }}>
                                    <div style={{
                                        width: '48px', height: '48px', borderRadius: '50%',
                                        background: 'rgba(255,255,255,0.2)',
                                        border: '2px solid rgba(255,255,255,0.4)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '1.1rem', fontWeight: '950', color: 'white',
                                        flexShrink: 0
                                    }}>
                                        {childDone ? <Check size={22} strokeWidth={3} /> : initials(child)}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: '950', fontSize: '1.05rem', color: 'white', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {child.firstName} {child.lastName.toUpperCase()}
                                        </div>
                                        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', fontWeight: '700', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <Pill size={11} strokeWidth={2.5} />
                                            {child.dailyMeds || 'Traitement'}
                                        </div>
                                    </div>
                                    {childDone ? (
                                        <div style={{ background: 'rgba(255,255,255,0.25)', color: 'white', fontSize: '0.65rem', fontWeight: '950', padding: '5px 12px', borderRadius: '999px', whiteSpace: 'nowrap', border: '1.5px solid rgba(255,255,255,0.4)' }}>
                                            COMPLET
                                        </div>
                                    ) : (
                                        <div style={{ background: 'rgba(255,255,255,0.15)', color: 'white', fontSize: '0.85rem', fontWeight: '950', padding: '5px 14px', borderRadius: '999px', border: '1.5px solid rgba(255,255,255,0.25)' }}>
                                            {childDoneCount}/{slots.length}
                                        </div>
                                    )}
                                </div>
                                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                                    {slots.map(slot => {
                                        const cfg = SLOT_CONFIG[slot] || { icon: '💊', label: slot, color: 'var(--primary-color)', colorLight: 'white', gradient: 'var(--primary-gradient)' };
                                        const isDone = !!validated[slot];
                                        return (
                                            <button
                                                key={slot}
                                                onClick={() => toggleSlot(child, slot)}
                                                disabled={!canEdit}
                                                style={{
                                                    width: '100%', minHeight: '68px',
                                                    display: 'flex', alignItems: 'center', gap: '1rem',
                                                    padding: '0 1.25rem',
                                                    borderRadius: '16px', border: '2px solid',
                                                    cursor: canEdit ? 'pointer' : 'default',
                                                    transition: 'all 0.3s',
                                                    borderColor: isDone ? cfg.color : 'var(--glass-border)',
                                                    background: isDone ? cfg.gradient : cfg.colorLight,
                                                    color: isDone ? 'white' : cfg.color,
                                                    boxShadow: isDone ? \`0 6px 20px \${cfg.color}35\` : 'none',
                                                    transform: isDone ? 'scale(1.01)' : 'scale(1)',
                                                    textAlign: 'left'
                                                }}
                                            >
                                                <span style={{ fontSize: '1.8rem', lineHeight: 1, flexShrink: 0, filter: isDone ? 'brightness(10)' : 'none', transition: 'filter 0.3s' }}>
                                                    {cfg.icon}
                                                </span>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: '950', fontSize: '1rem', letterSpacing: '-0.02em' }}>{cfg.label}</div>
                                                    <div style={{ fontSize: '0.72rem', fontWeight: '700', opacity: isDone ? 0.8 : 0.6, marginTop: '1px' }}>
                                                        {isDone ? 'Médicament administré' : 'Appuyer pour valider'}
                                                    </div>
                                                </div>
                                                <div style={{
                                                    width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    background: isDone ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.04)',
                                                    border: \`2px solid \${isDone ? 'rgba(255,255,255,0.5)' : 'var(--glass-border)'}\`,
                                                    transition: 'all 0.3s'
                                                }}>
                                                    {isDone
                                                        ? <Check size={18} strokeWidth={3} color="white" />
                                                        : <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: cfg.color, opacity: 0.3 }} />
                                                    }
                                                </div>
                                            </button>
                                        );
                                    })}
                                    {!childDone && canEdit && (
                                        <button
                                            onClick={() => validateAll(child)}
                                            style={{
                                                marginTop: '0.25rem', width: '100%', minHeight: '52px',
                                                borderRadius: '14px', border: 'none',
                                                background: 'var(--primary-gradient)',
                                                color: 'white', fontSize: '0.875rem', fontWeight: '950',
                                                cursor: 'pointer', display: 'flex', alignItems: 'center',
                                                justifyContent: 'center', gap: '8px',
                                                boxShadow: '0 4px 16px var(--shadow-color)',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <Check size={16} strokeWidth={3} /> Tout valider
                                        </button>
                                    )}
                                </div>
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
const endIndex = content.indexOf(medsDashboardEnd) + medsDashboardEnd.length - 28; // To keep const LogTypeButton
content = content.substring(0, startIndex) + newMedsDashboard + '\n\n' + content.substring(endIndex);

// 3. Update RegistreInfi names and remove Si Besoin from RegistreMeds
content = content.replace(
    "{ id: 'meds',    label: 'Registre Médicaments', icon: <Pill size={15} /> },",
    "{ id: 'meds',    label: 'Administration & Traitements', icon: <Pill size={15} /> },"
);
content = content.replace(
    "{ id: 'registre',    label: 'Registre Infi',    icon: <ClipboardList size={15} /> },",
    "{ id: 'registre',    label: 'Registre & Suivi',    icon: <ClipboardList size={15} /> },"
);

// Find the Si besoin section in RegistreMeds and remove it.
const siBesoinStart = '{/* Si besoin par enfant */}';
const siBesoinEnd = '{/* Registre header */}';
const siIdx1 = content.indexOf(siBesoinStart);
const siIdx2 = content.indexOf(siBesoinEnd);
if (siIdx1 !== -1 && siIdx2 !== -1) {
    content = content.substring(0, siIdx1) + content.substring(siIdx2);
}

// Update form fields in RegistreMeds (since Si besoin is handled in MedsDashboard now)
content = content.replace(
    "const [form, setForm] = useState({ childId: '', heure: '', medicaments: '', sibesoin: '', soignant: '' });",
    "const [form, setForm] = useState({ childId: '', heure: '', medicaments: '', traitement: '', soignant: '' });"
);
content = content.replace(
    "setForm(f => ({ ...f, childId, medicaments: child?.dailyMeds || '', sibesoin: child?.sibesoin || '' }));",
    "setForm(f => ({ ...f, childId, medicaments: child?.dailyMeds || '' }));"
);
content = content.replace(
    "const newLog = { id: Date.now(), timestamp: new Date().toISOString(), heure: form.heure || nowTime(), medicaments: form.medicaments, sibesoin: form.sibesoin, soignant: form.soignant };",
    "const newLog = { id: Date.now(), timestamp: new Date().toISOString(), heure: form.heure || nowTime(), medicaments: form.medicaments, traitement: form.traitement, soignant: form.soignant };"
);
content = content.replace(
    "setForm({ childId: '', heure: '', medicaments: '', sibesoin: '', soignant: '' });",
    "setForm({ childId: '', heure: '', medicaments: '', traitement: '', soignant: '' });"
);
content = content.replace(
    `<div>
                            <label style={labelStyle}>Si besoin (PRN)</label>
                            <input className="glass-input" placeholder="Auto-rempli depuis la fiche" value={form.sibesoin} onChange={e => setForm(f => ({ ...f, sibesoin: e.target.value }))} style={{ height: '44px', fontWeight: '800' }} />
                        </div>`,
    `<div>
                            <label style={labelStyle}>Soin / Traitement donné</label>
                            <input className="glass-input" placeholder="Ex: Ventoline, Doliprane..." value={form.traitement} onChange={e => setForm(f => ({ ...f, traitement: e.target.value }))} style={{ height: '44px', fontWeight: '800' }} />
                        </div>`
);
content = content.replace(
    "<th style={thStyle}>Si besoin</th>",
    "<th style={thStyle}>Soin / Traitement donné</th>"
);
content = content.replace(
    `<td style={tdStyle}>{log.sibesoin
                                        ? <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'oklch(55% 0.22 30)', background: 'oklch(96% 0.06 30)', padding: '3px 10px', borderRadius: '8px' }}>{log.sibesoin}</span>
                                        : <span style={{ opacity: 0.3 }}>—</span>}
                                    </td>`,
    `<td style={tdStyle}>{log.traitement
                                        ? <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'oklch(55% 0.22 30)', background: 'oklch(96% 0.06 30)', padding: '3px 10px', borderRadius: '8px' }}>{log.traitement}</span>
                                        : <span style={{ opacity: 0.3 }}>—</span>}
                                    </td>`
);

fs.writeFileSync(file, content);
console.log('Update successful');
