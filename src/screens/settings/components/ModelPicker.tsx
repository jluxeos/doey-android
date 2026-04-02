import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SettingRow } from './SettingRow';
import { t } from '../../../i18n';

interface ModelPickerProps {
  label: string;
  apiKey: string;
  selectedModel: string;
  onModelChange: (model: string) => void;
  fetchModels:
    | ((apiKey: string) => Promise<string[]>)
    | ((apiKey: string, baseUrl: string) => Promise<string[]>);
  defaultModel: string;
  allowManualInput?: boolean;
  baseUrl?: string;
}

export function ModelPicker({
  label,
  apiKey,
  selectedModel,
  onModelChange,
  fetchModels,
  defaultModel,
  allowManualInput = false,
  baseUrl,
}: ModelPickerProps): React.JSX.Element {
  const [pickerVisible, setPickerVisible] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [manualInput, setManualInput] = useState('');

  useEffect(() => {
    if (!apiKey) {
      setModels([]);
      return;
    }
    setLoading(true);

    const doFetch = async () => {
      try {
        let fetchedModels: string[];
        if (baseUrl && fetchModels.length === 2) {
          fetchedModels = await (
            fetchModels as (
              apiKey: string,
              baseUrl: string,
            ) => Promise<string[]>
          )(apiKey, baseUrl);
        } else {
          fetchedModels = await (
            fetchModels as (apiKey: string) => Promise<string[]>
          )(apiKey);
        }
        setModels(fetchedModels);
      } catch {
        setModels([]);
      } finally {
        setLoading(false);
      }
    };

    doFetch();
  }, [apiKey, fetchModels, baseUrl]);

  useEffect(() => {
    setManualInput(selectedModel || defaultModel);
  }, [selectedModel, defaultModel]);

  const displayModel = selectedModel || defaultModel;

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      onModelChange(manualInput.trim());
      setPickerVisible(false);
    }
  };

  return (
    <>
      <SettingRow label={label}>
        <TouchableOpacity
          onPress={() => setPickerVisible(true)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#8E8E93" />
          ) : (
            <Text
              numberOfLines={1}
            >
              {displayModel}
            </Text>
          )}
        </TouchableOpacity>
      </SettingRow>

      <Modal
        visible={pickerVisible}
        transparent
            animationType="fade"
            onRequestClose={() => setPickerVisible(false)}>
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => setPickerVisible(false)}>
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => {}}>
                <View>
                  <Text>{label}</Text>
                  <TouchableOpacity onPress={() => setPickerVisible(false)}>
                    <Text>{t('evidence.close')}</Text>
                  </TouchableOpacity>
                </View>
            {loading ? (
              <View>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text>
                  {t('settings.provider.loadingModels')}
                </Text>
              </View>
            ) : (
              <>
                {models.length > 0 && (
                  <ScrollView>
                    {models.map(model => (
                      <TouchableOpacity
                        key={model}
                        onPress={() => {
                          onModelChange(model);
                          setPickerVisible(false);
                        }}
                      >
                        <Text
                          className={`text-[15px] ${
                            selectedModel === model
                              ? 'text-accent font-semibold'
                              : 'text-label-primary'
                          }`}
                        >
                          {model}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
                {allowManualInput && (
                  <View>
                    <Text>
                      {t('settings.provider.manualModelInput')}
                    </Text>
                    <TextInput
                      value={manualInput}
                      onChangeText={setManualInput}
                      placeholder="model-name"
                      placeholderTextColor="#8E8E93"
                    />
                    <TouchableOpacity
                      onPress={handleManualSubmit}
                      disabled={!manualInput.trim()}
                    >
                      <Text>
                        OK
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>
        </>
  );
}
