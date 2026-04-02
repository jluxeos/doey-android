/**
 * SchedulesScreen – View and manage all scheduler entries
 *
 * Loads all schedules from the native SchedulerModule and displays them
 * as collapsible entries with details and a delete button.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { t } from '../i18n';
import { MarkdownText } from '../components/MarkdownText';
import { EditableDetailRow } from '../components/EditableDetailRow';
import SchedulerModule from '../native/SchedulerModule';
import type { Schedule } from '../tools/scheduler-tool';

interface SchedulesScreenProps {
  onBack: () => void;
  enabledSkillNames: string[];
  isDark: boolean;
}

function formatDate(ms: number): string {
  const d = new Date(ms);
  return d.toLocaleString('de-AT', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRecurrence(s: Schedule): string {
  const r = s.recurrence;
  switch (r.type) {
    case 'once':
      return t('schedules.recurrence.once');
    case 'interval': {
      const minutes = Math.round((r.intervalMs ?? 0) / 60_000);
      if (minutes < 60) {
        return t('schedules.recurrence.interval.minutes').replace('{count}', String(minutes));
      }
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      if (mins > 0) {
        return t('schedules.recurrence.interval.hoursMinutes')
          .replace('{hours}', String(hours))
          .replace('{minutes}', String(mins));
      }
      return t('schedules.recurrence.interval.hours').replace('{hours}', String(hours));
    }
    case 'daily':
      return t('schedules.recurrence.daily').replace('{time}', r.time ?? '?');
    case 'weekly': {
      const dayNames = ['', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
      const days = (r.daysOfWeek ?? []).map(d => dayNames[d] ?? '?').join(', ');
      return t('schedules.recurrence.weekly')
        .replace('{days}', days)
        .replace('{time}', r.time ?? '?');
    }
    default:
      return r.type;
  }
}

export function SchedulesScreen({ onBack, enabledSkillNames, isDark }: SchedulesScreenProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const isSkillEnabled = enabledSkillNames.includes('scheduler');

  const loadSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const json = await SchedulerModule.getAllSchedules();
      const parsed = JSON.parse(json) as Schedule[];
      parsed.sort((a, b) => {
        if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
        return a.triggerAtMs - b.triggerAtMs;
      });
      setSchedules(parsed);
    } catch {
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isSkillEnabled) {
      loadSchedules();
    }
  }, [loadSchedules, isSkillEnabled]);

  const handleToggle = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const handleToggleEnabled = async (schedule: Schedule) => {
    schedule.enabled = !schedule.enabled;
    await SchedulerModule.setSchedule(JSON.stringify(schedule));
    await loadSchedules();
  };

  const handleSaveField = async (
    schedule: Schedule,
    field: 'label' | 'instruction',
    value: string,
  ) => {
    const updated = { ...schedule, [field]: value };
    await SchedulerModule.setSchedule(JSON.stringify(updated));
    await loadSchedules();
  };

  const handleDelete = (schedule: Schedule) => {
    Alert.alert(
      t('schedules.delete.title'),
      t('schedules.delete.message'),
      [
        { text: t('schedules.delete.cancel'), style: 'cancel' },
        {
          text: t('schedules.delete.confirm'),
          style: 'destructive',
          onPress: async () => {
            await SchedulerModule.removeSchedule(schedule.id);
            if (expandedId === schedule.id) setExpandedId(null);
            await loadSchedules();
          },
        },
      ],
    );
  };

  return (
    <View style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      {/* Header */}
      <View>
        <TouchableOpacity onPress={onBack}>
          <Text>{t('settings.back')}</Text>
        </TouchableOpacity>
        <Text>{t('schedules.title')}</Text>
      </View>

      {!isSkillEnabled ? (
        <View>
          <MarkdownText isDark={isDark}>{t('schedules.skillDisabled')}</MarkdownText>
        </View>
      ) : loading ? (
        <View>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : schedules.length === 0 ? (
        <View>
          <Text>
            {t('schedules.empty')}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 48 }}>
          {schedules.map(schedule => {
            const isExpanded = expandedId === schedule.id;
            return (
              <View key={schedule.id}>
                {/* Schedule header row */}
                <View>
                  <TouchableOpacity
                    onPress={() => handleToggle(schedule.id)}
                    activeOpacity={0.7}>
                    <Text>
                      {isExpanded ? '▾' : '▸'}
                    </Text>
                    <View>
                      <Text
                        numberOfLines={2}>
                        {schedule.label || schedule.instruction}
                      </Text>
                      <Text>
                        {formatDate(schedule.triggerAtMs)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(schedule)}
                    activeOpacity={0.7}
                    style={{ width: 28, height: 28 }}>
                    <Text>🗑️</Text>
                  </TouchableOpacity>
                  <Switch
                    value={schedule.enabled}
                    onValueChange={() => handleToggleEnabled(schedule)}
                    trackColor={{ false: '#3A3A3C', true: '#007AFF' }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                {/* Expanded content */}
                {isExpanded && (
                  <View>
                    <EditableDetailRow
                      label={t('schedules.detail.label')}
                      value={schedule.label || ''}
                      onSave={v => handleSaveField(schedule, 'label', v)}
                      labelWidth={128}
                    />
                    <EditableDetailRow
                      label={t('schedules.detail.instruction')}
                      value={schedule.instruction}
                      onSave={v => handleSaveField(schedule, 'instruction', v)}
                      labelWidth={128}
                    />
                    <DetailRow label={t('schedules.detail.triggerAt')} value={formatDate(schedule.triggerAtMs)} />
                    <DetailRow label={t('schedules.detail.recurrence')} value={formatRecurrence(schedule)} />
                    <DetailRow
                      label={t('schedules.detail.status')}
                      value={schedule.enabled ? t('schedules.status.active') : t('schedules.status.disabled')}
                    />
                    <DetailRow label={t('schedules.detail.createdAt')} value={formatDate(schedule.createdAt)} />
                    {schedule.lastExecutedAt && (
                      <DetailRow
                        label={t('schedules.detail.lastExecuted')}
                        value={formatDate(schedule.lastExecutedAt)}
                      />
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <View>
      <Text>{label}</Text>
      <Text>{value}</Text>
    </View>
  );
}
