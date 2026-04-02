import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { t } from '../../../i18n';

interface HistorySectionProps {
  llmContextMaxMessages: number;
  onLlmContextMaxMessagesChange: (value: number) => void;
  conversationHistoryMaxMessages: number;
  onConversationHistoryMaxMessagesChange: (value: number) => void;
  onClearHistory?: () => void;
}

function HistoryStepper({
  label,
  description,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  description: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
}): React.JSX.Element {
  return (
    <View
      style={{ borderBottomWidth: StyleSheet.hairlineWidth }}>
      <View>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text>{label}</Text>
          <Text>{description}</Text>
        </View>

        <View>
          <TouchableOpacity
            onPress={() => onChange(Math.max(min, value - 1))}
            disabled={value <= min}
            activeOpacity={0.7}>
            <Text style={{ lineHeight: 22 }}>
              −
            </Text>
          </TouchableOpacity>

          <Text
            style={{ width: 40 }}>
            {value}
          </Text>

          <TouchableOpacity
            onPress={() => onChange(Math.min(max, value + 1))}
            disabled={value >= max}
            activeOpacity={0.7}>
            <Text style={{ lineHeight: 22 }}>
              +
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export function HistorySection({
  llmContextMaxMessages,
  onLlmContextMaxMessagesChange,
  conversationHistoryMaxMessages,
  onConversationHistoryMaxMessagesChange,
  onClearHistory,
}: HistorySectionProps): React.JSX.Element {
  const handleClearHistory = () => {
    Alert.alert(
      t('settings.clearHistory.confirm.title'),
      t('settings.clearHistory.confirm.message'),
      [
        { text: t('settings.clearHistory.confirm.cancel'), style: 'cancel' },
        {
          text: t('settings.clearHistory.confirm.confirm'),
          style: 'destructive',
          onPress: onClearHistory,
        },
      ],
    );
  };

  return (
    <>
      <View
        style={{ borderBottomWidth: StyleSheet.hairlineWidth }}>
        <Text>
          {t('settings.history.description')}
        </Text>
      </View>

      <HistoryStepper
        label={t('settings.history.llmContextLabel')}
        description={t('settings.history.llmContextDesc')}
        value={llmContextMaxMessages}
        onChange={onLlmContextMaxMessagesChange}
        min={10}
        max={200}
      />

      <HistoryStepper
        label={t('settings.history.conversationHistoryLabel')}
        description={t('settings.history.conversationHistoryDesc')}
        value={conversationHistoryMaxMessages}
        onChange={onConversationHistoryMaxMessagesChange}
        min={50}
        max={200}
      />

      {onClearHistory && (
        <View>
          <TouchableOpacity
            onPress={handleClearHistory}>
            <Text>
              {t('settings.clearHistory.button')}
            </Text>
          </TouchableOpacity>
          <Text>
            {t('settings.clearHistory.description')}
          </Text>
        </View>
      )}
    </>
  );
}
