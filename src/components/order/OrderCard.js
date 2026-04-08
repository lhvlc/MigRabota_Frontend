<View style={styles.orderHeader}>
  <Ionicons name={jobIcons[order.type] || 'person'} size={24} color={Colors.text.primary} />
  <Text style={styles.orderType}>{order.type}</Text>
  <View style={[styles.urgencyBadge, { backgroundColor: urgencyColor }]}>
    <Text style={styles.urgencyText}>
      {order.urgency === 'SOS' ? '🔥 SOS' : '📅 План'}
    </Text>
  </View>
</View>

import { Animated } from 'react-native';

const spinValue = new Animated.Value(0);
Animated.loop(
  Animated.timing(spinValue, {
    toValue: 1,
    duration: 3000,
    useNativeDriver: true,
  })
).start();

const pulseScale = spinValue.interpolate({
  inputRange: [0, 1],
  outputRange: [0.3, 1.2],
});

<View style={[
  styles.urgencyBadge,
  { backgroundColor: urgencyColor },
  { transform: [{ scale: pulseScale }] }
]}></View>
