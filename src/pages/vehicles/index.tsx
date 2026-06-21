import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import VehicleCard from '@/components/VehicleCard';
import { vehicles as mockVehicles } from '@/data/vehicles';
import { currentUser } from '@/data/acceptance';
import { Vehicle, VehicleStatus } from '@/types';

type FilterType = 'all' | VehicleStatus;

const VehiclesPage: React.FC = () => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [storeNo] = useState(currentUser.storeNo);
  const [storeName] = useState(currentUser.storeName);
  const [list, setList] = useState<Vehicle[]>(mockVehicles);

  useDidShow(() => {
    setList(mockVehicles);
  });

  const filteredList = useMemo(() => {
    if (filter === 'all') return list;
    return list.filter(v => v.status === filter);
  }, [list, filter]);

  const handleScan = () => {
    Taro.navigateTo({
      url: '/pages/scan/index'
    });
  };

  const handleInputNo = () => {
    Taro.navigateTo({
      url: '/pages/scan/index?mode=input'
    });
  };

  const filterTabs: { key: FilterType; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'loading', label: '装车中' },
    { key: 'transit', label: '运输中' },
    { key: 'arriving', label: '即将到达' },
    { key: 'arrived', label: '已到店' }
  ];

  return (
    <View className={styles.pageContainer}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>冷链温度追踪</Text>
        <Text className={styles.headerSubtitle}>实时掌握在途车辆温度，保障生鲜品质</Text>
      </View>

      <View className={styles.storeRow}>
        <View className={styles.storeInfo}>
          <Text className={styles.storeName}>{storeName}</Text>
          <Text className={styles.storeNo}>门店号 {storeNo}</Text>
        </View>
        <Text className={styles.changeStore}>切换门店</Text>
      </View>

      <View className={styles.actionRow}>
        <Button className={classnames(styles.actionBtn, styles.primaryBtn)} onClick={handleScan}>
          扫码验收
        </Button>
        <Button className={styles.actionBtn} onClick={handleInputNo}>
          输入配送单号
        </Button>
      </View>

      <ScrollView className={styles.filterTabs} scrollX enableFlex>
        {filterTabs.map(tab => (
          <Button
            key={tab.key}
            className={classnames(styles.filterTab, filter === tab.key && styles.activeTab)}
            onClick={() => setFilter(tab.key)}
          >
            {tab.label}
          </Button>
        ))}
      </ScrollView>

      <View className={styles.sectionTitle}>
        <Text className={styles.sectionTitleText}>在途车辆</Text>
        <View className={styles.vehicleCount}>
          <Text>共 {filteredList.length} 辆</Text>
        </View>
      </View>

      <View className={styles.vehicleList}>
        {filteredList.length > 0 ? (
          filteredList.map(vehicle => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>🚚</Text>
            <Text className={styles.emptyText}>暂无车辆</Text>
            <Text className={styles.emptySubtext}>当前筛选条件下没有在途车辆</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default VehiclesPage;
