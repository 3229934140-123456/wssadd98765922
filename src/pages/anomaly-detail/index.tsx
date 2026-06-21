import React, { useState, useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import TempFullChart from '@/components/TempFullChart';
import { getVehicleById } from '@/data/vehicles';
import { Vehicle, TempAnomaly, TempPoint, TempStatus } from '@/types';
import { formatDateTime, formatTime, getDurationText } from '@/utils';
import { formatTemp, getTempRange, checkTempStatus } from '@/utils/temperature';

const AnomalyDetailPage: React.FC = () => {
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [anomaly, setAnomaly] = useState<TempAnomaly | null>(null);

  useDidShow(() => {
    const vehicleId = router.params.vehicleId as string;
    const anomalyId = router.params.anomalyId as string;
    const v = getVehicleById(vehicleId);
    if (v) {
      setVehicle(v);
      const a = v.anomalies.find(anom => anom.id === anomalyId);
      if (a) setAnomaly(a);
    }
  });

  const anomalyChartTemps = useMemo((): TempPoint[] => {
    if (!vehicle || !anomaly) return [];
    const startTime = new Date(anomaly.startTime).getTime();
    const endTime = new Date(anomaly.endTime).getTime();
    return vehicle.fullTemps.filter(t => {
      const tt = new Date(t.time).getTime();
      return tt >= startTime - 10 * 60 * 1000 && tt <= endTime + 10 * 60 * 1000;
    });
  }, [vehicle, anomaly]);

  const timelineEvents = useMemo(() => {
    if (!anomaly) return [];
    return [
      {
        time: anomaly.startTime,
        event: '温度开始上升',
        desc: '车厢温度开始超出标准范围上限',
        type: anomaly.status as TempStatus
      },
      {
        time: new Date(new Date(anomaly.startTime).getTime() + anomaly.duration * 60 * 1000 / 2).toISOString(),
        event: '温度达到峰值',
        desc: `最高温度 ${formatTemp(anomaly.maxTemp)}，${anomaly.driverRemark}`,
        type: anomaly.status as TempStatus
      },
      {
        time: anomaly.endTime,
        event: '温度恢复正常',
        desc: '车厢温度回落至标准范围内',
        type: 'normal' as TempStatus
      }
    ];
  }, [anomaly]);

  if (!vehicle || !anomaly) {
    return (
      <View className={styles.pageContainer}>
        <View style={{ padding: 100, textAlign: 'center', color: '#86909C' }}>
          <Text>加载中...</Text>
        </View>
      </View>
    );
  }

  const tempRange = getTempRange(vehicle.tempZone);
  const isDanger = anomaly.status === 'danger';

  return (
    <View className={styles.pageContainer}>
      <View className={classnames(styles.statusBanner, isDanger ? styles.dangerBanner : styles.warningBanner)}>
        <View className={styles.statusIcon}>
          <Text>{isDanger ? '🚨' : '⚠️'}</Text>
        </View>
        <View className={styles.statusInfo}>
          <Text className={styles.statusTitle}>
            {isDanger ? '温度严重超标' : '短时温度波动'}
          </Text>
          <Text className={styles.statusDesc}>
            {formatDateTime(anomaly.startTime)} · 持续 {getDurationText(anomaly.duration)}
          </Text>
        </View>
      </View>

      <View className={styles.sectionCard}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>温度曲线</Text>
        </View>
        <TempFullChart temps={anomalyChartTemps} zone={vehicle.tempZone} title="异常时段温度" />
        <View className={classnames(styles.tempStats, isDanger && styles.dangerStats)}>
          <View className={styles.tempStat}>
            <Text className={classnames(styles.tempVal, isDanger ? styles.dangerText : styles.warningText)}>
              {formatTemp(anomaly.maxTemp)}
            </Text>
            <Text className={styles.tempLbl}>峰值温度</Text>
          </View>
          <View className={styles.tempStat}>
            <Text className={styles.tempVal}>{formatTemp(anomaly.minTemp)}</Text>
            <Text className={styles.tempLbl}>最低温度</Text>
          </View>
          <View className={styles.tempStat}>
            <Text className={styles.tempVal}>{tempRange.min}~{tempRange.max}℃</Text>
            <Text className={styles.tempLbl}>标准范围</Text>
          </View>
        </View>
      </View>

      <View className={styles.sectionCard}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>基本信息</Text>
        </View>
        <View className={styles.infoGrid}>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>开始时间</Text>
            <Text className={styles.infoValue}>{formatDateTime(anomaly.startTime)}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>结束时间</Text>
            <Text className={styles.infoValue}>{formatDateTime(anomaly.endTime)}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>持续时长</Text>
            <Text className={styles.infoValue}>{getDurationText(anomaly.duration)}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>车辆牌号</Text>
            <Text className={styles.infoValue}>{vehicle.plateNo}</Text>
          </View>
        </View>
      </View>

      <View className={styles.sectionCard}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>发生地点</Text>
        </View>
        <View className={styles.locationCard}>
          <Text className={styles.locationIcon}>📍</Text>
          <View className={styles.locationContent}>
            <Text className={styles.locationLabel}>异常发生位置</Text>
            <Text className={styles.locationValue}>{anomaly.location}</Text>
          </View>
        </View>
      </View>

      <View className={styles.sectionCard}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>司机备注</Text>
        </View>
        <View className={styles.remarkCard}>
          <Text className={styles.remarkLabel}>司机 {vehicle.driverName} 说明</Text>
          {anomaly.driverRemark ? (
            <Text className={styles.remarkValue}>{anomaly.driverRemark}</Text>
          ) : (
            <Text className={styles.emptyRemark}>司机未填写备注</Text>
          )}
        </View>
      </View>

      <View className={styles.timelineSection}>
        <View className={styles.sectionHeader} style={{ paddingLeft: 0, paddingRight: 0 }}>
          <Text className={styles.sectionTitle}>事件时间线</Text>
        </View>
        <View className={styles.timeline}>
          {timelineEvents.map((e, i) => (
            <View key={i} className={styles.timelineItem}>
              <View className={classnames(
                styles.timelineDot,
                e.type === 'warning' && styles.warningDot,
                e.type === 'danger' && styles.dangerDot
              )} />
              <View className={styles.timelineContent}>
                <Text className={styles.timelineTime}>{formatTime(e.time)}</Text>
                <Text className={styles.timelineEvent}>{e.event}</Text>
                <Text className={styles.timelineDesc}>{e.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

export default AnomalyDetailPage;
