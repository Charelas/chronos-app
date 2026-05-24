import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts } from '../../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { useRouter } from 'expo-router';
import { formatDuration } from '../../utils/storage';

type CategoryFilter = 'All' | 'Work' | 'Overtime' | 'Personal' | 'Meeting' | 'Education';
type RangeFilter = '7' | '30' | '90';

export default function HistoryScreen() {
  const { entries, removeEntry } = useApp();
  const router = useRouter();
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('All');
  const [rangeFilter, setRangeFilter] = useState<RangeFilter>('30');
  const [showFilters, setShowFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);

  const filteredEntries = useMemo(() => {
    let filtered = [...entries];

    // Date range
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(now.getDate() - parseInt(rangeFilter));
    filtered = filtered.filter(e => new Date(e.date) >= cutoff);

    // Category
    if (categoryFilter !== 'All') {
      filtered = filtered.filter(e => e.category === categoryFilter);
    }

    return filtered;
  }, [entries, categoryFilter, rangeFilter]);

  // BUG-003 fix: slice BEFORE grouping so visibleCount is actually respected
  const paginatedEntries = useMemo(() => filteredEntries.slice(0, visibleCount), [filteredEntries, visibleCount]);

  // Group by date
  const grouped = useMemo(() => {
    const groups: Record<string, typeof paginatedEntries> = {};
    paginatedEntries.forEach(entry => {
      if (!groups[entry.date]) groups[entry.date] = [];
      groups[entry.date].push(entry);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [paginatedEntries]);

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (dateStr === today) return 'Today';
    if (dateStr === yesterdayStr) return `Yesterday, ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert('Delete Entry', `Remove "${title}" from your history?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeEntry(id) },
    ]);
  };

  const iconMap: Record<string, any> = {
    Work: 'code',
    Overtime: 'trending-up',
    Personal: 'coffee',
    Meeting: 'groups',
    Education: 'school',
  };

  const rangeLabels: Record<RangeFilter, string> = { '7': 'Last 7 Days', '30': 'Last 30 Days', '90': 'Last 90 Days' };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialIcons name="menu" size={24} color={Colors.primary} />
          <Text style={styles.headerTitle}>Balanced Chronograph</Text>
        </View>
        <View style={styles.avatar}>
          <Image
            source={require('../../assets/images/avatar.png')}
            style={styles.avatarImg}
          />
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageLabel}>ARCHIVE REVIEW</Text>
        <Text style={styles.pageTitle}>Activity History</Text>
        <Text style={styles.pageDesc}>
          A chronological audit of your temporal balance. {filteredEntries.length} entries found.
        </Text>

        {/* Chronicle Banner */}
        <TouchableOpacity style={styles.chronicleBanner} onPress={() => router.push('/chronicle')} activeOpacity={0.88}>
          <View style={styles.chronicleLeft}>
            <MaterialIcons name="auto-awesome" size={22} color={Colors.primary} />
            <View>
              <Text style={styles.chronicleTitle}>Weekly Chronicle</Text>
              <Text style={styles.chronicleSub}>Your week distilled into an AI editorial</Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={22} color={Colors.primary} />
        </TouchableOpacity>

        {/* Filters */}
        <View style={styles.filterCard}>
          <Text style={styles.filterLabel}>TIME RANGE</Text>
          <View style={styles.filterChips}>
            {(['7', '30', '90'] as RangeFilter[]).map(range => (
              <TouchableOpacity
                key={range}
                style={[styles.filterChip, rangeFilter === range && styles.filterChipActive]}
                onPress={() => setRangeFilter(range)}
              >
                <Text style={[styles.filterChipText, rangeFilter === range && styles.filterChipTextActive]}>
                  {rangeLabels[range]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.filterLabel, { marginTop: 16 }]}>CATEGORY</Text>
          <View style={styles.filterChips}>
            {(['All', 'Work', 'Overtime', 'Personal', 'Meeting', 'Education'] as CategoryFilter[]).map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.filterChip, categoryFilter === cat && styles.filterChipActive]}
                onPress={() => setCategoryFilter(cat)}
              >
                <Text style={[styles.filterChipText, categoryFilter === cat && styles.filterChipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Entries grouped by date */}
        {grouped.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="search-off" size={36} color={Colors.outlineVariant} />
            <Text style={styles.emptyText}>No entries match your filters</Text>
          </View>
        ) : (
          grouped.map(([date, dayEntries]) => (
            <View key={date}>
              <View style={styles.sectionDivider}>
                <View style={styles.sectionLine} />
                <Text style={styles.sectionDay}>{formatDateLabel(date)}</Text>
              </View>

              {dayEntries.map((entry) => (
                <TouchableOpacity
                  key={entry.id}
                  style={styles.entryCard}
                  onLongPress={() => handleDelete(entry.id, entry.description)}
                >
                  <View style={styles.entryIcon}>
                    <MaterialIcons name={iconMap[entry.category] || 'schedule'} size={22} color={Colors.primary} />
                  </View>
                  <View style={styles.entryContent}>
                    <Text style={styles.entryTitle} numberOfLines={1}>{entry.description}</Text>
                    <Text style={styles.entrySub}>{entry.category} • {entry.startTime}</Text>
                  </View>
                  <View style={styles.entryRight}>
                    <Text style={styles.entryDurationLabel}>DURATION</Text>
                    <Text style={styles.entryDuration}>{formatDuration(entry.durationMinutes)}</Text>
                  </View>
                  <View style={[styles.balanceBadge, {
                    backgroundColor: entry.balanceHours >= 0 ? Colors.primaryFixed + '40' : Colors.errorContainer,
                  }]}>
                    <Text style={[styles.balanceText, {
                      color: entry.balanceHours >= 0 ? Colors.primary : Colors.error,
                    }]}>{entry.balanceHours >= 0 ? '+' : ''}{entry.balanceHours.toFixed(1)}</Text>
                    <Text style={[styles.balanceUnit, {
                      color: entry.balanceHours >= 0 ? Colors.primary : Colors.error,
                    }]}>hrs</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))
        )}

        {filteredEntries.length > visibleCount && (
          <TouchableOpacity style={styles.loadMore} onPress={() => setVisibleCount(v => v + 10)}>
            <Text style={styles.loadMoreText}>Load Older Records</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, height: 56, backgroundColor: Colors.surfaceContainerLowest },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontFamily: Fonts.headlineExtraBold, fontSize: 18, color: Colors.primary, letterSpacing: -0.3 },
  avatar: { width: 36, height: 36, borderRadius: 18, overflow: 'hidden', backgroundColor: Colors.surfaceContainerHigh },
  avatarImg: { width: '100%', height: '100%' },
  scrollView: { flex: 1, paddingHorizontal: 20 },
  pageLabel: { fontFamily: Fonts.labelBold, fontSize: 10, letterSpacing: 2, color: Colors.onSurfaceVariant, marginTop: 20 },
  pageTitle: { fontFamily: Fonts.headlineExtraBold, fontSize: 32, color: Colors.onSurface, letterSpacing: -1, marginTop: 4 },
  pageDesc: { fontFamily: Fonts.body, fontSize: 14, color: Colors.onSurfaceVariant, lineHeight: 22, marginTop: 8 },
  filterCard: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: 16, padding: 20, marginTop: 20 },
  filterLabel: { fontFamily: Fonts.labelBold, fontSize: 10, letterSpacing: 2, color: Colors.onSurfaceVariant, marginBottom: 10 },
  filterChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: { backgroundColor: Colors.surfaceContainerHigh, borderRadius: 50, paddingHorizontal: 14, paddingVertical: 8 },
  filterChipActive: { backgroundColor: Colors.primary },
  filterChipText: { fontFamily: Fonts.bodySemiBold, fontSize: 12, color: Colors.onSurface },
  filterChipTextActive: { color: Colors.onPrimary },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyText: { fontFamily: Fonts.body, fontSize: 14, color: Colors.onSurfaceVariant },
  sectionDivider: { marginTop: 24, marginBottom: 12 },
  sectionLine: { height: 1, backgroundColor: Colors.outlineVariant + '30' },
  sectionDay: { fontFamily: Fonts.headlineExtraBold, fontSize: 18, color: Colors.onSurface, marginTop: 8 },
  entryCard: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: 16, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  entryIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceContainerHigh, justifyContent: 'center', alignItems: 'center' },
  entryContent: { flex: 1 },
  entryTitle: { fontFamily: Fonts.headline, fontSize: 14, color: Colors.onSurface },
  entrySub: { fontFamily: Fonts.body, fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 3 },
  entryRight: { alignItems: 'flex-end', marginRight: 6 },
  entryDurationLabel: { fontFamily: Fonts.labelBold, fontSize: 8, letterSpacing: 1.5, color: Colors.onSurfaceVariant },
  entryDuration: { fontFamily: Fonts.headline, fontSize: 15, color: Colors.onSurface, marginTop: 2 },
  balanceBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center', minWidth: 50 },
  balanceText: { fontFamily: Fonts.headline, fontSize: 14 },
  balanceUnit: { fontFamily: Fonts.body, fontSize: 10, marginTop: -2 },
  loadMore: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 12, borderWidth: 1, borderColor: Colors.outlineVariant + '30' },
  loadMoreText: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.onSurface },
  chronicleBanner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.primaryContainer, borderRadius: 16,
    padding: 18, marginTop: 16, marginBottom: 4,
  },
  chronicleLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  chronicleTitle: { fontFamily: Fonts.headline, fontSize: 15, color: Colors.onPrimaryContainer },
  chronicleSub: { fontFamily: Fonts.body, fontSize: 12, color: Colors.onPrimaryContainer, opacity: 0.8, marginTop: 2 },
});
