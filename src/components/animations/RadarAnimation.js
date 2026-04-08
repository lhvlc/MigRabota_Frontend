import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Colors } from '../../theme';

export const RadarAnimation = ({ size = 240 }) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const rotationAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Анимация пульсации кругов
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        }),
      ])
    ).start();

    // Анимация вращения линий
    Animated.loop(
      Animated.timing(rotationAnim, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();

    return () => {
      pulseAnim.stopAnimation();
      rotationAnim.stopAnimation();
    };
  }, []);

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1.2],
  });

  const rotation = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Фоновый круг */}
      <View style={[styles.circle, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]} />

      {/* Пульсирующие круги */}
      {[0.4, 0.7, 1.0].map((scale, index) => (
        <Animated.View
          key={index}
          style={[
            styles.pulseCircle,
            {
              transform: [{ scale: pulseScale }],
              opacity: pulseAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.8, 0.3, 0],
              }),
              backgroundColor: `rgba(99, 102, 241, ${0.3 - index * 0.1})`,
            },
          ]}
        />
      ))}

      {/* Вращающиеся линии (как радар) */}
      <Animated.View style={[styles.radarLines, { transform: [{ rotate: rotation }] }]}>
        {[0, 90, 180, 270].map((angle, index) => (
          <View
            key={index}
            style={[
              styles.radarLine,
              {
                transform: [{ rotate: `${angle}deg` }],
                backgroundColor: Colors.accent.primary,
              },
            ]}
          />
        ))}
      </Animated.View>

      {/* Центральная точка */}
      <View style={styles.centerDot} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 1000,
  },
  pulseCircle: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 1000,
    borderWidth: 2,
    borderColor: 'rgba(99, 102, 241, 0.6)',
  },
  radarLines: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radarLine: {
    position: 'absolute',
    width: 2,
    height: '50%',
    top: '50%',
    transformOrigin: 'top center',
  },
  centerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.accent.primary,
    borderWidth: 4,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
});