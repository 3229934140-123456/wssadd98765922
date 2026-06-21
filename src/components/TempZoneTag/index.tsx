import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import { TempZone } from '@/types';
import { getTempZoneLabel } from '@/utils/temperature';

interface TempZoneTagProps {
  zone: TempZone;
}

const TempZoneTag: React.FC<TempZoneTagProps> = ({ zone }) => {
  return (
    <View className={classnames(styles.zoneTag, styles[zone])}>
      <Text>{getTempZoneLabel(zone)}</Text>
    </View>
  );
};

export default TempZoneTag;
