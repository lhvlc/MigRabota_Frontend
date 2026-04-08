import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import LottieView from 'lottie-react-native';
import { Colors } from '../../theme';

export const PaymentConfetti = ({ amount, onAnimationComplete }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Анимация появления суммы
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Запуск колбэка после анимации
      onAnimationComplete?.();
    });
  }, []);

  return (
    <View style={styles.container}>
      {/* Конфетти анимация */}
      <LottieView
        source={require('../../assets/animations/confetti.json')}
        autoPlay
        loop={false}
        style={styles.confetti}
      />

      {/* Сумма с анимацией масштаба */}
      <Animated.View
        style={[
          styles.amountContainer,
          {
            transform: [
              {
                scale: scaleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1],
                }),
              },
            ],
            opacity: opacityAnim,
          },
        ]}
      >
        <Text style={styles.amount}>+{amount}</Text>
        <Text style={styles.currency}>₽</Text>
      </Animated.View>

      {/* Подпись */}
      <Text style={styles.message}>Деньги зачислены</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
  },
  confetti: {
    position: 'absolute',
    width: '150%',
    height: '150%',
    top: -50,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  amount: {
    fontSize: 72,
    fontWeight: '800',
    color: Colors.accent.success,
    includeFontPadding: false,
  },
  currency: {
    fontSize: 36,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginLeft: 8,
  },
  message: {
    fontSize: 20,
    color: Colors.text.secondary,
    marginTop: 16,
  },
});