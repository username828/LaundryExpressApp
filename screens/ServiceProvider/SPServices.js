import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, Button, FlatList, TouchableOpacity } from "react-native";

const SPServices = () => {
  const [service, setService] = useState("");
  const [servicesList, setServicesList] = useState([]);

  const addService = () => {
    if (service) {
      setServicesList([...servicesList, service]);
      setService(""); // Clear the input field
    }
  };

  const removeService = (index) => {
    const newServicesList = servicesList.filter((_, i) => i !== index);
    setServicesList(newServicesList);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Services</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Service"
        value={service}
        onChangeText={setService}
      />
      <Button title="Add Service" onPress={addService} />

      <FlatList
        data={servicesList}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <View style={styles.serviceItem}>
            <Text>{item}</Text>
            <TouchableOpacity onPress={() => removeService(index)}>
              <Text style={styles.removeButton}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
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
  serviceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  removeButton: {
    color: "red",
  },
});

export default SPServices; 