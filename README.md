# LaundryExpress App

## Overview

LaundryExpress is a mobile application that connects customers with laundry service providers. The app streamlines the process of finding, ordering, and tracking laundry services, making it convenient for customers while helping service providers manage their business efficiently.

## Features

### For Customers

- **User Authentication**: Secure login and registration system
- **Service Provider Discovery**: Browse and search for laundry service providers
- **Service Selection**: View available services and pricing
- **Order Placement**: Easy order placement with service selection and scheduling
- **Real-time Order Tracking**: Track orders through various stages (pickup, washing, ironing, delivery)
- **Order History**: View past orders and their details
- **Profile Management**: Update personal information and addresses
- **Ratings & Reviews**: Rate and review service providers

### For Service Providers

- **Business Profile Management**: Create and update business profile
- **Service Management**: Add, edit, and remove services with pricing
- **Order Management**: View and process incoming orders
- **Status Updates**: Update order status in real-time
- **Customer Communication**: Receive and respond to customer inquiries
- **Analytics Dashboard**: View business performance metrics

## Technology Stack

- **Frontend**: React Native with Expo
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Navigation**: React Navigation
- **UI Components**: Custom components with modern design
- **Notifications**: Expo Notifications for real-time updates
- **Maps & Location**: React Native Maps and Geolocation

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/laundry-express-app.git
   ```

2. Install dependencies:
   ```
   cd laundry-express-app
   npm install
   ```

3. Set up Firebase:
   - Create a Firebase project
   - Enable Authentication, Firestore, and Storage
   - Add your Firebase configuration to `firebaseConfig.js`

4. Start the development server:
   ```
   npm start
   ```

## Project Structure
<h2>LaundryExpressApp</h2>
    <ul>
        <li>📁 <strong>assets/</strong> - Images, fonts, and other static assets</li>
        <li>📁 <strong>components/</strong> - Reusable UI components</li>
        <li>📁 <strong>context/</strong> - React Context for state management</li>
        <li>📁 <strong>helpers/</strong> - Helper functions and utilities</li>
        <li>📁 <strong>navigation/</strong> - Navigation configuration</li>
        <li>📁 <strong>screens/</strong> - Screen components
            <ul>
                <li>📁 <strong>Auth/</strong> - Authentication screens</li>
                <li>📁 <strong>Customer/</strong> - Customer-facing screens</li>
                <li>📁 <strong>ServiceProvider/</strong> - Service provider screens</li>
            </ul>
        </li>
        <li>📁 <strong>services/</strong> - API and service integrations</li>
        <li>📄 <strong>App.js</strong> - Main application component</li>
        <li>📄 <strong>firebaseConfig.js</strong> - Firebase configuration</li>
        <li>📄 <strong>package.json</strong> - Project dependencies</li>
    </ul>


## Key Screens

### Customer Screens

- **HomeScreen**: Browse service providers
- **ServiceProviderScreen**: View provider details and services
- **PlaceOrderScreen**: Place a new laundry order
- **TrackOrderScreen**: Track order status in real-time
- **OrdersScreen**: View order history
- **ProfileScreen**: Manage user profile
- **EditCustomerProfile**: Edit personal information

### Service Provider Screens

- **DashboardScreen**: Overview of business performance
- **SPServices**: Manage available services and pricing
- **ManageOrders**: View and manage customer orders
- **OrderDetailsScreen**: Process orders with step-by-step status updates
- **ProfileScreen**: Manage business profile

## User Flow

### Customer Flow

1. Register/Login to the app
2. Browse available service providers
3. Select a service provider
4. Choose services and schedule pickup
5. Place order
6. Track order status in real-time
7. Receive order and provide rating/review

### Service Provider Flow

1. Register/Login as a service provider
2. Set up business profile
3. Add available services and pricing
4. Receive orders from customers
5. Process orders and update status
6. Complete deliveries
7. View business analytics

## Future Enhancements

- **Payment Integration**: Secure in-app payment processing
- **Chat System**: Real-time chat between customers and service providers
- **Loyalty Program**: Rewards for frequent customers
- **Multi-language Support**: Localization for different regions
- **Advanced Analytics**: Detailed business insights for service providers
- **Route Optimization**: Efficient delivery route planning