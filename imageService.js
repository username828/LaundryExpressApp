import axios from "axios";
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from "@env";
export const uploadImageToCloudinary = async (imageUri) => {
  const data = new FormData();
  data.append("file", {
    uri: imageUri,
    type: "image/jpeg", // Adjust based on your image type
    name: "upload.jpg",
  });
  data.append("upload_preset",CLOUDINARY_UPLOAD_PRESET ); // Replace with actual preset name
  data.append("cloud_name", CLOUDINARY_CLOUD_NAME); // Replace with your Cloudinary cloud name

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: data,
      }
    );
    const result=await response.json()
    
    return result.secure_url; // Return URL of uploaded image
  } catch (error) {
    console.error("Error uploading image:", error);
    return null;
  }
};
