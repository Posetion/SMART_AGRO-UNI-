import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Lang } from '../context/LanguageContext';
import { formatRegionLabel, formatTownshipLabel } from '../utils/localizeFarm';
import { IconPin } from './icons';
import { api } from '../services/api';

export type TownshipOption = {
  id?: string | number;
  name: string;
  nameEn: string;
  nameMy?: string;
  region: string;
  lat?: number;
  lng?: number;
  coordinates?: { coordinates?: [number, number] };
  source?: 'local' | 'geocode';
};

type Tone = 'mint' | 'sky' | 'coral' | 'amber' | 'peach' | 'teal';

type Props = {
  currentName: string;
  currentRegion?: string;
  currentNameMy?: string;
  lang?: Lang;
  disabled?: boolean;
  onSelect: (tw: TownshipOption) => void;
  onUseDeviceLocation?: () => void;
  locating?: boolean;
  useLocationLabel?: string;
  locatingLabel?: string;
  townshipLabel?: string;
  searchPlaceholder?: string;
  listLabel?: string;
  closeLabel?: string;
  emptyLabel?: string;
  className?: string;
};

function SoftIcon({ tone, children, className = '' }: { tone: Tone; children: ReactNode; className?: string }) {
  return <span className={`wx-ico ${tone} ${className}`}>{children}</span>;
}

function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M16.2 16.2 20 20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function placeCoords(tw: TownshipOption): { lat: number; lng: number } | null {
  if (typeof tw.lat === 'number' && typeof tw.lng === 'number') {
    return { lat: tw.lat, lng: tw.lng };
  }
  const c = tw.coordinates?.coordinates;
  if (c && c.length >= 2) return { lat: c[1], lng: c[0] };
  return null;
}

