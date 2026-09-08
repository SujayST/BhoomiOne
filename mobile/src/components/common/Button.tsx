import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, borderRadius, typography } from '../../theme/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          container: { backgroundColor: colors.accent },
          text: { color: colors.textInverse },
          loader: colors.textInverse,
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderColor: colors.primary,
          },
          text: { color: colors.primary },
          loader: colors.primary,
        };
      case 'ghost':
        return {
          container: { backgroundColor: 'transparent' },
          text: { color: colors.primary },
          loader: colors.primary,
        };
      case 'danger':
        return {
          container: { backgroundColor: colors.error },
          text: { color: colors.textInverse },
          loader: colors.textInverse,
        };
      default:
        return {
          container: { backgroundColor: colors.primary },
          text: { color: colors.textInverse },
          loader: colors.textInverse,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          container: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: borderRadius.sm },
          text: { fontSize: 13, fontWeight: '600' as const },
        };
      case 'lg':
        return {
          container: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: borderRadius.md },
          text: { fontSize: 16, fontWeight: '700' as const },
        };
      default:
        return {
          container: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: borderRadius.md },
          text: { fontSize: 15, fontWeight: '600' as const },
        };
    }
  };

  const variantStyle = getVariantStyles();
  const sizeStyle = getSizeStyles();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.baseContainer,
        variantStyle.container,
        sizeStyle.container,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variantStyle.loader} />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text
            style={[
              styles.baseText,
              variantStyle.text,
              sizeStyle.text,
              icon ? { marginLeft: 8 } : null,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  baseText: {
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});

