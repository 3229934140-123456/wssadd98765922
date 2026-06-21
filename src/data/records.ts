import { AcceptanceRecord } from '@/types';

export const acceptanceRecords: AcceptanceRecord[] = [
  {
    id: 'R001',
    deliveryNo: 'DN20260620001',
    plateNo: '沪A·88888',
    storeName: '上海浦东店',
    acceptTime: '2026-06-20T14:30:00.000Z',
    receiver: '收货员小王',
    result: 'normal',
    status: 'accepted',
    tempZone: 'frozen',
    tempCompliance: 'normal',
    remark: '温度全程正常，货物完好',
    photos: [],
    batches: [
      { batchNo: 'B20260620001', productName: '进口牛排', quantity: 50, unit: '箱', productionDate: '2026-06-17', expireDate: '2026-12-17' }
    ]
  },
  {
    id: 'R002',
    deliveryNo: 'DN20260620002',
    plateNo: '沪B·66666',
    storeName: '上海浦东店',
    acceptTime: '2026-06-20T11:20:00.000Z',
    receiver: '收货员小李',
    result: 'partial',
    status: 'accepted',
    tempZone: 'chilled',
    tempCompliance: 'warning',
    remark: '途中有10分钟温度波动，2箱酸奶外包装有水珠，已拒收2箱，其余正常入库',
    photos: [],
    batches: [
      { batchNo: 'C20260620001', productName: '鲜牛奶', quantity: 118, unit: '箱', productionDate: '2026-06-19', expireDate: '2026-06-26' },
      { batchNo: 'C20260620002', productName: '酸奶', quantity: 58, unit: '箱', productionDate: '2026-06-18', expireDate: '2026-07-02' }
    ]
  },
  {
    id: 'R003',
    deliveryNo: 'DN20260619001',
    plateNo: '沪C·99999',
    storeName: '上海浦东店',
    acceptTime: '2026-06-19T16:45:00.000Z',
    receiver: '收货员小王',
    result: 'review',
    status: 'reviewing',
    tempZone: 'frozen',
    tempCompliance: 'danger',
    remark: '全程温度多次超标，已通知主管张经理到场复核',
    photos: [],
    batches: [
      { batchNo: 'B20260619001', productName: '速冻水饺', quantity: 80, unit: '箱', productionDate: '2026-06-14', expireDate: '2026-12-14' }
    ]
  },
  {
    id: 'R004',
    deliveryNo: 'DN20260619002',
    plateNo: '沪D·11111',
    storeName: '上海浦东店',
    acceptTime: '2026-06-19T10:15:00.000Z',
    receiver: '收货员小李',
    result: 'normal',
    status: 'accepted',
    tempZone: 'chilled',
    tempCompliance: 'normal',
    remark: '正常入库',
    photos: [],
    batches: [
      { batchNo: 'C20260619001', productName: '新鲜蔬菜', quantity: 80, unit: '箱', productionDate: '2026-06-19', expireDate: '2026-06-23' }
    ]
  },
  {
    id: 'R005',
    deliveryNo: 'DN20260618001',
    plateNo: '沪A·88888',
    storeName: '上海浦东店',
    acceptTime: '2026-06-18T15:00:00.000Z',
    receiver: '收货员小王',
    result: 'normal',
    status: 'accepted',
    tempZone: 'frozen',
    tempCompliance: 'normal',
    remark: '',
    photos: [],
    batches: [
      { batchNo: 'B20260618001', productName: '冷冻虾仁', quantity: 30, unit: '箱', productionDate: '2026-06-08', expireDate: '2026-09-08' }
    ]
  }
];

export const getRecordById = (id: string): AcceptanceRecord | undefined => {
  return acceptanceRecords.find(r => r.id === id);
};
