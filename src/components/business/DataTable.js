import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { theme } from '../../styles/theme';
import LoadingSpinner from '../common/LoadingSpinner';

const DataTable = ({
  data = [],
  columns = [],
  loading = false,
  onRefresh,
  onRowPress,
  sortable = true,
  pagination,
  onPageChange,
  emptyMessage = 'No data available',
  keyExtractor = (item) => item.id?.toString(),
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (columnKey) => {
    if (!sortable) return;

    let direction = 'asc';
    if (sortConfig.key === columnKey && sortConfig.direction === 'asc') {
      direction = 'desc';
    }

    setSortConfig({ key: columnKey, direction });
  };

  const getSortedData = () => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === 'string') {
        const result = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
        return sortConfig.direction === 'asc' ? result : -result;
      }

      if (typeof aValue === 'number') {
        const result = aValue - bValue;
        return sortConfig.direction === 'asc' ? result : -result;
      }

      return 0;
    });
  };

  const renderHeader = () => (
    <View style={styles.headerRow}>
      {columns.map((column) => (
        <TouchableOpacity
          key={column.key}
          style={[styles.headerCell, { flex: column.flex || 1 }]}
          onPress={() => handleSort(column.key)}
          disabled={!sortable || !column.sortable}
        >
          <Text style={styles.headerText}>{column.title}</Text>
          {sortable && column.sortable && (
            <View style={styles.sortIcon}>
              {sortConfig.key === column.key ? (
                <Icon
                  name={sortConfig.direction === 'asc' ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={theme.colors.primary[500]}
                />
              ) : (
                <Icon name="chevrons-up-down" size={16} color={theme.colors.gray[400]} />
              )}
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderRow = ({ item, index }) => (
    <TouchableOpacity
      style={[styles.row, index % 2 === 0 && styles.evenRow]}
      onPress={() => onRowPress && onRowPress(item)}
      disabled={!onRowPress}
    >
      {columns.map((column) => (
        <View key={column.key} style={[styles.cell, { flex: column.flex || 1 }]}>
          {column.render ? (
            column.render(item[column.key], item, index)
          ) : (
            <Text style={styles.cellText} numberOfLines={2}>
              {item[column.key]?.toString() || '-'}
            </Text>
          )}
        </View>
      ))}
    </TouchableOpacity>
  );

  const renderPagination = () => {
    if (!pagination) return null;

    const { currentPage, totalPages, onPrevious, onNext } = pagination;

    return (
      <View style={styles.pagination}>
        <TouchableOpacity
          style={[styles.pageButton, currentPage <= 1 && styles.disabledButton]}
          onPress={onPrevious}
          disabled={currentPage <= 1}
        >
          <Icon name="chevron-left" size={20} color={theme.colors.gray[600]} />
          <Text style={styles.pageButtonText}>Previous</Text>
        </TouchableOpacity>

        <Text style={styles.pageInfo}>
          {currentPage} of {totalPages}
        </Text>

        <TouchableOpacity
          style={[styles.pageButton, currentPage >= totalPages && styles.disabledButton]}
          onPress={onNext}
          disabled={currentPage >= totalPages}
        >
          <Text style={styles.pageButtonText}>Next</Text>
          <Icon name="chevron-right" size={20} color={theme.colors.gray[600]} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="inbox" size={64} color={theme.colors.gray[400]} />
      <Text style={styles.emptyText}>{emptyMessage}</Text>
    </View>
  );

  if (loading && data.length === 0) {
    return <LoadingSpinner text="Loading data..." />;
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      <FlatList
        data={getSortedData()}
        keyExtractor={keyExtractor}
        renderItem={renderRow}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={loading} onRefresh={onRefresh} />
          ) : undefined
        }
        style={styles.list}
      />
      {renderPagination()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.gray[50],
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
  },
  headerCell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 8,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.gray[700],
  },
  sortIcon: {
    marginLeft: 4,
  },
  list: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[100],
  },
  evenRow: {
    backgroundColor: theme.colors.gray[25],
  },
  cell: {
    paddingRight: 8,
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 14,
    color: theme.colors.gray[800],
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.gray[500],
    marginTop: 16,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[200],
    backgroundColor: theme.colors.gray[50],
  },
  pageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
  },
  disabledButton: {
    opacity: 0.5,
  },
  pageButtonText: {
    fontSize: 14,
    color: theme.colors.gray[600],
    marginHorizontal: 4,
  },
  pageInfo: {
    fontSize: 14,
    color: theme.colors.gray[600],
    fontWeight: '500',
  },
});

export default DataTable;
