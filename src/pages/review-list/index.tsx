import React, { useState, useMemo } from 'react';
import { View, Text, Button, Textarea } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useAppStore } from '@/store';
import { AcceptanceRecord, AcceptanceStatus, AcceptanceResult } from '@/types';
import { formatFullDateTime } from '@/utils';

const ReviewListPage: React.FC = () => {
  const records = useAppStore(s => s.records);
  const updateRecordStatus = useAppStore(s => s.updateRecordStatus);

  const [showModal, setShowModal] = useState(false);
  const [pendingRecord, setPendingRecord] = useState<AcceptanceRecord | null>(null);
  const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | null>(null);
  const [reviewRemark, setReviewRemark] = useState('');

  useDidShow(() => {});

  const reviewList = useMemo(() => {
    return records
      .filter(r => r.status === 'reviewing')
      .sort((a, b) => new Date(b.acceptTime).getTime() - new Date(a.acceptTime).getTime());
  }, [records]);

  const urgentCount = useMemo(() => {
    const oneHour = 60 * 60 * 1000;
    return reviewList.filter(r => (Date.now() - new Date(r.acceptTime).getTime()) > oneHour).length;
  }, [reviewList]);

  const handleViewDetail = (record: AcceptanceRecord) => {
    Taro.navigateTo({
      url: `/pages/record-detail/index?id=${record.id}`
    });
  };

  const startReview = (record: AcceptanceRecord, action: 'approve' | 'reject') => {
    setPendingRecord(record);
    setPendingAction(action);
    setReviewRemark('');
    setShowModal(true);
  };

  const confirmReview = () => {
    if (!pendingRecord || !pendingAction) return;
    const actionText = pendingAction === 'approve' ? '通过入库' : '确认拒收';
    Taro.showModal({
      title: `确认${actionText}`,
      content: reviewRemark || '确认不填写复核备注？',
      success: (res) => {
        if (res.confirm) {
          if (pendingAction === 'approve') {
            updateRecordStatus(pendingRecord.id, 'accepted' as AcceptanceStatus, 'normal' as AcceptanceResult, reviewRemark);
            Taro.showToast({ title: '已通过入库', icon: 'success' });
          } else {
            updateRecordStatus(pendingRecord.id, 'rejected' as AcceptanceStatus, 'partial' as AcceptanceResult, reviewRemark);
            Taro.showToast({ title: '已确认拒收', icon: 'success' });
          }
          setShowModal(false);
          setPendingRecord(null);
          setPendingAction(null);
          setReviewRemark('');
        }
      }
    });
  };

  return (
    <View className={styles.pageContainer}>
      <View className={styles.headerBar}>
        <Text className={styles.headerTitle}>待复核处理</Text>
        <Text className={styles.headerSub}>
          集中处理门店提交的待复核验收单，处理结果将实时同步给门店收货员
        </Text>
      </View>

      <View className={styles.statsRow}>
        <View className={styles.statCard}>
          <Text className={styles.statCardNumber}>{reviewList.length}</Text>
          <Text className={styles.statCardLabel}>待复核总数</Text>
        </View>
        <View className={classnames(styles.statCard, styles.statCardWarn)}>
          <Text className={styles.statCardNumber}>{urgentCount}</Text>
          <Text className={styles.statCardLabel}>超过1小时未处理</Text>
        </View>
      </View>

      <View className={styles.sectionHeader}>
        <Text className={styles.sectionTitle}>待处理列表</Text>
        <Text className={styles.sectionCount}>共 {reviewList.length} 单</Text>
      </View>

      {reviewList.length > 0 ? (
        <View className={styles.list}>
          {reviewList.map(record => {
            const anomalyCount = record.tempAnomalies?.length || 0;
            return (
              <View key={record.id} className={styles.card}>
                <View className={styles.cardTop}>
                  <View className={styles.cardLeft}>
                    <Text className={styles.deliveryNo}>配送单 {record.deliveryNo}</Text>
                    <View className={styles.meta}>
                      <Text>{record.storeName} · {record.plateNo}</Text>
                    </View>
                    <View className={styles.meta}>
                      <Text>收货员：{record.receiver}</Text>
                      <Text>提交时间：{formatFullDateTime(record.acceptTime)}</Text>
                    </View>
                  </View>
                  <View style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <View className={styles.statusTag}>待复核</View>
                    {anomalyCount > 0 && (
                      <View className={styles.anomalyBadge}>异常 {anomalyCount} 次</View>
                    )}
                  </View>
                </View>

                {record.remark && (
                  <View className={styles.remarkBox}>
                    <Text className={styles.remarkIcon}>📝</Text>
                    <Text className={styles.remarkText}>{record.remark}</Text>
                  </View>
                )}

                <View className={styles.actionRow}>
                  <Button className={styles.btnView} onClick={() => handleViewDetail(record)}>查看详情</Button>
                  <Button className={styles.btnReject} onClick={() => startReview(record, 'reject')}>确认拒收</Button>
                  <Button className={styles.btnApprove} onClick={() => startReview(record, 'approve')}>通过入库</Button>
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>✅</Text>
          <Text className={styles.emptyText}>全部处理完成</Text>
          <Text className={styles.emptySub}>暂无待复核的验收记录</Text>
        </View>
      )}

      {showModal && (
        <View className={styles.modalMask} onClick={() => setShowModal(false)}>
          <View className={styles.modalBody} onClick={e => e.stopPropagation()}>
            <Text className={styles.modalTitle}>
              {pendingAction === 'approve' ? '填写复核通过意见' : '填写拒收原因'}
            </Text>
            <Textarea
              className={styles.modalTextarea}
              placeholder={pendingAction === 'approve'
                ? '请填写复核通过说明，现场货物检查情况...'
                : '请填写拒收原因，温度超标、包装破损等...'}
              value={reviewRemark}
              onInput={(e) => setReviewRemark(e.detail.value)}
              maxlength={300}
            />
            <View className={styles.modalButtons}>
              <Button className={styles.modalCancel} onClick={() => setShowModal(false)}>取消</Button>
              <Button
                className={styles.modalSubmit}
                style={{
                  background: pendingAction === 'approve'
                    ? 'linear-gradient(135deg, #00B578 0%, #00C78A 100%)'
                    : 'linear-gradient(135deg, #F53F3F 0%, #FF5B5B 100%)'
                }}
                onClick={confirmReview}
              >确认提交</Button>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default ReviewListPage;
