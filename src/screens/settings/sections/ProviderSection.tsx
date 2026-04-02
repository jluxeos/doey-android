import React, { useState } from 'react';
import { Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ApiKeyInput } from '../components/ApiKeyInput';

interface ProviderSectionProps {
  openAIApiKey: string; 
  onOpenAIApiKeyChange: (key: string) => void;
  customApiKey: string; 
  onCustomApiKeyChange: (key: string) => void;
  onTestConnection?: () => Promise<void>;
}

export function ProviderSection({
  openAIApiKey, onOpenAIApiKeyChange,
  customApiKey, onCustomApiKeyChange,
  onTestConnection
}: ProviderSectionProps): React.JSX.Element {
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleTest = async () => {
    if (!onTestConnection) return;
    setTesting(true);
    setStatus("Probando conexiones...");
    try {
      await onTestConnection();
      setStatus("¡Conexión Dual Exitosa!");
    } catch (err: any) {
      setStatus(err?.message || "Error en las APIs");
    } finally {
      setTesting(false);
    }
  };

  return (
    <View>
      <Text>IA Principal: Gemini 2.5 Flash Lite</Text>
      <ApiKeyInput
        label="Gemini API Key"
        value={openAIApiKey}
        onChange={onOpenAIApiKeyChange}
        placeholder="AIza..."
        visible={true}
      />

      <View />

      <Text>IA Respaldo: Kimi K2 (Groq)</Text>
      <ApiKeyInput
        label="Groq API Key"
        value={customApiKey}
        onChange={onCustomApiKeyChange}
        placeholder="gsk_..."
        visible={true}
      />

      <TouchableOpacity
        onPress={handleTest}
        disabled={testing}
        className={`mt-8 rounded-xl py-3 items-center \${testing ? 'bg-surface-tertiary' : 'bg-accent'}`}
      >
        {testing ? <ActivityIndicator color="#fff" /> : <Text>Verificar Estado de APIs</Text>}
      </TouchableOpacity>
      
      {status && (
        <Text>
          {status}
        </Text>
      )}
    </View>
  );
}
