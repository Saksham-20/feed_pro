import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import ErrorBoundary from './src/components/common/ErrorBoundary';
import React from 'react';

// Wrap App with ErrorBoundary
const AppWithErrorBoundary = () => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

AppRegistry.registerComponent(appName, () => AppWithErrorBoundary);

