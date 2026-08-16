type IconProps = { className?: string };

export function IconDetect({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="5" width="16" height="14" rx="3" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 5V3.5M16 5V3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function IconBook({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v15.5H7.5A2.5 2.5 0 0 0 5 21"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path d="M5 5.5V21" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function IconWeather({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="3.2" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M8 17.5h8.5a3.2 3.2 0 1 0-.4-6.4A5 5 0 0 0 7.2 13"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconMap({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7.5 9.5 5l5 2.5L20 5v13.5L14.5 21l-5-2.5L4 21V7.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M9.5 5v13.5M14.5 7.5V21" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export function IconChat({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 16.5V7.8A2.8 2.8 0 0 1 7.8 5h8.4A2.8 2.8 0 0 1 19 7.8v5.4a2.8 2.8 0 0 1-2.8 2.8H9l-4 3.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconCommunity({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="9" cy="9" r="2.6" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="16" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M4.5 18.5c.8-2.6 2.8-4 5.2-4s4.3 1.4 5 3.6M14 14.5c1.6.2 3.1 1.1 3.8 3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconUserPlus({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="10" cy="9" r="3" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M4.5 18.5c.9-2.5 2.9-3.8 5.5-3.8 1.2 0 2.3.3 3.2.8M17 8v6M14 11h6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconBell({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6.5 16.5h11l-1.2-1.5V10a4.3 4.3 0 1 0-8.6 0v5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M10 18.2a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export function IconPin({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21s6-5.2 6-10.2A6 6 0 0 0 6 10.8C6 15.8 12 21 12 21Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="12" cy="10.5" r="2.2" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export function IconRice({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 20V8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path
        d="M12 9c-2.2-.8-4-2.6-4.5-5C11 4.4 12 6.4 12 9zM12 9c2.2-.8 4-2.6 4.5-5C13 4.4 12 6.4 12 9z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconOnion({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 20c3.2 0 5.5-2.4 5.5-5.8C17.5 10 14.5 7 12 4.5 9.5 7 6.5 10 6.5 14.2 6.5 17.6 8.8 20 12 20z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M12 4.5V3.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconLeaf({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 18c6-1 10-5 12-12-7 1-11 5-12 12Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M7.5 15.5c2.2-1.5 4.4-3.8 5.8-6.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconSprout({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 20V10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path
        d="M12 12c-3-1-5-3.5-5-6 3.5.2 5.5 2.2 6 5.5M12 14c3-.8 5-3 5-5.8-3 .4-4.8 2.4-5 5.3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconDisease({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 17c5-.8 8.5-4 10-10-5.5.8-9 4-10 10Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="15.5" cy="8.5" r="1.4" fill="currentColor" />
      <circle cx="12.2" cy="12" r="1.1" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

export function IconFlask({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M9 4h6M10 4v5.2L6.8 16.5A2.8 2.8 0 0 0 9.3 20.5h5.4a2.8 2.8 0 0 0 2.5-4L14 9.2V4" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M8.2 14.5h7.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconDrop({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3.5c3.8 4.2 6.5 7.4 6.5 10.4A6.5 6.5 0 0 1 5.5 13.9C5.5 10.9 8.2 7.7 12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconBug({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <ellipse cx="12" cy="13" rx="4.2" ry="5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10.2 8.2 8.5 5.8M13.8 8.2 15.5 5.8M7.2 12H4.8M19.2 12H16.8M7.5 16.2 5.5 18M16.5 16.2 18.5 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 10.5v5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function IconArticle({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="5" y="3.5" width="14" height="17" rx="2.2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8.5 8h7M8.5 12h7M8.5 16h4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function IconJournal({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6.5 4.5h9.5A2 2 0 0 1 18 6.5v13l-3-1.6-3 1.6-3-1.6-3 1.6v-13a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M9 9h6M9 12.5h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconDownload({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 4.5v10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="m8.5 11.5 3.5 3.5 3.5-3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 18.5h13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function IconCheck({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5.5 12.5 10 17l8.5-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconStarFilled({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="m12 3.6 2.2 4.5 5 .7-3.6 3.5.9 5-4.5-2.4L7.5 17.3l.9-5L4.8 8.8l5-.7L12 3.6Z" />
    </svg>
  );
}
