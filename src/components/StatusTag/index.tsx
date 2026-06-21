import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface StatusTagProps {
  type?: 'normal' | 'warning' | 'danger' | 'info' | 'gray';
  text: string;
}

const StatusTag: React.FC<StatusTagProps> = ({ type = 'info', text }) => {
  return (
    <View className={classnames(styles.statusTag, styles[type])}>
      <Text>{text}</Text>
    </View>
  );
};

export default StatusTag;
