export type TempZone = 'frozen' | 'chilled' | 'ambient';

export type TempStatus = 'normal' | 'warning' | 'danger';

export type VehicleStatus = 'loading' | 'transit' | 'arriving' | 'arrived';

export type AcceptanceResult = 'normal' | 'partial' | 'review';

export type AcceptanceStatus = 'pending' | 'accepted' | 'rejected' | 'reviewing';

export interface TempPoint {
  time: string;
  temp: number;
  location?: string;
}

export interface TempAnomaly {
  id: string;
  startTime: string;
  endTime: string;
  duration: number;
  location: string;
  maxTemp: number;
  minTemp: number;
  driverRemark: string;
  status: TempStatus;
}

export interface BatchInfo {
  batchNo: string;
  productName: string;
  quantity: number;
  unit: string;
  productionDate: string;
  expireDate: string;
}

export interface Vehicle {
  id: string;
  plateNo: string;
  driverName: string;
  driverPhone: string;
  deliveryNo: string;
  storeNo: string;
  storeName: string;
  loadingTime: string;
  estimatedArrival: string;
  actualArrival?: string;
  tempZone: TempZone;
  tempMin: number;
  tempMax: number;
  currentTemp: number;
  status: VehicleStatus;
  recentTemps: TempPoint[];
  fullTemps: TempPoint[];
  anomalies: TempAnomaly[];
  batches: BatchInfo[];
}

export interface AcceptanceRecord {
  id: string;
  deliveryNo: string;
  plateNo: string;
  storeName: string;
  acceptTime: string;
  receiver: string;
  result: AcceptanceResult;
  status: AcceptanceStatus;
  tempZone: TempZone;
  tempCompliance: TempStatus;
  remark: string;
  photos: string[];
  batches: BatchInfo[];
}
