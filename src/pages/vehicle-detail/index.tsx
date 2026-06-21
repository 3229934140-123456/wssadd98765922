import React, { useState, useMemo } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import TempFullChart from '@/components/TempFullChart';
import TempZoneTag from '@/components/TempZoneTag';
import StatusTag from '@/components/StatusTag';
import { getVehicleById } from '@/data/vehicles';
import { Vehicle, VehicleStatus } from '@/types';
import { formatDateTime, formatTime, getDurationText } from '@/utils';
import { checkTempsCompliance, getTempStatusText, formatTemp, getTempRange } from '@/utils/temperature';

const getStatusText = (status: VehicleStatus): string => {
  const map: Record<VehicleStatus, string> = {
    loading: '装车中',
    transit: '运输中',
    arriving: '即将到达',
    arrived: '已到店'
  };
  return map[status];
};

const VehicleDetailPage: React.FC = () => {
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);

  useDidShow(() => {
    const id = router.params.id as string;
    const v = getVehicleById(id);
    if (v) {
      setVehicle(v);
    }
  });

  const tempStatus = useMemo(() => {
    if (!vehicle) return 'normal' as const;
    return checkTempsCompliance(vehicle.fullTemps, vehicle.tempZone);
  }, [vehicle]);

  const tempRange = useMemo(() => {
    if (!vehicle) return { min: 0, max: 0 };
    return getTempRange(vehicle.tempZone);
  }, [vehicle]);

  const tempStats = useMemo(() => {
    if (!vehicle || vehicle.fullTemps.length === 0) {
      return { min: 0, max: 0, avg: 0 };
    }
    const temps = vehicle.fullTemps.map(t => t.temp);
    return {
      min: Math.min(...temps),
      max: Math.max(...temps),
      avg: temps.reduce((a, b) => a + b, 0) / temps.length
    };
  }, [vehicle]);

  const handleStartAccept = () => {
    if (!vehicle) return;
    Taro.navigateTo({
      url: `/pages/acceptance/index?deliveryNo=${vehicle.deliveryNo}`
    });
  };

  const handleAnomalyClick = (anomalyId: string) => {
    if (!vehicle) return;
    Taro.navigateTo({
      url: `/pages/anomaly-detail/index?vehicleId=${vehicle.id}&anomalyId=${anomalyId}`
    });
  };

  if (!vehicle) {
    return (
      <View className={styles.pageContainer}>
        <View style={{ padding: 100, textAlign: 'center', color: '#86909C' }}>
          <Text>加载中...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.pageContainer}>
      <View className={styles.vehicleInfoCard}>
        <View className={styles.plateRow}>
          <Text className={styles.plateNo}>{vehicle.plateNo}</Text>
          <View className={styles.statusBadge}>
            <Text>{getStatusText(vehicle.status)}</Text>
          </View>
        </View>
        <View style={{ marginBottom: 16 }}>
          <TempZoneTag zone={vehicle.tempZone} />
        </View>
        <View className={styles.infoGrid}>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>装车时间</Text>
            <Text className={styles.infoValue}>{formatDateTime(vehicle.loadingTime)}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>预计到达</Text>
            <Text className={styles.infoValue}>{formatTime(vehicle.estimatedArrival)}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>配送单号</Text>
            <Text className={styles.infoValue}>{vehicle.deliveryNo}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>标准温度</Text>
            <Text className={styles.infoValue}>{tempRange.min}~{tempRange.max}℃</Text>
          </View>
        </View>
      </View>

      <View className={styles.sectionCard}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>运输温度概况</Text>
          <StatusTag type={tempStatus} text={getTempStatusText(tempStatus)} />
        </View>
        <View className={styles.tempSummary}>
          <View className={styles.tempStat}>
            <Text className={styles.tempValue}>{formatTemp(tempStats.min)}</Text>
            <Text className={styles.tempLabel}>最低温度</Text>
          </View>
          <View className={styles.tempStat}>
            <Text className={styles.tempValue}>{formatTemp(tempStats.avg)}</Text>
            <Text className={styles.tempLabel}>平均温度</Text>
          </View>
          <View className={styles.tempStat}>
            <Text className={styles.tempValue}>{formatTemp(tempStats.max)}</Text>
            <Text className={styles.tempLabel}>最高温度</Text>
          </View>
        </View>
        <TempFullChart temps={vehicle.fullTemps} zone={vehicle.tempZone} />
      </View>

      <View className={styles.sectionCard}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>温度异常波动</Text>
          <Text style={{ fontSize: 24, color: '#86909C' }}>共 {vehicle.anomalies.length} 次</Text>
        </View>
        {vehicle.anomalies.length > 0 ? (
          <View className={styles.anomalyList}>
            {vehicle.anomalies.map(a => (
              <View
                key={a.id}
                className={classnames(styles.anomalyItem, a.status === 'danger' && styles.dangerItem)}
                onClick={() => handleAnomalyClick(a.id)}
              >
                <View className={styles.anomalyLeft}>
                  <Text className={styles.anomalyTitle}>温度异常波动</Text>
                  <Text className={styles.anomalyDesc}>
                    {formatTime(a.startTime)}-{formatTime(a.endTime)} · 持续{getDurationText(a.duration)}
                  </Text>
                  <Text className={styles.anomalyDesc}>{a.location}</Text>
                </View>
                <Text className={styles.anomalyRight}>›</Text>
              </View>
            ))}
          </View>
        ) : (
          <View className={styles.emptyAnomaly}>
            <Text>✓ 全程温度正常，无异常波动</Text>
          </View>
        )}
      </View>

      <View className={styles.sectionCard}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>司机信息</Text>
        </View>
        <View className={styles.driverCard}>
          <View className={styles.driverAvatar}>
            <Text>{vehicle.driverName.charAt(0)}</Text>
          </View>
          <View className={styles.driverInfo}>
            <Text className={styles.driverName}>{vehicle.driverName}</Text>
            <Text className={styles.driverPhone}>{vehicle.driverPhone}</Text>
          </View>
          <Button className={styles.callBtn}>联系司机</Button>
        </View>
      </View>

      <View className={styles.sectionCard}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>到货批次</Text>
          <Text style={{ fontSize: 24, color: '#86909C' }}>共 {vehicle.batches.length} 批</Text>
        </View>
        <View className={styles.batchList}>
          {vehicle.batches.map((b, i) => (
            <View key={i} className={styles.batchItem}>
              <View className={styles.batchInfo}>
                <Text className={styles.batchName}>{b.productName}</Text>
                <Text className={styles.batchNo}>批次号 {b.batchNo}</Text>
                <Text className={styles.batchDate}>生产日期 {b.productionDate} · 有效期至 {b.expireDate}</Text>
              </View>
              <Text className={styles.batchQty}>{b.quantity}{b.unit}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.bottomBar}>
        <Button className={styles.bottomBtn}>联系司机</Button>
        <Button className={classnames(styles.bottomBtn, styles.primaryBtn)} onClick={handleStartAccept}>
          开始验收
        </Button>
      </View>
    </View>
  );
};

export default VehicleDetailPage;
