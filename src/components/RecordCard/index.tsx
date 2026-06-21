import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import { AcceptanceRecord, AcceptanceResult } from '@/types';
import TempZoneTag from '../TempZoneTag';
import StatusTag from '../StatusTag';
import { formatFullDateTime } from '@/utils';
import { getTempStatusText } from '@/utils/temperature';

interface RecordCardProps {
  record: AcceptanceRecord;
  onClick?: () => void;
}

const getResultText = (result: AcceptanceResult): string => {
  const map: Record<AcceptanceResult, string> = {
    normal: '正常入库',
    partial: '部分拒收',
    review: '等待复核'
  };
  return map[result];
};

const RecordCard: React.FC<RecordCardProps> = ({ record, onClick }) => {
  return (
    <View className={styles.recordCard} onClick={onClick}>
      <View className={styles.cardHeader}>
        <View className={styles.headerLeft}>
          <Text className={styles.deliveryNo}>配送单 {record.deliveryNo}</Text>
          <TempZoneTag zone={record.tempZone} />
        </View>
        <View className={classnames(styles.resultBadge, styles[record.result])}>
          <Text>{getResultText(record.result)}</Text>
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
          <Text className={styles.footerText}>{record.remark}</Text>
        </View>
      )}
    </View>
  );
};

export default RecordCard;
