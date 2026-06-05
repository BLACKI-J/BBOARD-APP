const fs = require('fs');
const file = '/home/jathur/projects/colo-app/src/components/directory/ParticipantForm.jsx';
let content = fs.readFileSync(file, 'utf8');

const oldMedsInputStart = `<label className="form-label">Médicament(s) Quotidien(s)</label>`;
const oldMedsInputEnd = `{/* Si Besoin Section */}`;

const startIndex = content.indexOf(oldMedsInputStart);
const endIndex = content.indexOf(oldMedsInputEnd);

if (startIndex !== -1 && endIndex !== -1) {
    const newMedsUI = `<label className="form-label">Médicament(s) Quotidien(s)</label>
                                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                                            <input
                                                type="text"
                                                placeholder="Ex: Ventoline 100μg..."
                                                value={newMed}
                                                onChange={e => setNewMed(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        if (newMed.trim()) {
                                                            const currentMeds = formData.medications || (formData.dailyMeds ? formData.dailyMeds.split(/,|\\n/).map(s => s.trim()).filter(Boolean).map(name => ({name, slots: formData.medSlots || ['Matin', 'Midi', 'Goûter', 'Soir']})) : []);
                                                            setFormData({ ...formData, medications: [...currentMeds, { name: newMed.trim(), slots: [] }] });
                                                            setNewMed('');
                                                        }
                                                    }
                                                }}
                                                className="glass-input"
                                                style={{ flex: 1, background: 'white', border: '1.5px solid var(--glass-border)', padding: '0.85rem 1.25rem', borderRadius: '16px', fontWeight: '700' }}
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    if (newMed.trim()) {
                                                        const currentMeds = formData.medications || (formData.dailyMeds ? formData.dailyMeds.split(/,|\\n/).map(s => s.trim()).filter(Boolean).map(name => ({name, slots: formData.medSlots || ['Matin', 'Midi', 'Goûter', 'Soir']})) : []);
                                                        setFormData({ ...formData, medications: [...currentMeds, { name: newMed.trim(), slots: [] }] });
                                                        setNewMed('');
                                                    }
                                                }}
                                                style={{ 
                                                    background: 'oklch(55% 0.18 232)', color: 'white', border: 'none', 
                                                    borderRadius: '16px', padding: '0 1.5rem', fontWeight: '950', 
                                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' 
                                                }}
                                            >
                                                <Plus size={18} strokeWidth={3} /> Ajouter
                                            </button>
                                        </div>
                                        
                                        {(() => {
                                            const currentMeds = formData.medications || (formData.dailyMeds ? formData.dailyMeds.split(/,|\\n/).map(s => s.trim()).filter(Boolean).map(name => ({name, slots: formData.medSlots || ['Matin', 'Midi', 'Goûter', 'Soir']})) : []);
                                            if (currentMeds.length === 0) return null;
                                            
                                            return (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                    {currentMeds.map((med, idx) => (
                                                        <div key={idx} style={{ 
                                                            display: 'flex', flexDirection: 'column', gap: '0.5rem',
                                                            background: 'white', padding: '1rem', borderRadius: '16px',
                                                            border: '1.5px solid var(--glass-border)'
                                                        }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <span style={{ fontWeight: '900', fontSize: '1rem', color: 'var(--text-main)' }}>{med.name}</span>
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const list = [...currentMeds];
                                                                        list.splice(idx, 1);
                                                                        setFormData({ ...formData, medications: list });
                                                                    }}
                                                                    style={{ 
                                                                        background: 'oklch(62% 0.2 28 / 0.1)', color: 'var(--danger-color)', 
                                                                        border: 'none', borderRadius: '8px', width: '28px', height: '28px',
                                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                                                                    }}
                                                                >
                                                                    <Trash2 size={14} strokeWidth={2.5} />
                                                                </button>
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                                {['Matin', 'Midi', 'Goûter', 'Soir'].map(slotId => {
                                                                    const isActive = med.slots.includes(slotId);
                                                                    return (
                                                                        <button
                                                                            key={slotId}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const list = [...currentMeds];
                                                                                const m = list[idx];
                                                                                if (isActive) {
                                                                                    m.slots = m.slots.filter(s => s !== slotId);
                                                                                } else {
                                                                                    m.slots = [...m.slots, slotId];
                                                                                }
                                                                                setFormData({ ...formData, medications: list });
                                                                            }}
                                                                            style={{
                                                                                padding: '4px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '800',
                                                                                border: \`1.5px solid \${isActive ? 'oklch(55% 0.18 232)' : 'var(--glass-border)'}\`,
                                                                                background: isActive ? 'oklch(55% 0.18 232)' : 'transparent',
                                                                                color: isActive ? 'white' : 'var(--text-muted)',
                                                                                cursor: 'pointer', transition: 'all 0.2s',
                                                                                display: 'flex', alignItems: 'center', gap: '4px'
                                                                            }}
                                                                        >
                                                                            {isActive && <Check size={12} strokeWidth={4} />}
                                                                            {slotId}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    `;
    
    content = content.substring(0, startIndex) + newMedsUI + content.substring(endIndex);
    fs.writeFileSync(file, content);
    console.log('Update ParticipantForm complete');
} else {
    console.log('Markers not found', startIndex, endIndex);
}
