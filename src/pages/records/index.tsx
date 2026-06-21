import React, { useState, useMemo } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import RecordCard from '@/components/RecordCard';
import { useAppStore } from '@/store';
import { AcceptanceRecord, AcceptanceResult, AcceptanceStatus } from '@/types';

type FilterType = 'all' | AcceptanceResult | AcceptanceStatus;

const RecordsPage: React.FC = () => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'review'>('all');
  const records = useAppStore(s => s.records);

  useDidShow(() => {
    // store 是响应式的，无需重新 set
  });

  const filteredRecords = useMemo(() => {
    let list = records;
    if (statusFilter === 'review') {
      list = list.filter(r => r.status === 'reviewing');
    }
    if (statusFilter === 'pending') {
      list = list.filter(r => r.status === 'pending');
    }
    if (filter === 'all') return list;
    return list.filter(r => r.result === filter || r.status === filter);
  }, [records, filter, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: records.length,
      normal: records.filter(r => r.result === 'normal').length,
      partial: records.filter(r => r.result === 'partial').length,
      review: records.filter(r => r.status === 'reviewing').length,
      today: records.filter(r => {
        const d = new Date(r.acceptTime);
        const n = new Date();
        return d.toDateString() === n.toDateString();
      }).length
    };
  }, [records]);

  const filterBtns: { key: FilterType; label: string; count: number }[] = [
    { key: 'all', label: '全部', count: records.length },
    { key: 'normal', label: '正常入库', count: stats.normal },
    { key: 'partial', label: '部分拒收', count: stats.partial },
    { key: 'reviewing', label: '等待复核', count: stats.review } as any
  ];

  const handleRecordClick = (record: AcceptanceRecord) => {
    Taro.navigateTo({
      url: `/pages/record-detail/index?id=${record.id}`
    });
  };

  return (
    <View className={styles.pageContainer}>
      <View className={styles.statCards}>
        <View className={classnames(styles.statCard, styles.statToday)}>
          <Text className={styles.statNumber}>{stats.today}</Text>
          <Text className={styles.statLabel}>今日验收</Text>
        </View>
        <View className={classnames(styles.statCard, styles.statNormal)}>
          <Text className={styles.statNumber}>{stats.normal}</Text>
          <Text className={styles.statLabel}>正常入库</Text>
        </View>
        <View className={classnames(styles.statCard, styles.statPartial)}>
          <Text className={styles.statNumber}>{stats.partial}</Text>
          <Text className={styles.statLabel}>部分拒收</Text>
        </View>
        <View className={classnames(styles.statCard, styles.statReview)}>
          <Text className={styles.statNumber}>{stats.review}</Text>
          <Text className={styles.statLabel}>待复核</Text>
        </View>
      </View>

      <ScrollView className={styles.filterBar} scrollX enableFlex>
        {filterBtns.map(btn => (
          <Button
            key={btn.key}
            className={classnames(styles.filterBtn, filter === btn.key && styles.activeFilter)}
            onClick={() => setFilter(btn.key)}
          >
            {btn.label}{btn.count > 0 && ` (${btn.count})`}
          </Button>
        ))}
      </ScrollView>

      <View className={styles.sectionHeader}>
        <Text className={styles.sectionTitle}>验收记录</Text>
        <Text className={styles.sectionCount}>共 {filteredRecords.length} 条</Text>
      </View>

      <View className={styles.recordList}>
        {filteredRecords.length > 0 ? (
          filteredRecords.map(record => (
            <RecordCard
              key={record.id}
              record={record}
              onClick={() => handleRecordClick(record)}
            />
          ))
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📋</Text>
            <Text className={styles.emptyText}>暂无验收记录</Text>
            <Text className={styles.emptySubtext}>完成车辆验收后，记录会显示在这里</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default RecordsPage;
