import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { t } from '../../../i18n';

interface AboutSectionProps {
  debugLogEnabled: boolean;
  onDebugLogEnabledChange: (enabled: boolean) => void;
}

export function AboutSection({
  debugLogEnabled,
  onDebugLogEnabledChange,
}: AboutSectionProps): React.JSX.Element {
  return (
    <>
      <View
        style={{ borderBottomWidth: StyleSheet.hairlineWidth }}>
        <Text>Version 0.1.0 (Phase 1 MVP)</Text>
      </View>
      <View>
        <View>
          <Text>🪲</Text>
          <Text>
            {t('settings.about.debugLog')}
          </Text>
          <Switch
            value={debugLogEnabled}
            onValueChange={onDebugLogEnabledChange}
            trackColor={{ false: '#3A3A3C', true: '#007AFF' }}
            thumbColor="#FFFFFF"
          />
        </View>
        {debugLogEnabled && (
          <Text>
            {t('settings.about.debugFileHint')}
          </Text>
        )}
      </View>

      {/* Créditos */}
      <View>
        <Text>
          Doey — Asistente de IA Personal
        </Text>
        <Text>
          Impulsado por{' '}
          <Text>Google Gemini</Text>
        </Text>
        <Text>
          Diseño original por{' '}
          <Text>Sannabot</Text>
        </Text>
        <Text>
          Hecho con ❤️
        </Text>
      </View>
    </>
  );
}
