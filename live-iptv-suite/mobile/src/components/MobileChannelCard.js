import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Card, Text, Chip, IconButton, useTheme } from 'react-native-paper';

export default function MobileChannelCard({
  channel,
  onPress,
  isFavorite,
  onToggleFavorite
}) {
  const theme = useTheme();

  return (
    <Card style={styles.card} onPress={() => onPress(channel)}>
      <Card.Content style={styles.content}>
        {/* Logo or placeholder */}
        <View style={styles.logoBox}>
          {channel.logo_url ? (
            <Image
              source={{ uri: channel.logo_url }}
              style={styles.logo}
              resizeMode="contain"
            />
          ) : (
            <Text variant="titleMedium" style={{ color: theme.colors.primary }}>
              TV
            </Text>
          )}
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text variant="titleMedium" style={styles.title} numberOfLines={1}>
            {channel.name}
          </Text>
          <View style={styles.subRow}>
            <Text variant="bodySmall" style={styles.category}>
              {channel.category_name}
            </Text>
            <Chip compact textStyle={{ fontSize: 10 }} style={styles.qualityChip}>
              {channel.quality || 'HD'}
            </Chip>
          </View>
        </View>

        {/* Favorite Icon */}
        <IconButton
          icon={isFavorite ? "heart" : "heart-outline"}
          iconColor={isFavorite ? "#ef4444" : "#64748b"}
          size={22}
          onPress={() => onToggleFavorite(channel.id)}
        />
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 14,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  logoBox: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    marginRight: 14,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  info: {
    flex: 1,
  },
  title: {
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  category: {
    color: '#94a3b8',
  },
  qualityChip: {
    height: 20,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
  },
});
