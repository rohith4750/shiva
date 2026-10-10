import { create } from "zustand";
import { User } from "@/types/user";

export type RowDensity = "compact" | "standard" | "spacious";
export type SortField = "name" | "email" | "role" | "created_at" | "department";
export type SortOrder = "asc" | "desc";
export type ModalType = "add" | "edit" | "delete" | "details" | null;

export const ROW_HEIGHTS: Record<RowDensity, number> = {
  compact: 46,
  standard: 62,
  spacious: 78,
};

interface UserState {
  // --- Search & Filters ---
  searchQuery: string;
  selectedRole: string;
  statusFilter: "all" | "active" | "inactive";
  
  // --- Sorting ---
  sortBy: SortField;
  sortOrder: SortOrder;
  
  // --- Selection State ---
  selectedUserIds: string[];
  
  // --- Virtualization & UI Preferences ---
  viewMode: "virtualized" | "standard";
  rowDensity: RowDensity;
  virtualOverscan: number;
  mockDataCount: number; // 0 = real DB only, 1000 or 5000 = stress-test virtualization
  
  // --- Modal & Selection ---
  activeModal: ModalType;
  targetUser: User | null;

  // --- Actions ---
  setSearchQuery: (query: string) => void;
  setSelectedRole: (role: string) => void;
  setStatusFilter: (status: "all" | "active" | "inactive") => void;
  setSort: (field: SortField) => void;
  
  // Selection Actions
  toggleSelectUser: (id: string | number) => void;
  selectAllUsers: (ids: (string | number)[]) => void;
  clearSelection: () => void;

  // Virtualization Actions
  setViewMode: (mode: "virtualized" | "standard") => void;
  setRowDensity: (density: RowDensity) => void;
  setVirtualOverscan: (overscan: number) => void;
  setMockDataCount: (count: number) => void;

  // Modal Actions
  openModal: (type: ModalType, user?: User | null) => void;
  closeModal: () => void;

  // Reset
  resetFilters: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  // Defaults
  searchQuery: "",
  selectedRole: "All",
  statusFilter: "all",
  
  sortBy: "created_at",
  sortOrder: "desc",
  
  selectedUserIds: [],
  
  viewMode: "virtualized",
  rowDensity: "standard",
  virtualOverscan: 10,
  mockDataCount: 0,
  
  activeModal: null,
  targetUser: null,

  // Action implementations
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  
  setSelectedRole: (selectedRole) => set({ selectedRole }),
  
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  
  setSort: (field) =>
    set((state) => ({
      sortBy: field,
      sortOrder: state.sortBy === field && state.sortOrder === "asc" ? "desc" : "asc",
    })),

  toggleSelectUser: (rawId) =>
    set((state) => {
      const id = String(rawId);
      const exists = state.selectedUserIds.includes(id);
      return {
        selectedUserIds: exists
          ? state.selectedUserIds.filter((item) => item !== id)
          : [...state.selectedUserIds, id],
      };
    }),

  selectAllUsers: (ids) =>
    set({
      selectedUserIds: ids.map((id) => String(id)),
    }),

  clearSelection: () => set({ selectedUserIds: [] }),

  setViewMode: (viewMode) => set({ viewMode }),

  setRowDensity: (rowDensity) => set({ rowDensity }),

  setVirtualOverscan: (virtualOverscan) => set({ virtualOverscan }),

  setMockDataCount: (mockDataCount) => set({ mockDataCount }),

  openModal: (activeModal, targetUser = null) =>
    set({ activeModal, targetUser: targetUser ?? null }),

  closeModal: () => set({ activeModal: null, targetUser: null }),

  resetFilters: () =>
    set({
      searchQuery: "",
      selectedRole: "All",
      statusFilter: "all",
      sortBy: "created_at",
      sortOrder: "desc",
    }),
}));
