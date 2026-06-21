import React, { useState, useMemo } from 'react';
import { View, Text, Button, Textarea, Image } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import TempFullChart from '@/components/TempFullChart';
import TempZoneTag from '@/components/TempZoneTag';
import StatusTag from '@/components/StatusTag';
import { getVehicleByDeliveryNo } from '@/data/vehicles';
import { currentUser } from '@/data/acceptance';
import { Vehicle, AcceptanceResult, AcceptanceStatus, BatchInfo, AcceptanceRecord } from '@/types';
import { formatTime, getDurationText, persistPhotos } from '@/utils';
import { checkTempsCompliance, getTempStatusText, formatTemp, getTempRange } from '@/utils/temperature';
import { useAppStore } from '@/store';

const AcceptancePage: React.FC = () => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [checkedBatches, setCheckedBatches] = useState<string[]>([]);
  const [selectedResult, setSelectedResult] = useState<AcceptanceResult | null>(null);
  const [remark, setRemark] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const addRecord = useAppStore(s => s.addRecord);
  const { currentStoreNo, currentStoreName } = useAppStore();

  useDidShow(() => {
    const deliveryNo = router.params.deliveryNo as string;
    if (deliveryNo) {
      const v = getVehicleByDeliveryNo(deliveryNo);
      if (v) {
        setVehicle(v);
        setCheckedBatches(v.batches.map(b => b.batchNo));
      }
    }
  });

  const tempStatus = useMemo(() => {
    if (!vehicle) return 'normal' as const;
    return checkTempsCompliance(vehicle.fullTemps, vehicle.tempZone);
  }, [vehicle]);

  const tempRange = useMemo(() => {
    if (!vehicle) return { min: 0, max: 0 };
    return getTempRange(vehicle.tempZone);
  }, [vehicle]);

  const handleBatchToggle = (batchNo: string) => {
    setCheckedBatches(prev =>
      prev.includes(batchNo)
        ? prev.filter(b => b !== batchNo)
        : [...prev, batchNo]
    );
  };

  const handleNext = () => {
    if (step === 1 && checkedBatches.length === 0) {
      Taro.showToast({ title: '请至少勾选一个批次', icon: 'none' });
      return;
    }
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleAnomalyClick = (anomalyId: string) => {
    if (!vehicle) return;
    Taro.navigateTo({
      url: `/pages/anomaly-detail/index?vehicleId=${vehicle.id}&anomalyId=${anomalyId}`
    });
  };

  const handleAddPhoto = () => {
    if (photos.length >= 6) {
      Taro.showToast({ title: '最多上传6张照片', icon: 'none' });
      return;
    }
    Taro.chooseImage({
      count: 6 - photos.length,
      success: (res) => {
        setPhotos([...photos, ...res.tempFilePaths]);
      }
    });
  };

  const handleDeletePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!selectedResult || !vehicle) {
      Taro.showToast({ title: '请选择验收结果', icon: 'none' });
      return;
    }
    const resultText = { normal: '正常入库', partial: '部分拒收', review: '等待主管复核' }[selectedResult];
    Taro.showModal({
      title: '确认提交',
      content: `确认将此批货物标记为"${resultText}"吗？`,
      success: async (res) => {
        if (res.confirm) {
          Taro.showLoading({ title: '提交中...' });
          try {
            const acceptedBatches = vehicle.batches.filter(b => checkedBatches.includes(b.batchNo));
            const status: AcceptanceStatus = selectedResult === 'review' ? 'reviewing' : 'accepted';
            const savedPhotos = photos.length > 0 ? await persistPhotos(photos) : [];
            const newRecord: AcceptanceRecord = {
              id: 'R' + Date.now(),
              deliveryNo: vehicle.deliveryNo,
              plateNo: vehicle.plateNo,
              storeName: currentStoreName,
              storeNo: currentStoreNo,
              acceptTime: new Date().toISOString(),
              receiver: currentUser.name,
              receiverId: currentUser.employeeId,
              result: selectedResult,
              status,
              tempZone: vehicle.tempZone,
              tempCompliance: tempStatus,
              remark: remark,
              photos: savedPhotos,
              batches: acceptedBatches,
              vehicleId: vehicle.id,
              tempAnomalies: vehicle.anomalies.map(a => ({
                id: a.id,
                startTime: a.startTime,
                endTime: a.endTime,
                duration: a.duration,
                location: a.location,
                maxTemp: a.maxTemp,
                status: a.status,
                driverRemark: a.driverRemark
              })),
              fullTemps: vehicle.fullTemps,
              driverName: vehicle.driverName,
              driverPhone: vehicle.driverPhone
            } as any;
            addRecord(newRecord);
            Taro.hideLoading();
            Taro.showToast({ title: '验收完成', icon: 'success' });
            setTimeout(() => {
              Taro.switchTab({ url: '/pages/records/index' });
            }, 1200);
          } catch (err) {
            Taro.hideLoading();
            Taro.showToast({ title: '提交失败，请重试', icon: 'none' });
          }
        }
      }
    });
  };

  const steps = [
    { num: 1, label: '核对批次' },
    { num: 2, label: '温度检查' },
    { num: 3, label: '提交结果' }
  ];

  const resultOptions: { value: AcceptanceResult; label: string; desc: string }[] = [
    { value: 'normal', label: '正常入库', desc: '温度全程合规，货物无异常' },
    { value: 'partial', label: '部分拒收', desc: '部分货物有温度异常或包装问题' },
    { value: 'review', label: '等待主管复核', desc: '存在争议，需主管到场确认' }
  ];

  if (!vehicle) {
    return (
      <View className={styles.pageContainer}>
        <View style={{ padding: 100, textAlign: 'center', color: '#86909C' }}>
          <Text>加载中...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.pageContainer}>
      <View className={styles.stepBar}>
        {steps.map((s, i) => (
          <React.Fragment key={s.num}>
            <View
              className={classnames(
                styles.stepItem,
                step === s.num && styles.active,
                step > s.num && styles.done
              )}
            >
              <View className={styles.stepDot}>
                <Text>{step > s.num ? '✓' : s.num}</Text>
              </View>
              <Text className={styles.stepLabel}>{s.label}</Text>
            </View>
            {i < steps.length - 1 && (
              <View className={classnames(styles.stepLine, step > s.num && styles.doneLine)} />
            )}
          </React.Fragment>
        ))}
      </View>

      <View className={styles.sectionCard}>
        <View className={styles.vehicleInfo}>
          <View className={styles.vehicleLeft}>
            <Text className={styles.plateNo}>{vehicle.plateNo}</Text>
            <Text className={styles.vehicleDesc}>配送单 {vehicle.deliveryNo} · {vehicle.driverName}</Text>
          </View>
          <View className={styles.vehicleRight}>
            <TempZoneTag zone={vehicle.tempZone} />
            <View style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
              <Text className={styles.tempValue}>{formatTemp(vehicle.currentTemp)}</Text>
              <Text className={styles.tempLabel}>标准 {tempRange.min}~{tempRange.max}℃</Text>
            </View>
          </View>
        </View>
      </View>

      {step === 1 && (
        <View className={styles.sectionCard}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>核对到货批次</Text>
            <View className={styles.sectionBadge}>
              <Text>已勾选 {checkedBatches.length}/{vehicle.batches.length}</Text>
            </View>
          </View>
          <View className={styles.batchList}>
            {vehicle.batches.map((b: BatchInfo) => {
              const checked = checkedBatches.includes(b.batchNo);
              return (
                <View
                  key={b.batchNo}
                  className={styles.batchItem}
                  onClick={() => handleBatchToggle(b.batchNo)}
                >
                  <View className={classnames(styles.batchCheck, checked && styles.checked)}>
                    {checked && <Text>✓</Text>}
                  </View>
                  <View className={styles.batchInfo}>
                    <Text className={styles.batchName}>{b.productName}</Text>
                    <Text className={styles.batchNo}>批次号 {b.batchNo}</Text>
                    <Text className={styles.batchDate}>
                      生产 {b.productionDate} · 有效期至 {b.expireDate}
                    </Text>
                  </View>
                  <Text className={styles.batchQty}>{b.quantity}{b.unit}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {step === 2 && (
        <>
          <View className={styles.sectionCard}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>全程温度检查</Text>
              <StatusTag type={tempStatus} text={getTempStatusText(tempStatus)} />
            </View>
            <TempFullChart temps={vehicle.fullTemps} zone={vehicle.tempZone} />
          </View>

          {vehicle.anomalies.length > 0 && (
            <View className={styles.sectionCard}>
              <View className={styles.sectionHeader}>
                <Text className={styles.sectionTitle}>温度异常波动</Text>
                <View className={styles.sectionBadge}>
                  <Text>共 {vehicle.anomalies.length} 次</Text>
                </View>
              </View>
              <View className={styles.anomalyAlert}>
                <Text className={styles.anomalyAlertIcon}>⚠️</Text>
                <View className={styles.anomalyAlertContent}>
                  <Text className={styles.anomalyAlertTitle}>运输途中出现温度波动</Text>
                  <Text className={styles.anomalyAlertDesc}>
                    请点击下方异常记录查看详情，包括发生地点、持续时间和司机备注
                  </Text>
                </View>
              </View>
              {vehicle.anomalies.map(a => (
                <View
                  key={a.id}
                  className={classnames(
                    styles.anomalyItem,
                    a.status === 'danger' && styles.dangerItem
                  )}
                  onClick={() => handleAnomalyClick(a.id)}
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
                  <Text className={styles.anomalyRight}>›</Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}

      {step === 3 && (
        <>
          <View className={styles.sectionCard}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>选择验收结果</Text>
            </View>
            <View className={styles.resultSection}>
              {resultOptions.map(opt => (
                <View
                  key={opt.value}
                  className={classnames(
                    styles.resultOption,
                    selectedResult === opt.value && styles.selectedResult
                  )}
                  onClick={() => setSelectedResult(opt.value)}
                >
                  <View className={classnames(
                    styles.resultCheck,
                    selectedResult === opt.value && 'selectedResult'
                  )}>
                    {selectedResult === opt.value && <Text>✓</Text>}
                  </View>
                  <View className={styles.resultInfo}>
                    <Text className={styles.resultName}>{opt.label}</Text>
                    <Text className={styles.resultDesc}>{opt.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View className={styles.sectionCard}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>验收备注</Text>
            </View>
            <Textarea
              className={styles.remarkInput}
              placeholder="请输入验收备注，如有拒收请说明原因..."
              value={remark}
              onInput={(e) => setRemark(e.detail.value)}
              maxlength={500}
            />
          </View>

          <View className={styles.sectionCard}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>现场照片</Text>
              <View className={styles.sectionBadge}>
                <Text>{photos.length}/6</Text>
              </View>
            </View>
            <View className={styles.photoSection}>
              <View className={styles.photoGrid}>
                {photos.map((p, i) => (
                  <View key={i} className={styles.photoItem}>
                    <Image className={styles.photoImg} src={p} mode="aspectFill" />
                    <View className={styles.photoDelete} onClick={() => handleDeletePhoto(i)}>
                      <Text>×</Text>
                    </View>
                  </View>
                ))}
                {photos.length < 6 && (
                  <View className={styles.photoItem} onClick={handleAddPhoto}>
                    <Text className={styles.photoAddIcon}>+</Text>
                  </View>
                )}
              </View>
              <Text style={{ fontSize: 24, color: '#86909C' }}>
                收货员：{currentUser.name} · 工号 {currentUser.employeeId}
              </Text>
            </View>
          </View>
        </>
      )}

      <View className={styles.bottomBar}>
        {step > 1 ? (
          <Button className={styles.bottomBtn} onClick={handlePrev}>
            上一步
          </Button>
        ) : (
          <Button className={styles.bottomBtn} onClick={() => Taro.navigateBack()}>
            取消
          </Button>
        )}
        <Button
          className={classnames(styles.bottomBtn, styles.primaryBtn)}
          onClick={step === 3 ? handleSubmit : handleNext}
        >
          {step === 3 ? '提交验收' : '下一步'}
        </Button>
      </View>
    </View>
  );
};

export default AcceptancePage;
