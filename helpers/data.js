import { db } from '../firebaseConfig';
import { doc, setDoc, collection,getDocs,query,where} from 'firebase/firestore';
import { firestore } from '../firebaseConfig';

export const addTestData = async () => {
  try {
    // Adding a customer
    const customerRef = doc(collection(db, 'customers'), 'customer1');
    await setDoc(customerRef, {
      customerId: 'customer1',
      name: 'John Doe',
      email: 'johndoe@example.com',
      phone: '123-456-7890',
      address: '123 Main St, City, Country',
    });

    // Adding a service provider
    const serviceProviderRef = doc(collection(db, 'serviceProviders'), 'provider1');
    await setDoc(serviceProviderRef, {
      serviceProviderId: 'provider1',
      name: 'Sylvester Wash',
      rating: 4.8,
      location: {
        latitude: 37.7749,
        longitude: -122.4194,  // San Francisco coords
      },
      servicesOffered: ['washing', 'laundry'],
      priceRange: '$$',
    });

    // Adding an order
    const orderRef = doc(collection(db, 'orders'), 'order1');
    await setDoc(orderRef, {
      orderId: 'order1',
      customerId: 'customer1',
      serviceProviderId: 'provider1',
      serviceType: 'laundry',
      price: 20.0,
      status: 'pending',
      address: '123 Main St, City, Country',
      createdAt: new Date(),
    });

    // Adding a rating
    const ratingRef = doc(collection(db, 'ratings'), 'rating1');
    await setDoc(ratingRef, {
      ratingId: 'rating1',
      serviceProviderId: 'provider1',
      customerId: 'customer1',
      rating: 5,
      comment: 'Excellent service!',
      createdAt: new Date(),
    });

    console.log('Test data added successfully!');
  } catch (error) {
    console.error('Error adding test data:', error);
  }
};


export const addCustomer =async(name,email,password,uid)=>{
  const res=await setDoc(doc(firestore,"customers",uid),{
    name:name,
    email:email,
    createdAt:new Date(),
    customerId:uid
  })
}


export const getOrdersByUser = async (userId) => {
  const q = query(
    collection(firestore, 'orders'),
    where('customerId', '==', userId) // Filter orders by user ID
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};