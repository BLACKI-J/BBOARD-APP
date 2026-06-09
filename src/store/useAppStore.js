import { create } from 'zustand';

/**
 * Minimal global store — holds shared read data so child components
 * don't need deep prop drilling. Write operations stay in App.jsx via callbacks.
 *
 * Usage: const participants = useAppStore(s => s.participants);
 */
const useAppStore = create((set) => ({
    // Core data (alimentée par App.jsx après les fetchs API)
    participants: [],
    groups: [],
    activities: [],
    incidentSheets: [],
    exitSheets: [],
    meetingRecaps: [],
    inventoryItems: [],
    menus: {},

    // Setters (appelés depuis App.jsx)
    setParticipants: (participants) => set({ participants }),
    setGroups: (groups) => set({ groups }),
    setActivities: (activities) => set({ activities }),
    setIncidentSheets: (incidentSheets) => set({ incidentSheets }),
    setExitSheets: (exitSheets) => set({ exitSheets }),
    setMeetingRecaps: (meetingRecaps) => set({ meetingRecaps }),
    setInventoryItems: (inventoryItems) => set({ inventoryItems }),
    setMenus: (menus) => set({ menus }),
}));

export default useAppStore;
