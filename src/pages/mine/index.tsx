import React, { useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { currentUser } from '@/data/acceptance';
import { useAppStore } from '@/store';

const MinePage: React.FC = () => {
  const records = useAppStore(s => s.records);
  const currentStoreNo = useAppStore(s => s.currentStoreNo);
  const currentStoreName = useAppStore(s => s.currentStoreName);

  const stats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayRecords = records.filter(r => new Date(r.acceptTime).getTime() >= todayStart);
    return {
      today: todayRecords.length,
      total: records.length,
      pending: records.filter(r => r.status === 'reviewing').length
    };
  }, [records]);

  const menuGroups = [
    {
      title: '收货管理',
      items: [
        {
          icon: '📱',
          name: '扫码验收',
          desc: '扫描配送单二维码快速验收',
          action: () => Taro.navigateTo({ url: '/pages/scan/index' })
        },
        {
          icon: '🔍',
          name: '手动查询',
          desc: '输入配送单号查询并验收',
          action: () => Taro.navigateTo({ url: '/pages/scan/index?mode=input' })
        },
        {
          icon: '📋',
          name: '验收记录',
          desc: '查看历史验收记录',
          action: () => Taro.switchTab({ url: '/pages/records/index' })
        },
        ...(currentUser.role === '主管' || currentUser.role === 'store_manager' ? [
          {
            icon: '⏳',
            name: '待复核处理',
            desc: stats.pending > 0 ? `有 ${stats.pending} 笔待复核` : '暂无待复核记录',
            badge: stats.pending,
            action: () => Taro.navigateTo({ url: '/pages/review-list/index' })
          }
        ] : [])
      ]
    },
    {
      title: '门店信息',
      items: [
        { icon: '🏪', name: '当前门店', desc: `${currentStoreName} (${currentStoreNo})`, action: () => Taro.switchTab({ url: '/pages/vehicles/index' }) },
        { icon: '👥', name: '收货团队', desc: '查看门店收货员信息', action: () => {} }
      ]
    },
    {
      title: '其他',
      items: [
        { icon: '📞', name: '联系客服', desc: '如有问题请联系客服', action: () => {} },
        { icon: 'ℹ️', name: '关于我们', desc: '冷链温度追踪 v1.1.0', action: () => {} }
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
          <Text className={styles.userRole}>{currentUser.roleName || currentUser.role}</Text>
          <Text className={styles.storeInfo}>
            工号 {currentUser.employeeId} · {currentStoreName}
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
        <View
          className={styles.statItem}
          onClick={() => stats.pending > 0 && Taro.navigateTo({ url: '/pages/review-list/index' })}
        >
          <Text className={styles.statNumber} style={{ color: stats.pending > 0 ? '#0088CC' : undefined }}>
            {stats.pending}
          </Text>
          <Text className={styles.statLabel}>待复核</Text>
        </View>
      </View>

      {menuGroups.map((group, gi) => (
        <View key={gi}>
          {group.title && <Text className={styles.menuTitle}>{group.title}</Text>}
          <View className={styles.menuGroup}>
            {group.items.map((item: any, ii: number) => (
              <View
                key={ii}
                className={styles.menuItem}
                onClick={item.action}
              >
                <View className={styles.menuIcon}>
                  <Text>{item.icon}</Text>
                </View>
                <View className={styles.menuContent}>
                  <View style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Text className={styles.menuName}>{item.name}</Text>
                    {item.badge > 0 && (
                      <View className={styles.badge}>
                        <Text className={styles.badgeText}>{item.badge}</Text>
                      </View>
                    )}
                  </View>
                  {item.desc && <Text className={styles.menuDesc}>{item.desc}</Text>}
                </View>
                <Text className={styles.menuArrow}>›</Text>
              </View>
            ))}
          </View>
        </View>
      ))}

      <View className={styles.versionInfo}>
        <Text>冷链温度追踪 v1.1.0</Text>
      </View>
    </View>
  );
};

export default MinePage;
