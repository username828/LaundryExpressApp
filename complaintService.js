import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirestore, collection, addDoc, Timestamp } from "firebase/firestore";
import { auth } from "./firebaseConfig"; // Ensure Firebase is initialized

const db = getFirestore();


export const submitComplaint = async (orderId, providerId,description, imageUrl) => {
  try {
    console.log(orderId,providerId)
    const user = auth.currentUser;
    await addDoc(collection(db, "complaints"), {
      customerId: user.uid,
      orderId,
      providerId,
      description,
      imageUrl,
      status: "Pending",
      createdAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Failed to submit complaint:", error);
  }
};
