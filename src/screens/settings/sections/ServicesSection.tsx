/**
 * ServicesSection – OAuth client IDs & service keys configuration
 *
 * Allows users to enter the client IDs required for Google, Spotify, Slack
 * and the Picovoice access key for wake-word detection.
 * Each field is accompanied by step-by-step instructions on how to obtain it.
 */
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { ApiKeyInput } from '../components/ApiKeyInput';
import { t } from '../../../i18n';

interface ServiceItemProps {
  label: string;
  instructions: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}

/** Expandable row: label + collapsible instruction text + key input */
function ServiceItem({
  label,
  instructions,
  value,
  onChange,
  placeholder,
}: ServiceItemProps): React.JSX.Element {
  const [showInstructions, setShowInstructions] = useState(false);
  const hasValue = value.trim().length > 0;

  return (
    <View>
      {/* Header row */}
      <View>
        <View>
          <Text>{label}</Text>
          <Text style={{ color: hasValue ? '#34C759' : '#FF9500' }}>
            {hasValue ? t('settings.services.configured') : t('settings.services.notConfigured')}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowInstructions(v => !v)}
          activeOpacity={0.7}>
          <Text>
            {showInstructions ? t('settings.services.hideInstructions') : t('settings.services.showInstructions')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Instructions (collapsible) */}
      {showInstructions && (
        <View>
          <Text>{instructions}</Text>
        </View>
      )}

      {/* Key input */}
      <ApiKeyInput
        label={label}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        visible={true}
      />
    </View>
  );
}

interface ServicesSectionProps {
  googleWebClientId: string;
  onGoogleWebClientIdChange: (id: string) => void;
  spotifyClientId: string;
  onSpotifyClientIdChange: (id: string) => void;
  wakeWordKey: string;
  onWakeWordKeyChange: (key: string) => void;
  slackClientId: string;
  onSlackClientIdChange: (id: string) => void;
  googleMapsApiKey: string;
  onGoogleMapsApiKeyChange: (key: string) => void;
  braveSearchApiKey: string;
  onBraveSearchApiKeyChange: (key: string) => void;
}

export function ServicesSection({
  googleWebClientId,
  onGoogleWebClientIdChange,
  spotifyClientId,
  onSpotifyClientIdChange,
  wakeWordKey,
  onWakeWordKeyChange,
  slackClientId,
  onSlackClientIdChange,
  googleMapsApiKey,
  onGoogleMapsApiKeyChange,
  braveSearchApiKey,
  onBraveSearchApiKeyChange,
}: ServicesSectionProps): React.JSX.Element {
  return (
    <View>
      {/* Intro text */}
      <View>
        <Text>
          {t('settings.services.intro')}
        </Text>
      </View>

      <ServiceItem
        label={t('settings.services.google.label')}
        instructions={t('settings.services.google.instructions')}
        value={googleWebClientId}
        onChange={onGoogleWebClientIdChange}
        placeholder="xxxxxxxxx.apps.googleusercontent.com"
      />

      <ServiceItem
        label={t('settings.services.spotify.label')}
        instructions={t('settings.services.spotify.instructions')}
        value={spotifyClientId}
        onChange={onSpotifyClientIdChange}
        placeholder="Spotify Client ID…"
      />

      <ServiceItem
        label={t('settings.services.picovoice.label')}
        instructions={t('settings.services.picovoice.instructions')}
        value={wakeWordKey}
        onChange={onWakeWordKeyChange}
        placeholder="Picovoice AccessKey…"
      />

      <ServiceItem
        label={t('settings.services.slack.label')}
        instructions={t('settings.services.slack.instructions')}
        value={slackClientId}
        onChange={onSlackClientIdChange}
        placeholder="Slack Client ID…"
      />

      <ServiceItem
        label={t('settings.services.googleMaps.label')}
        instructions={t('settings.services.googleMaps.instructions')}
        value={googleMapsApiKey}
        onChange={onGoogleMapsApiKeyChange}
        placeholder="AIzaSy…"
      />

      <ServiceItem
        label={t('settings.services.braveSearch.label')}
        instructions={t('settings.services.braveSearch.instructions')}
        value={braveSearchApiKey}
        onChange={onBraveSearchApiKeyChange}
        placeholder="BSA…"
      />
    </View>
  );
}
