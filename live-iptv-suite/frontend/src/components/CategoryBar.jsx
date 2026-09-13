import React from 'react';
import { Box } from '@mui/material';
import ScrollableChipsRail from './common/ScrollableChipsRail';
import LanguagePills from './common/LanguagePills';

export default function CategoryBar({
  languages = [],
  selectedLanguage = 'tamil',
  onSelectLanguage,
  categories = [],
  selectedCategory = 'all',
  onSelectCategory,
  loading = false,
  totalChannels = 0,
}) {
  return (
    <Box sx={{ mb: 2 }}>
      {/* 1. Reusable YouTube Filter Chips Horizontal Rail */}
      <ScrollableChipsRail
        items={categories}
        selectedId={selectedCategory}
        onSelect={onSelectCategory}
        showAllOption={true}
        allOptionLabel="All Channels"
        allOptionCount={totalChannels}
        loading={loading && (!categories || categories.length === 0)}
      />

      {/* 2. Reusable Language Pill Selector Bar */}
      <LanguagePills
        languages={languages}
        selectedLanguage={selectedLanguage}
        onSelectLanguage={onSelectLanguage}
        allowToggle={true}
        sx={{ mt: 1.2 }}
      />
    </Box>
  );
}
