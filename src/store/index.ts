import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import Taro from '@tarojs/taro';
import { AcceptanceRecord, AcceptanceResult, AcceptanceStatus, BatchInfo } from '@/types';
import { acceptanceRecords as initialRecords } from '@/data/records';
import { stores as storeList, currentUser } from '@/data/acceptance';

interface AppStore {
  currentStoreNo: string;
  currentStoreName: string;
  setStore: (no: string, name: string) => void;

  records: AcceptanceRecord[];
  addRecord: (record: AcceptanceRecord) => void;
  updateRecordStatus: (id: string, status: AcceptanceStatus, result?: AcceptanceResult, reviewRemark?: string) => void;

  stores: { no: string; name: string }[];
}

const taroStorage = {
  getItem: (name: string): string | Promise<string | null> | null => {
    try {
      return Taro.getStorageSync(name) || null;
    } catch (e) {
      return null;
    }
  },
  setItem: (name: string, value: string): void | Promise<void> => {
    try {
      Taro.setStorageSync(name, value);
    } catch (e) {
      // ignore
    }
  },
  removeItem: (name: string): void | Promise<void> => {
    try {
      Taro.removeStorageSync(name);
    } catch (e) {
      // ignore
    }
  }
};

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      currentStoreNo: currentUser.storeNo,
      currentStoreName: currentUser.storeName,
      setStore: (no, name) => set({ currentStoreNo: no, currentStoreName: name }),

      records: initialRecords,
      addRecord: (record) => set((state) => ({
        records: [record, ...state.records]
      })),
      updateRecordStatus: (id, status, result, reviewRemark) => set((state) => ({
        records: state.records.map(r => {
          if (r.id !== id) return r;
          return {
            ...r,
            status,
            ...(result !== undefined ? { result } : {}),
            ...(reviewRemark ? {
              reviewRemark,
              reviewer: '张主管',
              reviewTime: new Date().toISOString()
            } : {})
          } as AcceptanceRecord;
        })
      })),

      stores: storeList
    }),
    {
      name: 'coldchain-app-storage',
      storage: createJSONStorage(() => taroStorage),
      partialize: (state) => ({
        currentStoreNo: state.currentStoreNo,
        currentStoreName: state.currentStoreName,
        records: state.records
      })
    }
  )
);
