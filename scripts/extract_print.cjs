const fs = require('fs');
const content = fs.readFileSync('src/components/IncidentSheet.jsx', 'utf8');
const startIdx = content.indexOf('const PrintContent = ({ data }) => {');
const endIdx = content.indexOf('export default function IncidentSheet');
let printContent = content.substring(startIdx, endIdx);

let newContent = `import React from 'react';
import { eventChecked, EVENT_TYPES } from './incidentUtils';

${printContent}
export default PrintContent;
`;
fs.writeFileSync('src/components/incidents/IncidentPrint.jsx', newContent);
