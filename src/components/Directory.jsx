import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// Components
import DirectoryHeader from './directory/DirectoryHeader';
import DirectoryFilters from './directory/DirectoryFilters';
import ParticipantTable from './directory/ParticipantTable';
import ParticipantCard from './directory/ParticipantCard';
import ParticipantDetails from './directory/ParticipantDetails';
import ParticipantForm from './directory/ParticipantForm';
import GroupManager from './directory/GroupManager';

// --- Main Component ---

export default function Directory({ participants = [], setParticipants, groups = [], setGroups }) {
    // Ensure props are safe
    const safeParticipants = Array.isArray(participants) ? participants : [];
    const safeGroups = Array.isArray(groups) ? groups : [];

    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'firstName', direction: 'ascending' });
    const [viewMode, setViewMode] = useState('table');
    const [filterRole, setFilterRole] = useState('all');
    const [filterGroup, setFilterGroup] = useState('all');

    // Selection State
    const [selectedParticipants, setSelectedParticipants] = useState([]);

    // Viewing State - Drawer Mode
    const [viewingParticipant, setViewingParticipant] = useState(null);

    // Form States
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        birthDate: '',
        allergies: '',
        constraints: '',
        photo: '',
        role: 'child',
        group: '',
        // Animator specific fields
        training: '',
        phone: '',
        address: '',
        emergencyContact: ''
    });

    // Group Management State
    const [isGroupManagerOpen, setIsGroupManagerOpen] = useState(false);
    const [newGroupData, setNewGroupData] = useState({ name: '', color: '#3b82f6' });

    // --- Actions ---

    const toggleSelection = (id) => {
        if (selectedParticipants.includes(id)) {
            setSelectedParticipants(selectedParticipants.filter(pId => pId !== id));
        } else {
            setSelectedParticipants([...selectedParticipants, id]);
        }
    };

    const toggleSelectAll = () => {
        if (selectedParticipants.length === sortedParticipants.length) {
            setSelectedParticipants([]);
        } else {
            setSelectedParticipants(sortedParticipants.map(p => p.id));
        }
    };

    const handleBulkDelete = () => {
        if (confirm(`Supprimer ces ${selectedParticipants.length} participants ?`)) {
            setParticipants(safeParticipants.filter(p => !selectedParticipants.includes(p.id)));
            setSelectedParticipants([]);
        }
    };

    const handleAddGroup = (e) => {
        e.preventDefault();
        if (newGroupData.name) {
            setGroups([...safeGroups, { id: uuidv4(), ...newGroupData }]);
            setNewGroupData({ name: '', color: '#3b82f6' });
        }
    };

    const handleDeleteGroup = (groupId) => {
        if (confirm("Supprimer ce groupe ? Les participants assignés n'auront plus de groupe.")) {
            setGroups(safeGroups.filter(g => g.id !== groupId));
            setParticipants(safeParticipants.map(p => p.group === groupId ? { ...p, group: '' } : p));
        }
    };

    const handleExport = () => {
        const dataStr = JSON.stringify(safeParticipants, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `colo-participants-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImport = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                if (Array.isArray(imported)) {
                    if (confirm(`Voulez-vous remplacer la liste actuelle (${safeParticipants.length}) par ${imported.length} participants importés ?`)) {
                        setParticipants(imported);
                    }
                } else {
                    alert("Format JSON invalide : doit être une liste de participants.");
                }
            } catch (err) {
                alert("Erreur lors de la lecture du fichier JSON.");
            }
        };
        reader.readAsText(file);
    };

    const resetForm = () => {
        setFormData({
            firstName: '', lastName: '', birthDate: '', allergies: '', constraints: '', photo: '', role: 'child', group: '',
            training: '', phone: '', address: '', emergencyContact: ''
        });
        setEditingId(null);
        setIsFormOpen(false);
    };

    const handleEdit = (participant) => {
        if (!participant) return;
        setFormData({
            ...participant,
            role: participant.role || 'child',
            firstName: participant.firstName || '',
            lastName: participant.lastName || '',
            birthDate: participant.birthDate || '',
            allergies: participant.allergies || '',
            constraints: participant.constraints || '',
            photo: participant.photo || '',
            group: participant.group || '',
            training: participant.training || '',
            phone: participant.phone || '',
            address: participant.address || '',
            emergencyContact: participant.emergencyContact || ''
        });
        setEditingId(participant.id);
        setIsFormOpen(true);
    };

    const handleDelete = (id) => {
        if (confirm("Voulez-vous vraiment supprimer ce participant ?")) {
            setParticipants(safeParticipants.filter(p => p.id !== id));
            if (viewingParticipant && viewingParticipant.id === id) {
                setViewingParticipant(null);
            }
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingId) {
            setParticipants(safeParticipants.map(p => p.id === editingId ? { ...formData, id: editingId } : p));
        } else {
            setParticipants([...safeParticipants, { ...formData, id: uuidv4() }]);
        }
        resetForm();
    };

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    // --- Filtering & Sorting ---

    const filteredParticipants = useMemo(() => {
        return safeParticipants.filter(p => {
            const fName = (p.firstName || '').toLowerCase();
            const lName = (p.lastName || '').toLowerCase();
            const role = (p.role || '').toLowerCase();
            const searchLower = searchTerm.toLowerCase();

            const matchesSearch = (fName + ' ' + lName).includes(searchLower) || role.includes(searchLower);
            const matchesRole = filterRole === 'all' || p.role === filterRole;
            const matchesGroup = filterGroup === 'all' || (filterGroup === 'none' ? !p.group : p.group === filterGroup);

            return matchesSearch && matchesRole && matchesGroup;
        });
    }, [safeParticipants, searchTerm, filterRole, filterGroup]);

    const sortedParticipants = useMemo(() => {
        let sortableItems = [...filteredParticipants];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                let aValue = a[sortConfig.key] || '';
                let bValue = b[sortConfig.key] || '';

                if (sortConfig.key === 'age') {
                    aValue = a.birthDate || '';
                    bValue = b.birthDate || '';
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [filteredParticipants, sortConfig]);

    // --- Statistics ---
    const stats = useMemo(() => {
        return {
            total: safeParticipants.length,
            children: safeParticipants.filter(p => p.role === 'child').length,
            animators: safeParticipants.filter(p => p.role === 'animator').length,
            direction: safeParticipants.filter(p => p.role === 'direction').length
        };
    }, [safeParticipants]);

    // --- Advanced Features ---
    const handleViewDetails = (participant) => {
        if (!participant) return;
        // Deep copy with defaults to prevent any possible crash
        const safeParticipant = {
            id: participant.id,
            firstName: participant.firstName || '',
            lastName: participant.lastName || '',
            role: participant.role || 'child',
            group: participant.group || '',
            birthDate: participant.birthDate || '',
            allergies: participant.allergies || '',
            constraints: participant.constraints || '',
            photo: participant.photo || ''
        };
        setViewingParticipant(safeParticipant);
    };

    return (
        <div className="directory-container" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-main)', overflow: 'hidden', position: 'relative' }}>

            <DirectoryHeader
                stats={stats}
                selectedCount={selectedParticipants.length}
                handleBulkDelete={handleBulkDelete}
                openGroupManager={() => setIsGroupManagerOpen(true)}
                openNewForm={() => { resetForm(); setIsFormOpen(true); }}
                handleExport={handleExport}
                handleImport={handleImport}
            />

            <DirectoryFilters
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filterRole={filterRole}
                setFilterRole={setFilterRole}
                filterGroup={filterGroup}
                setFilterGroup={setFilterGroup}
                viewMode={viewMode}
                setViewMode={setViewMode}
                groups={safeGroups}
            />

            {/* Main Content */}
            <div className="directory-content" style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
                {sortedParticipants.length === 0 ? (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        <div style={{ background: '#f1f5f9', padding: '2rem', borderRadius: '50%', marginBottom: '1.5rem' }}>
                            <Search size={48} color="#cbd5e1" />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#64748b' }}>Aucun résultat</h3>
                        <p>Essayez de modifier vos filtres ou votre recherche.</p>
                    </div>
                ) : (
                    <>
                        {viewMode === 'table' ? (
                            <ParticipantTable
                                participants={sortedParticipants}
                                selectedParticipants={selectedParticipants}
                                toggleSelection={toggleSelection}
                                toggleSelectAll={toggleSelectAll}
                                sortConfig={sortConfig}
                                requestSort={requestSort}
                                handleViewDetails={handleViewDetails}
                                handleEdit={handleEdit}
                                handleDelete={handleDelete}
                                groups={safeGroups}
                            />
                        ) : (
                            <div style={{ padding: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignContent: 'start' }}>
                                {sortedParticipants.map(p => (
                                    <div key={p.id} style={{ flex: '0 0 300px' }}>
                                        <ParticipantCard
                                            participant={p}
                                            isSelected={selectedParticipants.includes(p.id)}
                                            toggleSelection={toggleSelection}
                                            handleViewDetails={handleViewDetails}
                                            handleEdit={handleEdit}
                                            handleDelete={handleDelete}
                                            groups={safeGroups}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* --- Modals --- */}

            <GroupManager
                isOpen={isGroupManagerOpen}
                onClose={() => setIsGroupManagerOpen(false)}
                groups={safeGroups}
                setGroups={setGroups}
                participants={safeParticipants}
                setParticipants={setParticipants}
                newGroupData={newGroupData}
                setNewGroupData={setNewGroupData}
                onAddGroup={handleAddGroup}
                onDeleteGroup={handleDeleteGroup}
            />

            <ParticipantDetails
                viewingParticipant={viewingParticipant}
                setViewingParticipant={setViewingParticipant}
                handleEdit={handleEdit}
                groups={safeGroups}
            />

            <ParticipantForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleSubmit}
                editingId={editingId}
                groups={safeGroups}
            />

            {/* Styles injectés localement pour ce composant (et ses enfants) */}
            <style>{`
                /* Badges */
                .badge-stat {
                    display: flex; align-items: center; gap: 0.6rem;
                    padding: 0.4rem 0.8rem; border-radius: 8px;
                    font-size: 0.9rem; font-weight: 600;
                    background: #f1f5f9; color: #64748b;
                }
                
                /* Buttons */
                .btn-icon-only {
                    padding: 0.6rem; border-radius: 8px; border: 1px solid var(--border-color);
                    background: white; color: var(--text-muted); cursor: pointer; transition: all 0.2s;
                }
                .btn-icon-only:hover { background: #f8fafc; color: var(--primary-color); border-color: var(--primary-color); }

                /* Filters */
                .select-filter {
                    padding: 0.6rem 2rem 0.6rem 1rem; border-radius: 8px;
                    border: 1px solid var(--border-color); background: white;
                    font-size: 0.9rem; color: #475569; cursor: pointer;
                }
                .view-toggle {
                    border: none; background: transparent; padding: 0.4rem 0.6rem;
                    border-radius: 6px; cursor: pointer; color: #94a3b8;
                }
                .view-toggle.active { background: #f1f5f9; color: var(--primary-color); box-shadow: 0 1px 2px rgba(0,0,0,0.05); }

                /* Data Table */
                .data-table { width: 100%; border-collapse: separate; border-spacing: 0; }
                .data-table thead th {
                    text-align: left; padding: 1rem; color: #64748b; font-weight: 600;
                    border-bottom: 1px solid var(--border-color); cursor: pointer; user-select: none;
                    position: sticky; top: 0; background: white; z-index: 10;
                }
                .data-table thead th:hover { color: var(--primary-color); background: #f8fafc; }
                .data-table tbody tr { transition: background 0.1s; }
                .data-table tbody tr:hover { background: #f8fafc; }
                .data-table tbody tr.selected { background: rgba(59, 130, 246, 0.05); }
                .data-table td { padding: 1rem; vertical-align: middle; border-bottom: 1px solid #f1f5f9; }
                
                .action-buttons { display: flex; justify-content: flex-end; gap: 0.5rem; opacity: 0.6; transition: opacity 0.2s; }
                .data-table tr:hover .action-buttons { opacity: 1; }
                .action-buttons button {
                    background: none; border: none; cursor: pointer; padding: 6px;
                    color: #94a3b8; border-radius: 6px;
                }
                .action-buttons button:hover { background: #e2e8f0; color: #475569; }
                .action-buttons button.delete:hover { background: #fee2e2; color: #ef4444; }
                .action-buttons .divider { width: 1px; background: #cbd5e1; margin: 0 4px; }

                /* Cards Grid */
                .participant-card {
                    background: white; border-radius: 12px; border: 1px solid var(--border-color);
                    box-shadow: 0 1px 3px rgba(0,0,0,0.05); overflow: hidden;
                    display: flex; flexDirection: column; transition: all 0.2s; cursor: pointer;
                    position: relative;
                }
                .participant-card:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border-color: #cbd5e1; }
                .participant-card.selected { border-color: var(--primary-color); ring: 2px var(--primary-color); }
                
                .card-role-strip { height: 6px; width: 100%; }
                .card-role-strip.child { background: var(--primary-color); }
                .card-role-strip.animator { background: var(--secondary-color); }
                .card-role-strip.direction { background: #8b5cf6; }

                .card-header { padding: 1rem; display: flex; gap: 1rem; align-items: center; }
                .card-tags { padding: 0 1rem; display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.5rem; }
                .card-info { padding: 0 1rem; margin-bottom: 1rem; min-height: 24px; }
                
                .card-actions {
                    margin-top: auto; padding: 0.75rem 1rem; background: #f8fafc; border-top: 1px solid #f1f5f9;
                    display: flex; gap: 0.5rem; align-items: center;
                }
                .card-actions button {
                    background: white; border: 1px solid #e2e8f0; border-radius: 6px;
                    padding: 6px; cursor: pointer; color: #64748b; transition: all 0.1s;
                }
                .card-actions button:hover { border-color: #cbd5e1; color: #334155; }
                .card-actions button.danger:hover { border-color: #fecaca; color: #ef4444; background: #fef2f2; }

                /* Modal & Form */
                .modal-overlay {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px);
                    display: flex; justify-content: center; alignItems: center; z-index: 100;
                }
                .modal-content {
                    background: white; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
                    display: flex; flexDirection: column; max-height: 90vh;
                }
                .modal-header {
                    padding: 1.5rem; border-bottom: 1px solid #e2e8f0;
                    display: flex; justify-content: space-between; alignItems: center;
                }
                .modal-header h3 { font-size: 1.25rem; font-weight: 700; color: #1e293b; margin: 0; }
                .close-btn { background: none; border: none; cursor: pointer; color: #94a3b8; }
                .close-btn:hover { color: #475569; }

                .modal-body { padding: 2rem; overflow-y: auto; }
                .modal-footer {
                    padding: 1.5rem; border-top: 1px solid #e2e8f0; background: #f8fafc;
                    display: flex; justify-content: flex-end; gap: 1rem; border-radius: 0 0 16px 16px;
                }

                /* Form Layouts */
                .form-row-aligned {
                    display: grid;
                    grid-template-columns: 100px 1fr 100px 1fr;
                    align-items: center;
                    gap: 1rem;
                }
                /* For rows with just one field */
                .form-row-aligned > .role-selector,
                .form-row-aligned > textarea,
                .form-row-aligned > .input-field:only-of-type {
                    grid-column: 2 / span 3;
                }

                .form-group label, .form-row-aligned label { 
                    font-size: 0.9rem; font-weight: 600; color: #475569; text-align: right; 
                }
                .input-field {
                    padding: 0.75rem 1rem; border: 1px solid #cbd5e1; border-radius: 8px;
                    font-size: 1rem; transition: border-color 0.2s; width: 100%;
                }
                .input-field:focus { outline: none; border-color: var(--primary-color); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }

                /* Custom Role Selector */
                .role-selector {
                    display: flex; background: #f1f5f9; padding: 4px; border-radius: 12px;
                    width: 100%;
                }
                .role-option {
                    flex: 1; text-align: center; padding: 0.5rem; border-radius: 8px;
                    cursor: pointer; font-weight: 500; font-size: 0.9rem; color: #64748b;
                    transition: all 0.2s;
                }
                .role-option.active {
                    background: white; color: var(--primary-color); font-weight: 700;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }
                
                /* Medical Card */
                .medical-card {
                    background: #fff1f2; border: 1px solid #fecdd3; border-radius: 12px;
                    overflow: hidden; margin-bottom: 1rem;
                }
                .medical-header {
                    background: #ffe4e6; padding: 0.75rem 1rem;
                    display: flex; alignItems: center; gap: 0.5rem;
                    color: #be123c; font-weight: 600; font-size: 0.9rem;
                }
                .medical-item {
                    padding: 1rem; border-bottom: 1px solid #ffe4e6;
                }
                .medical-item:last-child { border-bottom: none; }
                .medical-item .label {
                    display: block; font-size: 0.75rem; text-transform: uppercase;
                    color: #9f1239; margin-bottom: 0.25rem; font-weight: 600;
                }
                .medical-item .value {
                    color: #881337; font-weight: 500; line-height: 1.4;
                }

                .empty-state-card {
                    border: 1px dashed #cbd5e1; border-radius: 12px;
                    padding: 2rem; display: flex; flexDirection: column; alignItems: center;
                    gap: 0.75rem; color: #94a3b8; font-weight: 500;
                }

                .drawer-footer {
                    padding-top: 1.5rem; border-top: 1px solid #e2e8f0;
                    display: flex; gap: 1rem; margin-top: 1rem;
                }
                .drawer-footer button { flex: 1; justify-content: center; }
                
                /* Info List - used in details */
                .info-list {
                    background: white; border-radius: 12px;
                    border: 1px solid #f1f5f9; padding: 0.5rem;
                    margin-bottom: 2rem;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.02);
                }
                .info-item {
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 0.75rem 1rem;
                    border-bottom: 1px solid #f8fafc;
                }
                .info-item:last-child { border-bottom: none; }
                .info-item .label {
                    color: #94a3b8; font-size: 0.9rem; font-weight: 500;
                }
                .info-item .value {
                    color: #334155; font-weight: 600; font-size: 0.95rem;
                    text-align: right;
                }
                .info-item .sub {
                    font-weight: 400; color: #94a3b8; font-size: 0.85rem; margin-left: 0.5rem;
                }
                .value-row {
                    display: flex; alignItems: center; gap: 0.5rem; justify-content: flex-end;
                }
                .value-row .icon { color: #cbd5e1; }
                
                /* Profile Section */
                .profile-section {
                    display: flex; flexDirection: column; alignItems: center;
                    margin-top: -55px; margin-bottom: 2rem;
                }
                .profile-avatar {
                    border: 6px solid white; border-radius: 50%;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    margin-bottom: 1rem; background: white;
                }
            `}</style>
        </div>
    );
}
