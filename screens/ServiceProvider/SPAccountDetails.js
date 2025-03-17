import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, Button, Image } from "react-native";

const SPAccountDetails = () => {
  const [name, setName] = useState(""); // Replace with actual data
  const [email, setEmail] = useState(""); // Replace with actual data
  const [phone, setPhone] = useState(""); // For user input
  const [location, setLocation] = useState(""); // For user input
  const [profilePicture, setProfilePicture] = useState(""); // For user input

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Account Details</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Enter Email Address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Enter Phone Number"
        value={phone}
        onChangeText={setPhone}
      />
      <TextInput
        style={styles.input}
        placeholder="Enter Location"
        value={location}
        onChangeText={setLocation}
      />
      <TextInput
        style={styles.input}
        placeholder="Enter Profile Picture URL"
        value={profilePicture}
        onChangeText={setProfilePicture}
      />

      {profilePicture ? (
        <Image
          source={{ uri: profilePicture }}
          style={styles.image}
          resizeMode="contain"
        />
      ) : null}

      <Button
        title="Save Changes"
        onPress={() => {
          /* Handle save logic */
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f9f9f9",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    height: 45,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 10,
    width: "100%",
  },
  image: {
    width: 200, // Adjust width as needed
    height: 200, // Adjust height as needed
    marginTop: 10,
  },
});

export default SPAccountDetails;
