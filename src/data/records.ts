import { AcceptanceRecord, TempPoint, TempAnomalySnapshot } from '@/types';
import { vehicles } from './vehicles';

const generateTemps = (base: number, count: number, anomalyIdx: number[] = []): TempPoint[] => {
  const start = new Date(Date.now() - count * 5 * 60 * 1000);
  const arr: TempPoint[] = [];
  for (let i = 0; i < count; i++) {
    const t = new Date(start.getTime() + i * 5 * 60 * 1000);
    let v = base + (Math.random() - 0.5) * 2;
    if (anomalyIdx.includes(i)) v = base + 5 + Math.random() * 3;
    arr.push({ time: t.toISOString(), temp: Number(v.toFixed(1)) });
  }
  return arr;
};

const vFrozen = vehicles.find(v => v.id === 'V001');
const vChilled = vehicles.find(v => v.id === 'V002');
const vFrozen2 = vehicles.find(v => v.id === 'V003');
const vChilled2 = vehicles.find(v => v.id === 'V004');

const frozenTempsGood = generateTemps(-19, 36);
const chilledTempsWarn = generateTemps(4, 30, [10, 11, 12]);
const frozenTempsBad = generateTemps(-18, 40, [8, 9, 10, 18, 19, 20, 28, 29, 30]);
const chilledTempsGood = generateTemps(5, 24);
const frozenTempsGood2 = generateTemps(-20, 36);

const anomaliesDanger: TempAnomalySnapshot[] = [
  { id: 'A-R003-1', startTime: new Date(Date.now() - 200 * 60 * 1000).toISOString(), endTime: new Date(Date.now() - 180 * 60 * 1000).toISOString(), duration: 20, location: 'G15沈海高速朱桥收费站', maxTemp: -8.2, status: 'danger', driverRemark: '前方交通事故堵车，制冷机组工作正常但箱体温度缓慢上升' },
  { id: 'A-R003-2', startTime: new Date(Date.now() - 140 * 60 * 1000).toISOString(), endTime: new Date(Date.now() - 125 * 60 * 1000).toISOString(), duration: 15, location: 'S20外环高速曹路服务区', maxTemp: -10.5, status: 'danger', driverRemark: '等待装卸区开门排队15分钟' },
  { id: 'A-R003-3', startTime: new Date(Date.now() - 60 * 60 * 1000).toISOString(), endTime: new Date(Date.now() - 48 * 60 * 1000).toISOString(), duration: 12, location: '门店附近市区道路', maxTemp: -9.8, status: 'warning', driverRemark: '市区严重堵车，已加开备用制冷' }
];

const anomaliesWarn: TempAnomalySnapshot[] = [
  { id: 'A-R002-1', startTime: new Date(Date.now() - 120 * 60 * 1000).toISOString(), endTime: new Date(Date.now() - 110 * 60 * 1000).toISOString(), duration: 10, location: '市区延安高架', maxTemp: 11.2, status: 'warning', driverRemark: '高架堵车约10分钟' }
];

