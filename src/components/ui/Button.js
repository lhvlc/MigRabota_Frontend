import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, Typography } from '../../theme';

const ButtonVariants = {
  primary: {
    backgroundColor: Colors.accent.primary,
    textColor: '#FFFFFF',
  },
  secondary: {
    backgroundColor: 'transparent',
    borderColor: Colors.accent.primary,
    borderWidth: 1,
    textColor: Colors.accent.primary,
  },
  danger: {
    backgroundColor: Colors.accent.danger,
    textColor: '#FFFFFF',
  },
  sos: {
    backgroundColor: Colors.accent.danger,
    textColor: '#FFFFFF',
    pulse: true, // Пульсация для SOS
  },
};

export const Button = ({ 
  variant = 'primary', 
  size = 'medium', 
  children, 
  loading = false,
  disabled = false,
  onPress,
  ...props 
}) => {
  const variantStyle = ButtonVariants[variant];
  const sizeStyle = {
    small: { height: 40, paddingHorizontal: 16 },
    medium: { height: 48, paddingHorizontal: 20 },
    large: { height: 56, paddingHorizontal: 24 },
  };

  return (
    <TouchableOpacity
      style={[
        styles.base,
        sizeStyle[size],
        variantStyle.backgroundColor && { backgroundColor: variantStyle.backgroundColor },
        variantStyle.borderColor && { borderColor: variantStyle.borderColor },
        variantStyle.borderWidth && { borderWidth: variantStyle.borderWidth },
        disabled && styles.disabled,
        variant === 'sos' && styles.sosPulse,
      ]}
      onPress={disabled || loading ? undefined : onPress}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variantStyle.textColor || '#FFFFFF'} />
      ) : (
        <Text style={[styles.text, { color: variantStyle.textColor || '#FFFFFF' }]}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  text: {
    ...Typography.button,
  },
  disabled: {
    opacity: 0.5,
  },
  sosPulse: {
    shadowColor: Colors.accent.danger,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 8,
    // Анимация пульсации реализуется через Animated API
  },
});