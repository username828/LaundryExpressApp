import { Button, StyleSheet, Text, View } from 'react-native';
import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { db } from '../firebaseConfig';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/core';

const ProfileScreen = () => {
  const auth = getAuth();
  const user = auth.currentUser;
  console.log(user);

  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (user) {
        try {
          // Query Firestore for the user document based on `customerId` (assumed to be `uid`)
          const profileQuery = query(
            collection(db, 'customers'),
            where('email', '==', user.email) // Searching by customerId
          );

          const querySnapshot = await getDocs(profileQuery);

          if (!querySnapshot.empty) {
            // Assuming there is only one document with this customerId
            const profileDoc = querySnapshot.docs[0];
            setProfile(profileDoc.data());
          } else {
            alert('No profile data found');
          }
        } catch (error) {
          console.error('Error fetching profile data:', error);
        }
      }
    };

    fetchProfileData();
  }, [user]);

  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const navigation=useNavigation();
  return (
    <View style={styles.container}>
      <View style={styles.profileContainer}>
        <Text style={styles.name}>{profile.name}</Text>
        <Text style={styles.email}>{profile.email}</Text>
      </View>

        <Button title="View Orders" onPress={()=>navigation.navigate("Orders")}></Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 16,
    color: '#777',
  },
});

export default ProfileScreen;
