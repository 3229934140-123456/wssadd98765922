import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import { TempPoint, TempZone } from '@/types';
import { checkTempStatus, getTempRange } from '@/utils/temperature';

interface TempMiniChartProps {
  temps: TempPoint[];
  zone: TempZone;
}

const TempMiniChart: React.FC<TempMiniChartProps> = ({ temps, zone }) => {
  if (!temps || temps.length < 2) {
    return (
      <View className={styles.chartContainer}>
        <View className={styles.noData}>
          <Text>暂无温度数据</Text>
        </View>
      </View>
    );
  }

  const range = getTempRange(zone);
  const allTemps = temps.map(t => t.temp);
  const minTemp = Math.min(...allTemps, range.min) - 2;
  const maxTemp = Math.max(...allTemps, range.max) + 2;
  const tempSpan = maxTemp - minTemp || 1;

  const width = 680;
  const height = 100;
  const padding = 4;

  const xStep = (width - padding * 2) / (temps.length - 1);

  const getY = (temp: number): number => {
    return height - padding - ((temp - minTemp) / tempSpan) * (height - padding * 2);
  };

  const points = temps.map((t, i) => {
    const x = padding + i * xStep;
    const y = getY(t.temp);
    const status = checkTempStatus(t.temp, zone);
    return { x, y, status, temp: t.temp };
  });

  let pathD = '';
  points.forEach((p, i) => {
    pathD += i === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`;
  });

  const zoneMinY = getY(range.min);
  const zoneMaxY = getY(range.max);

  return (
    <View className={styles.chartContainer}>
      <svg className={styles.chartSvg} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <rect
          x={padding}
          y={Math.min(zoneMinY, zoneMaxY)}
          width={width - padding * 2}
          height={Math.abs(zoneMaxY - zoneMinY)}
          fill="rgba(0, 181, 120, 0.08)"
        />
        <line x1={padding} y1={zoneMinY} x2={width - padding} y2={zoneMinY} stroke="#00B578" strokeWidth="1" strokeDasharray="4,2" opacity="0.5" />
        <line x1={padding} y1={zoneMaxY} x2={width - padding} y2={zoneMaxY} stroke="#00B578" strokeWidth="1" strokeDasharray="4,2" opacity="0.5" />
        <path d={pathD} fill="none" stroke="#0088CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => {
          const color = p.status === 'normal' ? '#0088CC' : p.status === 'warning' ? '#FF8F1F' : '#F53F3F';
          return <circle key={i} cx={p.x} cy={p.y} r={i === points.length - 1 ? 5 : 2} fill={color} />;
        })}
      </svg>
    </View>
  );
};

export default TempMiniChart;