export const acceptanceRecords: AcceptanceRecord[] = [
  {
    id: 'R001',
    deliveryNo: 'DN20260620001',
    plateNo: '沪A·88888',
    storeName: '上海浦东店',
    storeNo: 'SH001',
    acceptTime: '2026-06-20T14:30:00.000Z',
    receiver: '收货员小王',
    receiverId: 'EMP20260002',
    result: 'normal',
    status: 'accepted',
    tempZone: 'frozen',
    tempCompliance: 'normal',
    remark: '温度全程正常，货物完好，包装无破损',
    photos: [],
    batches: [
      { batchNo: 'B20260620001', productName: '进口牛排', quantity: 50, unit: '箱', productionDate: '2026-06-17', expireDate: '2026-12-17' }
    ],
    vehicleId: 'V001',
    fullTemps: vFrozen?.fullTemps || frozenTempsGood,
    tempAnomalies: vFrozen?.anomalies.map(a => ({
      id: a.id, startTime: a.startTime, endTime: a.endTime, duration: a.duration,
      location: a.location, maxTemp: a.maxTemp, status: a.status, driverRemark: a.driverRemark
    })) || [],
    driverName: vFrozen?.driverName || '张师傅',
    driverPhone: vFrozen?.driverPhone || '138****1234'
  },
  {
    id: 'R002',
    deliveryNo: 'DN20260620002',
    plateNo: '沪B·66666',
    storeName: '上海浦东店',
    storeNo: 'SH001',
    acceptTime: '2026-06-20T11:20:00.000Z',
    receiver: '收货员小李',
    receiverId: 'EMP20260003',
    result: 'partial',
    status: 'accepted',
    tempZone: 'chilled',
    tempCompliance: 'warning',
    remark: '途中有10分钟温度波动，2箱酸奶外包装有水珠且表面回温，已拒收2箱，其余118箱鲜牛奶和58箱酸奶检查完好，正常入库。现场已拍照留证。',
    photos: [],
    batches: [
      { batchNo: 'C20260620001', productName: '鲜牛奶', quantity: 118, unit: '箱', productionDate: '2026-06-19', expireDate: '2026-06-26' },
      { batchNo: 'C20260620002', productName: '酸奶（拒收2箱）', quantity: 58, unit: '箱', productionDate: '2026-06-18', expireDate: '2026-07-02' }
    ],
    vehicleId: 'V002',
    fullTemps: vChilled?.fullTemps || chilledTempsWarn,
    tempAnomalies: vChilled?.anomalies.map(a => ({
      id: a.id, startTime: a.startTime, endTime: a.endTime, duration: a.duration,
      location: a.location, maxTemp: a.maxTemp, status: a.status, driverRemark: a.driverRemark
    })) || anomaliesWarn,
    driverName: vChilled?.driverName || '李师傅',
    driverPhone: vChilled?.driverPhone || '139****5678'
  },
  {
    id: 'R003',
    deliveryNo: 'DN20260619001',
    plateNo: '沪C·99999',
    storeName: '上海浦东店',
    storeNo: 'SH001',
    acceptTime: '2026-06-19T16:45:00.000Z',
    receiver: '收货员小王',
    receiverId: 'EMP20260002',
    result: 'review',
    status: 'reviewing',
    tempZone: 'frozen',
    tempCompliance: 'danger',
    remark: '全程温度多次超标，共3段异常（累计约47分钟），货物表面有轻微结霜融化现象。收货员无法独立判断品质，已通知主管张经理到场复核，车辆暂停靠待检区，制冷机组保持工作。',
    photos: [],
    batches: [
      { batchNo: 'B20260619001', productName: '速冻水饺（待复核）', quantity: 80, unit: '箱', productionDate: '2026-06-14', expireDate: '2026-12-14' }
    ],
    vehicleId: 'V003',
    fullTemps: vFrozen2?.fullTemps || frozenTempsBad,
    tempAnomalies: vFrozen2?.anomalies.map(a => ({
      id: a.id, startTime: a.startTime, endTime: a.endTime, duration: a.duration,
      location: a.location, maxTemp: a.maxTemp, status: a.status, driverRemark: a.driverRemark
    })) || anomaliesDanger,
    driverName: vFrozen2?.driverName || '王师傅',
    driverPhone: vFrozen2?.driverPhone || '137****9012'
  },
  {
    id: 'R004',
    deliveryNo: 'DN20260619002',
    plateNo: '沪D·11111',
    storeName: '上海浦东店',
    storeNo: 'SH001',
    acceptTime: '2026-06-19T10:15:00.000Z',
    receiver: '收货员小李',
    receiverId: 'EMP20260003',
    result: 'normal',
    status: 'accepted',
    tempZone: 'chilled',
    tempCompliance: 'normal',
    remark: '全程温度平稳，蔬菜新鲜度良好，正常入库',
    photos: [],
    batches: [
      { batchNo: 'C20260619001', productName: '新鲜蔬菜', quantity: 80, unit: '箱', productionDate: '2026-06-19', expireDate: '2026-06-23' }
    ],
    vehicleId: 'V004',
    fullTemps: vChilled2?.fullTemps || chilledTempsGood,
    tempAnomalies: [],
    driverName: vChilled2?.driverName || '赵师傅',
    driverPhone: vChilled2?.driverPhone || '136****3456'
  },
  {
    id: 'R005',
    deliveryNo: 'DN20260618001',
    plateNo: '沪A·88888',
    storeName: '上海浦东店',
    storeNo: 'SH001',
    acceptTime: '2026-06-18T15:00:00.000Z',
    receiver: '收货员小王',
    receiverId: 'EMP20260002',
    result: 'normal',
    status: 'accepted',
    tempZone: 'frozen',
    tempCompliance: 'normal',
    remark: '',
    photos: [],
    batches: [
      { batchNo: 'B20260618001', productName: '冷冻虾仁', quantity: 30, unit: '箱', productionDate: '2026-06-08', expireDate: '2026-09-08' }
    ],
    fullTemps: frozenTempsGood2,
    tempAnomalies: [],
    driverName: '张师傅',
    driverPhone: '138****1234'
  }
];

export const getRecordById = (id: string): AcceptanceRecord | undefined => {
  return acceptanceRecords.find(r => r.id === id);
};
