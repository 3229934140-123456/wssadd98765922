import React, { useState, useMemo } from 'react';
import { View, Text, Image, Button, Textarea } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import TempFullChart from '@/components/TempFullChart';
import TempZoneTag from '@/components/TempZoneTag';
import StatusTag from '@/components/StatusTag';
import { useAppStore } from '@/store';
import { AcceptanceRecord, AcceptanceResult, AcceptanceStatus } from '@/types';
import { formatFullDateTime, formatTime, getDurationText } from '@/utils';
import { getTempStatusText, formatTemp } from '@/utils/temperature';
import { currentUser } from '@/data/acceptance';

const getResultBannerClass = (result: AcceptanceResult, status: AcceptanceStatus) => {
  if (status === 'rejected') return styles.rejectedBanner;
  const map: Record<AcceptanceResult, string> = {
    normal: styles.normalBanner,
    partial: styles.partialBanner,
    review: styles.reviewBanner
  };
  return map[result];
};

const getResultTitle = (result: AcceptanceResult, status: AcceptanceStatus) => {
  if (status === 'accepted') {
    const map: Record<AcceptanceResult, string> = {
      normal: '正常入库',
      partial: '部分拒收，其余入库',
      review: '已复核通过'
    };
    return map[result];
  }
  if (status === 'rejected') return '主管确认拒收';
  if (status === 'reviewing') return '等待主管复核';
  return '待处理';
};

const getResultIcon = (result: AcceptanceResult, status: AcceptanceStatus) => {
  if (status === 'rejected') return '❌';
  if (status === 'accepted') return '✅';
  if (status === 'reviewing') return '⏳';
  return '📋';
};

