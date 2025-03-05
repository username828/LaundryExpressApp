# Laundry Express App

## Overview
Laundry Express is a mobile application designed for service providers in the laundry industry. The app allows service providers to manage their accounts, services, and orders efficiently.

## Features
- User authentication (login and registration)
- Onboarding process for new users
- Service provider options including:
  - Account Details
  - Manage Services
  - Manage Orders
- User-friendly interface with easy navigation

## Technologies Used
- React Native
- Firebase (for authentication and Firestore database)
- React Navigation
- Expo

## Installation

### Prerequisites
- Node.js
- npm or yarn
- Expo CLI

### Steps to Run the Project
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/laundry-express-app.git
   cd laundry-express-app
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server:
   ```bash
   npx expo start
   ```

4. Open the app in your preferred simulator or on a physical device using the Expo Go app.

## File Structure
/screens
/ServiceProvider
SPAccountDetails.js
SPServices.js
ServiceProviderOptions.js
Auth.js
LoadingScreen.js
OnboardingScreen.js
AuthScreen.js
OrdersScreen.js
ProfileScreen.js


## Usage
- **Authentication**: Users can log in or register to access the app.
- **Onboarding**: New users will go through an onboarding process to set up their accounts.
- **Service Management**: Service providers can add, view, and remove their services.
- **Account Management**: Users can view and update their account details.


