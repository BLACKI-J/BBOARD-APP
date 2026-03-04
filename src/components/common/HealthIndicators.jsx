import React from 'react';
import { AlertCircle } from 'lucide-react';

const HealthIndicators = ({ participant = {}, expanded = false }) => {
    const hasAllergies = participant?.allergies && participant.allergies.trim() !== '';
    const hasConstraints = participant?.constraints && participant.constraints.trim() !== '';

    if (!hasAllergies && !hasConstraints) return expanded ? <span style={{color: '#cbd5e1', fontSize: '0.85rem'}}>Aucune info médicale</span> : <span style={{color: '#cbd5e1'}}>-</span>;
    
    return (
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', color: '#ef4444', fontSize: '0.85rem', fontWeight: 500 }}>
            <AlertCircle size={16} />
            <div style={{display: 'flex', flexDirection: expanded ? 'column' : 'row', gap: expanded ? '0' : '0.5rem'}}>
                {hasAllergies && <span title={participant.allergies}>{participant.allergies}</span>}
                {hasConstraints && <span title={participant.constraints}>{!expanded && hasAllergies ? '• ' : ''}{participant.constraints}</span>}
            </div>
        </div>
    );
};

export default HealthIndicators;
