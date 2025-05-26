/**
 * Icon Provider Utility - Working Solution
 *
 * This replaces react-native-vector-icons with a working emoji-based system
 * to avoid JSX transformation issues.
 */

import React from 'react';
import {Text, TextStyle} from 'react-native';

// Define emoji map for all icons used in the app
const ICON_MAP: {[key: string]: string} = {
  // Navigation icons
  list: '📋',
  'list-outline': '📋',
  newspaper: '📰',
  'newspaper-outline': '📰',
  person: '👤',
  'person-outline': '👤',
  'help-circle': '❓',
  'log-out-outline': '🚪',

  // Status icons
  'happy-outline': '😊',
  'restaurant-outline': '🍽️',
  'bed-outline': '🛌',
  'information-circle-outline': 'ℹ️',
  'alert-circle-outline': '⚠️',
  'chevron-forward': '▶️',
  'document-text-outline': '📄',
  'mail-outline': '📧',
  'notifications-outline': '🔔',
  'lock-closed-outline': '🔒',
  'help-circle-outline': '❓',
  'code-outline': '💻',

  // Default fallback
  default: '•',
};

interface IconProps {
  name: string;
  size: number;
  color: string;
  style?: TextStyle;
}

// Function to get icon for a name
const getIcon = (iconName: string): string => {
  if (iconName in ICON_MAP) {
    return ICON_MAP[iconName];
  }

  // Check if any key includes this icon name
  for (const key in ICON_MAP) {
    if (iconName.includes(key)) {
      return ICON_MAP[key];
    }
  }

  return ICON_MAP.default;
};

// Main Icon component
export const Ionicon: React.FC<IconProps> = ({name, size, color, style}) => {
  const icon = getIcon(name);

  return (
    <Text
      style={[
        {
          fontSize: size * 0.8,
          color: color,
          textAlign: 'center',
          lineHeight: size,
        },
        style,
      ]}>
      {icon}
    </Text>
  );
};

// TabBar Icon component
export const TabBarIcon: React.FC<IconProps> = ({name, size, color, style}) => {
  const icon = getIcon(name);

  return (
    <Text
      style={[
        {
          fontSize: size * 0.8,
          color: color,
          textAlign: 'center',
          lineHeight: size,
        },
        style,
      ]}>
      {icon}
    </Text>
  );
};

// Export function for getting emoji fallback
export const getEmojiFallback = getIcon;

// Default export
export default {
  Ionicon,
  TabBarIcon,
  getEmojiFallback,
};
