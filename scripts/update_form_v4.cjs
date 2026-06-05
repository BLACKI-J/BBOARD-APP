const fs = require('fs');
const file = '/home/jathur/projects/colo-app/src/components/directory/ParticipantForm.jsx';
let content = fs.readFileSync(file, 'utf8');

// We need to add state for the new inputs if they don't exist.
// Since ParticipantForm is a functional component, we can use `useState` inside it.
// Let's add it via a regex replace.
if (!content.includes('const [newMed, setNewMed] = useState')) {
    content = content.replace(
        'const ui = useUi();',
        'const ui = useUi();\n    const [newMed, setNewMed] = useState(\'\');\n    const [newPrn, setNewPrn] = useState(\'\');'
    );
}

const oldMedsInput = `                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <label className="form-label">Médicament(s) prescrit(s)</label>
                                        <input
                                            type="text"
                                            placeholder="Ex: Ventoline 100μg, Zyrtec 5mg..."
                                            value={formData.dailyMeds || ''}
                                            onChange={e => setFormData({ ...formData, dailyMeds: e.target.value })}
                                            className="glass-input"
                                            style={{ background: 'white', border: '1.5px solid var(--glass-border)', padding: '0.85rem 1.25rem', borderRadius: '16px', fontWeight: '700' }}
                                        />
                                    </div>`;

const newMedsUI = `                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <label className="form-label">Médicament(s) Quotidien(s)</label>
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
                                                            const current = formData.dailyMeds ? formData.dailyMeds.trim() : '';
                                                            setFormData({ ...formData, dailyMeds: current ? \`\${current}\\n\${newMed.trim()}\` : newMed.trim() });
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
                                                        const current = formData.dailyMeds ? formData.dailyMeds.trim() : '';
                                                        setFormData({ ...formData, dailyMeds: current ? \`\${current}\\n\${newMed.trim()}\` : newMed.trim() });
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
                                        
                                        {formData.dailyMeds && formData.dailyMeds.trim() !== '' && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                {formData.dailyMeds.split(/,|\\n/).map(s => s.trim()).filter(Boolean).map((med, idx) => (
                                                    <div key={idx} style={{ 
                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                        background: 'white', padding: '0.75rem 1rem', borderRadius: '12px',
                                                        border: '1.5px solid var(--glass-border)'
                                                    }}>
                                                        <span style={{ fontWeight: '800', fontSize: '0.9rem', color: 'var(--text-main)' }}>{med}</span>
                                                        <button 
                                                            type="button"
                                                            onClick={() => {
                                                                const list = formData.dailyMeds.split(/,|\\n/).map(s => s.trim()).filter(Boolean);
                                                                list.splice(idx, 1);
                                                                setFormData({ ...formData, dailyMeds: list.join('\\n') });
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
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Si Besoin Section */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--glass-border)' }}>
                                        <label className="form-label" style={{ color: 'oklch(52% 0.22 145)' }}>Traitement "Si Besoin" (PRN)</label>
                                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                                            <input
                                                type="text"
                                                placeholder="Ex: Spasfon si douleurs..."
                                                value={newPrn}
                                                onChange={e => setNewPrn(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        if (newPrn.trim()) {
                                                            const current = formData.sibesoin ? formData.sibesoin.trim() : '';
                                                            setFormData({ ...formData, sibesoin: current ? \`\${current}\\n\${newPrn.trim()}\` : newPrn.trim() });
                                                            setNewPrn('');
                                                        }
                                                    }
                                                }}
                                                className="glass-input"
                                                style={{ flex: 1, background: 'white', border: '1.5px solid var(--glass-border)', padding: '0.85rem 1.25rem', borderRadius: '16px', fontWeight: '700' }}
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    if (newPrn.trim()) {
                                                        const current = formData.sibesoin ? formData.sibesoin.trim() : '';
                                                        setFormData({ ...formData, sibesoin: current ? \`\${current}\\n\${newPrn.trim()}\` : newPrn.trim() });
                                                        setNewPrn('');
                                                    }
                                                }}
                                                style={{ 
                                                    background: 'oklch(62% 0.22 145)', color: 'white', border: 'none', 
                                                    borderRadius: '16px', padding: '0 1.5rem', fontWeight: '950', 
                                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' 
                                                }}
                                            >
                                                <Plus size={18} strokeWidth={3} /> Ajouter
                                            </button>
                                        </div>
                                        
                                        {formData.sibesoin && formData.sibesoin.trim() !== '' && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                {formData.sibesoin.split(/,|\\n/).map(s => s.trim()).filter(Boolean).map((med, idx) => (
                                                    <div key={idx} style={{ 
                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                        background: 'white', padding: '0.75rem 1rem', borderRadius: '12px',
                                                        border: '1.5px solid oklch(62% 0.22 145 / 0.3)'
                                                    }}>
                                                        <span style={{ fontWeight: '800', fontSize: '0.9rem', color: 'var(--text-main)' }}>{med}</span>
                                                        <button 
                                                            type="button"
                                                            onClick={() => {
                                                                const list = formData.sibesoin.split(/,|\\n/).map(s => s.trim()).filter(Boolean);
                                                                list.splice(idx, 1);
                                                                setFormData({ ...formData, sibesoin: list.join('\\n') });
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
                                                ))}
                                            </div>
                                        )}
                                    </div>`;

content = content.replace(oldMedsInput, newMedsUI);
fs.writeFileSync(file, content);
console.log('Update complete');
