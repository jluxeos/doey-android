import React, { useEffect, useState } from 'react';
import {
  Alert, Linking, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

interface Permission {
  id: string;
  icon: string;
  title: string;
  description: string;
  permission: string;
  status: 'granted' | 'denied' | 'blocked' | 'unavailable' | 'limited' | 'unknown';
}

const PERMISSION_LIST: Omit<Permission, 'status'>[] = [
  { id: 'mic',      icon: '🎤', title: 'Micrófono',         description: 'Necesario para comandos de voz y wake word',                     permission: PERMISSIONS.ANDROID.RECORD_AUDIO },
  { id: 'contacts', icon: '👥', title: 'Contactos',         description: 'Para buscar y llamar contactos por nombre',                       permission: PERMISSIONS.ANDROID.READ_CONTACTS },
  { id: 'sms',      icon: '💬', title: 'SMS',               description: 'Para leer y enviar mensajes de texto',                            permission: PERMISSIONS.ANDROID.READ_SMS },
  { id: 'calls',    icon: '📞', title: 'Llamadas',          description: 'Para consultar historial de llamadas',                            permission: PERMISSIONS.ANDROID.READ_CALL_LOG },
  { id: 'location', icon: '📍', title: 'Ubicación',         description: 'Para funciones de navegación y clima local',                      permission: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION },
  { id: 'notifs',   icon: '🔔', title: 'Notificaciones',    description: 'Para leer y reaccionar a notificaciones de otras apps',           permission: PERMISSIONS.ANDROID.POST_NOTIFICATIONS },
  { id: 'bt',       icon: '🎧', title: 'Bluetooth',         description: 'Para detectar y conectar dispositivos de audio',                  permission: PERMISSIONS.ANDROID.BLUETOOTH_CONNECT },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  granted:     { label: 'Concedido',    color: '#386A20', bg: '#C8E6C9' },
  denied:      { label: 'Denegado',     color: '#7D5700', bg: '#FFF0C2' },
  blocked:     { label: 'Bloqueado',    color: '#BA1A1A', bg: '#FFDAD6' },
  unavailable: { label: 'No disp.',     color: '#49454F', bg: '#E7E0EC' },
  limited:     { label: 'Limitado',     color: '#006874', bg: '#CCF0F4' },
  unknown:     { label: 'Desconocido',  color: '#49454F', bg: '#E7E0EC' },
};

interface PermissionsScreenProps {
  onBack: () => void;
  isDark: boolean;
}

export function PermissionsScreen({ onBack, isDark }: PermissionsScreenProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [permissions, setPermissions] = useState<Permission[]>(
    PERMISSION_LIST.map(p => ({ ...p, status: 'unknown' }))
  );

  const bg          = isDark ? '#10091A' : '#FFFBFE';
  const surface     = isDark ? '#1D1027' : '#FFFFFF';
  const surfaceVar  = isDark ? '#2B1E3A' : '#F3EDF7';
  const outline     = isDark ? '#4A4458' : '#CAC4D0';
  const textPrimary = isDark ? '#EAE0F8' : '#1C1B1F';
  const textSec     = isDark ? '#CDB8E8' : '#49454F';
  const primary     = isDark ? '#D0BCFF' : '#6750A4';

  const checkAll = async () => {
    const results = await Promise.all(
      PERMISSION_LIST.map(async p => {
        try {
          const result = await check(p.permission as any);
          return { ...p, status: result as Permission['status'] };
        } catch {
          return { ...p, status: 'unavailable' as const };
        }
      })
    );
    setPermissions(results);
  };

  useEffect(() => { checkAll(); }, []);

  const handleRequest = async (perm: Permission) => {
    if (perm.status === 'blocked') {
      Alert.alert(
        'Permiso bloqueado',
        'Este permiso fue bloqueado. Ábrelo manualmente en Ajustes del sistema.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir Ajustes', onPress: () => Linking.openSettings() },
        ]
      );
      return;
    }
    try {
      await request(perm.permission as any);
      await checkAll();
    } catch { /* unavailable */ }
  };

  return (
    <View style={[styles.root, { backgroundColor: bg, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: surface, borderBottomColor: outline }]}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn}>
          <Text style={[styles.backText, { color: primary }]}>‹ Volver</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textPrimary }]}>Permisos</Text>
        <TouchableOpacity onPress={checkAll} activeOpacity={0.7}>
          <Text style={[styles.refreshText, { color: primary }]}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* Intro */}
      <View style={[styles.intro, { backgroundColor: surfaceVar }]}>
        <Text style={[styles.introText, { color: textSec }]}>
          Doey necesita estos permisos para funcionar correctamente. Toca cualquiera para solicitarlo o abrirlo en Ajustes del sistema.
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }} showsVerticalScrollIndicator={false}>
        {permissions.map(perm => {
          const cfg = STATUS_CONFIG[perm.status] || STATUS_CONFIG.unknown;
          const isGranted = perm.status === 'granted';
          return (
            <TouchableOpacity
              key={perm.id}
              onPress={() => !isGranted && handleRequest(perm)}
              activeOpacity={isGranted ? 1 : 0.7}
              style={[styles.card, { backgroundColor: surface, borderColor: isGranted ? '#386A20' : outline }]}>
              <View style={[styles.cardIcon, { backgroundColor: surfaceVar }]}>
                <Text style={styles.cardIconText}>{perm.icon}</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={[styles.cardTitle, { color: textPrimary }]}>{perm.title}</Text>
                <Text style={[styles.cardDesc, { color: textSec }]}>{perm.description}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:         { flex: 1 },
  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 },
  backBtn:      { minWidth: 60 },
  backText:     { fontSize: 16, fontWeight: '500' },
  headerTitle:  { flex: 1, fontSize: 18, fontWeight: '700', letterSpacing: 0.15, textAlign: 'center' },
  refreshText:  { fontSize: 22, minWidth: 60, textAlign: 'right' },
  intro:        { margin: 16, padding: 14, borderRadius: 12 },
  introText:    { fontSize: 13, lineHeight: 20, letterSpacing: 0.25 },
  card:         { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, borderWidth: 1, gap: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
  cardIcon:     { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  cardIconText: { fontSize: 22 },
  cardBody:     { flex: 1, gap: 3 },
  cardTitle:    { fontSize: 15, fontWeight: '600', letterSpacing: 0.1 },
  cardDesc:     { fontSize: 12, letterSpacing: 0.3, lineHeight: 17 },
  statusBadge:  { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 50 },
  statusText:   { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
});
