import React from 'react';
import Svg, {Circle, Rect, Polygon, Path} from 'react-native-svg';
import {ViewStyle} from 'react-native';

interface LogoProps {
  width?: number;
  height?: number;
  style?: ViewStyle;
}

const Logo: React.FC<LogoProps> = ({width = 100, height = 100, style}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 100 100" style={style}>
      {/* Background Circle */}
      <Circle cx={50} cy={50} r={45} fill="#3B82F6" />

      {/* Roof */}
      <Polygon points="25,45 50,25 75,45" fill="#FFFFFF" />

      {/* House */}
      <Rect x={30} y={45} width={40} height={30} fill="#FFFFFF" />

      {/* Door */}
      <Rect x={45} y={55} width={10} height={20} fill="#10B981" />

      {/* Child Silhouette */}
      <Circle cx={50} cy={40} r={5} fill="#10B981" />
      <Path d="M45,50 C45,40 55,40 55,50" fill="#10B981" />
    </Svg>
  );
};

export default Logo;
