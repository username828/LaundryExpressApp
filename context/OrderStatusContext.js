import React, { createContext, useEffect, useState, useContext } from "react";
import Toast from "react-native-toast-message";
import { firestore } from "../firebaseConfig";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const OrderStatusContext = createContext();

export const OrderStatusProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const auth = getAuth();
  const user = auth.currentUser; // Get logged-in user

  useEffect(() => {
    if (!user) return; // Wait for authentication

    const ordersQuery = query(
      collection(firestore, "orders"),
      where("customerId", "==", user.uid) // Fetch only this user's orders
    );

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      let updatedOrders = [];
      snapshot.forEach((doc) => {
        updatedOrders.push({ id: doc.id, ...doc.data() });
      });

      updatedOrders.forEach((order) => {
        const existingOrder = orders.find((o) => o.id === order.id);
        if (existingOrder && existingOrder.status !== order.status) {
          showOrderUpdateToast(order);
        }
      });

      setOrders(updatedOrders);
    });

    return () => unsubscribe();
  }, [user,orders]);

  const showOrderUpdateToast = (order) => {
    Toast.show({
      type: "info",
      text1: "Order Update",
      text2: `Your order #${order.id} is now ${order.status}.`,
      visibilityTime: 4000,
      autoHide: true,
    });

  };


  return (
    <OrderStatusContext.Provider value={{ orders }}>
      {children}
      <Toast />
    </OrderStatusContext.Provider>
  );
};

export const useOrderStatus = () => useContext(OrderStatusContext);
