import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, Image, FlatList, TouchableOpacity, ActivityIndicator 
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getDoc, doc,query,where,getDocs,collection } from 'firebase/firestore';
import { MaterialCommunityIcons } from 'react-native-vector-icons';
import Sentiment from 'sentiment';
import { db } from '../../firebaseConfig'; // Ensure this points to your Firebase configuration

const sentimentAnalyzer = new Sentiment();
const ServiceProviderScreen = () => {
  const route = useRoute();
  const { providerId } = route.params; // Get providerId from route params

  const [providerDetails, setProviderDetails] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('All');

  const navigation = useNavigation();

  useEffect(() => {
    const fetchProviderDetails = async () => {
      try {
        const docRef = doc(db, 'serviceProviders', providerId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProviderDetails(docSnap.data());
          setServices(docSnap.data().services || []);
        }

        //console.log(providerDetails.services)
      } catch (error) {
        console.error('Error fetching provider details: ', error);
      } finally {
        setTimeout(() => setLoading(false), 1000); // Simulated loading time
      }
    };

    const fetchReviews = async () => {
      try {
        const reviewsQuery = query(collection(db, 'ratings'), where('serviceProviderId', '==', providerId));
        const querySnapshot = await getDocs(reviewsQuery);
        
        // Fetch reviews and analyze sentiment
        const fetchedReviews = querySnapshot.docs.map(doc => {
          const reviewData = doc.data();
          const sentimentScore = sentimentAnalyzer.analyze(reviewData.comment).score;

          // Determine sentiment category
          let sentimentCategory = 'Neutral';
          if (sentimentScore > 1) {
            sentimentCategory = 'Positive';
          } else if (sentimentScore < -1) {
            sentimentCategory = 'Negative';
          }

          return { id: doc.id, ...reviewData, sentiment: sentimentCategory };
        });
        console.log("Fetched Reviews:", providerDetails); // Log reviews

        setReviews(fetchedReviews);
        setFilteredReviews(fetchedReviews); // Default: Show all
      } catch (error) {
        console.error('Error fetching reviews:', error);
      }
    };



    fetchProviderDetails();
   
    fetchReviews();
  }, [providerId]);
  const filterReviews = (category) => {
    setSelectedFilter(category);
    if (category === 'All') {
      setFilteredReviews(reviews);
    } else {
      setFilteredReviews(reviews.filter(review => review.sentiment === category));
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (!providerDetails) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorMessage}>Service provider not found.</Text>
      </View>
    );
  }

  const specialOffers = [
    { id: '1', title: '20% off on first service!', icon: 'percent' },
    { id: '2', title: 'Free pickup & delivery', icon: 'truck' },
    { id: '3', title: 'Loyalty rewards for regular customers', icon: 'gift' },
  ];

  const handleOrderPlacement = () => {
    navigation.navigate('OrderPlacement', {
      providerId,
      availableServices: services,
    });
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={[{ key: 'providerDetails' }, { key: 'specialOffers' }, { key: 'services' }, { key: 'reviews' }]}
        renderItem={({ item }) => {
          if (item.key === 'providerDetails') {
            return (
              <View style={styles.header}>
                <Image 
                  source={{ uri: providerDetails.image || 'https://via.placeholder.com/140' }} 
                  style={styles.providerImage} 
                />
                <Text style={styles.providerName}>{providerDetails.name || 'Default Name'}</Text>
                <Text style={styles.rating}>⭐ {providerDetails.rating || 'N/A'}</Text>
                <Text style={styles.description}>{providerDetails.description || 'No description available'}</Text>
              </View>
            );
          }
          
          if (item.key === 'specialOffers') {
            return (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🎉 Special Offers</Text>
                {specialOffers.map((offer) => (
                  <View key={offer.id} style={styles.offerItem}>
                    <Text style={styles.offerText}>
                      <Text style={{ fontSize: 18 }}>🎁</Text> {offer.title}
                    </Text>
                  </View>
                ))}
              </View>
              );
          }

          if (item.key === 'services') {
            return (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🧼 Services Offered</Text>
                <FlatList
                  data={services}
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={({ item }) => (
                    <View style={styles.serviceItem}>
                      {item.image ? (
                        <Image source={{ uri: item.image }} style={styles.serviceImage} />
                      ) : (
                        <Text style={styles.serviceIcon}>🛁</Text>
                      )}
                      <View style={styles.serviceTextContainer}>
                        <Text style={styles.serviceName}>{item.name || 'Service'}</Text>
                        <Text style={styles.servicePrice}>💲{item.price || 'N/A'}</Text>
                      </View>
                    </View>
                  )}
                />
              </View>
            );
          }

          if (item.key === 'reviews') {
            return (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>💬 Reviews</Text>

                {/* Filter Buttons */}
                <View style={styles.filterButtonsContainer}>
                  {['All', 'Positive', 'Neutral', 'Negative'].map(category => (
                    <TouchableOpacity 
                      key={category} 
                      style={[styles.filterButton, selectedFilter === category && styles.filterButtonActive]} 
                      onPress={() => filterReviews(category)}
                    >
                      <Text style={styles.filterButtonText}>{category}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Reviews List */}
                <FlatList
                  data={filteredReviews}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <View style={[styles.reviewItem, getReviewStyle(item.sentiment)]}>
                      <Text style={styles.reviewText}>🗣️ {item.comment}</Text>
                      <Text style={styles.reviewSentiment}>Sentiment: {item.sentiment}</Text>
                    </View>
                  )}
                  ListEmptyComponent={<Text style={styles.noReviewsText}>No reviews available</Text>}
                />
              </View>
            );
          }

          return null;
        }}
        keyExtractor={(item) => item.key}
      />
      <TouchableOpacity style={styles.orderButton} onPress={handleOrderPlacement}>
        <Text style={styles.orderButtonText}>🛒 Place Order</Text>
      </TouchableOpacity>
    </View>
  );
};

const getReviewStyle = (sentiment) => {
  switch (sentiment) {
    case 'Positive':
      return { backgroundColor: '#C8E6C9' }; // Light Green
    case 'Neutral':
      return { backgroundColor: '#FFF9C4' }; // Light Yellow
    case 'Negative':
      return { backgroundColor: '#FFCDD2' }; // Light Red
    default:
      return { backgroundColor: '#E0E0E0' }; // Default Grey
  }
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorMessage: {
    fontSize: 18,
    color: '#D32F2F',
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
  },
  providerImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: '#fff',
    marginBottom: 16,
  },
  providerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  rating: {
    fontSize: 18,
    color: '#FFD700',
    marginVertical: 5,
  },
  description: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginHorizontal: 20,
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 10,
    marginVertical: 6,
    shadowOpacity: 0.1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceIcon: {
    fontSize: 28,
    marginRight: 10,
  },
  serviceTextContainer: {
    marginLeft: 10,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  servicePrice: {
    fontSize: 16,
    color: '#2E7D32',
  },
  orderButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 20,
  },
  orderButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  filterButtonsContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  filterButton: { padding: 10, borderRadius: 5, backgroundColor: '#ddd' },
  filterButtonActive: { backgroundColor: '#4CAF50' },
  filterButtonText: { fontSize: 16, color: '#333' },
  reviewItem: { padding: 10, borderRadius: 5, marginVertical: 5 },
  reviewText: { fontSize: 16 },
  reviewSentiment: { fontSize: 14, fontWeight: 'bold', marginTop: 5 },
  noReviewsText: { textAlign: 'center', marginTop: 10, color: '#777' }
});

export default ServiceProviderScreen;




