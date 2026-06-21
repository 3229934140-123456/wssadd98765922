import React, { useState, useMemo } from 'react';
import { View, Text, Button, ScrollView, Picker } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import RecordCard from '@/components/RecordCard';
import { useAppStore } from '@/store';
import { AcceptanceRecord, AcceptanceResult, AcceptanceStatus } from '@/types';

type DateRangeKey = 'today' | 'week' | 'custom';
type ViewMode = 'list' | 'ledger';
type StatFilter = 'all' | 'normal' | 'partial' | 'reviewing' | 'rejected';

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const isSameDay = (a: Date, b: Date) => startOfDay(a).getTime() === startOfDay(b).getTime();

const isSameWeek = (d: Date) => {
  const now = new Date();
  const weekStart = new Date(now);
  const day = now.getDay() || 7;
  weekStart.setDate(now.getDate() - day + 1);
  weekStart.setHours(0, 0, 0, 0);
  return d >= weekStart;
};

const formatDateKey = (iso: string) => {
  const d = new Date(iso);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
};

const RecordsPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [dateRange, setDateRange] = useState<DateRangeKey>('today');
  const [customDate, setCustomDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [statFilter, setStatFilter] = useState<StatFilter>('all');
  const [storeFilter, setStoreFilter] = useState<string>('all');
  const stores = useAppStore(s => s.stores);
  const records = useAppStore(s => s.records);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStorePicker, setShowStorePicker] = useState(false);

  useDidShow(() => {});

  const dateFiltered = useMemo(() => {
    const now = new Date();
    return records.filter(r => {
      const d = new Date(r.acceptTime);
      if (dateRange === 'today') return isSameDay(d, now);
      if (dateRange === 'week') return isSameWeek(d);
      if (dateRange === 'custom') {
        const c = new Date(customDate);
        return isSameDay(d, c);
      }
      return true;
    });
  }, [records, dateRange, customDate]);

  const storeFiltered = useMemo(() => {
    if (storeFilter === 'all') return dateFiltered;
    return dateFiltered.filter(r => r.storeNo === storeFilter || r.storeName === storeFilter);
  }, [dateFiltered, storeFilter]);

  const finalFiltered = useMemo(() => {
    if (statFilter === 'all') return storeFiltered;
    if (statFilter === 'normal') return storeFiltered.filter(r => r.result === 'normal' && r.status === 'accepted');
    if (statFilter === 'partial') return storeFiltered.filter(r => r.result === 'partial');
    if (statFilter === 'reviewing') return storeFiltered.filter(r => r.status === 'reviewing');
    if (statFilter === 'rejected') return storeFiltered.filter(r => r.status === 'rejected');
    return storeFiltered;
  }, [storeFiltered, statFilter]);

  const stats = useMemo(() => {
    const list = storeFiltered;
    return {
      total: list.length,
      normal: list.filter(r => r.result === 'normal' && r.status === 'accepted').length,
      partial: list.filter(r => r.result === 'partial').length,
      reviewing: list.filter(r => r.status === 'reviewing').length,
      rejected: list.filter(r => r.status === 'rejected').length
    };
  }, [storeFiltered]);

  const dateRangeLabel = useMemo(() => {
    if (dateRange === 'today') return '今天';
    if (dateRange === 'week') return '本周';
    if (dateRange === 'custom') return formatDateKey(customDate);
    return '全部';
  }, [dateRange, customDate]);

  const storeLabel = useMemo(() => {
    if (storeFilter === 'all') return '全部门店';
    const s = stores.find(x => x.no === storeFilter);
    return s ? `${s.name} (${s.no})` : storeFilter;
  }, [storeFilter, stores]);

  const ledgerGroups = useMemo(() => {
    const map = new Map<string, AcceptanceRecord[]>();
    finalFiltered.forEach(r => {
      const key = formatDateKey(r.acceptTime);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });
    return Array.from(map.entries()).sort((a, b) => {
      return new Date(b[1][0].acceptTime).getTime() - new Date(a[1][0].acceptTime).getTime();
    });
  }, [finalFiltered]);

  const handleRecordClick = (record: AcceptanceRecord) => {
    Taro.navigateTo({
      url: `/pages/record-detail/index?id=${record.id}`
    });
  };

  const handlePickDate = (value: string) => {
    if (!value) return;
    setCustomDate(value);
    setDateRange('custom');
    setTimeout(() => setShowDatePicker(false), 100);
  };

  return (
    <View className={styles.pageContainer}>
      <View className={styles.topBar}>
        <View className={styles.viewTabs}>
          <View
            className={classnames(styles.viewTab, viewMode === 'list' && styles.activeViewTab)}
            onClick={() => setViewMode('list')}
          >
            <Text>列表视图</Text>
          </View>
          <View
            className={classnames(styles.viewTab, viewMode === 'ledger' && styles.activeViewTab)}
            onClick={() => setViewMode('ledger')}
          >
            <Text>台账视图</Text>
          </View>
        </View>
      </View>

      <View className={styles.filterRow}>
        <View className={styles.filterChip} onClick={() => setShowDatePicker(true)}>
          <Text className={styles.filterChipText}>📅 {dateRangeLabel}</Text>
          <Text className={styles.filterChipArrow}>▾</Text>
        </View>
        <View className={styles.filterChip} onClick={() => setShowStorePicker(true)}>
          <Text className={styles.filterChipText}>🏪 {storeLabel}</Text>
          <Text className={styles.filterChipArrow}>▾</Text>
        </View>
      </View>

      {viewMode === 'ledger' && (
        <View className={styles.ledgerSummary}>
          <Text className={styles.ledgerSummaryText}>
            {dateRangeLabel} · {storeLabel} · 共 {stats.total} 单
          </Text>
        </View>
      )}

      <View
        className={classnames(
          styles.statCards,
          viewMode === 'ledger' && styles.statCards5
        )}
      >
        <View
          className={classnames(styles.statCard, styles.statToday, statFilter === 'all' && styles.activeStat)}
          onClick={() => setStatFilter('all')}
        >
          <Text className={styles.statNumber}>{stats.total}</Text>
          <Text className={styles.statLabel}>合计</Text>
        </View>
        <View
          className={classnames(styles.statCard, styles.statNormal, statFilter === 'normal' && styles.activeStat)}
          onClick={() => setStatFilter('normal')}
        >
          <Text className={styles.statNumber}>{stats.normal}</Text>
          <Text className={styles.statLabel}>正常入库</Text>
        </View>
        <View
          className={classnames(styles.statCard, styles.statPartial, statFilter === 'partial' && styles.activeStat)}
          onClick={() => setStatFilter('partial')}
        >
          <Text className={styles.statNumber}>{stats.partial}</Text>
          <Text className={styles.statLabel}>部分拒收</Text>
        </View>
        <View
          className={classnames(styles.statCard, styles.statReview, statFilter === 'reviewing' && styles.activeStat)}
          onClick={() => setStatFilter('reviewing')}
        >
          <Text className={styles.statNumber}>{stats.reviewing}</Text>
          <Text className={styles.statLabel}>待复核</Text>
        </View>
        {viewMode === 'ledger' && (
          <View
            className={classnames(styles.statCard, styles.statRejected, statFilter === 'rejected' && styles.activeStat)}
            onClick={() => setStatFilter('rejected')}
          >
            <Text className={styles.statNumber}>{stats.rejected}</Text>
            <Text className={styles.statLabel}>已拒收</Text>
          </View>
        )}
      </View>

      {viewMode === 'list' ? (
        <>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>验收记录</Text>
            <Text className={styles.sectionCount}>共 {finalFiltered.length} 条</Text>
          </View>
          <View className={styles.recordList}>
            {finalFiltered.length > 0 ? (
              finalFiltered.map(record => (
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
        </>
      ) : (
        <View className={styles.ledgerList}>
          {ledgerGroups.length > 0 ? (
            ledgerGroups.map(([dateKey, list]) => (
              <View key={dateKey} className={styles.ledgerGroup}>
                <View className={styles.ledgerDateHeader}>
                  <Text className={styles.ledgerDate}>{dateKey}</Text>
                  <Text className={styles.ledgerDateCount}>
                    共 {list.length} 单
                  </Text>
                </View>
                {list.map(record => (
                  <RecordCard
                    key={record.id}
                    record={record}
                    onClick={() => handleRecordClick(record)}
                  />
                ))}
              </View>
            ))
          ) : (
            <View className={styles.emptyState}>
              <Text className={styles.emptyIcon}>📊</Text>
              <Text className={styles.emptyText}>当前筛选条件下暂无记录</Text>
              <Text className={styles.emptySubtext}>切换日期或门店重新查看</Text>
            </View>
          )}
        </View>
      )}

      {showDatePicker && (
        <View className={styles.mask} onClick={() => setShowDatePicker(false)}>
          <View className={styles.pickerSheet} onClick={e => e.stopPropagation()}>
            <View className={styles.pickerHeader}>
              <Text className={styles.pickerTitle}>选择日期范围</Text>
              <Text className={styles.pickerClose} onClick={() => setShowDatePicker(false)}>✕</Text>
            </View>
            {(['today', 'week', 'custom'] as DateRangeKey[]).map(k => {
              if (k === 'custom') {
                return (
                  <Picker
                    key={k}
                    mode="date"
                    value={customDate}
                    end={new Date().toISOString().slice(0, 10)}
                    onChange={(e: any) => {
                      handlePickDate(e.detail.value);
                    }}
                  >
                    <View
                      className={classnames(
                        styles.pickerItem,
                        styles.pickerItemCustom,
                        dateRange === k && styles.activePickerItem
                      )}
                    >
                      <Text>指定日期</Text>
                      <Text className={styles.pickerSub}>
                        {formatDateKey(customDate)}（点击右侧选择）
                      </Text>
                      <View className={styles.datePickBtn}>
                        <Text>选择日期 ▾</Text>
                      </View>
                      {dateRange === k && <Text className={styles.pickerCheck}>✓</Text>}
                    </View>
                  </Picker>
                );
              }
              return (
                <View
                  key={k}
                  className={classnames(styles.pickerItem, dateRange === k && styles.activePickerItem)}
                  onClick={() => {
                    setDateRange(k);
                    setShowDatePicker(false);
                  }}
                >
                  <Text>{k === 'today' ? '今天' : '本周'}</Text>
                  {dateRange === k && <Text className={styles.pickerCheck}>✓</Text>}
                </View>
              );
            })}
          </View>
        </View>
      )}

      {showStorePicker && (
        <View className={styles.mask} onClick={() => setShowStorePicker(false)}>
          <View className={styles.pickerSheet} onClick={e => e.stopPropagation()}>
            <View className={styles.pickerHeader}>
              <Text className={styles.pickerTitle}>选择门店</Text>
              <Text className={styles.pickerClose} onClick={() => setShowStorePicker(false)}>✕</Text>
            </View>
            <View
              className={classnames(styles.pickerItem, storeFilter === 'all' && styles.activePickerItem)}
              onClick={() => { setStoreFilter('all'); setShowStorePicker(false); }}
            >
              <Text>全部门店</Text>
              {storeFilter === 'all' && <Text className={styles.pickerCheck}>✓</Text>}
            </View>
            {stores.map(s => (
              <View
                key={s.no}
                className={classnames(styles.pickerItem, storeFilter === s.no && styles.activePickerItem)}
                onClick={() => { setStoreFilter(s.no); setShowStorePicker(false); }}
              >
                <Text>{s.name}</Text>
                <Text className={styles.pickerSub}>{s.no}</Text>
                {storeFilter === s.no && <Text className={styles.pickerCheck}>✓</Text>}
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

export default RecordsPage;
