const fs = require('fs');
const file = '/home/jathur/projects/colo-app/src/components/HealthCenter.jsx';
let content = fs.readFileSync(file, 'utf8');

const oldCarnetBlockStart = `<div style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Traitement de fond</div>`;
const oldCarnetBlockEnd = `<div style={{ textAlign: 'right', padding: '0.75rem 1.25rem', background: 'var(--bg-main)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>`;

const startIndex = content.indexOf(oldCarnetBlockStart);
const endIndex = content.indexOf(oldCarnetBlockEnd);

if (startIndex !== -1 && endIndex !== -1) {
    const newBlock = `<div style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Traitement de fond</div>
                                <div style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main)', width: '100%' }}>
                                    {(() => {
                                        const medsList = getMedicationsList(selectedChild);
                                        if (medsList.length === 0) return <span style={{ opacity: 0.5, fontSize: '0.8rem' }}>Aucun traitement</span>;
                                        
                                        return (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                {medsList.map((med, idx) => (
                                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', background: 'white', padding: '4px 8px', borderRadius: '8px', border: '1px solid var(--glass-border)', fontSize: '0.8rem', gap: '6px' }}>
                                                        <span style={{ fontWeight: 'bold' }}>{med.name}</span>
                                                        <div style={{ display: 'flex', gap: '2px' }}>
                                                            {med.slots.map(s => (
                                                                <span key={s} style={{ fontSize: '0.6rem', background: 'var(--bg-main)', padding: '2px 4px', borderRadius: '4px' }}>{s}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                            `;
    
    content = content.substring(0, startIndex) + newBlock + content.substring(endIndex);
    fs.writeFileSync(file, content);
    console.log('Update Carnet complete');
} else {
    console.log('Markers not found in HealthCenter');
}
