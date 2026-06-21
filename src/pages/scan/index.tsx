import React, { useState } from 'react';
import { View, Text, Button, Input } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { vehicles } from '@/data/vehicles';

const ScanPage: React.FC = () => {
  const router = useRouter();
  const initialMode = (router.params.mode as string) || 'scan';
  const [mode, setMode] = useState<'scan' | 'input'>(initialMode === 'input' ? 'input' : 'scan');
  const [deliveryNo, setDeliveryNo] = useState('');

  const handleScan = () => {
    Taro.scanCode({
      onlyFromCamera: false,
      success: (res) => {
        const code = res.result;
        handleDelivery(code);
      },
      fail: () => {
        Taro.showToast({ title: '扫码失败，请手动输入', icon: 'none' });
      }
    });
  };

  const handleDelivery = (no: string) => {
    const vehicle = vehicles.find(v => v.deliveryNo === no || v.plateNo === no);
    if (!vehicle) {
      Taro.showModal({
        title: '未找到配送信息',
        content: `配送单号 ${no} 未找到相关车辆信息，请核对后重试`,
        showCancel: false
      });
      return;
    }
    Taro.navigateTo({
      url: `/pages/acceptance/index?deliveryNo=${vehicle.deliveryNo}`
    });
  };

  const handleConfirm = () => {
    if (!deliveryNo.trim()) {
      Taro.showToast({ title: '请输入配送单号', icon: 'none' });
      return;
    }
    handleDelivery(deliveryNo.trim().toUpperCase());
  };

  const recentDeliveries = [
    { no: 'DN20260620001', plate: '沪A·88888', time: '今天 14:30' },
    { no: 'DN20260620002', plate: '沪B·66666', time: '今天 11:20' },
    { no: 'DN20260619001', plate: '沪C·99999', time: '昨天 16:45' }
  ];

  return (
    <View className={styles.pageContainer}>
      <View className={styles.tabs}>
        <Button
          className={classnames(styles.tabItem, mode === 'scan' && styles.activeTab)}
          onClick={() => setMode('scan')}
        >
          扫码验收
        </Button>
        <Button
          className={classnames(styles.tabItem, mode === 'input' && styles.activeTab)}
          onClick={() => setMode('input')}
        >
          手动输入
        </Button>
      </View>

      {mode === 'scan' && (
        <View className={styles.scanArea}>
          <View className={styles.scanFrame}>
            <View className={classnames(styles.scanCorner, styles.topLeft)} />
            <View className={classnames(styles.scanCorner, styles.topRight)} />
            <View className={classnames(styles.scanCorner, styles.bottomLeft)} />
            <View className={classnames(styles.scanCorner, styles.bottomRight)} />
            <Text className={styles.scanIcon}>📷</Text>
          </View>
          <Text className={styles.scanTitle}>扫描配送单二维码</Text>
          <Text className={styles.scanDesc}>
            将配送单上的二维码放入扫描框内{'\n'}
            系统将自动识别并进入验收流程
          </Text>
          <Button className={styles.scanBtn} onClick={handleScan}>
            开始扫码
          </Button>
        </View>
      )}

      {mode === 'input' && (
        <View className={styles.inputArea}>
          <Text className={styles.inputLabel}>输入配送单号</Text>
          <Input
            className={styles.inputField}
            placeholder="请输入配送单号，如 DN20260621001"
            value={deliveryNo}
            onInput={(e) => setDeliveryNo(e.detail.value)}
            maxlength={20}
          />
          <Text className={styles.inputHint}>
            也可以输入车牌号进行查询，如 沪A·88888
          </Text>
          <Button
            className={classnames(styles.confirmBtn, !deliveryNo.trim() && styles.disabled)}
            onClick={handleConfirm}
          >
            确认查询
          </Button>
        </View>
      )}

      <View className={styles.recentSection}>
        <Text className={styles.sectionTitle}>最近验收</Text>
        {recentDeliveries.length > 0 ? (
          <View className={styles.recentList}>
            {recentDeliveries.map((item, i) => (
              <View
                key={i}
                className={styles.recentItem}
                onClick={() => handleDelivery(item.no)}
              >
                <View>
                  <Text className={styles.recentNo}>{item.no}</Text>
                  <Text className={styles.recentInfo}>{item.plate}</Text>
                </View>
                <Text className={styles.recentInfo}>{item.time}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View className={styles.emptyRecent}>
            <Text>暂无最近验收记录</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default ScanPage;
