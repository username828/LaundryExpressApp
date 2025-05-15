import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Platform,
  StatusBar,
  Alert,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../theme/ThemeContext";
import * as Location from "expo-location";
import axios from "axios";
import Header from "../../components/Header";
import Card from "../../components/Card";
import { doc, getDoc } from "firebase/firestore";
import { firestore as db } from "../../firebaseConfig";
import polyline from "@mapbox/polyline";

const { width, height } = Dimensions.get("window");

// OpenRouteService API key
const ORS_API_KEY = "5b3ce3597851110001cf62485503c0a1c1824b7ca2f3f39d7e2f7dda";

const LiveTrackingScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const {
    orderId,
    customerAddress,
    dropoffTime,
    serviceProviderName,
    serviceProviderId,
  } = route.params;

  const mapRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [routeLoading, setRouteLoading] = useState(false);
  const [region, setRegion] = useState(null);
  const [customerLocation, setCustomerLocation] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [waypoints, setWaypoints] = useState([]);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [eta, setEta] = useState(null); // No default value, will be calculated
  const [currentWaypointIndex, setCurrentWaypointIndex] = useState(0);
  const [locationPermission, setLocationPermission] = useState(false);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [speed, setSpeed] = useState(40); // Constant speed set to 40 km/h
  const [remainingDistance, setRemainingDistance] = useState(null);
  const [trafficFactor, setTrafficFactor] = useState(1.0); // 1.0 = normal, >1.0 = traffic
  const [hasArrived, setHasArrived] = useState(false);

  // Timer for updating the ETA
  const etaIntervalRef = useRef(null);

  // Timer for moving the driver location
  const driverIntervalRef = useRef(null);

  // Timer for position simulation
  const simIntervalRef = useRef(null);

  // Get user's location permission and initialize locations
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        // Get location permission from the user
        const { status } = await Location.requestForegroundPermissionsAsync();
        setLocationPermission(status === "granted");

        // Attempt to get service provider location from Firestore
        let serviceProviderLocation = null;
        try {
          if (serviceProviderId) {
            console.log(
              "Fetching service provider data for ID:",
              serviceProviderId
            );
            const spRef = doc(db, "serviceProviders", serviceProviderId);
            const spSnapshot = await getDoc(spRef);

            if (spSnapshot.exists()) {
              const spData = spSnapshot.data();
              console.log("Service provider data:", spData);

              if (spData.location && spData.location.coordinates) {
                serviceProviderLocation = {
                  latitude: parseFloat(spData.location.coordinates.latitude),
                  longitude: parseFloat(spData.location.coordinates.longitude),
                };

                if (isCoordinateValid(serviceProviderLocation)) {
                  console.log(
                    "Using actual service provider coordinates:",
                    serviceProviderLocation
                  );
                  setDriverLocation(serviceProviderLocation);
                } else {
                  console.error(
                    "Invalid service provider coordinates:",
                    serviceProviderLocation
                  );
                  throw new Error("Invalid service provider coordinates");
                }
              } else {
                console.error("No coordinates in service provider data");
                throw new Error("No coordinates in service provider data");
              }
            } else {
              console.error("Service provider document does not exist");
              throw new Error("Service provider document does not exist");
            }
          } else {
            console.error("No serviceProviderId provided");
            throw new Error("No serviceProviderId provided");
          }
        } catch (error) {
          console.error("Error fetching service provider location:", error);

          // Create a fallback location in Lahore
          serviceProviderLocation = {
            latitude: 31.5127,
            longitude: 74.3516,
          };
          console.log(
            "Using fallback service provider location:",
            serviceProviderLocation
          );
          setDriverLocation(serviceProviderLocation);
        }

        // Get customer location
        let customerCoordinates = null;
        if (status === "granted") {
          try {
            const location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
              timeout: 15000,
            });
            const { latitude, longitude } = location.coords;
            customerCoordinates = {
              latitude: parseFloat(latitude),
              longitude: parseFloat(longitude),
            };
            console.log("Device location:", customerCoordinates);
          } catch (error) {
            console.error("Error getting device location:", error);
            // Create a fallback location near the service provider
            customerCoordinates = {
              latitude: serviceProviderLocation.latitude + 0.01,
              longitude: serviceProviderLocation.longitude + 0.01,
            };
            console.log(
              "Using fallback customer location:",
              customerCoordinates
            );
          }
        } else {
          console.warn("Location permission not granted");
          // Create a fallback location near the service provider
          customerCoordinates = {
            latitude: serviceProviderLocation.latitude + 0.01,
            longitude: serviceProviderLocation.longitude + 0.01,
          };
          console.log("Using fallback customer location:", customerCoordinates);
        }

        // Now that we have both locations, we can proceed
        if (
          isCoordinateValid(serviceProviderLocation) &&
          isCoordinateValid(customerCoordinates)
        ) {
          setCustomerLocation(customerCoordinates);

          // Set the map region to show both locations with appropriate zoom
          const latDelta =
            Math.abs(
              customerCoordinates.latitude - serviceProviderLocation.latitude
            ) * 2.5;
          const lngDelta =
            Math.abs(
              customerCoordinates.longitude - serviceProviderLocation.longitude
            ) * 2.5;

          setRegion({
            latitude:
              (customerCoordinates.latitude +
                serviceProviderLocation.latitude) /
              2,
            longitude:
              (customerCoordinates.longitude +
                serviceProviderLocation.longitude) /
              2,
            latitudeDelta: Math.max(0.02, latDelta),
            longitudeDelta: Math.max(0.02, lngDelta),
          });

          // Calculate actual distance (Haversine formula)
          const actualDistance = calculateHaversineDistance(
            customerCoordinates.latitude,
            customerCoordinates.longitude,
            serviceProviderLocation.latitude,
            serviceProviderLocation.longitude
          );

          console.log(
            "Actual calculated distance:",
            actualDistance.toFixed(2),
            "km"
          );

          // Fetch route from OpenRouteService
          fetchRoute(serviceProviderLocation, customerCoordinates);
        } else {
          throw new Error("Invalid coordinates for tracking");
        }
      } catch (error) {
        console.error("Error initializing tracking:", error);
        setLoading(false);
        Alert.alert(
          "Tracking Error",
          "Could not initialize live tracking. Please try again later.",
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      }
    })();

    return () => {
      if (etaIntervalRef.current) clearInterval(etaIntervalRef.current);
      if (driverIntervalRef.current) clearInterval(driverIntervalRef.current);
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, []);

  // Calculate distance using Haversine formula
  const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  // Fetch route from OpenRouteService API
  const fetchRoute = async (start, end) => {
    try {
      setRouteLoading(true);

      if (!isCoordinateValid(start) || !isCoordinateValid(end)) {
        console.error("Invalid coordinates for route calculation", {
          start,
          end,
        });
        throw new Error("Invalid coordinates for route planning");
      }

      // Prepare coordinates (longitude, latitude order for OpenRouteService)
      const startCoord = [start.longitude, start.latitude];
      const endCoord = [end.longitude, end.latitude];

      console.log("Attempting to fetch route between:", startCoord, endCoord);

      // Maximum number of retry attempts
      const maxRetries = 3;
      let retryCount = 0;
      let success = false;

      while (retryCount < maxRetries && !success) {
        try {
          console.log(`API attempt ${retryCount + 1} of ${maxRetries}...`);

          // Add exponential backoff delay to avoid rate limiting
          if (retryCount > 0) {
            const delay = Math.pow(2, retryCount) * 1000; // 2s, 4s, 8s
            console.log(`Waiting ${delay / 1000}s before retry...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
          }

          // Try the first API endpoint
          const response = await axios({
            method: "POST",
            url: "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
            headers: {
              Authorization: `${ORS_API_KEY}`,
              "Content-Type": "application/json",
              Accept: "application/geo+json",
            },
            data: JSON.stringify({
              coordinates: [startCoord, endCoord],
            }),
            timeout: 10000, // 10 second timeout
          });

          if (
            response.data &&
            response.data.features &&
            response.data.features.length > 0
          ) {
            const route = response.data.features[0];

            // Extract route coordinates
            const routePoints = route.geometry.coordinates.map((coord) => ({
              latitude: coord[1],
              longitude: coord[0],
            }));

            // Extract route information
            const properties = route.properties;
            if (properties && properties.summary) {
              // Convert distance from meters to kilometers
              const distanceKm = (properties.summary.distance / 1000).toFixed(
                1
              );
              setDistance(distanceKm);
              setRemainingDistance(parseFloat(distanceKm));

              // Apply a small random traffic factor to make each delivery unique
              // Random value between 0.9 and 1.3 (10% faster to 30% slower)
              const randomTraffic = 0.9 + Math.random() * 0.4;
              setTrafficFactor(randomTraffic);

              // Convert duration from seconds to minutes, adjusted with traffic factor
              // Calculate ETA based on our constant speed (40 km/h)
              const calculatedDurationHours = parseFloat(distanceKm) / 40;
              const durationMin = Math.ceil(
                calculatedDurationHours * 60 * randomTraffic
              );
              setDuration(durationMin);
              setEta(durationMin);

              // Keep speed constant at 40 km/h
              setSpeed(40);
            }

            setRouteCoordinates(routePoints);
            setWaypoints(routePoints);

            // Start simulation after getting route
            startSimulation(routePoints);
            setLoading(false);
            success = true;
            return;
          } else {
            console.error("No valid route found in API response");
            throw new Error("No valid route found");
          }
        } catch (error) {
          console.error(`API attempt ${retryCount + 1} failed:`, error);

          // Check if we should retry or try alternative endpoint
          if (retryCount === maxRetries - 1) {
            console.log("Trying alternative API endpoint...");
            // Try with the alternative API approach
            const retrySuccess = await retryFetchRoute(start, end);

            if (retrySuccess) {
              success = true;
              return;
            } else {
              console.log(
                "Alternative API endpoint also failed. Using fallback route."
              );
              break;
            }
          }

          retryCount++;
        }
      }

      // If we reach here, all API attempts have failed
      console.log("All API attempts failed. Generating fallback route.");
      fallbackToLinearRoute(start, end);
    } catch (error) {
      console.error("Error in fetchRoute:", error);

      // Log more detailed error information
      if (error.response) {
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);
        console.error("Error response headers:", error.response.headers);
      } else if (error.request) {
        console.error("Error request:", error.request);
      } else {
        console.error("Error message:", error.message);
      }

      // Fall back to linear route if API call fails
      fallbackToLinearRoute(start, end);
    } finally {
      setRouteLoading(false);
      setLoading(false);
    }
  };

  // Fallback to generate a route between the actual coordinates when API fails
  const fallbackToLinearRoute = (start, end) => {
    console.log("Using fallback route generation between actual coordinates");

    if (!isCoordinateValid(start) || !isCoordinateValid(end)) {
      console.error("Invalid coordinates for fallback route", { start, end });
      Alert.alert(
        "Route Error",
        "Cannot generate a route with the provided locations.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
      return;
    }

    // Generate a more realistic route with slight zigzags
    const numSegments = 8; // More segments for a more realistic path
    const points = [];
    points.push({ latitude: start.latitude, longitude: start.longitude });

    // Create a more realistic path by adding some random offsets
    for (let i = 1; i < numSegments; i++) {
      const ratio = i / numSegments;

      // Base point on the direct line
      const baseLat = start.latitude + (end.latitude - start.latitude) * ratio;
      const baseLng =
        start.longitude + (end.longitude - start.longitude) * ratio;

      // Add some random zigzag to simulate roads
      // More zigzag in the middle, less at the start and end
      const zigzagFactor = Math.sin(ratio * Math.PI); // peak in the middle
      const maxOffset = 0.0015 * zigzagFactor; // Maximum deviation from straight line
      const latOffset = (Math.random() * 2 - 1) * maxOffset;
      const lngOffset = (Math.random() * 2 - 1) * maxOffset;

      points.push({
        latitude: baseLat + latOffset,
        longitude: baseLng + lngOffset,
      });
    }

    // Add destination point
    points.push({ latitude: end.latitude, longitude: end.longitude });

    setRouteCoordinates(points);
    setWaypoints(points);

    // Calculate actual distance using Haversine formula
    const directDistance = calculateHaversineDistance(
      start.latitude,
      start.longitude,
      end.latitude,
      end.longitude
    );

    // Add ~25% to straight-line distance to account for actual road network and zigzags
    const zigzagFactor = 1.25;
    const adjustedDistance = directDistance * zigzagFactor;

    // Set distance with 1 decimal place
    setDistance(adjustedDistance.toFixed(1));
    setRemainingDistance(adjustedDistance);

    // Set constant speed to 40 km/h
    setSpeed(40);

    // Calculate ETA based on adjusted distance and constant speed
    const durationMinutes = Math.ceil((adjustedDistance / 40) * 60);
    setDuration(durationMinutes);
    setEta(durationMinutes);

    console.log(
      `Fallback route generated between actual coordinates: ${adjustedDistance.toFixed(
        1
      )}km, ${durationMinutes}min at 40 km/h`
    );

    // Start simulation
    startSimulation(points);
  };

  // Calculate intermediate position between waypoints for smoother movement
  const getInterpolatedPosition = (pointA, pointB, fraction) => {
    return {
      latitude:
        pointA.latitude + (pointB.latitude - pointA.latitude) * fraction,
      longitude:
        pointA.longitude + (pointB.longitude - pointA.longitude) * fraction,
    };
  };

  // Start position simulation along the route
  const startSimulation = (routePoints) => {
    if (!routePoints || routePoints.length < 2) {
      console.error(
        "Not enough route points for simulation:",
        routePoints?.length
      );
      return;
    }

    // Clear any existing interval
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
    }

    console.log(
      `Starting simulation with ${routePoints.length} points, distance: ${distance}km`
    );

    let currentPointIndex = 0;
    let lastUpdate = Date.now();

    // Calculate how far each point represents in km
    const distancePerPoint = parseFloat(distance) / (routePoints.length - 1);
    let currentRemainingDistance = parseFloat(distance);
    let fractionalIndex = 0; // For smooth interpolation between points

    // Update the driver's position more frequently for smoother animation
    simIntervalRef.current = setInterval(() => {
      try {
        const now = Date.now();
        const timeDelta = (now - lastUpdate) / 1000; // Time passed in seconds
        lastUpdate = now;

        // Calculate how far we should move based on speed (km per second)
        const currentSpeed = parseFloat(speed);
        const distanceToMoveKm = (currentSpeed / 3600) * timeDelta;

        // Update remaining distance
        currentRemainingDistance = Math.max(
          0,
          currentRemainingDistance - distanceToMoveKm
        );
        setRemainingDistance(currentRemainingDistance);

        // Calculate how many fractional points to move
        const fractionToMove = distanceToMoveKm / distancePerPoint;

        // Update fractional index for smooth movement
        fractionalIndex = Math.min(
          routePoints.length - 1,
          fractionalIndex + fractionToMove
        );
        currentPointIndex = Math.floor(fractionalIndex);

        // Calculate fraction between current and next point
        const fraction = fractionalIndex - currentPointIndex;

        // Get the actual position (interpolated between points for smoothness)
        if (currentPointIndex < routePoints.length - 1) {
          const currentPoint = routePoints[currentPointIndex];
          const nextPoint = routePoints[currentPointIndex + 1];

          // Create a smoothly interpolated position
          const interpolatedPosition = getInterpolatedPosition(
            currentPoint,
            nextPoint,
            fraction
          );

          console.log(
            `Moving to interpolated position between points ${currentPointIndex} and ${
              currentPointIndex + 1
            }, fraction: ${fraction.toFixed(2)}`
          );
          setDriverLocation(interpolatedPosition);
          setCurrentWaypointIndex(currentPointIndex);
        } else {
          // We've reached the end
          setDriverLocation(routePoints[routePoints.length - 1]);
        }

        // Update ETA based on remaining distance and current speed
        if (currentSpeed > 0) {
          const remainingTimeHours = currentRemainingDistance / currentSpeed;
          const remainingTimeMinutes = Math.max(
            0,
            Math.ceil(remainingTimeHours * 60)
          );
          console.log(
            `Updating ETA: ${remainingTimeMinutes} min remaining (${currentRemainingDistance.toFixed(
              2
            )}km at ${currentSpeed}km/h)`
          );
          setEta(remainingTimeMinutes);
        }

        // Check if we've reached the end
        if (
          currentPointIndex >= routePoints.length - 1 ||
          currentRemainingDistance <= 0.05
        ) {
          console.log("Reached destination, stopping simulation");
          clearInterval(simIntervalRef.current);

          // Set final position and values
          setDriverLocation(routePoints[routePoints.length - 1]);
          setRemainingDistance(0);
          setEta(0);
          setHasArrived(true);

          // Show arrival notification
          Alert.alert(
            "Service Provider Arrived",
            "Your service provider has arrived at your location.",
            [{ text: "OK" }]
          );
        }
      } catch (error) {
        console.error("Error in simulation:", error);
        clearInterval(simIntervalRef.current);
      }
    }, 5000); // Update every second for smoother motion
  };

  // Format minutes to MM:SS or return arrival message if time is 0
  const formatEta = (minutes) => {
    if (minutes === null || minutes === undefined) return "--:--";
    if (minutes <= 0) return "Arrived";

    const mins = Math.floor(minutes);
    const secs = Math.round((minutes - mins) * 60);
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Retry fetch with an alternative approach
  const retryFetchRoute = async (start, end) => {
    try {
      if (!isCoordinateValid(start) || !isCoordinateValid(end)) {
        console.error("Invalid coordinates for retry route calculation", {
          start,
          end,
        });
        return false;
      }

      console.log("Retrying route fetch with simplified parameters");

      // Prepare coordinates (longitude, latitude)
      const startCoord = [start.longitude, start.latitude];
      const endCoord = [end.longitude, end.latitude];

      const response = await axios({
        method: "POST",
        url: "https://api.openrouteservice.org/v2/directions/driving-car/json",
        headers: {
          Authorization: `${ORS_API_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        data: JSON.stringify({
          coordinates: [startCoord, endCoord],
        }),
        timeout: 10000, // 10 second timeout
      });

      if (
        response.data &&
        response.data.routes &&
        response.data.routes.length > 0
      ) {
        const route = response.data.routes[0];

        // Extract route geometry
        if (route.geometry) {
          // Decode polyline format
          try {
            const decoded = polyline.decode(route.geometry, 5);
            const routePoints = decoded.map((coord) => ({
              latitude: coord[0],
              longitude: coord[1],
            }));

            // Extract route information
            const summary = route.summary;
            if (summary) {
              // Convert distance from meters to kilometers
              const distanceKm = (summary.distance / 1000).toFixed(1);
              setDistance(distanceKm);
              setRemainingDistance(parseFloat(distanceKm));

              // Apply a small random traffic factor
              const randomTraffic = 0.9 + Math.random() * 0.3;
              setTrafficFactor(randomTraffic);

              // Calculate duration based on our constant 40 km/h speed
              const calculatedDurationHours = parseFloat(distanceKm) / 40;
              const durationMin = Math.ceil(
                calculatedDurationHours * 60 * randomTraffic
              );
              setDuration(durationMin);
              setEta(durationMin);

              // Keep speed constant at 40 km/h
              setSpeed(40);
            }

            setRouteCoordinates(routePoints);
            setWaypoints(routePoints);

            // Start simulation
            startSimulation(routePoints);
            setLoading(false);

            console.log("Retry route fetch successful");
            return true;
          } catch (error) {
            console.error("Error decoding polyline:", error);
            return false;
          }
        }
      }

      console.error("Retry route fetch returned invalid route data");
      return false;
    } catch (error) {
      console.error("Error in retry route fetch:", error);

      // Log more detailed error information
      if (error.response) {
        console.error("Retry error response data:", error.response.data);
        console.error("Retry error response status:", error.response.status);
      } else if (error.request) {
        console.error("Retry error request:", error.request);
      } else {
        console.error("Retry error message:", error.message);
      }

      return false;
    }
  };

  // Helper to validate coordinates
  const isCoordinateValid = (coord) => {
    return (
      coord &&
      !isNaN(coord.latitude) &&
      !isNaN(coord.longitude) &&
      Math.abs(coord.latitude) <= 90 &&
      Math.abs(coord.longitude) <= 180
    );
  };

  // Handle state updates
  useEffect(() => {
    if (driverLocation && routeCoordinates.length > 0) {
      // Log position updates for debugging
      console.log("Driver position updated:", driverLocation);

      // If we're not using a simulation, we should update ETA manually
      if (!simIntervalRef.current && remainingDistance > 0 && speed > 0) {
        const remainingTimeHours = remainingDistance / parseFloat(speed);
        const remainingTimeMinutes = Math.max(
          0,
          Math.ceil(remainingTimeHours * 60)
        );
        setEta(remainingTimeMinutes);
      }
    }
  }, [driverLocation]);

  // Make sure we initialize the simulation with valid data
  useEffect(() => {
    if (
      routeCoordinates.length > 0 &&
      !simIntervalRef.current &&
      distance > 0
    ) {
      console.log("Route coordinates available, starting simulation");
      startSimulation(routeCoordinates);
    }
  }, [routeCoordinates, distance]);

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Header
          title="Live Tracking"
          leftIcon="arrow-back"
          onLeftPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textLight }]}>
            Loading map...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <Header
        title="Live Tracking"
        leftIcon="arrow-back"
        onLeftPress={() => navigation.goBack()}
      />

      {hasArrived && (
        <View style={styles.arrivalBanner}>
          <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
          <Text style={styles.arrivalBannerText}>
            Service Provider Has Arrived
          </Text>
        </View>
      )}

      <View style={styles.mapContainer}>
        {region && (
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={region}
            showsUserLocation={locationPermission}
            showsMyLocationButton={false}
            showsCompass={true}
            rotateEnabled={true}
            zoomEnabled={true}
            scrollEnabled={true}
          >
            {/* Delivery route line */}
            {routeCoordinates.length > 0 && (
              <Polyline
                coordinates={routeCoordinates}
                strokeWidth={3}
                strokeColor={theme.colors.primary}
                lineDashPattern={[1]}
              />
            )}

            {/* Customer location marker */}
            {customerLocation && (
              <Marker
                coordinate={customerLocation}
                title="Delivery Location"
                description={customerAddress || "Your delivery address"}
              >
                <View style={styles.destinationMarker}>
                  <Ionicons
                    name="home"
                    size={20}
                    color={theme.colors.primary}
                  />
                </View>
              </Marker>
            )}

            {/* Driver location marker */}
            {driverLocation && (
              <Marker
                coordinate={driverLocation}
                title={serviceProviderName || "Delivery Agent"}
                description={
                  hasArrived
                    ? "Has arrived at your location"
                    : "Your delivery is on the way"
                }
              >
                <View
                  style={[
                    styles.driverMarker,
                    hasArrived && styles.arrivedMarker,
                  ]}
                >
                  <Ionicons
                    name={hasArrived ? "checkmark" : "bicycle"}
                    size={20}
                    color="#FFFFFF"
                  />
                </View>
              </Marker>
            )}
          </MapView>
        )}

        {routeLoading && (
          <View style={styles.routeLoadingContainer}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={styles.routeLoadingText}>Calculating route...</Text>
          </View>
        )}
      </View>

      <Card style={styles.infoCard}>
        <Text style={styles.etaTitle}>
          {hasArrived ? "Status" : "Estimated Time of Arrival"}
        </Text>
        <Text style={styles.etaValue}>
          {hasArrived ? "Arrived" : eta ? formatEta(eta) : "--:--"}
        </Text>

        <View style={styles.etaMinutes}>
          <Text style={styles.etaMinutesText}>
            {hasArrived
              ? "Rider has reached the location"
              : eta
              ? `${Math.ceil(eta)} minutes`
              : "..."}
          </Text>
        </View>

        <View style={styles.routeInfoContainer}>
          {distance && (
            <View style={styles.routeInfoItem}>
              <Ionicons
                name="navigate"
                size={16}
                color={theme.colors.textLight}
              />
              <Text style={styles.routeInfoText}>{distance} km</Text>
            </View>
          )}
          {remainingDistance !== null && (
            <View style={styles.routeInfoItem}>
              <Ionicons name="flag" size={16} color={theme.colors.textLight} />
              <Text style={styles.routeInfoText}>
                {hasArrived
                  ? "0.0 km left"
                  : `${remainingDistance.toFixed(1)} km left`}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        <View style={styles.driverInfoContainer}>
          <View style={styles.driverIconContainer}>
            <Ionicons name="bicycle" size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.driverDetails}>
            <Text style={styles.driverName}>{serviceProviderName}</Text>
            <Text
              style={[styles.driverStatus, hasArrived && styles.arrivedStatus]}
            >
              {hasArrived
                ? "Has arrived at your location"
                : "En route to your location"}
            </Text>
          </View>
        </View>

        <View style={styles.deliveryInfoContainer}>
          <View style={styles.deliveryInfoItem}>
            <Ionicons
              name="location"
              size={18}
              color={theme.colors.textLight}
            />
            <Text style={styles.deliveryInfoText} numberOfLines={2}>
              {customerAddress || "Your delivery address"}
            </Text>
          </View>

          <View style={styles.deliveryInfoItem}>
            <Ionicons name="time" size={18} color={theme.colors.textLight} />
            <Text style={styles.deliveryInfoText}>
              Expected by {dropoffTime || "the scheduled time"}
            </Text>
          </View>
        </View>
      </Card>

      <TouchableOpacity
        style={[styles.centerButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => {
          mapRef.current?.animateToRegion(region, 500);
        }}
      >
        <Ionicons name="locate" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  mapContainer: {
    flex: 1,
    overflow: "hidden",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  routeLoadingContainer: {
    position: "absolute",
    top: 10,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    padding: 8,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 40,
  },
  routeLoadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#4A5568",
  },
  infoCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  etaTitle: {
    fontSize: 14,
    color: "#718096",
    marginBottom: 4,
  },
  etaValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2D3748",
  },
  routeInfoContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  routeInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: "#F7FAFC",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  routeInfoText: {
    fontSize: 12,
    color: "#4A5568",
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 16,
  },
  driverInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  driverIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EBF4FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2D3748",
    marginBottom: 2,
  },
  driverStatus: {
    fontSize: 14,
    color: "#48BB78",
  },
  arrivedStatus: {
    color: "#48BB78",
    fontWeight: "700",
  },
  deliveryInfoContainer: {
    backgroundColor: "#F7FAFC",
    borderRadius: 8,
    padding: 12,
  },
  deliveryInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  deliveryInfoText: {
    fontSize: 14,
    color: "#4A5568",
    marginLeft: 8,
    flex: 1,
  },
  centerButton: {
    position: "absolute",
    bottom: 200,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#4299E1",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  destinationMarker: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 6,
    borderWidth: 2,
    borderColor: "#4299E1",
  },
  driverMarker: {
    backgroundColor: "#4299E1",
    borderRadius: 12,
    padding: 6,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  arrivedMarker: {
    backgroundColor: "#48BB78",
    borderRadius: 12,
    padding: 6,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  etaMinutes: {
    marginTop: 4,
    marginBottom: 8,
  },
  etaMinutesText: {
    fontSize: 14,
    color: "#718096",
  },
  arrivalBanner: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: "#48BB78",
    padding: 10,
    borderRadius: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  arrivalBannerText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    marginLeft: 10,
  },
});

export default LiveTrackingScreen;
