import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { t } from '../../../i18n';

interface AgentSectionProps {
  maxIterations: number;
  onMaxIterationsChange: (value: number) => void;
  maxSubAgentIterations: number;
  onMaxSubAgentIterationsChange: (value: number) => void;
  maxAccessibilityIterations: number;
  onMaxAccessibilityIterationsChange: (value: number) => void;
}

function IterationStepper({
  label,
  description,
  value,
  onChange,
  min = 1,
  max = 50,
}: {
  label: string;
  description: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}): React.JSX.Element {
  return (
    <View
      style={{ borderBottomWidth: StyleSheet.hairlineWidth }}>
      <View>
        {/* Label + description */}
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text>{label}</Text>
          <Text>{description}</Text>
        </View>

        {/* Stepper: − value + */}
        <View>
          <TouchableOpacity
            onPress={() => onChange(Math.max(min, value - 1))}
            disabled={value <= min}
            activeOpacity={0.7}>
            <Text
              style={{ lineHeight: 22 }}>
              −
            </Text>
          </TouchableOpacity>

          <Text
            style={{ width: 32 }}>
            {value}
          </Text>

          <TouchableOpacity
            onPress={() => onChange(Math.min(max, value + 1))}
            disabled={value >= max}
            activeOpacity={0.7}>
            <Text
              style={{ lineHeight: 22 }}>
              +
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export function AgentSection({
  maxIterations,
  onMaxIterationsChange,
  maxSubAgentIterations,
  onMaxSubAgentIterationsChange,
  maxAccessibilityIterations,
  onMaxAccessibilityIterationsChange,
}: AgentSectionProps): React.JSX.Element {
  return (
    <>
      <View
        style={{ borderBottomWidth: StyleSheet.hairlineWidth }}>
        <Text>
          {t('settings.agent.description')}
        </Text>
      </View>

      <IterationStepper
        label={t('settings.agent.mainLabel')}
        description={t('settings.agent.mainDesc')}
        value={maxIterations}
        onChange={onMaxIterationsChange}
        min={6}
      />

      <IterationStepper
        label={t('settings.agent.subLabel')}
        description={t('settings.agent.subDesc')}
        value={maxSubAgentIterations}
        onChange={onMaxSubAgentIterationsChange}
        min={6}
      />

      <IterationStepper
        label={t('settings.agent.accessibilityLabel')}
        description={t('settings.agent.accessibilityDesc')}
        value={maxAccessibilityIterations}
        onChange={onMaxAccessibilityIterationsChange}
        min={6}
      />
    </>
  );
}
