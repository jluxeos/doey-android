/**
 * JournalScreen – Display and manage journal entries
 *
 * Shows all journal entries with filtering by category and deletion support.
 * Similar to DebugPanel but for journal entries.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { getEntries, deleteEntry, getCategories, type JournalEntry } from '../agent/journal-store';
import { t } from '../i18n';

interface JournalScreenProps {
  visible: boolean;
  onClose: () => void;
}

const ITEMS_PER_PAGE = 20;

export function JournalScreen({ visible, onClose }: JournalScreenProps): React.JSX.Element {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [expandState, setExpandState] = useState<Record<string, 'preview' | 'full'>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const loadEntries = useCallback(async () => {
    const loadedEntries = await getEntries();
    setEntries(loadedEntries);
    const loadedCategories = await getCategories();
    setCategories(loadedCategories);
  }, []);

  useEffect(() => {
    if (visible) {
      loadEntries();
    }
  }, [visible, loadEntries]);

  // Reset to first page when entries or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [entries.length, activeCategory]);

  const filteredEntries = activeCategory
    ? entries.filter(e => e.category === activeCategory)
    : entries;

  const handleCategoryToggle = useCallback((category: string) => {
    setActiveCategory(prev => (prev === category ? null : category));
  }, []);

  // Calculate pagination
  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentEntries = filteredEntries.slice(startIndex, endIndex);

  const goToPage = useCallback((page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [totalPages]);

  const goToPreviousPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  const goToNextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  // Cycle: collapsed → preview → full → collapsed
  const toggleEntry = useCallback((id: string) => {
    setExpandState(prev => {
      const cur = prev[id];
      if (!cur) return { ...prev, [id]: 'preview' };
      if (cur === 'preview') return { ...prev, [id]: 'full' };
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const handleDelete = useCallback((entry: JournalEntry) => {
    Alert.alert(
      t('journal.delete.title'),
      t('journal.delete.message'),
      [
        {
          text: t('journal.delete.cancel'),
          style: 'cancel',
        },
        {
          text: t('journal.delete.confirm'),
          style: 'destructive',
          onPress: async () => {
            await deleteEntry(entry.id);
            await loadEntries();
          },
        },
      ],
    );
  }, [loadEntries]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}>
      <View>
        {/* Header */}
        <View>
          <TouchableOpacity onPress={onClose}>
            <Text>{t('settings.back')}</Text>
          </TouchableOpacity>
          <Text>{t('journal.title')}</Text>
        </View>

        {/* Category Filter */}
        {categories.length > 0 && (
          <View>
            <TouchableOpacity
              onPress={() => setActiveCategory(null)}
              className={`px-3 py-1.5 rounded-full ${
                activeCategory === null ? 'bg-surface-elevated' : 'bg-surface-tertiary opacity-60'
              }`}
              activeOpacity={0.7}>
              <Text className={`text-xs font-semibold ${
                activeCategory === null ? 'text-label-primary' : 'text-label-secondary'
              }`}>
                {t('journal.filter.all')}
              </Text>
            </TouchableOpacity>
            {categories.map(category => {
              const isActive = activeCategory === category;
              return (
                <TouchableOpacity
                  key={category}
                  onPress={() => handleCategoryToggle(category)}
                  className={`px-3 py-1.5 rounded-full ${
                    isActive ? 'bg-surface-elevated' : 'bg-surface-tertiary opacity-60'
                  }`}
                  activeOpacity={0.7}>
                  <Text className={`text-xs font-semibold ${
                    isActive ? 'text-label-primary' : 'text-label-secondary'
                  }`}>
                    {category}
                    {isActive && ' ✕'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Journal entries */}
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: 8, gap: 4 }}>
          {filteredEntries.length === 0 ? (
            <Text>
              {entries.length === 0
                ? t('journal.empty')
                : t('journal.filter.empty').replace('{category}', activeCategory ?? '')}
            </Text>
          ) : (
            currentEntries.map(entry => (
              <JournalEntryRow
                key={entry.id}
                entry={entry}
                expandLevel={expandState[entry.id]}
                onToggle={toggleEntry}
                onDelete={handleDelete}
              />
            ))
          )}
        </ScrollView>

        {/* Pagination controls */}
        {filteredEntries.length > ITEMS_PER_PAGE && (
          <View>
            <TouchableOpacity
              onPress={goToPreviousPage}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg ${
                currentPage === 1
                  ? 'bg-surface-tertiary opacity-50'
                  : 'bg-surface-elevated'
              }`}>
              <Text
                className={`text-sm font-semibold ${
                  currentPage === 1
                    ? 'text-label-tertiary'
                    : 'text-label-primary'
                }`}>
                {t('journal.pagination.previous')}
              </Text>
            </TouchableOpacity>

            <Text>
              {t('journal.pagination.page')
                .replace('{current}', currentPage.toString())
                .replace('{total}', totalPages.toString())
                .replace('{count}', filteredEntries.length.toString())}
            </Text>

            <TouchableOpacity
              onPress={goToNextPage}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-lg ${
                currentPage === totalPages
                  ? 'bg-surface-tertiary opacity-50'
                  : 'bg-surface-elevated'
              }`}>
              <Text
                className={`text-sm font-semibold ${
                  currentPage === totalPages
                    ? 'text-label-tertiary'
                    : 'text-label-primary'
                }`}>
                {t('journal.pagination.next')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

// ─── JournalEntryRow ────────────────────────────────────────────────────────────

const PREVIEW_CHARS = 500;

interface JournalEntryRowProps {
  entry: JournalEntry;
  /** undefined = collapsed, 'preview' = truncated detail, 'full' = full detail */
  expandLevel?: 'preview' | 'full';
  onToggle: (id: string) => void;
  onDelete: (entry: JournalEntry) => void;
}

const JournalEntryRow = React.memo(function JournalEntryRow({
  entry,
  expandLevel,
  onToggle,
  onDelete,
}: JournalEntryRowProps) {
  const dateStr = new Date(entry.createdAt).toLocaleString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  const hasDetail = entry.details.length > 0;
  const isOpen = !!expandLevel;
  const isFull = expandLevel === 'full';
  const needsTruncation = hasDetail && entry.details.length > PREVIEW_CHARS;

  const stateIcon = !isOpen ? '▶' : isFull ? '▼' : '▷';

  return (
    <View className={`rounded-lg px-2.5 py-2 ${isOpen ? 'bg-surface-tertiary' : 'bg-surface-elevated'}`}>
      <TouchableOpacity
        onPress={() => hasDetail && onToggle(entry.id)}
        activeOpacity={hasDetail ? 0.6 : 1}>
        <View>
          <Text
            style={{ fontFamily: 'monospace' }}
            selectable>
            {dateStr}
          </Text>
          <View>
            <Text>
              {entry.category}
            </Text>
          </View>
          <Text
            numberOfLines={isOpen ? 0 : 2}
            selectable>
            {entry.title}
          </Text>
          {hasDetail && (
            <Text>
              {stateIcon}
            </Text>
          )}
        </View>
        {isOpen && entry.details && (
          <View>
            <Text
              selectable>
              {isFull ? entry.details : entry.details.slice(0, PREVIEW_CHARS)}
              {!isFull && needsTruncation
                ? `\n\n⬇️ ${t('journal.tapForMore')}`
                : ''}
            </Text>
          </View>
        )}
        {(entry.dateFrom || entry.dateTo) && (
          <View>
            {entry.dateFrom && (
              <Text>
                {t('journal.dateFrom')}: {new Date(entry.dateFrom).toLocaleDateString()}
              </Text>
            )}
            {entry.dateTo && (
              <Text>
                {t('journal.dateTo')}: {new Date(entry.dateTo).toLocaleDateString()}
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => onDelete(entry)}>
        <Text>
          {t('journal.deleteButton')}
        </Text>
      </TouchableOpacity>
    </View>
  );
});
