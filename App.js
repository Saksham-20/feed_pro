// App.js - New app structure with navigation
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SplashScreen from 'react-native-splash-screen';

// Import all screens
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import ClientScreen from './screens/enhanced/ClientScreen';
import AdminScreen from './screens/enhanced/AdminScreen';
import SalePurchaseEmployeeScreen from './screens/SalePurchaseEmployeeScreen';
import MarketingEmployeeScreen from './screens/MarketingEmployeeScreen';
import OfficeEmployeeScreen from './screens/OfficeEmployeeScreen';

// Import context providers
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';

const Stack = createStackNavigator();

const App = () => {
  const [initialRoute, setInitialRoute] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const [accessToken, userData] = await Promise.all([
        AsyncStorage.getItem('accessToken'),
        AsyncStorage.getItem('user')
      ]);

      if (accessToken && userData) {
        const user = JSON.parse(userData);
        const userScreen = getUserScreen(user.role);
        setInitialRoute(userScreen);
      } else {
        setInitialRoute('LoginScreen');
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setInitialRoute('LoginScreen');
    } finally {
      setIsLoading(false);
      if (SplashScreen) {
        SplashScreen.hide();
      }
    }
  };

  const getUserScreen = (userRole) => {
    const screenMap = {
      'client': 'ClientScreen',
      'sales_purchase': 'SalePurchaseEmployeeScreen',
      'marketing': 'MarketingEmployeeScreen',
      'office': 'OfficeEmployeeScreen',
      'admin': 'AdminScreen',
    };
    return screenMap[userRole] || 'ClientScreen';
  };

  if (isLoading) {
    return null; // Show splash screen while loading
  }

  return (
    <AppProvider>
      <AuthProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName={initialRoute}
            screenOptions={{
              headerShown: false,
              gestureEnabled: false,
            }}
          >
            {/* Authentication Screens */}
            <Stack.Screen 
              name="LoginScreen" 
              component={LoginScreen}
              options={{
                gestureEnabled: false,
              }}
            />
            <Stack.Screen 
              name="SignupScreen" 
              component={SignupScreen}
            />

            {/* Main App Screens */}
            <Stack.Screen 
              name="ClientScreen" 
              component={ClientScreen}
              options={{
                gestureEnabled: false,
              }}
            />
            <Stack.Screen 
              name="AdminScreen" 
              component={AdminScreen}
              options={{
                gestureEnabled: false,
              }}
            />
            <Stack.Screen 
              name="SalePurchaseEmployeeScreen" 
              component={SalePurchaseEmployeeScreen}
              options={{
                gestureEnabled: false,
              }}
            />
            <Stack.Screen 
              name="MarketingEmployeeScreen" 
              component={MarketingEmployeeScreen}
              options={{
                gestureEnabled: false,
              }}
            />
            <Stack.Screen 
              name="OfficeEmployeeScreen" 
              component={OfficeEmployeeScreen}
              options={{
                gestureEnabled: false,
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </AuthProvider>
    </AppProvider>
  );
};

export default App;