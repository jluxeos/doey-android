import React from 'react';
import { LayoutAnimation, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CollapsibleSectionProps {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  isDark?: boolean;
}

export function CollapsibleSection({ title, expanded, onToggle, children, isDark = false }: CollapsibleSectionProps): React.JSX.Element {
  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggle();
  };
  const primary   = isDark ? '#D0BCFF' : '#6750A4';
  const primCont  = isDark ? '#4F378B' : '#EADDFF';
  const contentBg = isDark ? '#1D1027' : '#FFFFFF';
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleToggle} activeOpacity={0.7} style={styles.header}>
        <Text style={[styles.title, { color: primary }]}>{title}</Text>
        <View style={[styles.badge, { backgroundColor: primCont, transform: [{ rotate: expanded ? '90deg' : '0deg' }] }]}>
          <Text style={[styles.chevron, { color: primary }]}>›</Text>
        </View>
      </TouchableOpacity>
      {expanded && (
        <View style={[styles.content, { backgroundColor: contentBg }]}>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 4 },
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4 },
  title:     { fontSize: 13, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
  badge:     { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  chevron:   { fontSize: 16, fontWeight: '700', lineHeight: 20 },
  content:   { borderRadius: 16, overflow: 'hidden', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
});
