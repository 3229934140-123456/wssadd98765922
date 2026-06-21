import React, { useState, useMemo } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import RecordCard from '@/components/RecordCard';
import { acceptanceRecords } from '@/data/records';
import { AcceptanceRecord, AcceptanceResult } from '@/types';

type FilterType = 'all' | AcceptanceResult;

const RecordsPage: React.FC = () => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [records, setRecords] = useState<AcceptanceRecord[]>(acceptanceRecords);

  useDidShow(() => {
    setRecords(acceptanceRecords);
  });

  const filteredRecords = useMemo(() => {
    if (filter === 'all') return records;
    return records.filter(r => r.result === filter);
  }, [records, filter]);

  const stats = useMemo(() => {
    return {
      total: records.length,
      normal: records.filter(r => r.result === 'normal').length,
      partial: records.filter(r => r.result === 'partial').length,
      review: records.filter(r => r.result === 'review').length
    };
  }, [records]);

  const filterBtns: { key: FilterType; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'normal', label: '正常入库' },
    { key: 'partial', label: '部分拒收' },
    { key: 'review', label: '等待复核' }
  ];

  return (
    <View className={styles.pageContainer}>
      <ScrollView className={styles.filterBar} scrollX enableFlex>
        {filterBtns.map(btn => (
          <Button
            key={btn.key}
            className={classnames(styles.filterBtn, filter === btn.key && styles.activeFilter)}
            onClick={() => setFilter(btn.key)}
          >
            {btn.label}
          </Button>
        ))}
      </ScrollView>

      <View className={styles.statCards}>
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
          <Text className={styles.statLabel}>等待复核</Text>
        </View>
      </View>

      <View className={styles.sectionHeader}>
        <Text className={styles.sectionTitle}>验收记录</Text>
        <Text className={styles.sectionCount}>共 {filteredRecords.length} 条</Text>
      </View>

      <View className={styles.recordList}>
        {filteredRecords.length > 0 ? (
          filteredRecords.map(record => (
            <RecordCard key={record.id} record={record} />
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
