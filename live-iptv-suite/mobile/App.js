import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  ScrollView,
  StatusBar,
  SafeAreaView,
  Modal,
  Dimensions,
} from 'react-native';
import {
  PaperProvider,
  Appbar,
  Searchbar,
  Chip,
  Text,
  ActivityIndicator,
  IconButton,
  Button,
} from 'react-native-paper';
import { Video, ResizeMode } from 'expo-av';
import axios from 'axios';
import { paperTheme } from './src/theme';
import MobileChannelCard from './src/components/MobileChannelCard';

// Update this IP with your local network IP (e.g. 192.168.1.x) when testing on physical phone
const API_BASE = 'http://10.0.2.2:8000/api'; // Android Emulator default host mapping

export default function App() {
  const [channels, setChannels] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeChannel, setActiveChannel] = useState(null);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [catsRes, chansRes] = await Promise.all([
        axios.get(`${API_BASE}/categories/`).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/channels/`).catch(() => ({ data: [] })),
      ]);
      setCategories(catsRes.data);
      setChannels(chansRes.data);
    } catch (e) {
      console.log('Error connecting to backend:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = (id) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredChannels = channels.filter((ch) => {
    const matchesCat =
      selectedCategory === 'all' || ch.category_slug === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      ch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ch.category_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <PaperProvider theme={paperTheme}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#080c14" />

        {/* Top Appbar */}
        <Appbar.Header style={styles.appbar}>
          <Appbar.Action icon="television-play" color="#06b6d4" />
          <Appbar.Content
            title="StreamPulse"
            subtitle="Live IPTV & OTT Mobile"
            titleStyle={styles.appTitle}
            subtitleStyle={styles.appSubtitle}
          />
          <Appbar.Action
            icon="reload"
            color="#94a3b8"
            onPress={fetchInitialData}
          />
        </Appbar.Header>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search Tamil, Kids, News..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
            inputStyle={styles.searchInput}
            iconColor="#06b6d4"
          />
        </View>

        {/* Category Filter Chips */}
        <View style={styles.categoriesWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            <Chip
              selected={selectedCategory === 'all'}
              onPress={() => setSelectedCategory('all')}
              style={[
                styles.chip,
                selectedCategory === 'all' && styles.selectedChip,
              ]}
              textStyle={
                selectedCategory === 'all'
                  ? styles.selectedChipText
                  : styles.chipText
              }
            >
              All Channels
            </Chip>

            {categories.map((cat) => (
              <Chip
                key={cat.id}
                selected={selectedCategory === cat.slug}
                onPress={() => setSelectedCategory(cat.slug)}
                style={[
                  styles.chip,
                  selectedCategory === cat.slug && styles.selectedChip,
                ]}
                textStyle={
                  selectedCategory === cat.slug
                    ? styles.selectedChipText
                    : styles.chipText
                }
              >
                {cat.name}
              </Chip>
            ))}
          </ScrollView>
        </View>

        {/* Channel List */}
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator animating={true} color="#06b6d4" size="large" />
            <Text style={styles.loadingText}>Loading Live TV Streams...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredChannels}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <MobileChannelCard
                channel={item}
                onPress={(ch) => setActiveChannel(ch)}
                isFavorite={favorites.includes(item.id)}
                onToggleFavorite={handleToggleFavorite}
              />
            )}
            ListEmptyComponent={
              <View style={styles.centered}>
                <Text variant="titleMedium" style={{ color: '#64748b' }}>
                  No channels match your query
                </Text>
              </View>
            }
            contentContainerStyle={styles.listContent}
          />
        )}

        {/* Video Player Modal */}
        <Modal
          visible={!!activeChannel}
          animationType="slide"
          onRequestClose={() => setActiveChannel(null)}
        >
          <SafeAreaView style={styles.playerContainer}>
            <View style={styles.playerHeader}>
              <IconButton
                icon="arrow-left"
                iconColor="#fff"
                size={28}
                onPress={() => setActiveChannel(null)}
              />
              <Text variant="titleMedium" style={styles.playerTitle} numberOfLines={1}>
                {activeChannel?.name}
              </Text>
            </View>

            {activeChannel && (
              <Video
                source={{ uri: activeChannel.stream_url }}
                rate={1.0}
                volume={1.0}
                isMuted={false}
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay
                useNativeControls
                style={styles.video}
              />
            )}

            <View style={styles.playerDetails}>
              <Text variant="headlineSmall" style={{ color: '#fff', fontWeight: 'bold' }}>
                {activeChannel?.name}
              </Text>
              <Text variant="bodyMedium" style={{ color: '#06b6d4', marginTop: 4 }}>
                {activeChannel?.category_name} • {activeChannel?.language}
              </Text>
            </View>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080c14',
  },
  appbar: {
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  appTitle: {
    fontWeight: '800',
    color: '#ffffff',
    fontSize: 20,
  },
  appSubtitle: {
    color: '#06b6d4',
    fontSize: 11,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchbar: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchInput: {
    color: '#ffffff',
    fontSize: 14,
  },
  categoriesWrapper: {
    paddingVertical: 12,
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
  },
  selectedChip: {
    backgroundColor: '#06b6d4',
  },
  chipText: {
    color: '#94a3b8',
    fontWeight: '600',
  },
  selectedChipText: {
    color: '#000000',
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 20,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 12,
    fontWeight: '600',
  },
  playerContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  playerTitle: {
    color: '#ffffff',
    fontWeight: '700',
    flex: 1,
  },
  video: {
    width: Dimensions.get('window').width,
    height: 250,
  },
  playerDetails: {
    padding: 20,
  },
});
