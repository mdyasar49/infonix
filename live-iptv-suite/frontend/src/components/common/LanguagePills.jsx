import React from 'react';
import { Box, Chip, Typography } from '@mui/material';
import TranslateIcon from '@mui/icons-material/Translate';
import { getLanguageDisplay } from '../../constants/languages';

export default function LanguagePills({
  languages = [],
  selectedLanguage = 'tamil',
  onSelectLanguage,
  allowToggle = true,
  showFlags = false,
  size = 'small',
  sx = {},
}) {
  if (!languages || languages.length === 0) return null;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, overflowX: 'auto', py: 0.3, '&::-webkit-scrollbar': { display: 'none' }, ...sx }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#00e5ff', flexShrink: 0 }}>
        <TranslateIcon sx={{ fontSize: 16 }} />
        <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.7rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
          Lang:
        </Typography>
      </Box>

      {languages.map((langItem) => {
        const langCode = typeof langItem === 'string' ? langItem.toLowerCase() : (langItem.language || '').toLowerCase();
        const count = typeof langItem === 'object' ? langItem.count : null;
        const meta = getLanguageDisplay(langCode);
        const isSelected = selectedLanguage.toLowerCase() === langCode;
        const labelText = `${showFlags ? meta.flag + ' ' : ''}${meta.label.toUpperCase()}${count !== null && count !== undefined ? ` (${count})` : ''}`;

        return (
          <Chip
            key={langCode}
            label={labelText}
            size={size}
            clickable
            onClick={() => {
              if (allowToggle) {
                onSelectLanguage(isSelected ? 'all' : langCode);
              } else {
                onSelectLanguage(langCode);
              }
            }}
            sx={{
              height: size === 'small' ? 24 : 28,
              fontSize: '0.68rem',
              fontWeight: isSelected ? 800 : 600,
              borderRadius: 1.5,
              bgcolor: isSelected ? 'rgba(0, 229, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              color: isSelected ? '#00e5ff' : '#9ca3af',
              border: isSelected ? '1px solid #00e5ff' : '1px solid rgba(255, 255, 255, 0.06)',
              transition: 'all 0.18s ease',
              '&:hover': {
                bgcolor: isSelected ? 'rgba(0, 229, 255, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                color: isSelected ? '#00e5ff' : '#ffffff',
                borderColor: isSelected ? '#00e5ff' : 'rgba(255, 255, 255, 0.15)',
              },
            }}
          />
        );
      })}
    </Box>
  );
}
