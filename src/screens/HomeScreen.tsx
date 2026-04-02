import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StatusBar,
  ActivityIndicator, TextInput, Platform, StyleSheet,
  Animated, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PipelineState } from '../agent/conversation-pipeline';
import { DebugPanel } from './DebugPanel';
import { DoeyAvatar } from '../components/DoeyAvatar';
import { AvatarMenu } from '../components/AvatarMenu';
import { MarkdownText } from '../components/MarkdownText';
import { MiniMediaPlayer } from '../components/MiniMediaPlayer';
import KeepAwakeModule from '../native/KeepAwakeModule';
import { t } from '../i18n';

export interface Message {
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

interface HomeScreenProps {
  onMicPress: () => void;
  onTextSubmit: (text: string) => void;
  pipelineState: PipelineState;
  drivingMode: boolean;
  onToggleDrivingMode: () => void;
  onSettingsPress: () => void;
  onListsPress: () => void;
  onSchedulesPress: () => void;
  onNotificationListenersPress: () => void;
  onJournalPress: () => void;
  onPermissionsPress: () => void;
  messages: Message[];
  isDark: boolean;
  onToggleDarkMode: () => void;
  historyLoading?: boolean;
  language: string;
  debugLogEnabled: boolean;
}

const STATE_CONFIG: Record<PipelineState, { color: string; bg: string; darkBg: string }> = {
  idle:       { color: '#386A20', bg: '#C8E6C9', darkBg: '#1B3A0F' },
  listening:  { color: '#6750A4', bg: '#EADDFF', darkBg: '#4F378B' },
  processing: { color: '#7D5700', bg: '#FFF0C2', darkBg: '#3D2A00' },
  speaking:   { color: '#006874', bg: '#CCF0F4', darkBg: '#00363D' },
  error:      { color: '#BA1A1A', bg: '#FFDAD6', darkBg: '#690005' },
};

export function HomeScreen({
  onMicPress, onTextSubmit, pipelineState, drivingMode,
  onToggleDrivingMode, onSettingsPress, onListsPress,
  onSchedulesPress, onNotificationListenersPress, onJournalPress,
  onPermissionsPress, messages, isDark, onToggleDarkMode,
  historyLoading, language, debugLogEnabled,
}: HomeScreenProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const isBusy = pipelineState !== 'idle';
  const [debugVisible, setDebugVisible] = useState(false);
  const [avatarMenuVisible, setAvatarMenuVisible] = useState(false);
  const prevMessageCountRef = useRef(messages.length);
  const prevLastMessageRef = useRef<string | null>(null);
  const isInitialMountRef = useRef(true);
  const drivingMicScaleAnim = useRef(new Animated.Value(1)).current;

  const bg            = isDark ? '#10091A' : '#FFFBFE';
  const surface       = isDark ? '#1D1027' : '#FFFFFF';
  const surfaceVar    = isDark ? '#2B1E3A' : '#F3EDF7';
  const outline       = isDark ? '#4A4458' : '#CAC4D0';
  const textPrimary   = isDark ? '#EAE0F8' : '#1C1B1F';
  const textSecondary = isDark ? '#CDB8E8' : '#49454F';
  const primary       = isDark ? '#D0BCFF' : '#6750A4';

  useEffect(() => {
    const currentCount = messages.length;
    const prevCount = prevMessageCountRef.current;
    const lastMessage = messages.length > 0
      ? `${messages[messages.length-1].timestamp.getTime()}-${messages[messages.length-1].text.slice(0,50)}`
      : null;
    const prevLastMessage = prevLastMessageRef.current;
    if (isInitialMountRef.current || historyLoading) {
      isInitialMountRef.current = false;
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: false }));
      prevMessageCountRef.current = currentCount;
      prevLastMessageRef.current = lastMessage;
      return;
    }
    if (currentCount > prevCount || (lastMessage !== null && lastMessage !== prevLastMessage)) {
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    }
    prevMessageCountRef.current = currentCount;
    prevLastMessageRef.current = lastMessage;
  }, [messages, historyLoading]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [drivingMode]);

  useEffect(() => {
    drivingMode ? KeepAwakeModule.activate() : KeepAwakeModule.deactivate();
    return () => KeepAwakeModule.deactivate();
  }, [drivingMode]);

  useEffect(() => {
    if (pipelineState === 'listening') {
      const anim = Animated.loop(Animated.sequence([
        Animated.timing(drivingMicScaleAnim, { toValue: 1.08, duration: 600, useNativeDriver: true }),
        Animated.timing(drivingMicScaleAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]));
      anim.start();
      return () => anim.stop();
    } else {
      Animated.timing(drivingMicScaleAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }
  }, [pipelineState, drivingMicScaleAnim]);

  const stateLabel: Record<PipelineState, string> = {
    idle: t('home.state.idle'), listening: t('home.state.listening'),
    processing: t('home.state.processing'), speaking: t('home.state.speaking'),
    error: t('home.state.error'),
  };

  const stateCfg = STATE_CONFIG[pipelineState];

  return (
    <View style={[styles.root, { backgroundColor: bg, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={bg} />

      {/* Top App Bar */}
      <View style={[styles.topBar, { backgroundColor: surface, borderBottomColor: outline }]}>
        <TouchableOpacity onPress={() => setAvatarMenuVisible(true)} activeOpacity={0.7}>
          <View style={[styles.avatarRing, { borderColor: primary }]}>
            <DoeyAvatar size={34} />
          </View>
        </TouchableOpacity>

        <View style={styles.topBarCenter}>
          <Text style={[styles.topBarTitle, { color: textPrimary }]}>Doey</Text>
          <View style={[styles.statePill, { backgroundColor: isDark ? stateCfg.darkBg : stateCfg.bg }]}>
            <View style={[styles.stateDot, { backgroundColor: stateCfg.color }]} />
            <Text style={[styles.stateLabel, { color: stateCfg.color }]}>{stateLabel[pipelineState]}</Text>
          </View>
        </View>

        <View style={styles.topBarRight}>
          <MiniMediaPlayer isDark={isDark} />
          <TouchableOpacity
            onPress={onToggleDrivingMode}
            activeOpacity={0.7}
            style={[styles.modeChip, {
              backgroundColor: drivingMode ? '#4F378B' : surfaceVar,
              borderColor: outline,
            }]}>
            <Text style={[styles.modeChipText, { color: drivingMode ? '#EADDFF' : textSecondary }]}>
              {drivingMode ? '🚗 ' + t('home.mode.driving') : '💬 ' + t('home.mode.normal')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <AvatarMenu
        visible={avatarMenuVisible}
        onClose={() => setAvatarMenuVisible(false)}
        isDark={isDark}
        onToggleDarkMode={onToggleDarkMode}
        onSettingsPress={onSettingsPress}
        onDebugPress={() => setDebugVisible(true)}
        onListsPress={onListsPress}
        onSchedulesPress={onSchedulesPress}
        onNotificationListenersPress={onNotificationListenersPress}
        onJournalPress={onJournalPress}
        onPermissionsPress={onPermissionsPress}
        debugLogEnabled={debugLogEnabled}
      />

      {drivingMode ? (
        <View style={{ flex: 1 }}>
          <View style={[styles.drivingMicSection, { backgroundColor: bg, borderBottomColor: outline }]}>
            <Animated.View style={{ transform: [{ scale: drivingMicScaleAnim }] }}>
              <TouchableOpacity
                style={[styles.drivingMicBtn, {
                  backgroundColor:
                    pipelineState === 'listening' ? '#BA1A1A'
                    : pipelineState === 'processing' ? surfaceVar
                    : primary,
                }]}
                onPress={onMicPress}
                disabled={pipelineState === 'processing'}
                activeOpacity={0.8}>
                <Text style={styles.drivingMicIcon}>{pipelineState === 'listening' ? '⏹️' : '🎤'}</Text>
                <Text style={styles.drivingMicLabel}>
                  {pipelineState === 'listening' ? t('home.driving.tapToStop')
                   : pipelineState === 'processing' ? t('home.driving.thinking')
                   : pipelineState === 'speaking' ? t('home.driving.speaking')
                   : t('home.driving.micOn')}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>

          <ScrollView ref={scrollRef} style={{ flex: 1, backgroundColor: bg }}
            contentContainerStyle={{ padding: 12, gap: 10, paddingBottom: 8 }}
            showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="always">
            {messages.length === 0 && !historyLoading
              ? <View style={styles.emptyCenter}><Text style={[styles.emptySubtitle, { color: textSecondary }]}>{t('home.driving.tapMic')}</Text></View>
              : messages.map(msg => <MessageBubble key={`${msg.timestamp.getTime()}-${msg.text.slice(0,20)}`} message={msg} isDark={isDark} language={language} />)
            }
            {pipelineState === 'processing' && (
              <View style={styles.thinkingRow}>
                <ActivityIndicator size="small" color={primary} />
                <Text style={[styles.thinkingText, { color: textSecondary }]}>{t('home.thinking')}</Text>
              </View>
            )}
          </ScrollView>
          <InputBar isBusy={isBusy} pipelineState={pipelineState} onMicPress={onMicPress} onSubmit={onTextSubmit} showMic={false} isDark={isDark} />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <ScrollView ref={scrollRef} style={{ flex: 1, backgroundColor: bg }}
            contentContainerStyle={messages.length === 0 && !historyLoading
              ? { padding: 16, gap: 12, paddingBottom: 8, flex: 1 }
              : { padding: 16, gap: 10, paddingBottom: 8 }}
            showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="always">

            {historyLoading ? (
              <View style={styles.emptyCenter}>
                <DoeyAvatar size={80} />
                <ActivityIndicator size="large" color={primary} style={{ marginTop: 16 }} />
                <Text style={[styles.emptySubtitle, { color: textSecondary, marginTop: 8 }]}>{t('home.loadingHistory')}</Text>
              </View>
            ) : messages.length === 0 ? (
              <View style={styles.emptyCenter}>
                <View style={[styles.emptyAvatarRing, { borderColor: primary, backgroundColor: surfaceVar }]}>
                  <DoeyAvatar size={80} />
                </View>
                <Text style={[styles.emptyTitle, { color: textPrimary }]}>{t('home.empty.title')}</Text>
                <Text style={[styles.emptySubtitle, { color: textSecondary }]}>{t('home.empty.subtitle')}</Text>
              </View>
            ) : (
              messages.map(msg => <MessageBubble key={`${msg.timestamp.getTime()}-${msg.text.slice(0,20)}`} message={msg} isDark={isDark} language={language} />)
            )}

            {pipelineState === 'processing' && (
              <View style={styles.thinkingRow}>
                <ActivityIndicator size="small" color={primary} />
                <Text style={[styles.thinkingText, { color: textSecondary }]}>{t('home.thinking')}</Text>
              </View>
            )}
          </ScrollView>
          <InputBar isBusy={isBusy} pipelineState={pipelineState} onMicPress={onMicPress} onSubmit={onTextSubmit} isDark={isDark} />
        </View>
      )}

      <DebugPanel visible={debugVisible} onClose={() => setDebugVisible(false)} />
    </View>
  );
}

// ── InputBar ──────────────────────────────────────────────────────────────────

interface InputBarProps {
  isBusy: boolean;
  pipelineState: PipelineState;
  onMicPress: () => void;
  onSubmit: (text: string) => void;
  showMic?: boolean;
  isDark: boolean;
}

const INPUT_DRAFT_KEY = 'sanna_input_draft';

const InputBar = React.memo(function InputBar({ isBusy, pipelineState, onMicPress, onSubmit, showMic = true, isDark }: InputBarProps) {
  const textRef = useRef('');
  const inputRef = useRef<TextInput>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const surface    = isDark ? '#1D1027' : '#FFFFFF';
  const surfaceVar = isDark ? '#2B1E3A' : '#F3EDF7';
  const outline    = isDark ? '#4A4458' : '#CAC4D0';
  const primary    = isDark ? '#D0BCFF' : '#6750A4';
  const onPrimary  = isDark ? '#381E72' : '#FFFFFF';

  useEffect(() => {
    AsyncStorage.getItem(INPUT_DRAFT_KEY).then(saved => {
      if (saved?.trim() && inputRef.current) {
        textRef.current = saved;
        inputRef.current.setNativeProps({ text: saved });
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (pipelineState === 'listening') {
      const anim = Animated.loop(Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]));
      anim.start();
      return () => anim.stop();
    } else {
      Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }
  }, [pipelineState, scaleAnim]);

  const saveDraft = (text: string) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      text.trim()
        ? AsyncStorage.setItem(INPUT_DRAFT_KEY, text).catch(() => {})
        : AsyncStorage.removeItem(INPUT_DRAFT_KEY).catch(() => {});
    }, 500);
  };

  const handleSend = () => {
    const trimmed = textRef.current.trim();
    if (!trimmed || pipelineState === 'processing') return;
    AsyncStorage.removeItem(INPUT_DRAFT_KEY).catch(() => {});
    if (saveTimeoutRef.current) { clearTimeout(saveTimeoutRef.current); saveTimeoutRef.current = null; }
    inputRef.current?.clear();
    textRef.current = '';
    onSubmit(trimmed);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  useEffect(() => () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); }, []);

  return (
    <View style={[styles.inputBar, { backgroundColor: surface, borderTopColor: outline }]}>
      {showMic && (
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            style={[styles.micBtn, { backgroundColor: pipelineState === 'listening' ? '#BA1A1A' : surfaceVar }]}
            onPress={onMicPress} disabled={pipelineState === 'processing'} activeOpacity={0.8}>
            <Text style={styles.micIcon}>{pipelineState === 'listening' ? '⏹️' : '🎤'}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
      <TextInput
        ref={inputRef}
        style={[styles.textInput, {
          backgroundColor: surfaceVar,
          color: isDark ? '#EAE0F8' : '#1C1B1F',
          borderColor: outline,
        }, Platform.OS === 'android' ? { textAlignVertical: 'center', paddingVertical: 0 } : undefined]}
        onChangeText={v => { textRef.current = v; saveDraft(v); }}
        onSubmitEditing={handleSend}
        placeholder={t('home.input.placeholder')}
        placeholderTextColor={isDark ? '#9A82B8' : '#79747E'}
        returnKeyType="send"
        editable={pipelineState !== 'processing'}
        blurOnSubmit={false}
        autoCorrect={false}
        autoCapitalize="none"
        underlineColorAndroid="transparent"
      />
      <TouchableOpacity
        style={[styles.sendBtn, { backgroundColor: isBusy ? (isDark ? '#2B1E3A' : '#E7E0EC') : primary }]}
        onPress={handleSend} disabled={isBusy} activeOpacity={0.8}>
        <Text style={[styles.sendIcon, { color: isBusy ? (isDark ? '#9A82B8' : '#79747E') : onPrimary }]}>
          {isBusy ? '⏳' : '➤'}
        </Text>
      </TouchableOpacity>
    </View>
  );
});

// ── MessageBubble ─────────────────────────────────────────────────────────────

const MessageBubble = React.memo(function MessageBubble({ message, isDark, language }: { message: Message; isDark: boolean; language: string }) {
  const isUser = message.role === 'user';
  const time = message.timestamp.toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' });
  const primary       = isDark ? '#D0BCFF' : '#6750A4';
  const onPrimary     = isDark ? '#381E72' : '#FFFFFF';
  const surfaceVar    = isDark ? '#2B1E3A' : '#F3EDF7';
  const textSecondary = isDark ? '#CDB8E8' : '#49454F';

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onLongPress={() => Alert.alert(t('home.bubble.copied'))}
      style={[
        styles.bubble,
        isUser ? [styles.bubbleUser, { backgroundColor: primary }] : [styles.bubbleAssistant, { backgroundColor: surfaceVar }],
      ]}>
      <View style={styles.bubbleHeader}>
        {!isUser && <DoeyAvatar size={16} />}
        <Text style={[styles.bubbleSender, { color: isUser ? 'rgba(255,255,255,0.75)' : primary }]}>
          {isUser ? t('home.bubble.user') : t('home.bubble.assistant')}
        </Text>
      </View>
      {isUser
        ? <Text style={[styles.bubbleText, { color: onPrimary }]}>{message.text}</Text>
        : <MarkdownText isDark={isDark}>{message.text}</MarkdownText>
      }
      <Text style={[styles.bubbleTime, { color: isUser ? 'rgba(255,255,255,0.5)' : textSecondary }]}>{time}</Text>
    </TouchableOpacity>
  );
});

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:             { flex: 1 },
  topBar:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, gap: 10 },
  avatarRing:       { borderRadius: 22, borderWidth: 2, padding: 2 },
  topBarCenter:     { flex: 1, gap: 4 },
  topBarTitle:      { fontSize: 18, fontWeight: '700', letterSpacing: 0.15 },
  statePill:        { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 50, alignSelf: 'flex-start' },
  stateDot:         { width: 6, height: 6, borderRadius: 3 },
  stateLabel:       { fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  topBarRight:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modeChip:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 50, borderWidth: 1 },
  modeChipText:     { fontSize: 12, fontWeight: '600', letterSpacing: 0.1 },
  emptyCenter:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyAvatarRing:  { borderRadius: 56, borderWidth: 2, padding: 8 },
  emptyTitle:       { fontSize: 22, fontWeight: '700', letterSpacing: 0.15 },
  emptySubtitle:    { fontSize: 14, letterSpacing: 0.25, textAlign: 'center', paddingHorizontal: 32 },
  thinkingRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  thinkingText:     { fontSize: 13 },
  drivingMicSection:{ height: 260, alignItems: 'center', justifyContent: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
  drivingMicBtn:    { width: 160, height: 160, borderRadius: 80, alignItems: 'center', justifyContent: 'center', gap: 8, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12 },
  drivingMicIcon:   { fontSize: 52 },
  drivingMicLabel:  { color: '#FFFFFF', fontSize: 14, fontWeight: '700', textAlign: 'center' },
  inputBar:         { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth },
  micBtn:           { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  micIcon:          { fontSize: 20 },
  textInput:        { flex: 1, height: 44, borderRadius: 22, paddingHorizontal: 16, fontSize: 15, borderWidth: 1 },
  sendBtn:          { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  sendIcon:         { fontSize: 18, fontWeight: '700' },
  bubble:           { padding: 12, borderRadius: 20, gap: 4, maxWidth: '85%' },
  bubbleUser:       { alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  bubbleAssistant:  { alignSelf: 'flex-start', borderBottomLeftRadius: 4, width: '85%' },
  bubbleHeader:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bubbleSender:     { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  bubbleText:       { fontSize: 15, lineHeight: 22 },
  bubbleTime:       { fontSize: 10, alignSelf: 'flex-end', marginTop: 2, opacity: 0.6 },
});
