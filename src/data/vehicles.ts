import { Vehicle, TempPoint, TempAnomaly, BatchInfo } from '@/types';

const generateTempPoints = (
  startTime: Date,
  count: number,
  intervalMin: number,
  zoneBaseTemp: number,
  anomalyIndexes: number[] = []
): TempPoint[] => {
  const points: TempPoint[] = [];
  for (let i = 0; i < count; i++) {
    const time = new Date(startTime.getTime() + i * intervalMin * 60 * 1000);
    let temp = zoneBaseTemp + (Math.random() - 0.5) * 2;
    if (anomalyIndexes.includes(i)) {
      temp = zoneBaseTemp + 5 + Math.random() * 3;
    }
    points.push({
      time: time.toISOString(),
      temp: Number(temp.toFixed(1))
    });
  }
  return points;
};

const now = new Date();

const createAnomaly = (
  id: string,
  startOffsetMin: number,
  durationMin: number,
  location: string,
  maxTemp: number,
  remark: string,
  status: 'warning' | 'danger' = 'warning'
): TempAnomaly => {
  const startTime = new Date(now.getTime() - (180 - startOffsetMin) * 60 * 1000);
  const endTime = new Date(startTime.getTime() + durationMin * 60 * 1000);
  return {
    id,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    duration: durationMin,
    location,
    maxTemp,
    minTemp: -20,
    driverRemark: remark,
    status
  };
};

const batchesFrozen: BatchInfo[] = [
  { batchNo: 'B20260621001', productName: '进口牛排', quantity: 50, unit: '箱', productionDate: '2026-06-18', expireDate: '2026-12-18' },
  { batchNo: 'B20260621002', productName: '速冻水饺', quantity: 80, unit: '箱', productionDate: '2026-06-15', expireDate: '2026-12-15' },
  { batchNo: 'B20260621003', productName: '冷冻虾仁', quantity: 30, unit: '箱', productionDate: '2026-06-10', expireDate: '2026-09-10' }
];

const batchesChilled: BatchInfo[] = [
  { batchNo: 'C20260621001', productName: '鲜牛奶', quantity: 120, unit: '箱', productionDate: '2026-06-20', expireDate: '2026-06-27' },
  { batchNo: 'C20260621002', productName: '酸奶', quantity: 60, unit: '箱', productionDate: '2026-06-19', expireDate: '2026-07-03' },
  { batchNo: 'C20260621003', productName: '鲜鸡蛋', quantity: 40, unit: '箱', productionDate: '2026-06-18', expireDate: '2026-07-18' }
];

const loadingTime1 = new Date(now.getTime() - 180 * 60 * 1000);
const loadingTime2 = new Date(now.getTime() - 120 * 60 * 1000);
const loadingTime3 = new Date(now.getTime() - 240 * 60 * 1000);
const loadingTime4 = new Date(now.getTime() - 60 * 60 * 1000);

export const vehicles: Vehicle[] = [
  {
    id: 'V001',
    plateNo: '沪A·88888',
    driverName: '张师傅',
    driverPhone: '138****1234',
    deliveryNo: 'DN20260621001',
    storeNo: 'SH001',
    storeName: '上海浦东店',
    loadingTime: loadingTime1.toISOString(),
    estimatedArrival: new Date(now.getTime() + 15 * 60 * 1000).toISOString(),
    tempZone: 'frozen',
    tempMin: -25,
    tempMax: -15,
    currentTemp: -19.2,
    status: 'arriving',
    recentTemps: generateTempPoints(new Date(now.getTime() - 120 * 60 * 1000), 24, 5, -19, [8, 9, 10]),
    fullTemps: generateTempPoints(loadingTime1, 36, 5, -19, [15, 16, 17]),
    anomalies: [
      createAnomaly('A001', 90, 15, 'G60沪昆高速枫泾服务区', -12.5, '过收费站排队15分钟，已打开备用制冷', 'warning')
    ],
    batches: batchesFrozen
  },
  {
    id: 'V002',
    plateNo: '沪B·66666',
    driverName: '李师傅',
    driverPhone: '139****5678',
    deliveryNo: 'DN20260621002',
    storeNo: 'SH001',
    storeName: '上海浦东店',
    loadingTime: loadingTime2.toISOString(),
    estimatedArrival: new Date(now.getTime() + 45 * 60 * 1000).toISOString(),
    tempZone: 'chilled',
    tempMin: 0,
    tempMax: 8,
    currentTemp: 4.2,
    status: 'transit',
    recentTemps: generateTempPoints(new Date(now.getTime() - 120 * 60 * 1000), 24, 5, 4),
    fullTemps: generateTempPoints(loadingTime2, 24, 5, 4),
    anomalies: [],
    batches: batchesChilled
  },
  {
    id: 'V003',
    plateNo: '沪C·99999',
    driverName: '王师傅',
    driverPhone: '137****9012',
    deliveryNo: 'DN20260621003',
    storeNo: 'SH001',
    storeName: '上海浦东店',
    loadingTime: loadingTime3.toISOString(),
    estimatedArrival: new Date(now.getTime() + 90 * 60 * 1000).toISOString(),
    tempZone: 'frozen',
    tempMin: -25,
    tempMax: -15,
    currentTemp: -18.5,
    status: 'transit',
    recentTemps: generateTempPoints(new Date(now.getTime() - 120 * 60 * 1000), 24, 5, -18.5),
    fullTemps: generateTempPoints(loadingTime3, 48, 5, -18.5),
    anomalies: [],
    batches: [
      { batchNo: 'B20260621010', productName: '速冻汤圆', quantity: 100, unit: '箱', productionDate: '2026-06-01', expireDate: '2026-12-01' },
      { batchNo: 'B20260621011', productName: '冷冻薯条', quantity: 60, unit: '箱', productionDate: '2026-05-20', expireDate: '2026-11-20' }
    ]
  },
  {
    id: 'V004',
    plateNo: '沪D·11111',
    driverName: '赵师傅',
    driverPhone: '136****3456',
    deliveryNo: 'DN20260621004',
    storeNo: 'SH001',
    storeName: '上海浦东店',
    loadingTime: loadingTime4.toISOString(),
    estimatedArrival: new Date(now.getTime() + 180 * 60 * 1000).toISOString(),
    tempZone: 'chilled',
    tempMin: 0,
    tempMax: 8,
    currentTemp: 5.8,
    status: 'loading',
    recentTemps: [],
    fullTemps: generateTempPoints(loadingTime4, 12, 5, 5.5),
    anomalies: [],
    batches: [
      { batchNo: 'C20260621010', productName: '新鲜蔬菜', quantity: 80, unit: '箱', productionDate: '2026-06-21', expireDate: '2026-06-25' },
      { batchNo: 'C20260621011', productName: '新鲜水果', quantity: 50, unit: '箱', productionDate: '2026-06-21', expireDate: '2026-06-28' }
    ]
  }
];

export const getVehicleById = (id: string): Vehicle | undefined => {
  return vehicles.find(v => v.id === id);
};

export const getVehicleByDeliveryNo = (no: string): Vehicle | undefined => {
  return vehicles.find(v => v.deliveryNo === no);
};

export const getVehiclesByStoreNo = (storeNo: string): Vehicle[] => {
  return vehicles.filter(v => v.storeNo === storeNo);
};
