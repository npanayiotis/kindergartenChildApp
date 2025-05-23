/**
 * Icon Provider Utility
 *
 * This file provides a common interface for handling icon rendering with proper fallbacks
 * to ensure the app doesn't crash when vector icons fail to load.
 */

import React from 'react';
import {Text} from 'react-native';
// Use direct import from react-native-vector-icons instead of @expo/vector-icons
import Ionicons from 'react-native-vector-icons/Ionicons';

// Define emoji map for fallbacks
const EMOJI_MAP: {[key: string]: string} = {
  // Navigation icons
  list: '📋',
  'list-outline': '📋',
  newspaper: '📰',
  'newspaper-outline': '📰',
  person: '👤',
  'person-outline': '👤',
  'help-circle': '❓',

  // Status icons
  'happy-outline': '😊',
  'restaurant-outline': '🍽️',
  'bed-outline': '🛌',
  'information-circle-outline': 'ℹ️',

  // Generic fallback
  default: '•',
};

// Function to get emoji fallback for an icon name
export const getEmojiFallback = (iconName: string): string => {
  // Check if we have a specific emoji for this icon
  if (iconName in EMOJI_MAP) {
    return EMOJI_MAP[iconName];
  }

  // Check if any key includes this icon name
  for (const key in EMOJI_MAP) {
    if (iconName.includes(key)) {
      return EMOJI_MAP[key];
    }
  }

  // Default fallback
  return EMOJI_MAP.default;
};

// Ionicons component with fallback
export const Ionicon = ({
  name,
  size,
  color,
}: {
  name: any; // Using 'any' to bypass type checking for now
  size: number;
  color: string;
}) => {
  try {
    // Directly use the imported Ionicons component
    return <Ionicons name={name} size={size} color={color} />;
  } catch (error) {
    // Return text-based fallback if icons fail to load
    return (
      <Text style={{color, fontSize: size / 2, fontWeight: 'bold'}}>
        {getEmojiFallback(name)}
      </Text>
    );
  }
};

// TabBar Icon component
export const TabBarIcon = ({
  name,
  size,
  color,
}: {
  name: any; // Using 'any' to bypass type checking for now
  size: number;
  color: string;
}) => {
  try {
    // Use the imported Ionicons
    return <Ionicons name={name} size={size} color={color} />;
  } catch (error) {
    // Fallback
    return (
      <Text style={{color, fontSize: size / 2, fontWeight: 'bold'}}>
        {getEmojiFallback(name)}
      </Text>
    );
  }
};

export default {
  Ionicon,
  TabBarIcon,
  getEmojiFallback,
};
