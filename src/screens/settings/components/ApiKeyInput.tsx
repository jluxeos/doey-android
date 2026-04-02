import React from 'react';
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';

interface ApiKeyInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  visible: boolean;
  secureTextEntry?: boolean;
}

export function ApiKeyInput({
  label,
  value,
  onChange,
  placeholder,
  visible,
  secureTextEntry = true,
}: ApiKeyInputProps): React.JSX.Element | null {
  if (!visible) return null;
  return (
    <View
      style={{ borderTopWidth: StyleSheet.hairlineWidth }}
    >
      <Text>{label}</Text>
      <TextInput
        style={{
          fontFamily: Platform.OS === 'android' ? 'monospace' : 'Menlo',
        }}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#636366"
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}
