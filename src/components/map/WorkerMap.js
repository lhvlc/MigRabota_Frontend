import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';

export const WorkerMap = ({ onLocationSelect, initialRegion }) => {
  const [region, setRegion] = useState(initialRegion || {
    latitude: 43.1155,    // Владивосток (кампус ДВФУ)
    longitude: 131.8855,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      // Центрировать карту на пользователе
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    })();
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        onPress={(e) => onLocationSelect?.(e.nativeEvent.coordinate)}
        provider="google" // или "apple" для iOS
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        loadingEnabled={true}
        loadingIndicatorColor={Colors.accent.primary}
        loadingBackgroundColor={Colors.background.primary}
      >
        {/* Круг радиуса поиска (3-5 км) */}
        {userLocation && (
          <Circle
            center={userLocation}
            radius={3000} // 3 км
            strokeColor={Colors.accent.primary}
            fillColor="rgba(99, 102, 241, 0.1)"
            strokeWidth={2}
          />
        )}

        {/* Маркеры заказов */}
        {orders.map((order) => (
          <Marker
            key={order.id}
            coordinate={{ latitude: order.lat, longitude: order.lng }}
            title={order.type}
            description={`${order.price_per_hour}₽/час`}
            pinColor={order.urgency === 'SOS' ? '#EF4444' : '#6366F1'}
            onPress={() => setSelectedOrder(order)}
          />
        ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    margin: 16,
    borderWidth: 1,
    borderColor: Colors.background.tertiary,
  },
  map: {
    flex: 1,
  },
});