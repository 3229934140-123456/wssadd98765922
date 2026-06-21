import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Button, Input } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import VehicleCard from '@/components/VehicleCard';
import { vehicles as mockVehicles } from '@/data/vehicles';
import { currentUser } from '@/data/acceptance';
import { useAppStore } from '@/store';
import { Vehicle, VehicleStatus } from '@/types';

type FilterType = 'all' | VehicleStatus;

const VehiclesPage: React.FC = () => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [showSheet, setShowSheet] = useState(false);
  const [searchKey, setSearchKey] = useState('');
  const { currentStoreNo, currentStoreName, setStore, stores } = useAppStore();

  useDidShow(() => {
    // 每次页面显示，确保数据最新
  });

  const filteredStores = useMemo(() => {
    if (!searchKey.trim()) return stores;
    const key = searchKey.trim().toLowerCase();
    return stores.filter(s =>
      s.no.toLowerCase().includes(key) ||
      s.name.toLowerCase().includes(key)
    );
  }, [stores, searchKey]);

  const storeVehicles = useMemo(() => {
    return mockVehicles.filter(v => v.storeNo === currentStoreNo);
  }, [currentStoreNo]);

  const filteredList = useMemo(() => {
    if (filter === 'all') return storeVehicles;
    return storeVehicles.filter(v => v.status === filter);
  }, [storeVehicles, filter]);

  const isMyStore = currentStoreNo === currentUser.storeNo;

  const handleSelectStore = (no: string, name: string) => {
    setStore(no, name);
    setShowSheet(false);
    setSearchKey('');
    Taro.showToast({ title: `已切换至${name}`, icon: 'none' });
  };

  const handleBackToMine = () => {
    setStore(currentUser.storeNo, currentUser.storeName);
    setShowSheet(false);
    Taro.showToast({ title: '已回到我的门店', icon: 'success' });
  };

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

      <View className={styles.storeRow} onClick={() => setShowSheet(true)}>
        <View className={styles.storeInfo}>
          <Text className={styles.storeName}>
            {currentStoreName}
            {isMyStore && <Text style={{ color: '#00B578', marginLeft: 8, fontSize: 22 }}>（我的门店）</Text>}
          </Text>
          <Text className={styles.storeNo}>门店号 {currentStoreNo}</Text>
        </View>
        <Text className={styles.changeStore}>切换门店 ›</Text>
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
            <Text className={styles.emptyText}>
              {storeVehicles.length === 0 ? '该门店暂无配送车辆' : '暂无车辆'}
            </Text>
            <Text className={styles.emptySubtext}>
              {storeVehicles.length === 0
                ? `${currentStoreName}暂无配送预告，稍后再来查看`
                : '当前筛选条件下没有在途车辆'}
            </Text>
            {!isMyStore && (
              <View className={styles.backToMine} onClick={handleBackToMine}>
                <Text>← 回到我的门店查看</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {showSheet && (
        <View className={styles.mask} onClick={() => setShowSheet(false)}>
          <View className={styles.storeSheet} onClick={e => e.stopPropagation()}>
            <View className={styles.sheetHeader}>
              <Text className={styles.sheetTitle}>选择门店</Text>
              <View className={styles.sheetClose} onClick={() => setShowSheet(false)}>
                <Text>×</Text>
              </View>
            </View>

            <Input
              className={styles.searchInput}
              placeholder="搜索门店号或门店名称"
              value={searchKey}
              onInput={(e) => setSearchKey(e.detail.value)}
              maxlength={30}
            />

            <ScrollView className={styles.storeList} scrollY>
              {filteredStores.length > 0 ? (
                filteredStores.map(s => {
                  const active = s.no === currentStoreNo;
                  const mine = s.no === currentUser.storeNo;
                  const count = mockVehicles.filter(v => v.storeNo === s.no).length;
                  return (
                    <View
                      key={s.no}
                      className={classnames(styles.storeItem, active && styles.activeStore)}
                      onClick={() => handleSelectStore(s.no, s.name)}
                    >
                      <View className={styles.storeItemInfo}>
                        <View className={styles.storeItemName}>
                          <Text>{s.name}</Text>
                          {mine && <Text style={{ color: '#00B578', marginLeft: 8, fontSize: 22 }}>我的门店</Text>}
                        </View>
                        <Text className={styles.storeItemNo}>
                          门店号 {s.no} · 配送中 {count} 辆
                        </Text>
                      </View>
                      {active && <Text className={styles.checkIcon}>✓</Text>}
                    </View>
                  );
                })
              ) : (
                <View className={styles.emptySearch}>
                  <Text>未找到匹配的门店</Text>
                </View>
              )}
            </ScrollView>

            {!isMyStore && (
              <View className={styles.backToMine} onClick={handleBackToMine}>
                <Text>← 切回我的门店（{currentUser.storeName}）</Text>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

export default VehiclesPage;
