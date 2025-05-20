// src/types/declarations.d.ts
declare module 'react-native-vector-icons/MaterialCommunityIcons';
declare module '*.png';
declare module '*.jpg';
declare module '*.svg';

declare module 'react-native-render-html' {
  import {ComponentType} from 'react';
  import {StyleProp, TextStyle, ViewStyle} from 'react-native';

  interface RenderHTMLProps {
    contentWidth?: number;
    source: {html: string} | {uri: string};
    tagsStyles?: Record<string, StyleProp<TextStyle | ViewStyle>>;
    classesStyles?: Record<string, StyleProp<TextStyle | ViewStyle>>;
    emSize?: number;
    baseStyle?: StyleProp<TextStyle>;
    allowFontScaling?: boolean;
    ignoredStyles?: string[];
    ignoredTags?: string[];
    ignoreNodesFunction?: (node: any) => boolean;
    alterData?: (node: any) => any;
    alterChildren?: (node: any) => any;
    alterNode?: (node: any) => any;
    listsPrefixesRenderers?: Record<string, ComponentType<any>>;
    renderers?: Record<string, ComponentType<any>>;
    customHTMLElementModels?: Record<string, any>;
    WebView?: ComponentType<any>;
    renderersProps?: Record<string, any>;
    dangerouslySetInnerHTML?: {__html: string};
    debug?: boolean;
    defaultTextProps?: Record<string, any>;
    systemFonts?: string[];
  }

  const RenderHTML: ComponentType<RenderHTMLProps>;
  export default RenderHTML;
}

declare module '@expo/vector-icons' {
  import {ComponentType} from 'react';
  import {TextProps} from 'react-native';

  interface IconProps extends TextProps {
    name: string;
    size?: number;
    color?: string;
  }

  export const Ionicons: ComponentType<IconProps>;
  export const FontAwesome: ComponentType<IconProps>;
  export const MaterialIcons: ComponentType<IconProps>;
  export const MaterialCommunityIcons: ComponentType<IconProps>;
  export const Feather: ComponentType<IconProps>;
}
