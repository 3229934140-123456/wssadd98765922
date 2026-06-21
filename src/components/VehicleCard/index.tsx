import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { Vehicle, VehicleStatus } from '@/types';
import TempZoneTag from '../TempZoneTag';
import TempMiniChart from '../TempMiniChart';
import StatusTag from '../StatusTag';
import { formatTime, formatDateTime } from '@/utils';
import { checkTempsCompliance, getTempStatusText, formatTemp, getTempRange } from '@/utils/temperature';

interface VehicleCardProps {
  vehicle: Vehicle;
}

const getVehicleStatusText = (status: VehicleStatus): string => {
  const map: Record<VehicleStatus, string> = {
    loading: '装车中',
    transit: '运输中',
    arriving: '即将到达',
    arrived: '已到店'
  };
  return map[status];
};

const getVehicleStatusClass = (status: VehicleStatus): string => {
  const map: Record<VehicleStatus, string> = {
    loading: styles.statusLoading,
    transit: styles.statusTransit,
    arriving: styles.statusArriving,
    arrived: styles.statusArrived
  };
  return map[status];
};

const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle }) => {
  const tempStatus = checkTempsCompliance(vehicle.recentTemps, vehicle.tempZone);
  const tempRange = getTempRange(vehicle.tempZone);

  const handleClick = () => {
    Taro.navigateTo({
      url: `/pages/vehicle-detail/index?id=${vehicle.id}`
    });
  };

  return (
    <View className={styles.vehicleCard} onClick={handleClick}>
      <View className={styles.cardHeader}>
        <View className={styles.headerLeft}>
          <Text className={styles.plateNo}>{vehicle.plateNo}</Text>
          <TempZoneTag zone={vehicle.tempZone} />
        </View>
        <View className={classnames(styles.statusBadge, getVehicleStatusClass(vehicle.status))}>
          <Text>{getVehicleStatusText(vehicle.status)}</Text>
        </View>
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
      </View>

      <View className={styles.tempRow}>
        <View className={styles.tempLeft}>
          <Text className={styles.currentTemp}>{formatTemp(vehicle.currentTemp)}</Text>
          <Text className={styles.tempRange}>标准 {tempRange.min}~{tempRange.max}℃</Text>
        </View>
        <View className={styles.tempStatus}>
          <Text className={classnames(styles.tempStatusText, styles[tempStatus])}>
            {getTempStatusText(tempStatus)}
          </Text>
        </View>
      </View>

      <Text className={styles.chartTitle}>近两小时温度走势</Text>
      <TempMiniChart temps={vehicle.recentTemps} zone={vehicle.tempZone} />

      <View className={styles.cardFooter}>
        <View className={styles.driverInfo}>
          <Text className={styles.driverName}>{vehicle.driverName}</Text>
          <Text className={styles.deliveryNo}>配送单 {vehicle.deliveryNo}</Text>
        </View>
        <View className={styles.viewDetail}>
          <Text>查看详情</Text>
          <Text>›</Text>
        </View>
      </View>
    </View>
  );
};

export default VehicleCard;
