import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import { TempPoint, TempZone } from '@/types';
import { checkTempStatus, getTempRange, formatTemp } from '@/utils/temperature';
import { formatTime } from '@/utils';

interface TempFullChartProps {
  temps: TempPoint[];
  zone: TempZone;
  title?: string;
}

const TempFullChart: React.FC<TempFullChartProps> = ({ temps, zone, title = '全程温度曲线' }) => {
  if (!temps || temps.length < 2) {
    return (
      <View className={styles.chartContainer}>
        <View className={styles.chartHeader}>
          <Text className={styles.chartTitle}>{title}</Text>
        </View>
        <View className={styles.noData}>
          <Text>暂无温度数据</Text>
        </View>
      </View>
    );
  }

  const range = getTempRange(zone);
  const allTemps = temps.map(t => t.temp);
  const minTemp = Math.min(...allTemps, range.min) - 3;
  const maxTemp = Math.max(...allTemps, range.max) + 3;
  const tempSpan = maxTemp - minTemp || 1;

  const width = 620;
  const height = 240;
  const padding = { top: 10, right: 10, bottom: 10, left: 10 };
  const chartLeft = 60;

  const xStep = (width - padding.left - padding.right - chartLeft) / (temps.length - 1);

  const getY = (temp: number): number => {
    return height - padding.bottom - ((temp - minTemp) / tempSpan) * (height - padding.top - padding.bottom);
  };

  const points = temps.map((t, i) => {
    const x = chartLeft + padding.left + i * xStep;
    const y = getY(t.temp);
    const status = checkTempStatus(t.temp, zone);
    return { x, y, status, temp: t.temp, time: t.time };
  });

  let pathD = '';
  points.forEach((p, i) => {
    pathD += i === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`;
  });

  const zoneMinY = getY(range.min);
  const zoneMaxY = getY(range.max);

  const yLabels = [];
  const yStep = tempSpan / 4;
  for (let i = 0; i <= 4; i++) {
    yLabels.push((minTemp + i * yStep).toFixed(0));
  }

  const xLabels = [];
  const labelCount = Math.min(5, temps.length);
  const labelStep = Math.floor(temps.length / (labelCount - 1 || 1));
  for (let i = 0; i < labelCount; i++) {
    const idx = Math.min(i * labelStep, temps.length - 1);
    xLabels.push(formatTime(temps[idx].time));
  }

  return (
    <View className={styles.chartContainer}>
      <View className={styles.chartHeader}>
        <Text className={styles.chartTitle}>{title}</Text>
        <View className={styles.chartLegend}>
          <View className={styles.legendItem}>
            <View className={styles.legendLine} style={{ backgroundColor: '#0088CC' }} />
            <Text>实测温度</Text>
          </View>
          <View className={styles.legendItem}>
            <View className={styles.legendLine} style={{ backgroundColor: '#00B578', opacity: 0.5 }} />
            <Text>标准区间</Text>
          </View>
        </View>
      </View>

      <View style={{ position: 'relative' }}>
        <View className={styles.yAxisLabels}>
          {yLabels.slice().reverse().map((label, i) => (
            <Text key={i} className={styles.yLabel}>{label}℃</Text>
          ))}
        </View>

        <svg className={styles.chartSvg} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          <rect
            x={chartLeft + padding.left}
            y={Math.min(zoneMinY, zoneMaxY)}
            width={width - chartLeft - padding.left - padding.right}
            height={Math.abs(zoneMaxY - zoneMinY)}
            fill="rgba(0, 181, 120, 0.08)"
          />
          <line
            x1={chartLeft + padding.left}
            y1={zoneMinY}
            x2={width - padding.right}
            y2={zoneMinY}
            stroke="#00B578"
            strokeWidth="1"
            strokeDasharray="4,2"
            opacity="0.5"
          />
          <line
            x1={chartLeft + padding.left}
            y1={zoneMaxY}
            x2={width - padding.right}
            y2={zoneMaxY}
            stroke="#00B578"
            strokeWidth="1"
            strokeDasharray="4,2"
            opacity="0.5"
          />
          <path d={pathD} fill="none" stroke="#0088CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          {points.map((p, i) => {
            if (p.status === 'normal') return null;
            const color = p.status === 'warning' ? '#FF8F1F' : '#F53F3F';
            return <circle key={i} cx={p.x} cy={p.y} r={4} fill={color} />;
          })}
        </svg>
      </View>

      <View className={styles.xAxisLabels}>
        {xLabels.map((label, i) => (
          <Text key={i} className={styles.xLabel}>{label}</Text>
        ))}
      </View>
    </View>
  );
};

export default TempFullChart;
