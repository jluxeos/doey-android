/**
 * SettingsScreen – API Keys, Wake Word, Skills credential management
 */
import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { CredentialManager } from '../../permissions/credential-manager';
import type { SkillInfo } from '../../agent/skill-loader';
import type { TTSService } from '../../audio/tts-service';
import { CollapsibleSection } from './components/CollapsibleSection';
import { EvidenceModal } from './components/EvidenceModal';
import { useSkillCredentials } from './hooks/useSkillCredentials';
import { useSkillTesting } from './hooks/useSkillTesting';
import { AboutSection } from './sections/AboutSection';
import { AgentSection } from './sections/AgentSection';
import { HistorySection } from './sections/HistorySection';
import { ProviderSection } from './sections/ProviderSection';
import { ServicesSection } from './sections/ServicesSection';
import { SkillsSection } from './sections/SkillsSection';
import { SoulSection } from './sections/SoulSection';
import { SpeechSection } from './sections/SpeechSection';
import { WakeWordSection } from './sections/WakeWordSection';
import { t } from '../../i18n';

type SectionId =
  | 'provider'
  | 'wakeWord'
  | 'services'
  | 'speech'
  | 'soul'
  | 'skills'
  | 'agent'
  | 'history'
  | 'about';

interface SettingsScreenProps {
  onBack: () => void;
  credentialManager: CredentialManager;
  allSkills: SkillInfo[];
  enabledSkillNames: string[];
  skillAvailability: Record<string, boolean>;
  onToggleSkill: (skillName: string, enabled: boolean) => void;
  claudeApiKey: string;
  onClaudeApiKeyChange: (key: string) => void;
  openAIApiKey: string;
  onOpenAIApiKeyChange: (key: string) => void;
  selectedProvider: 'groq';
  onProviderChange: (provider: 'groq') => void;
  selectedOpenAIModel: string;
  onOpenAIModelChange: (model: string) => void;
  selectedClaudeModel: string;
  onClaudeModelChange: (model: string) => void;
  customApiKey: string;
  onCustomApiKeyChange: (key: string) => void;
  customModelUrl: string;
  onCustomModelUrlChange: (url: string) => void;
  customModelName: string;
  onCustomModelNameChange: (name: string) => void;
  onTestConnection?: () => void;
  wakeWordEnabled: boolean;
  onWakeWordToggle: (enabled: boolean) => void;
  wakeWordKey: string;
  onWakeWordKeyChange: (key: string) => void;
  sttLanguage: 'system' | string;
  onSttLanguageChange: (language: 'system' | string) => void;
  sttMode: 'auto' | 'offline' | 'online';
  onSttModeChange: (mode: 'auto' | 'offline' | 'online') => void;
  appLanguage: 'system' | string;
  onAppLanguageChange: (lang: 'system' | string) => void;
  googleWebClientId: string;
  onGoogleWebClientIdChange: (id: string) => void;
  spotifyClientId: string;
  onSpotifyClientIdChange: (id: string) => void;
  slackClientId: string;
  onSlackClientIdChange: (id: string) => void;
  googleMapsApiKey: string;
  onGoogleMapsApiKeyChange: (key: string) => void;
  braveSearchApiKey: string;
  onBraveSearchApiKeyChange: (key: string) => void;
  onTestSkill?: (skillName: string) => Promise<{
    success: boolean;
    message: string;
    error?: string;
    evidence?: {
      toolCalls: Array<{ name: string; arguments: Record<string, unknown> }>;
      toolResults: Array<{ toolName: string; result: string; isError: boolean }>;
      finalResponse?: string;
      iterations: number;
    };
  }>;
  ttsService?: TTSService;
  onAddSkill?: (content: string) => Promise<{ success: boolean; error?: string }>;
  onDeleteSkill?: (skillName: string) => Promise<void>;
  dynamicSkillNames?: string[];
  onClearHistory?: () => void;
  maxIterations: number;
  onMaxIterationsChange: (value: number) => void;
  maxSubAgentIterations: number;
  onMaxSubAgentIterationsChange: (value: number) => void;
  maxAccessibilityIterations: number;
  onMaxAccessibilityIterationsChange: (value: number) => void;
  llmContextMaxMessages: number;
  onLlmContextMaxMessagesChange: (value: number) => void;
  conversationHistoryMaxMessages: number;
  onConversationHistoryMaxMessagesChange: (value: number) => void;
  soulText: string;
  onSoulTextChange: (value: string) => void;
  onDictateSoul: () => Promise<string>;
  onClearSoul: () => void;
  personalMemoryText: string;
  onPersonalMemoryTextChange: (value: string) => void;
  onClearPersonalMemory: () => void;
  debugLogEnabled: boolean;
  onDebugLogEnabledChange: (enabled: boolean) => void;
  isDark?: boolean;
}

