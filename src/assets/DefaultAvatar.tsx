import React from 'react';
import Svg, {Circle, Path} from 'react-native-svg';
import {ViewStyle} from 'react-native';

interface DefaultAvatarProps {
  width?: number;
  height?: number;
  style?: ViewStyle;
}

const DefaultAvatar: React.FC<DefaultAvatarProps> = ({
  width = 100,
  height = 100,
  style,
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 100 100" style={style}>
      {/* Background Circle */}
      <Circle cx={50} cy={50} r={50} fill="#c7d2fe" />

      {/* Head */}
      <Circle cx={50} cy={40} r={20} fill="#6366f1" />

      {/* Body */}
      <Path
        d="M50,60 C33,60 20,75 20,95 L80,95 C80,75 67,60 50,60"
        fill="#6366f1"
      />
    </Svg>
  );
};

export default DefaultAvatar;
