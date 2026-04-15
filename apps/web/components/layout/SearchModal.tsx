'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

type SearchTypeFilter = 'all' | 'question' | 'exam' | 'note';

function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function sectionTitle(type: string) {
  if (type === 'question') return 'Questions';
  if (type === 'exam') return 'Exams';
  if (type === 'note') return 'Notes';
  return type;
}

export function SearchModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<SearchTypeFilter>('all');
  const [activeIndex, setActiveIndex] = useState(0);
  const debounced = useDebounced(query, 300);

  const searchQuery = useQuery({
    queryKey: ['global-search', debounced, filter],
    queryFn: async () => {
      const typeParam = filter === 'all' ? '' : `&type=${filter}`;
      const res = await fetch(`/api/search?q=${encodeURIComponent(debounced)}${typeParam}&limit=10`);
      const data = await res.json();
      if (!data?.success) throw new Error(data?.error ?? 'Search failed');
      return data.data;
    },
    enabled: open && debounced.trim().length >= 2,
  });

  const grouped = searchQuery.data?.results ?? { questions: [], exams: [], notes: [] };
  const flat = useMemo(
    () => [...grouped.questions, ...grouped.exams, ...grouped.notes],
    [grouped]
  );

  useEffect(() => {
    if (open) {
      setActiveIndex(0);
    }
  }, [open, debounced, filter]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (!flat.length) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % flat.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + flat.length) % flat.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = flat[activeIndex];
        if (selected?.href) {
          onClose();
          router.push(selected.href);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, flat, activeIndex, onClose, router]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/45 backdrop-blur-[2px] flex items-start justify-center p-4 md:p-10" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="w-full max-w-3xl card glass p-4 md:p-5 shadow-2xl border border-[var(--line)]">
        <div className="flex items-center gap-2 mb-3">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions, exams, notes…"
            className="input flex-1"
          />
          <button className="btn-secondary text-sm" onClick={onClose}>Esc</button>
        </div>

        <div className="flex items-center gap-2 mb-3">
          {(['all', 'question', 'exam', 'note'] as SearchTypeFilter[]).map((f) => (
            <button
              key={f}
              className={`px-3 py-1.5 rounded-lg text-xs border ${filter === f
                ? 'bg-[var(--brand-soft)] border-[var(--brand)] text-[var(--brand)]'
                : 'border-[var(--line)] text-[var(--muted)] hover:text-[var(--text)]'}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : sectionTitle(f)}
            </button>
          ))}
        </div>

        {debounced.trim().length < 2 ? (
          <p className="text-sm text-[var(--muted)] px-1 py-6">Type at least 2 characters to search.</p>
        ) : searchQuery.isLoading ? (
          <p className="text-sm text-[var(--muted)] px-1 py-6">Searching…</p>
        ) : flat.length === 0 ? (
          <p className="text-sm text-[var(--muted)] px-1 py-6">No results found.</p>
        ) : (
          <div className="max-h-[58vh] overflow-y-auto pr-1 space-y-4">
            {([
              ['question', grouped.questions],
              ['exam', grouped.exams],
              ['note', grouped.notes],
            ] as const)
              .filter(([, items]) => items.length > 0)
              .map(([type, items]) => (
                <div key={type}>
                  <p className="text-[11px] uppercase tracking-wide text-[var(--muted)] mb-2">{sectionTitle(type)}</p>
                  <div className="space-y-1.5">
                    {items.map((item: any) => {
                      const globalIndex = flat.findIndex((x: any) => x.id === item.id && x.type === item.type);
                      const active = globalIndex === activeIndex;
                      return (
                        <button
                          key={`${item.type}-${item.id}`}
                          onClick={() => {
                            onClose();
                            router.push(item.href);
                          }}
                          className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors ${
                            active
                              ? 'border-[var(--brand)] bg-[var(--brand-soft)]'
                              : 'border-[var(--line)] hover:bg-[var(--brand-soft)]/50'
                          }`}
                        >
                          <p className="text-sm text-[var(--text)] line-clamp-1">{item.label}</p>
                          {item.subtitle && <p className="text-xs text-[var(--muted)] mt-0.5 line-clamp-1">{item.subtitle}</p>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