export function SettingsScreen({
  onBack, credentialManager, allSkills, enabledSkillNames,
  skillAvailability, onToggleSkill, claudeApiKey, onClaudeApiKeyChange,
  openAIApiKey, onOpenAIApiKeyChange, selectedProvider, onProviderChange,
  selectedOpenAIModel, onOpenAIModelChange, selectedClaudeModel,
  onClaudeModelChange, customApiKey, onCustomApiKeyChange,
  customModelUrl, onCustomModelUrlChange, customModelName,
  onCustomModelNameChange, onTestConnection, wakeWordEnabled,
  onWakeWordToggle, wakeWordKey, onWakeWordKeyChange, sttLanguage,
  onSttLanguageChange, sttMode, onSttModeChange, appLanguage,
  onAppLanguageChange, googleWebClientId, onGoogleWebClientIdChange,
  spotifyClientId, onSpotifyClientIdChange, slackClientId,
  onSlackClientIdChange, googleMapsApiKey, onGoogleMapsApiKeyChange,
  braveSearchApiKey, onBraveSearchApiKeyChange, onTestSkill, ttsService,
  onAddSkill, onDeleteSkill, dynamicSkillNames, onClearHistory,
  maxIterations, onMaxIterationsChange, maxSubAgentIterations,
  onMaxSubAgentIterationsChange, maxAccessibilityIterations,
  onMaxAccessibilityIterationsChange, llmContextMaxMessages,
  onLlmContextMaxMessagesChange, conversationHistoryMaxMessages,
  onConversationHistoryMaxMessagesChange, soulText, onSoulTextChange,
  onDictateSoul, onClearSoul, personalMemoryText, onPersonalMemoryTextChange,
  onClearPersonalMemory, debugLogEnabled, onDebugLogEnabledChange,
  isDark = false,
}: SettingsScreenProps): React.JSX.Element {
  const { skillCredentialStatus, checkSkillCredentials } = useSkillCredentials(allSkills, credentialManager);
  const {
    testingSkill, testResults, evidenceModalVisible, evidenceModalContent,
    handleTestSkill, showEvidencePopup, handleCloseEvidenceModal,
  } = useSkillTesting(onTestSkill);

  const insets = useSafeAreaInsets();
  const [openSection, setOpenSection] = useState<SectionId | null>(null);
  const handleSectionToggle = (sectionId: SectionId) => {
    setOpenSection(prev => (prev === sectionId ? null : sectionId));
  };

  const bg      = isDark ? '#10091A' : '#FFFBFE';
  const surface = isDark ? '#1D1027' : '#FFFFFF';
  const outline = isDark ? '#4A4458' : '#CAC4D0';
  const textPri = isDark ? '#EAE0F8' : '#1C1B1F';
  const primary = isDark ? '#D0BCFF' : '#6750A4';

  return (
    <View style={[{ flex: 1, backgroundColor: bg }, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: outline, backgroundColor: surface, gap: 12 }}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7}>
          <Text style={{ color: primary, fontSize: 16, fontWeight: '500' }}>‹ {t('settings.back')}</Text>
        </TouchableOpacity>
        <Text style={{ flex: 1, color: textPri, fontSize: 18, fontWeight: '700', letterSpacing: 0.15 }}>
          {t('settings.title')}
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 24, paddingBottom: 48 }}>
        <CollapsibleSection title={t('settings.section.language')} expanded={openSection === 'speech'} onToggle={() => handleSectionToggle('speech')} isDark={isDark}>
          <SpeechSection sttLanguage={sttLanguage} onSttLanguageChange={onSttLanguageChange} sttMode={sttMode} onSttModeChange={onSttModeChange} appLanguage={appLanguage} onAppLanguageChange={onAppLanguageChange} />
        </CollapsibleSection>

        <CollapsibleSection title={t('settings.section.wakeWord')} expanded={openSection === 'wakeWord'} onToggle={() => handleSectionToggle('wakeWord')} isDark={isDark}>
          <WakeWordSection wakeWordEnabled={wakeWordEnabled} onWakeWordToggle={onWakeWordToggle} wakeWordKey={wakeWordKey} onWakeWordKeyChange={onWakeWordKeyChange} />
        </CollapsibleSection>

        <CollapsibleSection title={t('settings.section.soul')} expanded={openSection === 'soul'} onToggle={() => handleSectionToggle('soul')} isDark={isDark}>
          <SoulSection soulText={soulText} onSoulTextChange={onSoulTextChange} onDictateSoul={onDictateSoul} onClearSoul={onClearSoul} personalMemoryText={personalMemoryText} onPersonalMemoryTextChange={onPersonalMemoryTextChange} onClearPersonalMemory={onClearPersonalMemory} />
        </CollapsibleSection>

        <CollapsibleSection title={t('settings.section.skills')} expanded={openSection === 'skills'} onToggle={() => handleSectionToggle('skills')} isDark={isDark}>
          <SkillsSection allSkills={allSkills} enabledSkillNames={enabledSkillNames} skillAvailability={skillAvailability} onToggleSkill={onToggleSkill} credentialManager={credentialManager} skillCredentialStatus={skillCredentialStatus} checkSkillCredentials={checkSkillCredentials} testingSkill={testingSkill} testResults={testResults} handleTestSkill={handleTestSkill} showEvidencePopup={showEvidencePopup} onTestSkill={onTestSkill} onAddSkill={onAddSkill} onDeleteSkill={onDeleteSkill} dynamicSkillNames={dynamicSkillNames} />
        </CollapsibleSection>

        <CollapsibleSection title={t('settings.section.services')} expanded={openSection === 'services'} onToggle={() => handleSectionToggle('services')} isDark={isDark}>
          <ServicesSection googleWebClientId={googleWebClientId} onGoogleWebClientIdChange={onGoogleWebClientIdChange} spotifyClientId={spotifyClientId} onSpotifyClientIdChange={onSpotifyClientIdChange} wakeWordKey={wakeWordKey} onWakeWordKeyChange={onWakeWordKeyChange} slackClientId={slackClientId} onSlackClientIdChange={onSlackClientIdChange} googleMapsApiKey={googleMapsApiKey} onGoogleMapsApiKeyChange={onGoogleMapsApiKeyChange} braveSearchApiKey={braveSearchApiKey} onBraveSearchApiKeyChange={onBraveSearchApiKeyChange} />
        </CollapsibleSection>

        <CollapsibleSection title={t('settings.section.provider')} expanded={openSection === 'provider'} onToggle={() => handleSectionToggle('provider')} isDark={isDark}>
          <ProviderSection openAIApiKey={openAIApiKey} onOpenAIApiKeyChange={onOpenAIApiKeyChange} customApiKey={customApiKey} onCustomApiKeyChange={onCustomApiKeyChange} onTestConnection={onTestConnection} />
        </CollapsibleSection>

        <CollapsibleSection title={t('settings.section.agent')} expanded={openSection === 'agent'} onToggle={() => handleSectionToggle('agent')} isDark={isDark}>
          <AgentSection maxIterations={maxIterations} onMaxIterationsChange={onMaxIterationsChange} maxSubAgentIterations={maxSubAgentIterations} onMaxSubAgentIterationsChange={onMaxSubAgentIterationsChange} maxAccessibilityIterations={maxAccessibilityIterations} onMaxAccessibilityIterationsChange={onMaxAccessibilityIterationsChange} />
        </CollapsibleSection>

        <CollapsibleSection title={t('settings.section.history')} expanded={openSection === 'history'} onToggle={() => handleSectionToggle('history')} isDark={isDark}>
          <HistorySection llmContextMaxMessages={llmContextMaxMessages} onLlmContextMaxMessagesChange={onLlmContextMaxMessagesChange} conversationHistoryMaxMessages={conversationHistoryMaxMessages} onConversationHistoryMaxMessagesChange={onConversationHistoryMaxMessagesChange} onClearHistory={onClearHistory} />
        </CollapsibleSection>

        <CollapsibleSection title={t('settings.section.about')} expanded={openSection === 'about'} onToggle={() => handleSectionToggle('about')} isDark={isDark}>
          <AboutSection debugLogEnabled={debugLogEnabled} onDebugLogEnabledChange={onDebugLogEnabledChange} />
        </CollapsibleSection>
      </ScrollView>

      {evidenceModalContent && (
        <EvidenceModal visible={evidenceModalVisible} title={evidenceModalContent.title} text={evidenceModalContent.text} onClose={handleCloseEvidenceModal} ttsService={ttsService} />
      )}
    </View>
  );
}
