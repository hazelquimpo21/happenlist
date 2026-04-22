/* Shared primitives used across all filter variations.
   Uses Happenlist design tokens from DESIGN-GUIDE.md. */

const HL = {
  blue: '#008bd2',
  blueLight: '#33a2db',
  orange: '#d95927',
  golden: '#e7b746',
  amber: '#d48700',
  teal: '#008e91',
  lime: '#ace671',
  emerald: '#009768',
  plum: '#7B2D8E',
  magenta: '#D94B7A',
  indigo: '#5B4FC4',
  vermillion: '#E85D45',
  fern: '#6BAD5A',
  rose: '#F43F5E',

  ink: '#020203',
  night: '#141416',
  slate: '#2A2A2E',
  zinc: '#71717A',
  silver: '#D1D1D6',
  mist: '#E4E4E7',
  cloud: '#F4F4F5',
  ice: '#e0f0f5',
  white: '#f5f4f0',
  pure: '#FFFFFF',
};

const CATEGORIES = [
  { name: 'Music',                color: HL.blue,       count: 87 },
  { name: 'Arts & Culture',       color: HL.teal,       count: 52 },
  { name: 'Family',               color: HL.golden,     count: 41 },
  { name: 'Food & Drink',         color: HL.orange,     count: 63 },
  { name: 'Sports & Fitness',     color: HL.vermillion, count: 34 },
  { name: 'Nightlife',            color: HL.plum,       count: 29 },
  { name: 'Community',            color: HL.magenta,    count: 46 },
  { name: 'Classes & Workshops',  color: HL.emerald,    count: 38 },
  { name: 'Festivals',            color: HL.amber,      count: 12 },
  { name: 'Theater & Film',       color: HL.indigo,     count: 27 },
  { name: 'Markets & Shopping',   color: HL.lime,       count: 19 },
  { name: 'Talks & Lectures',     color: HL.blue,       count: 22 },
  { name: 'Outdoors & Nature',    color: HL.fern,       count: 31 },
  { name: 'Charity & Fundraising', color: HL.magenta,   count: 8  },
  { name: 'Holiday & Seasonal',   color: HL.golden,     count: 6  },
];

const GOOD_FOR = [
  'Date night', 'Solo', 'With kids', 'After work',
  "Girls' night", 'Foodies', 'Rainy day', 'Occasion',
  'Game night', 'Meet people',
];

const TIMES = ['Morning', 'Afternoon', 'Evening', 'Late night'];
const BUDGETS = ['Free', 'Under $10', 'Under $25', '$25+'];

/* ── Mini icon system — kept dead simple, line style, Plus Jakarta weight ── */

const Icon = ({ path, size = 16, stroke = 'currentColor', fill = 'none', strokeWidth = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
       strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
       style={{ flexShrink: 0 }}>
    <path d={path} />
  </svg>
);

const IconSearch = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
       style={{ flexShrink: 0 }}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

const IconClose = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

const IconChevron = ({ size = 14, dir = 'down' }) => {
  const rot = { down: 0, up: 180, left: 90, right: -90 }[dir];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
         style={{ transform: `rotate(${rot}deg)`, transition: 'transform .15s' }}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
};

const IconSliders = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" x2="4" y1="21" y2="14" />
    <line x1="4" x2="4" y1="10" y2="3" />
    <line x1="12" x2="12" y1="21" y2="12" />
    <line x1="12" x2="12" y1="8" y2="3" />
    <line x1="20" x2="20" y1="21" y2="16" />
    <line x1="20" x2="20" y1="12" y2="3" />
    <line x1="2" x2="6" y1="14" y2="14" />
    <line x1="10" x2="14" y1="8" y2="8" />
    <line x1="18" x2="22" y1="16" y2="16" />
  </svg>
);

const IconSparkles = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
  </svg>
);

const IconClock = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconTag = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
    <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" />
  </svg>
);

const IconWallet = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2" />
    <path d="M22 11V9a2 2 0 0 0-2-2h-5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h5a2 2 0 0 0 2-2v-2" />
    <circle cx="16" cy="11" r="1" fill="currentColor" />
  </svg>
);

const IconMapPin = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const IconUsers = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconCheck = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const IconHappenlist = ({ size = 26 }) => (
  <svg width={size * 3.5} height={size} viewBox="0 0 120 32" fill="none">
    <text x="0" y="24" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="800"
          fontSize="24" letterSpacing="-0.02em">
      <tspan fill={HL.blue}>H</tspan>
      <tspan fill={HL.ink}>appenlist</tspan>
    </text>
  </svg>
);

/* ── Generic site shell — header + page header — reused by all 3 ── */

function SiteHeader({ compact = false }) {
  const navs = ['Events', 'Classes & Series', 'Today', 'This Weekend', 'Performers', 'Venues'];
  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: compact ? '10px 20px' : '14px 32px',
      background: HL.white, borderBottom: `1px solid ${HL.mist}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: compact ? 20 : 36 }}>
        <IconHappenlist size={compact ? 22 : 26} />
        {!compact && (
          <nav style={{ display: 'flex', gap: 24 }}>
            {navs.map((n, i) => (
              <a key={n} href="#" style={{
                fontSize: 14, color: i === 0 ? HL.ink : HL.zinc, fontWeight: i === 0 ? 600 : 500,
                textDecoration: 'none',
              }}>{n}</a>
            ))}
          </nav>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {!compact && (
          <button style={{
            background: 'transparent', border: `1px solid ${HL.mist}`,
            padding: '8px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: HL.ink,
          }}>
            + Submit Event
          </button>
        )}
        <div style={{
          width: 32, height: 32, borderRadius: 999, background: HL.emerald,
          color: HL.pure, display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 13,
        }}>H</div>
      </div>
    </header>
  );
}

function MobileHeader() {
  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 16px', background: HL.white, borderBottom: `1px solid ${HL.mist}`,
    }}>
      <IconHappenlist size={20} />
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ color: HL.ink }}><IconSearch size={20} /></div>
        <div style={{
          width: 28, height: 28, borderRadius: 999, background: HL.emerald,
          color: HL.pure, display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 12,
        }}>H</div>
      </div>
    </header>
  );
}

Object.assign(window, {
  HL, CATEGORIES, GOOD_FOR, TIMES, BUDGETS,
  Icon, IconSearch, IconClose, IconChevron, IconSliders, IconSparkles,
  IconClock, IconTag, IconWallet, IconMapPin, IconUsers, IconCheck, IconHappenlist,
  SiteHeader, MobileHeader,
});
