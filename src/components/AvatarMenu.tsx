import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Switch,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { t } from '../i18n';
import { DoeyAvatar } from './DoeyAvatar';

export interface AvatarMenuProps {
  visible: boolean;
  onClose: () => void;
  isDark: boolean;
  onToggleDarkMode: () => void;
  onSettingsPress: () => void;
  onDebugPress: () => void;
  onListsPress: () => void;
  onSchedulesPress: () => void;
  onNotificationListenersPress: () => void;
  onJournalPress: () => void;
  debugLogEnabled: boolean;
  onPermissionsPress: () => void;
}

const MENU_ITEMS = (handlers: any, isDark: boolean, onToggleDarkMode: () => void, debugLogEnabled: boolean) => [
  { icon: '📋', label: 'menu.lists',                  onPress: handlers.lists,         always: true },
  { icon: '⏰', label: 'menu.scheduler',              onPress: handlers.schedules,     always: true },
  { icon: '🔔', label: 'menu.notificationListeners',  onPress: handlers.notifs,        always: true },
  { icon: '📔', label: 'menu.journal',                onPress: handlers.journal,       always: true },
  { icon: '🔐', label: 'menu.permissions', onPress: handlers.permissions, always: true },
  { icon: '⚙️', label: 'menu.settings',              onPress: handlers.settings,      always: true },
  { icon: '🪲', label: 'menu.debug',                  onPress: handlers.debug,         always: debugLogEnabled },
];

export function AvatarMenu({
  visible, onClose, isDark, onToggleDarkMode,
  onSettingsPress, onDebugPress, onListsPress,
  onSchedulesPress, onNotificationListenersPress,
  onJournalPress, debugLogEnabled,
}: AvatarMenuProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-280)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, damping: 20, stiffness: 180, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -280, duration: 220, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const delay = (fn: () => void) => { onClose(); setTimeout(fn, 180); };
  const handlers = {
    settings: () => delay(onSettingsPress),
    debug:    () => delay(onDebugPress),
    lists:    () => delay(onListsPress),
    schedules:() => delay(onSchedulesPress),
    notifs:   () => delay(onNotificationListenersPress),
    journal:      () => delay(onJournalPress),
    permissions:  () => delay(onPermissionsPress),
  };

  const bg    = isDark ? '#1D1027' : '#FFFBFE';
  const hdr   = isDark ? '#2B1E3A' : '#F3EDF7';
  const divider = isDark ? '#4A4458' : '#CAC4D0';
  const primary = isDark ? '#D0BCFF' : '#6750A4';
  const textPrimary = isDark ? '#EAE0F8' : '#1C1B1F';
  const textSecondary = isDark ? '#CDB8E8' : '#49454F';

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', opacity: fadeAnim }]}>
          <TouchableWithoutFeedback>
            <Animated.View style={[
              styles.drawer,
              { backgroundColor: bg, paddingTop: insets.top + 8, transform: [{ translateX: slideAnim }] },
            ]}>

              {/* Header */}
              <View style={[styles.header, { backgroundColor: hdr, borderBottomColor: divider }]}>
                <View style={[styles.avatarRing, { borderColor: primary }]}>
                  <DoeyAvatar size={68} />
                </View>
                <Text style={[styles.headerName, { color: textPrimary }]}>Doey</Text>
                <Text style={[styles.headerSub, { color: textSecondary }]}>Asistente Personal</Text>
              </View>

              {/* Items */}
              <View style={styles.itemList}>
                {MENU_ITEMS(handlers, isDark, onToggleDarkMode, debugLogEnabled)
                  .filter(i => i.always)
                  .map(item => (
                    <TouchableOpacity
                      key={item.label}
                      onPress={item.onPress}
                      activeOpacity={0.7}
                      style={[styles.item, { borderBottomColor: divider }]}>
                      <View style={[styles.iconContainer, { backgroundColor: isDark ? '#2B1E3A' : '#F3EDF7' }]}>
                        <Text style={styles.icon}>{item.icon}</Text>
                      </View>
                      <Text style={[styles.itemLabel, { color: textPrimary }]}>{t(item.label)}</Text>
                      <Text style={[styles.chevron, { color: textSecondary }]}>›</Text>
                    </TouchableOpacity>
                  ))}

                {/* Dark mode toggle */}
                <View style={[styles.item, { borderBottomColor: divider }]}>
                  <View style={[styles.iconContainer, { backgroundColor: isDark ? '#2B1E3A' : '#F3EDF7' }]}>
                    <Text style={styles.icon}>{isDark ? '☀️' : '🌙'}</Text>
                  </View>
                  <Text style={[styles.itemLabel, { color: textPrimary, flex: 1 }]}>
                    {isDark ? t('menu.darkMode.dark') : t('menu.darkMode.light')}
                  </Text>
                  <Switch
                    value={isDark}
                    onValueChange={onToggleDarkMode}
                    trackColor={{ false: '#CAC4D0', true: '#6750A4' }}
                    thumbColor={isDark ? '#D0BCFF' : '#FFFFFF'}
                  />
                </View>
              </View>

              {/* Footer version */}
              <View style={styles.footer}>
                <Text style={[styles.footerText, { color: textSecondary }]}>Doey v0.1.0</Text>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  drawer: {
    position: 'absolute', top: 0, left: 0, bottom: 0, width: 280,
    elevation: 16,
    shadowColor: '#000', shadowOffset: { width: 6, height: 0 }, shadowOpacity: 0.3, shadowRadius: 16,
  },
  header: {
    paddingVertical: 28, paddingHorizontal: 20,
    alignItems: 'center', gap: 8,
    borderBottomWidth: 1,
  },
  avatarRing: {
    borderRadius: 40, borderWidth: 2, padding: 3,
  },
  headerName: { fontSize: 20, fontWeight: '700', letterSpacing: 0.15 },
  headerSub:  { fontSize: 13, letterSpacing: 0.25 },
  itemList:   { flex: 1, paddingTop: 8 },
  item: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, gap: 14,
  },
  iconContainer: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  icon:       { fontSize: 20 },
  itemLabel:  { flex: 1, fontSize: 15, fontWeight: '500', letterSpacing: 0.1 },
  chevron:    { fontSize: 20, fontWeight: '300' },
  footer:     { padding: 20, alignItems: 'center' },
  footerText: { fontSize: 11, letterSpacing: 0.4 },
});
