import React from 'react';
import { Dimensions, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import type { TTSService } from '../../../audio/tts-service';
import { t } from '../../../i18n';

interface EvidenceModalProps {
  visible: boolean;
  title: string;
  text: string;
  onClose: () => void;
  ttsService?: TTSService;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function EvidenceModal({
  visible,
  title,
  text,
  onClose,
}: EvidenceModalProps): React.JSX.Element {
  // Use 70% of screen height for the scrollable content area
  const maxScrollHeight = SCREEN_HEIGHT * 0.7;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {}}>
          <View>
            <Text>{title || t('evidence.noDetails')}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text>{t('evidence.close')}</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            style={{ maxHeight: maxScrollHeight }}
            contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
            showsVerticalScrollIndicator={true}>
            <Text>
              {text || t('evidence.noDetails')}
            </Text>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
