import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface SettingRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
  isDark?: boolean;
}

export function SettingRow({ label, description, children, isDark = false }: SettingRowProps): React.JSX.Element {
  const textPri = isDark ? '#EAE0F8' : '#1C1B1F';
  const textSec = isDark ? '#CDB8E8' : '#49454F';
  const border  = isDark ? '#4A4458' : '#CAC4D0';
  return (
    <View style={[styles.row, { borderBottomColor: border }]}>
      <View style={styles.left}>
        <Text style={[styles.label, { color: textPri }]}>{label}</Text>
        {description && <Text style={[styles.desc, { color: textSec }]}>{description}</Text>}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  row:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  left:  { flex: 1, marginRight: 12 },
  label: { fontSize: 15, fontWeight: '500', letterSpacing: 0.1 },
  desc:  { fontSize: 12, marginTop: 2, letterSpacing: 0.4 },
});
