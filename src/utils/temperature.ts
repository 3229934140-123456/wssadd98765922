import { TempStatus, TempZone, TempPoint } from '@/types';

export const getTempZoneLabel = (zone: TempZone): string => {
  const map: Record<TempZone, string> = {
    frozen: '冷冻区',
    chilled: '冷藏区',
    ambient: '常温区'
  };
  return map[zone];
};

export const getTempRange = (zone: TempZone): { min: number; max: number } => {
  const map: Record<TempZone, { min: number; max: number }> = {
    frozen: { min: -25, max: -15 },
    chilled: { min: 0, max: 8 },
    ambient: { min: 10, max: 25 }
  };
  return map[zone];
};

export const checkTempStatus = (temp: number, zone: TempZone): TempStatus => {
  const range = getTempRange(zone);
  const diff = Math.max(range.min - temp, temp - range.max);
  if (diff <= 0) return 'normal';
  if (diff <= 3) return 'warning';
  return 'danger';
};

export const checkTempsCompliance = (temps: TempPoint[], zone: TempZone): TempStatus => {
  if (!temps || temps.length === 0) return 'normal';
  let hasWarning = false;
  for (const t of temps) {
    const status = checkTempStatus(t.temp, zone);
    if (status === 'danger') return 'danger';
    if (status === 'warning') hasWarning = true;
  }
  return hasWarning ? 'warning' : 'normal';
};

export const getTempStatusText = (status: TempStatus): string => {
  const map: Record<TempStatus, string> = {
    normal: '温度正常',
    warning: '短时波动',
    danger: '温度超标'
  };
  return map[status];
};

export const formatTemp = (temp: number): string => {
  return `${temp > 0 ? '+' : ''}${temp.toFixed(1)}℃`;
};
