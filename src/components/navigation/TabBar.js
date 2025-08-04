import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { theme } from '../../styles/theme';

const { width } = Dimensions.get('window');

const TabBar = ({ tabs = [], activeTab, onTabPress, style }) => {
  const tabWidth = width / tabs.length;

  return (
    <View style={[styles.container, style]}>
      {tabs.map((tab, index) => {
        const isActive = activeTab === tab.key;
        
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, { width: tabWidth }]}
            onPress={() => onTabPress(tab.key)}
            activeOpacity={0.7}
          >
            <View style={[styles.tabContent, isActive && styles.activeTab]}>
              {tab.icon && (
                <Icon
                  name={tab.icon}
                  size={20}
                  color={isActive ? theme.colors.primary[500] : theme.colors.gray[500]}
                />
              )}
              <Text style={[
                styles.tabText,
                isActive ? styles.activeTabText : styles.inactiveTabText
              ]}>
                {tab.label}
              </Text>
              {tab.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{tab.badge}</Text>
                </View>
              )}
            </View>
            {isActive && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
    ...theme.shadows.sm,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    position: 'relative',
  },
  activeTab: {
    // Additional styling for active tab if needed
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  activeTabText: {
    color: theme.colors.primary[500],
    fontWeight: '600',
  },
  inactiveTabText: {
    color: theme.colors.gray[500],
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '20%',
    right: '20%',
    height: 2,
    backgroundColor: theme.colors.primary[500],
    borderRadius: 1,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: theme.colors.danger[500],
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: theme.colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
});

export default TabBar;
