import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useBranchStore = create(
  persist(
    (set) => ({
      selectedBranchId: '', // '' means 'Barcha filiallar'
      selectedBranchName: 'Barcha filiallar',
      branches: [],

      setSelectedBranch: (id, name) => set({
        selectedBranchId: id || '',
        selectedBranchName: name || 'Barcha filiallar',
      }),

      setBranches: (branches) => set({ branches }),

      resetBranch: () => set({
        selectedBranchId: '',
        selectedBranchName: 'Barcha filiallar',
      }),
    }),
    {
      name: 'abdora-active-branch',
      partialize: (state) => ({
        selectedBranchId: state.selectedBranchId,
        selectedBranchName: state.selectedBranchName,
      }),
    }
  )
);
