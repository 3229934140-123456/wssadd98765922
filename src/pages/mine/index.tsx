import React, { useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { currentUser } from '@/data/acceptance';
import { acceptanceRecords } from '@/data/records';

const MinePage: React.FC = () => {
  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todayRecords = acceptanceRecords.filter(
      r => new Date(r.acceptTime).toDateString() === today
    );
    return {
      today: todayRecords.length,
      total: acceptanceRecords.length,
      pending: acceptanceRecords.filter(r => r.status === 'reviewing').length
    };
  }, []);

  const menuGroups = [
    {
      title: '收货管理',
      items: [
        { icon: '📱', name: '扫码验收', desc: '扫描配送单二维码快速验收', action: () => Taro.navigateTo({ url: '/pages/scan/index' }) },
        { icon: '🔍', name: '手动查询', desc: '输入配送单号查询并验收', action: () => Taro.navigateTo({ url: '/pages/scan/index?mode=input' }) },
        { icon: '📋', name: '验收记录', desc: '查看历史验收记录', action: () => Taro.switchTab({ url: '/pages/records/index' }) }
      ]
    },
    {
      title: '门店信息',
      items: [
        { icon: '🏪', name: '门店信息', desc: `${currentUser.storeName} (${currentUser.storeNo})`, action: () => {} },
        { icon: '👥', name: '收货团队', desc: '查看门店收货员信息', action: () => {} }
      ]
    },
    {
      title: '其他',
      items: [
        { icon: '📞', name: '联系客服', desc: '如有问题请联系客服', action: () => {} },
        { icon: 'ℹ️', name: '关于我们', desc: '冷链温度追踪 v1.0.0', action: () => {} }
      ]
    }
  ];

  return (
    <View className={styles.pageContainer}>
      <View className={styles.header}>
        <View className={styles.avatar}>
          <Text>{currentUser.name.charAt(0)}</Text>
        </View>
        <View className={styles.userInfo}>
          <Text className={styles.userName}>{currentUser.name}</Text>
          <Text className={styles.userRole}>{currentUser.role}</Text>
          <Text className={styles.storeInfo}>
            工号 {currentUser.employeeId} · {currentUser.storeName}
          </Text>
        </View>
      </View>

      <View className={styles.statsRow}>
        <View className={styles.statItem}>
          <Text className={styles.statNumber}>{stats.today}</Text>
          <Text className={styles.statLabel}>今日验收</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statNumber}>{stats.total}</Text>
          <Text className={styles.statLabel}>累计验收</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statNumber}>{stats.pending}</Text>
          <Text className={styles.statLabel}>待复核</Text>
        </View>
      </View>

      {menuGroups.map((group, gi) => (
        <View key={gi}>
          {group.title && <Text className={styles.menuTitle}>{group.title}</Text>}
          <View className={styles.menuGroup}>
            {group.items.map((item, ii) => (
              <View
                key={ii}
                className={styles.menuItem}
                onClick={item.action}
              >
                <View className={styles.menuIcon}>
                  <Text>{item.icon}</Text>
                </View>
                <View className={styles.menuContent}>
                  <Text className={styles.menuName}>{item.name}</Text>
                  {item.desc && <Text className={styles.menuDesc}>{item.desc}</Text>}
                </View>
                <Text className={styles.menuArrow}>›</Text>
              </View>
            ))}
          </View>
        </View>
      ))}

      <View className={styles.versionInfo}>
        <Text>冷链温度追踪 v1.0.0</Text>
      </View>
    </View>
  );
};

export default MinePage;