/** Shared Myanmar township search + select (Weather / Profile / Detect). */
export function TownshipLocationPicker({
  currentName,
  currentRegion,
  currentNameMy,
  lang = 'en',
  disabled,
  onSelect,
  onUseDeviceLocation,
  locating,
  useLocationLabel = 'Use my location',
  locatingLabel = 'Locating…',
  townshipLabel = 'Township',
  searchPlaceholder = 'Search Myanmar townships...',
  listLabel = 'List',
  closeLabel = 'Close',
  emptyLabel = 'No place found. Try another spelling.',
  className = '',
}: Props) {
  const [query, setQuery] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [allTownships, setAllTownships] = useState<TownshipOption[]>([]);
  const [searchResults, setSearchResults] = useState<TownshipOption[]>([]);
  const pickerRef = useRef<HTMLDivElement>(null);
  const searchTimer = useRef<number | null>(null);

  async function fetchTownships(search?: string) {
    return api<TownshipOption[]>(
      `/weather/townships${search ? `?search=${encodeURIComponent(search)}` : ''}`
    );
  }

  useEffect(() => {
    void fetchTownships()
      .then((list) => {
        setAllTownships(list || []);
        setSearchResults(list || []);
      })
      .catch(() => {
        setAllTownships([]);
        setSearchResults([]);
      });
  }, []);

  useEffect(() => {
    if (!pickerOpen) return;
    if (searchTimer.current) window.clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(() => {
      const q = query.trim();
      if (!q) {
        setSearchResults(allTownships);
        return;
      }
      void fetchTownships(q)
        .then((list) => setSearchResults(list || []))
        .catch(() => {
          const lower = q.toLowerCase();
          setSearchResults(
            allTownships.filter(
              (tw) =>
                tw.nameEn?.toLowerCase().includes(lower) ||
                tw.name?.toLowerCase().includes(lower) ||
                tw.nameMy?.includes(q) ||
                tw.region?.toLowerCase().includes(lower)
            )
          );
        });
    }, 220);
    return () => {
      if (searchTimer.current) window.clearTimeout(searchTimer.current);
    };
  }, [query, pickerOpen, allTownships]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!pickerRef.current?.contains(e.target as Node)) setPickerOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const selectOptions = useMemo(() => {
    if (!currentName) return allTownships;
    const exists = allTownships.some(
      (tw) => (tw.nameEn || tw.name).toLowerCase() === currentName.toLowerCase()
    );
    if (exists) return allTownships;
    return [
      {
        name: currentName,
        nameEn: currentName,
        nameMy: currentNameMy,
        region: currentRegion || 'Myanmar',
      },
      ...allTownships,
    ];
  }, [allTownships, currentName, currentNameMy, currentRegion]);

  function choose(tw: TownshipOption | string) {
    setPickerOpen(false);
    setQuery('');
    if (typeof tw === 'string') {
      onSelect({ name: tw, nameEn: tw, region: currentRegion || 'Myanmar' });
      return;
    }
    onSelect(tw);
  }

  function labelFor(tw: TownshipOption) {
    return formatTownshipLabel(tw.nameEn || tw.name, tw.nameMy, lang);
  }

  return (
    <div className={`wx-township-picker pf-loc-picker ${className}`} ref={pickerRef}>
      <label className="wx-select-wrap">
        <span>{townshipLabel}</span>
        <select
          value={currentName}
          disabled={disabled || selectOptions.length === 0}
          aria-label={townshipLabel}
          onChange={(e) => {
            const value = e.target.value;
            const match = selectOptions.find((tw) => (tw.nameEn || tw.name) === value);
            if (match) choose(match);
            else if (value) choose(value);
          }}
        >
          {selectOptions.map((tw) => {
            const value = tw.nameEn || tw.name;
            return (
              <option key={`${value}-${tw.region}`} value={value}>
                {labelFor(tw)} — {formatRegionLabel(tw.region, lang)}
              </option>
            );
          })}
        </select>
      </label>

      <div className={`wx-search ${pickerOpen ? 'is-open' : ''}`}>
        <SoftIcon tone="teal">
          <IconSearch />
        </SoftIcon>
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPickerOpen(true);
          }}
          onFocus={() => setPickerOpen(true)}
          placeholder={searchPlaceholder}
          aria-expanded={pickerOpen}
          autoComplete="off"
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setPickerOpen(false);
            if (e.key === 'Enter') {
              e.preventDefault();
              const first = searchResults[0];
              if (first) choose(first);
              else if (query.trim()) choose(query.trim());
            }
          }}
        />
        <button
          type="button"
          className="button compact"
          disabled={disabled}
          onClick={() => setPickerOpen((v) => !v)}
        >
          {pickerOpen ? closeLabel : listLabel}
        </button>
      </div>

      {onUseDeviceLocation && (
        <button
          type="button"
          className="button secondary compact pf-geo-btn"
          disabled={disabled || locating}
          onClick={onUseDeviceLocation}
        >
          {locating ? locatingLabel : useLocationLabel}
        </button>
      )}

      {pickerOpen && (
        <ul className="wx-township-menu" role="listbox">
          {searchResults.length === 0 && (
            <li className="wx-township-empty">{emptyLabel}</li>
          )}
          {searchResults.map((tw) => {
            const value = tw.nameEn || tw.name;
            const active = value.toLowerCase() === currentName.toLowerCase();
            return (
              <li key={`${value}-${tw.region}-${tw.lat ?? ''}`}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={active ? 'is-active' : undefined}
                  onClick={() => choose(tw)}
                >
                  <SoftIcon tone={active ? 'mint' : tw.source === 'geocode' ? 'teal' : 'sky'} className="sm">
                    <IconPin />
                  </SoftIcon>
                  <span>
                    <strong>{labelFor(tw)}</strong>
                    <small>
                      {formatRegionLabel(tw.region || 'Myanmar', lang)}
                      {tw.source === 'geocode' ? (lang === 'my' ? ' · တစ်နိုင်ငံလုံး' : ' · nationwide') : ''}
                    </small>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
