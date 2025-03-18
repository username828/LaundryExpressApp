import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirestore, collection, addDoc, Timestamp } from "firebase/firestore";
import { auth } from "./firebaseConfig"; // Ensure Firebase is initialized

const db = getFirestore();
const storage = getStorage();

export const uploadImageToFirebase = async (imageUri) => {
  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const imageRef = ref(storage, `complaints/${Date.now()}.jpg`);
    await uploadBytes(imageRef, blob);
    return await getDownloadURL(imageRef);
  } catch (error) {
    console.error("Image upload failed:", error);
    return null;
  }
};

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
