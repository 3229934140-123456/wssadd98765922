import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import { AcceptanceRecord, AcceptanceResult, AcceptanceStatus } from '@/types';
import TempZoneTag from '../TempZoneTag';
import StatusTag from '../StatusTag';
import { formatFullDateTime } from '@/utils';
import { getTempStatusText } from '@/utils/temperature';

interface RecordCardProps {
  record: AcceptanceRecord;
  onClick?: () => void;
}

const getDisplayStatus = (record: AcceptanceRecord): { label: string; cls: string } => {
  if (record.status === 'reviewing') {
    return { label: '待主管复核', cls: 'review' };
  }
  if (record.status === 'rejected') {
    return { label: '已拒收', cls: 'rejected' };
  }
  if (record.result === 'normal') {
    return { label: record.reviewRemark ? '已复核通过' : '正常入库', cls: 'normal' };
  }
  if (record.result === 'partial') {
    return { label: '部分拒收', cls: 'partial' };
  }
  if (record.result === 'review') {
    return { label: '复核通过', cls: 'normal' };
  }
  return { label: '已处理', cls: 'normal' };
};

const RecordCard: React.FC<RecordCardProps> = ({ record, onClick }) => {
  const status = getDisplayStatus(record);
  return (
    <View className={styles.recordCard} onClick={onClick}>
      <View className={styles.cardHeader}>
        <View className={styles.headerLeft}>
          <Text className={styles.deliveryNo}>配送单 {record.deliveryNo}</Text>
          <TempZoneTag zone={record.tempZone} />
          {record.sharedWithManager && (
            <View className={styles.sharedTag}>
              <Text>✓ 已转主管</Text>
            </View>
          )}
        </View>
        <View className={classnames(styles.resultBadge, styles[status.cls])}>
          <Text>{status.label}</Text>
        </View>
      </View>

      <View className={styles.infoRow}>
        <View className={styles.infoItem}>
          <Text className={styles.infoLabel}>车牌号</Text>
          <Text className={styles.infoValue}>{record.plateNo}</Text>
        </View>
        <View className={styles.infoItem}>
          <Text className={styles.infoLabel}>验收时间</Text>
          <Text className={styles.infoValue}>{formatFullDateTime(record.acceptTime)}</Text>
        </View>
        <View className={styles.infoItem}>
          <Text className={styles.infoLabel}>收货员</Text>
          <Text className={styles.infoValue}>{record.receiver}</Text>
        </View>
      </View>

      <View className={styles.infoRow}>
        <View className={styles.infoItem}>
          <Text className={styles.infoLabel}>温度合规性</Text>
          <StatusTag type={record.tempCompliance} text={getTempStatusText(record.tempCompliance)} />
        </View>
      </View>

      {record.batches && record.batches.length > 0 && (
        <View className={styles.batches}>
          {record.batches.map((b, i) => (
            <View key={i} className={styles.batchTag}>
              <Text>{b.productName} ×{b.quantity}{b.unit}</Text>
            </View>
          ))}
        </View>
      )}

      {record.remark && (
        <View className={styles.cardFooter}>
          <Text className={styles.footerText}>📝 {record.remark}</Text>
        </View>
      )}

      {record.reviewRemark && (
        <View className={classnames(styles.reviewFooter, record.status === 'rejected' && styles.rejectedReview)}>
          <Text className={styles.reviewFooterText}>
            {record.status === 'rejected' ? '❌' : '✅'} 主管{record.status === 'rejected' ? '拒收' : '复核通过'}：
            {record.reviewRemark}
            {record.reviewer && ` · ${record.reviewer}`}
          </Text>
        </View>
      )}
    </View>
  );
};

export default RecordCard;
