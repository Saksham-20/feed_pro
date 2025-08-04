import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Feather } from 'lucide-react';

// Mock AsyncStorage for demonstration
const AsyncStorage = {
  getItem: async (key) => {
    // Simulate async storage retrieval
    const mockData = {
      savedEmail: 'user@example.com',
      rememberMe: 'true'
    };
    return mockData[key] || null;
  },
  setItem: async (key, value) => {
    console.log(`Setting ${key}: ${value}`);
  },
  removeItem: async (key) => {
    console.log(`Removing ${key}`);
  }
};

// Mock axios for demonstration
const axios = {
  post: async (url, data, config) => {
    console.log('Login attempt:', { url, data });
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock successful login response
    if (data.email === 'admin@test.com' && data.password === 'password') {
      return {
        data: {
          success: true,
          data: {
            user: {
              id: 1,
              fullname: 'John Doe',
              email: data.email,
              role: 'admin'
            },
            tokens: {
              accessToken: 'mock-access-token',
              refreshToken: 'mock-refresh-token'
            }
          }
        }
      };
    }
    
    // Mock error response
    throw {
      response: {
        status: 401,
        data: {
          success: false,
          message: 'Invalid credentials'
        }
      }
    };
  }
};

// Button Component
const Button = ({ title, onPress, loading, disabled, style, variant = 'primary' }) => {
  const buttonStyle = [
    styles.button,
    variant === 'secondary' && styles.buttonSecondary,
    disabled && styles.buttonDisabled,
    style
  ];

  const textStyle = [
    styles.buttonText,
    variant === 'secondary' && styles.buttonTextSecondary,
    disabled && styles.buttonTextDisabled
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? '#6366F1' : '#FFFFFF'} />
      ) : (
        <Text style={textStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

// Input Component
const Input = ({ 
  label, 
  value, 
  onChangeText, 
  placeholder, 
  secureTextEntry, 
  keyboardType, 
  autoCapitalize,
  leftIcon,
  required,
  style 
}) => {
  const [isSecure, setIsSecure] = useState(secureTextEntry);

  return (
    <View style={[styles.inputContainer, style]}>
      <Text style={styles.inputLabel}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <View style={styles.inputWrapper}>
        {leftIcon && (
          <View style={styles.inputIcon}>
            <Feather name={leftIcon} size={20} color="#64748B" />
          </View>
        )}
        <input
          style={[styles.input, leftIcon && styles.inputWithIcon]}
          value={value}
          onChange={(e) => onChangeText(e.target.value)}
          placeholder={placeholder}
          type={isSecure ? 'password' : (keyboardType === 'email-address' ? 'email' : 'text')}
        />
        {secureTextEntry && (
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setIsSecure(!isSecure)}
          >
            <Feather name={isSecure ? 'eye-off' : 'eye'} size={20} color="#64748B" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const LoginScreen = ({ navigation = { navigate: () => {}, replace: () => {} } }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    checkSavedCredentials();
  }, []);

  const checkSavedCredentials = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem('savedEmail');
      const remember = await AsyncStorage.getItem('rememberMe');
      
      if (savedEmail && remember === 'true') {
        setFormData(prev => ({ ...prev, email: savedEmail }));
        setRememberMe(true);
      }
    } catch (error) {
      console.error('Error loading saved credentials:', error);
    }
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return false;
    }

    if (!formData.password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const response = await axios.post(
        'http://192.168.29.161:3000/api/auth/login',
        {
          email: formData.email.toLowerCase().trim(),
          password: formData.password,
        },
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        const { user, tokens } = response.data.data;

        // Save tokens and user data
        await AsyncStorage.setItem('accessToken', tokens.accessToken);
        await AsyncStorage.setItem('refreshToken', tokens.refreshToken);
        await AsyncStorage.setItem('user', JSON.stringify(user));

        // Save email if remember me is checked
        if (rememberMe) {
          await AsyncStorage.setItem('savedEmail', formData.email);
          await AsyncStorage.setItem('rememberMe', 'true');
        } else {
          await AsyncStorage.removeItem('savedEmail');
          await AsyncStorage.removeItem('rememberMe');
        }

        // Navigate based on user role
        navigateToUserScreen(user.role);
      } else {
        Alert.alert('Login Failed', response.data.message || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.response?.status === 403) {
        Alert.alert(
          'Account Pending',
          'Your account is awaiting admin approval. Please contact your administrator.',
          [{ text: 'OK' }]
        );
      } else if (error.response?.status === 401) {
        Alert.alert('Login Failed', 'Invalid email or password');
      } else if (error.code === 'ECONNABORTED') {
        Alert.alert('Connection Timeout', 'Please check your internet connection and try again');
      } else {
        Alert.alert('Login Failed', 'Unable to connect to server. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const navigateToUserScreen = (userRole) => {
    const navigationMap = {
      'client': 'ClientScreen',
      'sales_purchase': 'SalePurchaseEmployeeScreen',
      'marketing': 'MarketingEmployeeScreen',
      'office': 'OfficeEmployeeScreen',
      'admin': 'AdminScreen',
    };

    const screenName = navigationMap[userRole] || 'ClientScreen';
    console.log(`Navigating to: ${screenName}`);
    navigation.replace(screenName);
  };

  const TouchableOpacity = ({ children, onPress, style, activeOpacity = 0.7 }) => (
    <div
      style={{
        ...style,
        cursor: 'pointer',
        opacity: 1,
        transition: 'opacity 0.2s',
      }}
      onClick={onPress}
      onMouseDown={(e) => e.currentTarget.style.opacity = activeOpacity}
      onMouseUp={(e) => e.currentTarget.style.opacity = 1}
      onMouseLeave={(e) => e.currentTarget.style.opacity = 1}
    >
      {children}
    </div>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Feather name="briefcase" size={32} color="#FFFFFF" />
            </View>
            <Text style={styles.appName}>Business Hub</Text>
            <Text style={styles.tagline}>Your business management solution</Text>
          </View>
        </View>

        {/* Login Form */}
        <View style={styles.formContainer}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>Welcome Back</Text>
            <Text style={styles.formSubtitle}>Sign in to your account</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Email Address"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="mail"
              required
            />

            <Input
              label="Password"
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              placeholder="Enter your password"
              secureTextEntry
              leftIcon="lock"
              required
            />

            <View style={styles.formOptions}>
              <TouchableOpacity
                style={styles.rememberMe}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && <Feather name="check" size={16} color="#FFFFFF" />}
                </View>
                <Text style={styles.rememberText}>Remember me</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              style={styles.loginButton}
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.signupSection}>
              <Text style={styles.signupText}>Don't have an account?</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('SignupScreen')}
                style={styles.signupButton}
              >
                <Text style={styles.signupButtonText}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            {/* Demo Credentials */}
            <View style={styles.demoSection}>
              <Text style={styles.demoTitle}>Demo Credentials:</Text>
              <Text style={styles.demoText}>Email: admin@test.com</Text>
              <Text style={styles.demoText}>Password: password</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By signing in, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    minHeight: '100vh',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    display: 'flex',
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 16,
    color: '#64748B',
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  input: {
    width: '100%',
    height: 48,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: 8,
    fontSize: 16,
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  inputWithIcon: {
    paddingLeft: 48,
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  formOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    display: 'flex',
  },
  rememberMe: {
    flexDirection: 'row',
    alignItems: 'center',
    display: 'flex',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    border: '2px solid #D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    display: 'flex',
    cursor: 'pointer',
  },
  checkboxChecked: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  rememberText: {
    fontSize: 14,
    color: '#64748B',
  },
  forgotPassword: {
    padding: 4,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '500',
    cursor: 'pointer',
  },
  button: {
    height: 48,
    backgroundColor: '#6366F1',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    display: 'flex',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    border: '1px solid #E2E8F0',
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonTextSecondary: {
    color: '#6366F1',
  },
  buttonTextDisabled: {
    color: '#94A3B8',
  },
  loginButton: {
    marginBottom: 24,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    display: 'flex',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: 14,
    color: '#94A3B8',
    paddingHorizontal: 16,
  },
  signupSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    display: 'flex',
  },
  signupText: {
    fontSize: 14,
    color: '#64748B',
    marginRight: 4,
  },
  signupButton: {
    padding: 4,
  },
  signupButtonText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '600',
    cursor: 'pointer',
  },
  demoSection: {
    padding: 16,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    border: '1px solid #BAE6FD',
    marginBottom: 24,
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369A1',
    marginBottom: 8,
  },
  demoText: {
    fontSize: 12,
    color: '#0284C7',
    fontFamily: 'monospace',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default LoginScreen;