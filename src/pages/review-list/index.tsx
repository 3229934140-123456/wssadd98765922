import React, { useState, useMemo } from 'react';
import { View, Text, Button, Textarea } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useAppStore } from '@/store';
import { AcceptanceRecord, AcceptanceStatus, AcceptanceResult } from '@/types';
import { formatFullDateTime } from '@/utils';
import { currentUser } from '@/data/acceptance';

const ReviewListPage: React.FC = () => {
  const records = useAppStore(s => s.records);
  const updateRecordStatus = useAppStore(s => s.updateRecordStatus);
  const batchUpdateRecords = useAppStore(s => s.batchUpdateRecords);

  const [showModal, setShowModal] = useState(false);
  const [pendingRecord, setPendingRecord] = useState<AcceptanceRecord | null>(null);
  const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | null>(null);
  const [reviewRemark, setReviewRemark] = useState('');

  const [batchMode, setBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchAction, setBatchAction] = useState<'approve' | 'reject' | null>(null);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchRemark, setBatchRemark] = useState('');

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

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

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
    const defaultRemark = pendingAction === 'approve'
      ? '现场检查货物未受影响，同意通过入库'
      : '温度超标时间较长，确认拒收，后续走报废流程';
    let finalRemark = reviewRemark.trim();
    if (!finalRemark) {
      finalRemark = defaultRemark;
    }
    const newStatus = pendingAction === 'approve' ? 'accepted' : 'rejected';
    const newResult = pendingAction === 'approve' ? 'normal' : 'partial';
    Taro.showModal({
      title: `确认${actionText}`,
      content: `复核意见：${finalRemark}\n确认提交后将同步给门店收货员`,
      success: (res) => {
        if (res.confirm) {
          updateRecordStatus(pendingRecord.id, newStatus as AcceptanceStatus, newResult as AcceptanceResult, finalRemark);
          Taro.showToast({ title: actionText + '成功', icon: 'success' });
          setShowModal(false);
          setPendingRecord(null);
          setPendingAction(null);
          setReviewRemark('');
        }
      }
    });
  };

  const startBatchAction = (action: 'approve' | 'reject') => {
    if (selectedIds.size === 0) {
      Taro.showToast({ title: '请先选择记录', icon: 'none' });
      return;
    }
    setBatchAction(action);
    setBatchRemark('');
    setShowBatchModal(true);
  };

  const confirmBatchAction = () => {
    if (!batchAction) return;
    const actionText = batchAction === 'approve' ? '通过入库' : '确认拒收';
    const defaultRemark = batchAction === 'approve'
      ? '现场检查货物未受影响，同意通过入库'
      : '温度超标时间较长，确认拒收，后续走报废流程';
    let finalRemark = batchRemark.trim();
    if (!finalRemark) {
      finalRemark = defaultRemark;
    }
    const newStatus: AcceptanceStatus = batchAction === 'approve' ? 'accepted' : 'rejected';
    const newResult: AcceptanceResult = batchAction === 'approve' ? 'normal' : 'partial';
    const ids = Array.from(selectedIds);
    Taro.showModal({
      title: `批量${actionText}`,
      content: `已选 ${ids.length} 单，复核意见：${finalRemark}\n确认提交后将同步给门店收货员`,
      success: (res) => {
        if (res.confirm) {
          batchUpdateRecords(ids, newStatus, newResult, finalRemark);
          Taro.showToast({ title: `批量${actionText}成功`, icon: 'success' });
          setShowBatchModal(false);
          setBatchAction(null);
          setBatchRemark('');
          setSelectedIds(new Set());
        }
      }
    });
  };

  const toggleBatchMode = () => {
    if (batchMode) {
      setSelectedIds(new Set());
    }
    setBatchMode(!batchMode);
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
        <View className={styles.sectionLeft}>
          <Text className={styles.sectionTitle}>待处理列表</Text>
          <Text className={styles.sectionCount}>共 {reviewList.length} 单</Text>
        </View>
        <View
          className={classnames(styles.batchModeToggle, batchMode && styles.batchModeActive)}
          onClick={toggleBatchMode}
        >
          <Text className={styles.batchModeToggleText}>{batchMode ? '退出批量' : '批量模式'}</Text>
        </View>
      </View>

      {reviewList.length > 0 ? (
        <View className={classnames(styles.list, batchMode && styles.listWithBatch)}>
          {reviewList.map(record => {
            const anomalyCount = record.tempAnomalies?.length || 0;
            const isChecked = selectedIds.has(record.id);
            return (
              <View key={record.id} className={styles.card}>
                <View className={styles.cardTop}>
                  {batchMode && (
                    <View
                      className={classnames(styles.checkBox, isChecked && styles.checkedBox)}
                      onClick={() => toggleSelect(record.id)}
                    >
                      <Text className={styles.checkBoxText}>{isChecked ? '✓' : '□'}</Text>
                    </View>
                  )}
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

                {!batchMode && (
                  <View className={styles.actionRow}>
                    <Button className={styles.btnView} onClick={() => handleViewDetail(record)}>查看详情</Button>
                    <Button className={styles.btnReject} onClick={() => startReview(record, 'reject')}>确认拒收</Button>
                    <Button className={styles.btnApprove} onClick={() => startReview(record, 'approve')}>通过入库</Button>
                  </View>
                )}
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

      {batchMode && selectedIds.size > 0 && (
        <View className={styles.batchBar}>
          <Text className={styles.batchCount}>已选 {selectedIds.size} 单</Text>
          <View className={styles.batchBarActions}>
            <View className={styles.batchApproveBtn} onClick={() => startBatchAction('approve')}>
              <Text className={styles.batchBtnText}>统一通过入库</Text>
            </View>
            <View className={styles.batchRejectBtn} onClick={() => startBatchAction('reject')}>
              <Text className={styles.batchBtnText}>统一确认拒收</Text>
            </View>
          </View>
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

      {showBatchModal && (
        <View className={styles.modalMask} onClick={() => setShowBatchModal(false)}>
          <View className={styles.modalBody} onClick={e => e.stopPropagation()}>
            <Text className={styles.modalTitle}>
              批量{batchAction === 'approve' ? '通过入库' : '确认拒收'} - 共享意见
            </Text>
            <Text className={styles.modalSub}>已选 {selectedIds.size} 单，以下意见将应用到所有选中记录</Text>
            <Textarea
              className={styles.modalTextarea}
              placeholder={batchAction === 'approve'
                ? '请填写批量复核通过说明...'
                : '请填写批量拒收原因...'}
              value={batchRemark}
              onInput={(e) => setBatchRemark(e.detail.value)}
              maxlength={300}
            />
            <View className={styles.modalButtons}>
              <Button className={styles.modalCancel} onClick={() => setShowBatchModal(false)}>取消</Button>
              <Button
                className={styles.modalSubmit}
                style={{
                  background: batchAction === 'approve'
                    ? 'linear-gradient(135deg, #00B578 0%, #00C78A 100%)'
                    : 'linear-gradient(135deg, #F53F3F 0%, #FF5B5B 100%)'
                }}
                onClick={confirmBatchAction}
              >确认提交</Button>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default ReviewListPage;
