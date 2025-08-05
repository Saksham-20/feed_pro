// App.js
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// Import screens (Fixed path issues)
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import ClientScreen from './src/screens/enhanced/ClientScreen';
import AdminScreen from './src/screens/enhanced/AdminScreen';
import SalePurchaseEmployeeScreen from './src/screens/SalePurchaseEmployeeScreen';
import MarketingEmployeeScreen from './src/screens/MarketingEmployeeScreen';
import OfficeEmployeeScreen from './src/screens/OfficeEmployeeScreen';

// Import context providers
import { AuthProvider } from './src/context/AuthContext.js';
import { AppProvider } from './src/context/AppContext';
import { UserProvider } from './src/context/UserContext';
import { OrderProvider } from './src/context/OrderContext';
import { FeedbackProvider } from './src/context/FeedbackContext';

// Import components
import ErrorBoundary from './src/components/common/ErrorBoundary';
import LoadingSpinner from './src/components/common/LoadingSpinner';
import Toast from './src/components/common/Toast';

const Stack = createStackNavigator();

const App = () => {
  const [initialRoute, setInitialRoute] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

  useEffect(() => {
    initializeApp();
    setupNetworkListener();
  }, []);

  const initializeApp = async () => {
    try {
      // Check authentication status
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
      console.error('App initialization error:', error);
      setInitialRoute('LoginScreen');
    } finally {
      setIsLoading(false);
    }
  };

  const setupNetworkListener = () => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const wasConnected = isConnected;
      const nowConnected = state.isConnected;
      
      setIsConnected(nowConnected);
      
      if (!wasConnected && nowConnected) {
        showToast('Connection restored', 'success');
      } else if (wasConnected && !nowConnected) {
        showToast('No internet connection', 'error');
      }
    });

    return unsubscribe;
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

  const showToast = (message, type = 'info', duration = 3000) => {
    setToast({ visible: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, duration);
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading..." overlay />;
  }

  return (
    <ErrorBoundary>
      <AppProvider>
        <AuthProvider>
          <UserProvider>
            <OrderProvider>
              <FeedbackProvider>
                <NavigationContainer>
                  <Stack.Navigator
                    initialRouteName={initialRoute}
                    screenOptions={{
                      headerShown: false,
                      gestureEnabled: false,
                      cardStyle: { backgroundColor: '#FFFFFF' },
                    }}
                  >
                    {/* Authentication Screens */}
                    <Stack.Screen 
                      name="LoginScreen" 
                      component={LoginScreen}
                      options={{
                        gestureEnabled: false,
                        animationTypeForReplace: 'pop',
                      }}
                    />
                    <Stack.Screen 
                      name="SignupScreen" 
                      component={SignupScreen}
                      options={{
                        gestureEnabled: true,
                        animationTypeForReplace: 'push',
                      }}
                    />

                    {/* Main App Screens */}
                    <Stack.Screen 
                      name="ClientScreen" 
                      component={ClientScreen}
                      options={{
                        gestureEnabled: false,
                        animationTypeForReplace: 'pop',
                      }}
                    />
                    <Stack.Screen 
                      name="AdminScreen" 
                      component={AdminScreen}
                      options={{
                        gestureEnabled: false,
                        animationTypeForReplace: 'pop',
                      }}
                    />
                    <Stack.Screen 
                      name="SalePurchaseEmployeeScreen" 
                      component={SalePurchaseEmployeeScreen}
                      options={{
                        gestureEnabled: false,
                        animationTypeForReplace: 'pop',
                      }}
                    />
                    <Stack.Screen 
                      name="MarketingEmployeeScreen" 
                      component={MarketingEmployeeScreen}
                      options={{
                        gestureEnabled: false,
                        animationTypeForReplace: 'pop',
                      }}
                    />
                    <Stack.Screen 
                      name="OfficeEmployeeScreen" 
                      component={OfficeEmployeeScreen}
                      options={{
                        gestureEnabled: false,
                        animationTypeForReplace: 'pop',
                      }}
                    />
                  </Stack.Navigator>
                </NavigationContainer>

                {/* Global Toast */}
                <Toast
                  visible={toast.visible}
                  message={toast.message}
                  type={toast.type}
                  onDismiss={() => setToast(prev => ({ ...prev, visible: false }))}
                />
              </FeedbackProvider>
            </OrderProvider>
          </UserProvider>
        </AuthProvider>
      </AppProvider>
    </ErrorBoundary>
  );
};

export default App;