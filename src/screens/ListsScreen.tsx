/**
 * ListsScreen – View and manage all stored lists
 *
 * Shows all lists stored via FileStorageTool (AsyncStorage key prefix: sanna_file_).
 * Each list is shown as a collapsible entry. Items can be deleted individually
 * in edit mode. The entire list can also be deleted.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { t } from '../i18n';

const FILE_KEY_PREFIX = 'sanna_file_';
const TYPE_KEY_PREFIX = 'sanna_file_';
const TYPE_KEY_SUFFIX = '_type';

interface ListEntry {
  name: string;
  items: string[];
}

interface ListsScreenProps {
  onBack: () => void;
}

export function ListsScreen({ onBack }: ListsScreenProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [lists, setLists] = useState<ListEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedList, setExpandedList] = useState<string | null>(null);
  const [editingList, setEditingList] = useState<string | null>(null);

  const loadLists = useCallback(async () => {
    setLoading(true);
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const fileKeys = (allKeys as readonly string[]).filter(k =>
        k.startsWith(FILE_KEY_PREFIX) && !k.endsWith(TYPE_KEY_SUFFIX),
      );
      const entries: ListEntry[] = [];
      for (const key of fileKeys) {
        const name = key.slice(FILE_KEY_PREFIX.length);
        // Check if this file has type "list" (or no type for backward compatibility)
        const typeKey = `${TYPE_KEY_PREFIX}${name}${TYPE_KEY_SUFFIX}`;
        const fileType = await AsyncStorage.getItem(typeKey);
        // Only include files with type "list" or no type (backward compatibility)
        if (fileType !== null && fileType !== 'list') {
          continue;
        }
        const content = await AsyncStorage.getItem(key);
        const items = content
          ? content.split('\n').filter(l => l.trim().length > 0)
          : [];
        entries.push({ name, items });
      }
      entries.sort((a, b) => a.name.localeCompare(b.name));
      setLists(entries);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLists();
  }, [loadLists]);

  const handleToggle = (name: string) => {
    setExpandedList(prev => (prev === name ? null : name));
    if (editingList === name) {
      setEditingList(null);
    }
  };

  const handleDeleteList = (name: string) => {
    Alert.alert(
      `${t('lists.delete.title')}: "${name}"`,
      t('lists.delete.message'),
      [
        { text: t('lists.delete.cancel'), style: 'cancel' },
        {
          text: t('lists.delete.confirm'),
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem(`${FILE_KEY_PREFIX}${name}`);
            // Also delete type metadata
            await AsyncStorage.removeItem(`${TYPE_KEY_PREFIX}${name}${TYPE_KEY_SUFFIX}`);
            if (expandedList === name) setExpandedList(null);
            if (editingList === name) setEditingList(null);
            await loadLists();
          },
        },
      ],
    );
  };

  const handleDeleteItem = async (listName: string, itemIndex: number) => {
    const key = `${FILE_KEY_PREFIX}${listName}`;
    const content = await AsyncStorage.getItem(key);
    if (!content) return;
    const lines = content.split('\n').filter(l => l.trim().length > 0);
    lines.splice(itemIndex, 1);
    await AsyncStorage.setItem(key, lines.join('\n'));
    await loadLists();
  };

  return (
    <View style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      {/* Header */}
      <View>
        <TouchableOpacity onPress={onBack}>
          <Text>{t('settings.back')}</Text>
        </TouchableOpacity>
        <Text>{t('lists.title')}</Text>
      </View>

      {loading ? (
        <View>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : lists.length === 0 ? (
        <View>
          <Text>
            {t('lists.empty')}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 48 }}>
          {lists.map(list => {
            const isExpanded = expandedList === list.name;
            const isEditing = editingList === list.name;
            const itemLabel =
              list.items.length === 1
                ? `1 ${t('lists.item.singular')}`
                : `${list.items.length} ${t('lists.item.plural')}`;
            return (
              <View key={list.name}>
                {/* List header row */}
                <TouchableOpacity
                  onPress={() => handleToggle(list.name)}
                  activeOpacity={0.7}>
                  <Text>
                    {isExpanded ? '▾' : '▸'}
                  </Text>
                  <Text>
                    {list.name}
                  </Text>
                  <Text>{itemLabel}</Text>
                </TouchableOpacity>

                {/* Expanded content */}
                {isExpanded && (
                  <View>
                    {/* Action buttons */}
                    <View>
                      <TouchableOpacity
                        onPress={() => setEditingList(isEditing ? null : list.name)}
                        activeOpacity={0.7}
                        style={{ width: 28, height: 28 }}
                        className={`rounded-full items-center justify-center ${isEditing ? 'bg-accent' : 'bg-surface-tertiary'}`}>
                        <Text className={`text-[13px] leading-none ${isEditing ? 'text-white' : 'text-label-primary'}`}>
                          {isEditing ? '✓' : '✏️'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteList(list.name)}
                        activeOpacity={0.7}
                        style={{ width: 28, height: 28 }}>
                        <Text>🗑️</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Items */}
                    {list.items.length === 0 ? (
                      <View>
                        <Text>
                          {t('lists.items.empty')}
                        </Text>
                      </View>
                    ) : (
                      list.items.map((item, idx) => (
                        <View
                          key={idx}>
                          <Text>•</Text>
                          <Text>{item}</Text>
                          {isEditing && (
                            <TouchableOpacity
                              onPress={() => handleDeleteItem(list.name, idx)}
                              activeOpacity={0.7}>
                              <Text>✕</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      ))
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
