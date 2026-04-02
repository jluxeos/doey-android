import React from 'react';
import { Image, View } from 'react-native';

interface DoeyAvatarProps {
  size?: number;
}

export function DoeyAvatar({ size = 48 }: DoeyAvatarProps): React.JSX.Element {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}>
      <Image
        source={require('../../ic_doey.png')}
        style={{ width: size, height: size }}
        resizeMode="cover"
      />
    </View>
  );
}

export default DoeyAvatar;
