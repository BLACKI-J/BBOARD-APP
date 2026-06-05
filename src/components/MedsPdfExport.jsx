import React from 'react';
import { getMedicationsList, getSiBesoinList } from '../utils/meds';

const MedsPdfExport = ({ children }) => {
    // We only want to print children who have some medical info
    const childrenToPrint = children.filter(c => {
        const meds = getMedicationsList(c);
        const siBesoin = getSiBesoinList(c);
        return meds.length > 0 || siBesoin.length > 0;
    });

    if (childrenToPrint.length === 0) return null;

    const renderEmptyRows = (count, startIndex = 1, isComplementary = false) => {
        return Array.from({ length: count }).map((_, i) => (
            <tr key={i} className="meds-row">
                <td className="med-name-cell">
                    <div className="med-index">{String(startIndex + i).padStart(2, '0')} |</div>
                    <div className="med-types">
                        <span>CP</span>
                        <span>CU</span>
                        <span>G</span>
                        <span>D</span>
                        <span>S</span>
                    </div>
                </td>
                <td className="check-cell"></td>
                <td className="check-cell"></td>
                <td className="check-cell"></td>
                <td className="check-cell"></td>
                {isComplementary ? (
                    <>
                        <td className="check-cell" colSpan={2}></td>
                    </>
                ) : (
                    <>
                        <td className="check-cell"></td>
                        <td className="check-cell"></td>
                    </>
                )}
            </tr>
        ));
    };

    return (
        <div className="print-only-container">
            {childrenToPrint.map((child, pageIndex) => {
                const dailyMedsList = getMedicationsList(child);
                const siBesoinList = getSiBesoinList(child);

                return (
                    <div key={child.id} className="print-page">
                        <div className="print-header">
                            <h1>FICHE DE SUIVI DES TRAITEMENTS MÉDICAUX</h1>
                            <div className="child-info">
                                <strong>Nom / Prénom :</strong> {child.lastName.toUpperCase()} {child.firstName}
                            </div>
                        </div>

                        <table className="meds-print-table">
                            <thead>
                                <tr>
                                    <th className="signature-header">Paraphe de l'AS qui a assuré l'administration</th>
                                    <th>RÉVEIL</th>
                                    <th>PDJ</th>
                                    <th>MIDI</th>
                                    <th>GOÛTER</th>
                                    <th>SOIR</th>
                                    <th>COUCHER</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Traitement Quotidien */}
                                <tr className="section-header-row">
                                    <td className="section-title">
                                        <strong>TRAITEMENT QUOTIDIEN</strong>
                                        <div className="subtitle">(entourer le type de dosage *)</div>
                                    </td>
                                    <td className="col-header">RÉVEIL</td>
                                    <td className="col-header">PDJ</td>
                                    <td className="col-header">MIDI</td>
                                    <td className="col-header">APRÈS-MIDI</td>
                                    <td className="col-header">SOIR</td>
                                    <td className="col-header">COUCHER</td>
                                </tr>
                                
                                {dailyMedsList.map((med, i) => {
                                    // Map PDF columns to app slots
                                    // Reveil, PDJ -> Matin
                                    // Midi -> Midi
                                    // Apres-midi / Gouter -> Goûter
                                    // Soir / Coucher -> Soir
                                    const hasMatin = med.slots.includes('Matin');
                                    const hasMidi = med.slots.includes('Midi');
                                    const hasGouter = med.slots.includes('Goûter');
                                    const hasSoir = med.slots.includes('Soir');

                                    return (
                                        <tr key={'d'+i} className="meds-row">
                                            <td className="med-name-cell filled-med">
                                                <div className="med-index">{String(i + 1).padStart(2, '0')} |</div>
                                                <div className="med-types">
                                                    <span>CP</span>
                                                    <span>CU</span>
                                                    <span>G</span>
                                                    <span>D</span>
                                                    <span>S</span>
                                                </div>
                                                <div className="med-name-text">{med.name}</div>
                                            </td>
                                            <td className={hasMatin ? "check-cell" : "check-cell disabled-cell"}></td>
                                            <td className={hasMatin ? "check-cell" : "check-cell disabled-cell"}></td>
                                            <td className={hasMidi ? "check-cell" : "check-cell disabled-cell"}></td>
                                            <td className={hasGouter ? "check-cell" : "check-cell disabled-cell"}></td>
                                            <td className={hasSoir ? "check-cell" : "check-cell disabled-cell"}></td>
                                            <td className={hasSoir ? "check-cell" : "check-cell disabled-cell"}></td>
                                        </tr>
                                    );
                                })}
                                {renderEmptyRows(Math.max(1, 15 - dailyMedsList.length), dailyMedsList.length + 1)}

                                {/* Traitement Si Besoin */}
                                <tr className="section-header-row">
                                    <td className="section-title">
                                        <strong>TRAITEMENT SI BESOIN</strong>
                                        <div className="subtitle">(entourer le type de dosage *)</div>
                                    </td>
                                    <td className="col-header">RÉVEIL</td>
                                    <td className="col-header">PDJ</td>
                                    <td className="col-header">MIDI</td>
                                    <td className="col-header">APRÈS-MIDI</td>
                                    <td className="col-header">SOIR</td>
                                    <td className="col-header">COUCHER</td>
                                </tr>
                                
                                {siBesoinList.map((medName, i) => (
                                    <tr key={'s'+i} className="meds-row">
                                        <td className="med-name-cell filled-med">
                                            <div className="med-index">{String(i + 1).padStart(2, '0')} |</div>
                                            <div className="med-types">
                                                <span>CP</span>
                                                <span>CU</span>
                                                <span>G</span>
                                                <span>D</span>
                                                <span>S</span>
                                            </div>
                                            <div className="med-name-text">{medName}</div>
                                        </td>
                                        {/* PRN has all slots available by definition */}
                                        <td className="check-cell"></td>
                                        <td className="check-cell"></td>
                                        <td className="check-cell"></td>
                                        <td className="check-cell"></td>
                                        <td className="check-cell"></td>
                                        <td className="check-cell"></td>
                                    </tr>
                                ))}
                                {renderEmptyRows(Math.max(1, 6 - siBesoinList.length), siBesoinList.length + 1)}

                                {/* Traitement Complémentaire */}
                                <tr className="section-header-row">
                                    <td className="section-title">
                                        <strong>TRAITEMENT COMPLÉMENTAIRE</strong>
                                        <div className="subtitle">(entourer le type de dosage *)</div>
                                    </td>
                                    <td className="col-header">RÉVEIL</td>
                                    <td className="col-header">PDJ</td>
                                    <td className="col-header">MIDI</td>
                                    <td className="col-header">APRÈS-MIDI</td>
                                    <td className="col-header">SOIR</td>
                                    <td className="col-header">COUCHER</td>
                                </tr>
                                {renderEmptyRows(6, 1, true)}

                            </tbody>
                        </table>
                    </div>
                );
            })}

            <style dangerouslySetInnerHTML={{__html: `
                @media screen {
                    .print-only-container { display: none; }
                }
                @media print {
                    @page { size: A4; margin: 10mm; }
                    body * { visibility: hidden; }
                    .print-only-container, .print-only-container * { visibility: visible; }
                    .print-only-container {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        background: white;
                    }
                    .print-page {
                        page-break-after: always;
                        width: 100%;
                        font-family: Arial, sans-serif;
                    }
                    .print-page:last-child {
                        page-break-after: auto;
                    }
                    .print-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 15px;
                    }
                    .print-header h1 {
                        font-size: 16px;
                        margin: 0;
                        text-decoration: underline;
                    }
                    .child-info {
                        font-size: 14px;
                        border: 1px solid #000;
                        padding: 5px 15px;
                    }
                    .meds-print-table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 11px;
                    }
                    .meds-print-table th, .meds-print-table td {
                        border: 1px solid #000;
                        text-align: center;
                    }
                    .signature-header {
                        text-align: left;
                        padding: 5px;
                        font-weight: normal;
                        background: #eee;
                    }
                    .meds-print-table th {
                        background: #eee;
                        padding: 5px;
                    }
                    .section-header-row {
                        background: #ccc;
                        font-weight: bold;
                    }
                    .section-title {
                        text-align: left !important;
                        padding: 4px 8px;
                    }
                    .section-title .subtitle {
                        font-weight: normal;
                        font-size: 9px;
                        font-style: italic;
                    }
                    .col-header {
                        padding: 4px;
                        font-size: 10px;
                    }
                    .meds-row {
                        height: 25px;
                    }
                    .med-name-cell {
                        display: flex;
                        align-items: center;
                        height: 100%;
                        border: none !important;
                        padding: 0 5px;
                        position: relative;
                    }
                    .med-index {
                        margin-right: 5px;
                    }
                    .med-types {
                        display: flex;
                        gap: 4px;
                        font-size: 10px;
                        letter-spacing: 1px;
                    }
                    .med-name-text {
                        position: absolute;
                        left: 110px;
                        font-weight: bold;
                        font-size: 12px;
                        color: #000;
                        text-transform: uppercase;
                    }
                    .filled-med {
                        background: rgba(0,0,0,0.05);
                    }
                    .disabled-cell {
                        background: #d3d3d3 !important;
                        position: relative;
                        overflow: hidden;
                    }
                    .disabled-cell::after {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: repeating-linear-gradient(
                            45deg,
                            transparent,
                            transparent 5px,
                            #aaa 5px,
                            #aaa 6px
                        );
                    }
                }
            `}} />
        </div>
    );
};

export default MedsPdfExport;