const RecordDetailPage: React.FC = () => {
  const router = useRouter();
  const [record, setRecord] = useState<AcceptanceRecord | null>(null);
  const records = useAppStore(s => s.records);
  const updateRecordStatus = useAppStore(s => s.updateRecordStatus);
  const [showRemarkModal, setShowRemarkModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | null>(null);
  const [reviewRemark, setReviewRemark] = useState('');

  useDidShow(() => {
    const id = router.params.id as string;
    const r = records.find(item => item.id === id);
    if (r) setRecord(r);
  });

  const handlePreviewPhoto = (url: string, urls: string[]) => {
    Taro.previewImage({
      current: url,
      urls
    });
  };

  const startReview = (action: 'approve' | 'reject') => {
    setPendingAction(action);
    setReviewRemark('');
    setShowRemarkModal(true);
  };

  const confirmReview = () => {
    if (!record || !pendingAction) return;
    const actionText = pendingAction === 'approve' ? '通过入库' : '确认拒收';
    Taro.showModal({
      title: `确认${actionText}`,
      content: reviewRemark || '确认不填写复核备注？',
      success: (res) => {
        if (res.confirm) {
          if (pendingAction === 'approve') {
            updateRecordStatus(record.id, 'accepted', 'normal', reviewRemark);
            Taro.showToast({ title: '已通过入库', icon: 'success' });
          } else {
            updateRecordStatus(record.id, 'rejected', 'partial', reviewRemark);
            Taro.showToast({ title: '已确认拒收', icon: 'success' });
          }
          setShowRemarkModal(false);
          setTimeout(() => {
            const updated = records.find(r => r.id === record.id);
            if (updated) setRecord({ ...updated });
          }, 500);
        }
      }
    });
  };

  if (!record) {
    return (
      <View className={styles.pageContainer}>
        <View style={{ padding: 100, textAlign: 'center', color: '#86909C' }}>
          <Text>加载中...</Text>
        </View>
      </View>
    );
  }

  const anomalies = record.tempAnomalies || [];
  const photos = record.photos || [];
  const isReviewing = record.status === 'reviewing';

  return (
    <View className={styles.pageContainer}>
      <View className={classnames(styles.resultBanner, getResultBannerClass(record.result, record.status))}>
        <View className={styles.resultIcon}>
          <Text>{getResultIcon(record.result, record.status)}</Text>
        </View>
        <View className={styles.resultInfo}>
          <Text className={styles.resultTitle}>{getResultTitle(record.result, record.status)}</Text>
          <Text className={styles.resultDesc}>
            配送单 {record.deliveryNo} · {record.plateNo}
          </Text>
          <Text className={styles.resultStatus}>
            验收时间 {formatFullDateTime(record.acceptTime)}
          </Text>
        </View>
      </View>

      <View className={styles.sectionCard}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>基本信息</Text>
          <TempZoneTag zone={record.tempZone} />
        </View>
        <View className={styles.infoGrid}>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>门店</Text>
            <Text className={styles.infoValue}>{record.storeName}{record.storeNo && ` (${record.storeNo})`}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>司机</Text>
            <Text className={styles.infoValue}>{record.driverName || '-'}{record.driverPhone && ` ${record.driverPhone}`}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>收货员</Text>
            <Text className={styles.infoValue}>{record.receiver}{record.receiverId && ` (${record.receiverId})`}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>温度合规</Text>
            <StatusTag type={record.tempCompliance} text={getTempStatusText(record.tempCompliance)} />
          </View>
        </View>
      </View>

      {record.fullTemps && record.fullTemps.length > 0 && (
        <View className={styles.sectionCard}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>运输温度曲线</Text>
          </View>
          <TempFullChart temps={record.fullTemps} zone={record.tempZone} />
        </View>
      )}

      {anomalies.length > 0 && (
        <View className={styles.sectionCard}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>温度异常波动</Text>
            <View className={styles.sectionBadge}>
              <Text>共 {anomalies.length} 次</Text>
            </View>
          </View>
          <View className={styles.anomalyList}>
            {anomalies.map(a => (
              <View
                key={a.id}
                className={classnames(
                  styles.anomalyItem,
                  a.status === 'danger' ? styles.dangerItem : styles.warningItem
                )}
              >
                <View className={styles.anomalyLeft}>
                  <Text className={styles.anomalyTitle}>
                    {a.status === 'danger' ? '温度超标' : '短时温度波动'}
                  </Text>
                  <Text className={styles.anomalyDesc}>
                    {formatTime(a.startTime)}-{formatTime(a.endTime)} · 持续{getDurationText(a.duration)}
                  </Text>
                  <Text className={styles.anomalyDesc}>
                    峰值 {formatTemp(a.maxTemp)} · {a.location}
                  </Text>
                  <Text className={styles.anomalyDesc}>司机备注：{a.driverRemark}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      <View className={styles.sectionCard}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>到货批次</Text>
          <View className={styles.sectionBadge}>
            <Text>共 {record.batches.length} 批</Text>
          </View>
        </View>
        <View className={styles.batchList}>
          {record.batches.map((b, i) => (
            <View key={i} className={styles.batchItem}>
              <View className={styles.batchInfo}>
                <Text className={styles.batchName}>{b.productName}</Text>
                <Text className={styles.batchNo}>批次号 {b.batchNo}</Text>
                <Text className={styles.batchDate}>
                  生产 {b.productionDate} · 有效期至 {b.expireDate}
                </Text>
              </View>
              <Text className={styles.batchQty}>{b.quantity}{b.unit}</Text>
            </View>
          ))}
        </View>
      </View>

      {photos.length > 0 && (
        <View className={styles.sectionCard}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>现场照片</Text>
            <View className={styles.sectionBadge}>
              <Text>共 {photos.length} 张</Text>
            </View>
          </View>
          <View className={styles.photoSection}>
            <View className={styles.photoGrid}>
              {photos.map((p, i) => (
                <View
                  key={i}
                  className={styles.photoItem}
                  onClick={() => handlePreviewPhoto(p, photos)}
                >
                  <Image className={styles.photoImg} src={p} mode="aspectFill" />
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {record.remark && (
        <View className={styles.sectionCard}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>收货员备注</Text>
          </View>
          <View className={styles.remarkCard}>
            <Text className={styles.remarkValue}>{record.remark}</Text>
          </View>
        </View>
      )}

      {record.reviewRemark && (
        <View className={styles.sectionCard}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>主管复核记录</Text>
          </View>
          <View className={classnames(
            styles.reviewedInfo,
            record.status === 'rejected' && styles.rejectedReviewInfo
          )}>
            <Text className={styles.reviewedTitle}>
              {record.status === 'rejected' ? '❌ 主管确认拒收' : '✅ 主管复核通过'}
            </Text>
            <Text className={styles.reviewedMeta}>
              复核人：{record.reviewer || '主管'} · 复核时间：{record.reviewTime ? formatFullDateTime(record.reviewTime) : '-'}
            </Text>
            <Text className={styles.reviewedRemark}>{record.reviewRemark}</Text>
          </View>
        </View>
      )}

      {isReviewing && (
        <View className={styles.bottomBar}>
          <Button className={classnames(styles.bottomBtn, styles.rejectBtn)} onClick={() => startReview('reject')}>
            确认拒收
          </Button>
          <Button className={classnames(styles.bottomBtn, styles.approveBtn)} onClick={() => startReview('approve')}>
            通过入库
          </Button>
        </View>
      )}

      {showRemarkModal && (
        <View
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 200,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 32rpx'
          }}
          onClick={() => setShowRemarkModal(false)}
        >
          <View
            style={{
              width: '100%', maxWidth: 686, backgroundColor: '#fff',
              borderRadius: 16, padding: 32, boxSizing: 'border-box'
            }}
            onClick={e => e.stopPropagation()}
          >
            <Text style={{ fontSize: 32, fontWeight: 600, color: '#1D2129', marginBottom: 24 }}>
              {pendingAction === 'approve' ? '填写复核通过意见' : '填写拒收原因'}
            </Text>
            <Textarea
              style={{
                width: '100%', minHeight: 160, padding: 16,
                backgroundColor: '#F2F3F5', borderRadius: 12,
                fontSize: 28, color: '#1D2129', boxSizing: 'border-box'
              }}
              placeholder={pendingAction === 'approve'
                ? '请填写复核通过说明，现场货物检查情况...'
                : '请填写拒收原因，温度超标、包装破损等...'}
              value={reviewRemark}
              onInput={(e) => setReviewRemark(e.detail.value)}
              maxlength={300}
            />
            <View style={{ display: 'flex', gap: 16, marginTop: 24 }}>
              <Button
                onClick={() => setShowRemarkModal(false)}
                style={{
                  flex: 1, height: 80, borderRadius: 48,
                  backgroundColor: '#F2F3F5', color: '#4E5969',
                  fontSize: 28, fontWeight: 500, lineHeight: '80rpx', padding: 0
                }}
              >取消</Button>
              <Button
                onClick={confirmReview}
                style={{
                  flex: 1, height: 80, borderRadius: 48,
                  background: pendingAction === 'approve'
                    ? 'linear-gradient(135deg, #00B578 0%, #00C78A 100%)'
                    : 'linear-gradient(135deg, #F53F3F 0%, #FF5B5B 100%)',
                  color: '#fff', fontSize: 28, fontWeight: 500,
                  lineHeight: '80rpx', padding: 0
                }}
              >确认提交</Button>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default RecordDetailPage;
