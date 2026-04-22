/* Home views for each variation + events-archive tweaks (slim mode).
   Each home:
   - Time-aware greeting, hero featured event, this-weekend sidebar
   - The variation's filter UI, at hero prominence
   - Category tile row, tonight/weekend horizontal scroll
   And a compact no-search archive bar for A and C.
*/

function HeroFeaturedCard({ big = false }) {
  return (
    <div style={{
      flex: 1, minHeight: big ? 360 : 280, borderRadius: 20,
      background: `linear-gradient(180deg, transparent 40%, rgba(2,2,3,0.88) 100%),
                   repeating-linear-gradient(45deg, ${HL.blue}55 0 20px, ${HL.blue}33 20px 40px)`,
      position: 'relative', padding: 24, display: 'flex', flexDirection: 'column',
      justifyContent: 'flex-end', color: HL.pure, overflow: 'hidden',
    }}>
      <span style={{
        position: 'absolute', top: 20, left: 20, padding: '4px 12px', background: HL.blue,
        color: HL.pure, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em',
        textTransform: 'uppercase', borderRadius: 999,
      }}>Music</span>
      <div style={{ fontSize: 12.5, fontWeight: 600, opacity: 0.9, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Tonight · 8pm</div>
      <div style={{ fontSize: big ? 40 : 28, fontWeight: 800, letterSpacing: '-0.02em', marginTop: 6, lineHeight: 1.1 }}>
        Jazz at the Pabst
      </div>
      <div style={{ fontSize: 14, opacity: 0.85, marginTop: 4 }}>Pabst Theater · Free · 340 going</div>
    </div>
  );
}

function QuickGlanceCard() {
  const items = [
    { dot: HL.amber, title: 'Summerfest Preview', when: 'Sat · 1pm' },
    { dot: HL.orange, title: 'Taco Fest MKE', when: 'Sat · 12pm' },
    { dot: HL.teal, title: 'Gallery Walk', when: 'Sat · 5pm' },
    { dot: HL.emerald, title: 'Open Mic Night', when: 'Sun · 7pm' },
  ];
  return (
    <div style={{
      flex: '0 0 300px', background: HL.night, borderRadius: 20, padding: 22,
      color: HL.pure, display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: HL.blueLight, letterSpacing: '0.08em', textTransform: 'uppercase' }}>This weekend</div>
      <div style={{ display: 'grid', gap: 12 }}>
        {items.map(it => (
          <div key={it.title} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: it.dot, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: HL.pure, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.title}</div>
              <div style={{ fontSize: 11.5, color: HL.silver }}>{it.when}</div>
            </div>
          </div>
        ))}
      </div>
      <a style={{
        marginTop: 'auto', fontSize: 13, fontWeight: 600, color: HL.blueLight,
        borderTop: `1px solid ${HL.slate}`, paddingTop: 14, textDecoration: 'none',
      }}>42 events this weekend →</a>
    </div>
  );
}

function CategoryStrip() {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12,
    }}>
      {CATEGORIES.slice(0, 6).map(c => (
        <a key={c.name} style={{
          background: c.color, borderRadius: 16, padding: '18px 16px',
          color: HL.pure, textDecoration: 'none', display: 'block',
          minHeight: 90,
        }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{c.name}</div>
          <div style={{ fontSize: 12, opacity: 0.85, marginTop: 3 }}>{c.count} events</div>
        </a>
      ))}
    </div>
  );
}

function TonightScroll() {
  const items = [
    { title: 'Indigo Quartet', venue: 'Jazz Gallery', when: 'Tonight · 9pm', cat: 'Music', color: HL.blue },
    { title: 'Comedy at Pabst', venue: 'Pabst Theater', when: 'Tonight · 8pm', cat: 'Theater & Film', color: HL.indigo },
    { title: 'Rooftop Sessions', venue: 'Third Ward', when: 'Tonight · 7pm', cat: 'Nightlife', color: HL.plum },
    { title: 'Film Fest Night 3', venue: 'Oriental', when: 'Tonight · 7:30', cat: 'Theater & Film', color: HL.indigo },
  ];
  return (
    <div style={{ background: HL.ink, padding: '36px 32px', color: HL.pure }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>Tonight in Milwaukee</h2>
          <a style={{ fontSize: 13, fontWeight: 600, color: HL.blueLight, textDecoration: 'none' }}>See all →</a>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {items.map(it => (
            <div key={it.title} style={{
              background: HL.night, borderRadius: 14, overflow: 'hidden',
              border: `1px solid ${HL.slate}`,
            }}>
              <div style={{ height: 110, background: `repeating-linear-gradient(45deg, ${it.color}55 0 10px, ${it.color}33 10px 20px)`, padding: 10 }}>
                <span style={{ padding: '3px 9px', background: it.color, color: HL.pure,
                  fontSize: 9.5, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', borderRadius: 999 }}>{it.cat}</span>
              </div>
              <div style={{ padding: 12 }}>
                <div style={{ fontSize: 11, color: HL.silver }}>{it.when}</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginTop: 3 }}>{it.title}</div>
                <div style={{ fontSize: 12, color: HL.silver, marginTop: 2 }}>{it.venue}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   A · HOME — hero with featured event + quick-glance + chips.
   Filter UI matches A's style: quick-picks → Filters button → sheet
   ───────────────────────────────────────────────────────────────── */

function VarA_Home() {
  return (
    <div style={{ background: HL.white, minHeight: 760, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <SiteHeader />

      {/* Dark hero */}
      <div style={{ background: HL.ink, color: HL.pure, padding: '40px 32px 48px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: HL.blueLight, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Thursday · April 22
          </div>
          <h1 style={{ fontSize: 56, fontWeight: 800, letterSpacing: '-0.03em', margin: '8px 0 0', lineHeight: 1 }}>
            Good evening, Milwaukee.
          </h1>

          <div style={{ display: 'flex', gap: 20, marginTop: 28 }}>
            <HeroFeaturedCard big />
            <QuickGlanceCard />
          </div>

          {/* Filter zone — quick picks + search + filters button */}
          <div style={{
            marginTop: 24, padding: 12, background: HL.night, borderRadius: 16,
            display: 'flex', alignItems: 'center', gap: 10, border: `1px solid ${HL.slate}`,
          }}>
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 16px', background: HL.slate, borderRadius: 12, color: HL.pure,
            }}>
              <div style={{ color: HL.silver }}><IconSearch size={16} /></div>
              <input placeholder="Search events, venues, performers…" style={{
                flex: 1, background: 'transparent', border: 0, outline: 'none',
                color: HL.pure, fontSize: 14, fontFamily: 'inherit',
              }} />
            </div>
            <button style={{
              padding: '12px 18px', background: HL.blue, color: HL.pure,
              border: 0, borderRadius: 12, fontSize: 13, fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <IconSliders size={14} /> Filters
            </button>
          </div>
          <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { t: 'Tonight', icon: <IconClock size={12} /> },
              { t: 'This weekend' }, { t: 'Free', accent: HL.emerald },
              { t: 'Music', accent: HL.blue }, { t: 'Food & Drink', accent: HL.orange },
              { t: 'With kids' }, { t: 'Date night' }, { t: 'Outdoors', accent: HL.fern },
            ].map(p => (
              <span key={p.t} style={{
                padding: '7px 13px', background: 'transparent', color: HL.pure,
                border: `1px solid ${HL.slate}`, borderRadius: 999,
                fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
                {p.accent && <span style={{ width: 6, height: 6, borderRadius: 999, background: p.accent }} />}
                {p.icon}{p.t}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 32px' }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: HL.ink, margin: '0 0 16px' }}>Browse by category</h2>
        <CategoryStrip />
      </div>
      <TonightScroll />
    </div>
  );
}

function VarA_Home_Mobile() {
  return (
    <div style={{ background: HL.white, minHeight: 760, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <MobileHeader />
      <div style={{ background: HL.ink, color: HL.pure, padding: '20px 16px 28px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: HL.blueLight, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Thursday · April 22</div>
        <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em', margin: '6px 0 0', lineHeight: 1.05 }}>
          Good evening,<br/>Milwaukee.
        </h1>
        <div style={{ marginTop: 16, padding: 6, background: HL.night, borderRadius: 14, border: `1px solid ${HL.slate}`, display: 'flex', gap: 6 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: HL.slate, borderRadius: 10 }}>
            <div style={{ color: HL.silver }}><IconSearch size={15} /></div>
            <span style={{ fontSize: 13.5, color: HL.silver }}>Search…</span>
          </div>
          <button style={{ padding: '10px 12px', background: HL.blue, color: HL.pure, border: 0, borderRadius: 10, fontWeight: 700, fontSize: 13, fontFamily: 'inherit' }}>
            <IconSliders size={14} />
          </button>
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['Tonight', 'Weekend', 'Free', 'Music', 'Kids'].map(t => (
            <span key={t} style={{ padding: '5px 11px', border: `1px solid ${HL.slate}`, borderRadius: 999, fontSize: 12.5, fontWeight: 600 }}>{t}</span>
          ))}
        </div>
      </div>
      <div style={{ padding: '18px 16px' }}>
        <div style={{ marginBottom: 16 }}><HeroFeaturedCard /></div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: HL.ink, margin: '8px 0 12px' }}>Categories</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {CATEGORIES.slice(0, 6).map(c => (
            <a key={c.name} style={{ background: c.color, color: HL.pure, padding: '14px 14px', borderRadius: 14, textDecoration: 'none' }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{c.name}</div>
              <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>{c.count} events</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   B · HOME — segmented picker fits naturally as hero search
   ───────────────────────────────────────────────────────────────── */

function VarB_Home() {
  const [openSeg, setOpenSeg] = React.useState(null);
  const segments = [
    { key: 'category', icon: <IconTag />, label: 'Category', display: 'Any category' },
    { key: 'when', icon: <IconClock />, label: 'When', display: 'Tonight', accent: HL.blue },
    { key: 'goodFor', icon: <IconSparkles />, label: 'Good for', display: 'Anything' },
    { key: 'budget', icon: <IconWallet />, label: 'Budget', display: 'Any price' },
  ];

  return (
    <div style={{ background: HL.white, minHeight: 760, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <SiteHeader />
      <div style={{ background: HL.ice, padding: '48px 32px 40px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: HL.teal, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Happening in Milwaukee
          </div>
          <h1 style={{ fontSize: 56, fontWeight: 800, letterSpacing: '-0.03em', color: HL.ink, margin: '10px 0 0', lineHeight: 1 }}>
            What are you in the mood for?
          </h1>
          <p style={{ fontSize: 16, color: HL.zinc, maxWidth: 520, margin: '14px auto 0' }}>
            557 events on right now. Pick a mood — we'll do the rest.
          </p>

          {/* Segmented pill, centered */}
          <div style={{
            marginTop: 30, display: 'inline-flex', alignItems: 'stretch',
            background: HL.pure, borderRadius: 999,
            boxShadow: '0 10px 40px rgba(2,2,3,0.10)',
            border: `1px solid ${HL.mist}`, padding: 6,
          }}>
            {segments.map((s, i) => (
              <React.Fragment key={s.key}>
                {i > 0 && <div style={{ width: 1, background: HL.mist, margin: '10px 0' }} />}
                <button style={{
                  padding: '10px 22px', background: 'transparent', border: 0, cursor: 'pointer',
                  fontFamily: 'inherit', textAlign: 'left', borderRadius: 999,
                }}>
                  <div style={{
                    fontSize: 11, fontWeight: 700, color: HL.zinc,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}>
                    <span style={{ color: s.accent || HL.zinc }}>{s.icon}</span>{s.label}
                  </div>
                  <div style={{
                    fontSize: 14, fontWeight: s.display.startsWith('Any') || s.display === 'Anything' ? 500 : 700,
                    color: s.display.startsWith('Any') || s.display === 'Anything' ? HL.zinc : HL.ink,
                    marginTop: 2,
                  }}>{s.display}</div>
                </button>
              </React.Fragment>
            ))}
            <button style={{
              marginLeft: 6, padding: '0 24px', background: HL.blue, color: HL.pure,
              border: 0, borderRadius: 999, fontSize: 14, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <IconSearch size={15} /> Find events
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
          <HeroFeaturedCard big />
          <QuickGlanceCard />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: HL.ink, margin: '36px 0 16px' }}>Browse by category</h2>
        <CategoryStrip />
      </div>
      <TonightScroll />
    </div>
  );
}

function VarB_Home_Mobile() {
  return (
    <div style={{ background: HL.white, minHeight: 760, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <MobileHeader />
      <div style={{ background: HL.ice, padding: '24px 16px 24px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: HL.teal, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Happening in Milwaukee
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', color: HL.ink, margin: '6px 0 0', lineHeight: 1.05 }}>
          What are you in the<br/>mood for?
        </h1>

        <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <MobileSegment label="Category" icon={<IconTag size={14} />} value="Any" />
          <MobileSegment label="When" icon={<IconClock size={14} />} value="Tonight" accent={HL.blue} />
          <MobileSegment label="Good for" icon={<IconSparkles size={14} />} value="Anything" />
          <MobileSegment label="Budget" icon={<IconWallet size={14} />} value="Any" />
        </div>
        <button style={{
          marginTop: 10, width: '100%', padding: '13px', background: HL.blue, color: HL.pure,
          border: 0, borderRadius: 999, fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
        }}>Find 557 events</button>
      </div>

      <div style={{ padding: '16px' }}>
        <HeroFeaturedCard />
        <h2 style={{ fontSize: 18, fontWeight: 800, color: HL.ink, margin: '20px 0 12px' }}>Categories</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {CATEGORIES.slice(0, 6).map(c => (
            <a key={c.name} style={{ background: c.color, color: HL.pure, padding: '14px 14px', borderRadius: 14, textDecoration: 'none' }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{c.name}</div>
              <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>{c.count} events</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   C · HOME — the command bar already IS a home-style search.
   Adds featured event row, categories under the search.
   ───────────────────────────────────────────────────────────────── */

function VarC_Home() {
  return (
    <div style={{ background: HL.white, minHeight: 760, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <SiteHeader />
      <div style={{ background: HL.ice, padding: '50px 32px 36px' }}>
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: HL.teal, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
            Thursday · April 22
          </div>
          <h1 style={{ fontSize: 48, fontWeight: 800, letterSpacing: '-0.02em', color: HL.ink, margin: 0, lineHeight: 1.03 }}>
            Good evening, Milwaukee.<br/>
            <span style={{ color: HL.zinc, fontWeight: 700 }}>557 things are happening.</span>
          </h1>
          <div style={{
            marginTop: 26, background: HL.pure, borderRadius: 20,
            boxShadow: '0 8px 28px rgba(2,2,3,0.08)', padding: 10,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px' }}>
              <div style={{ color: HL.zinc }}><IconSearch size={20} /></div>
              <input placeholder="Try 'jazz saturday' or 'free kids things'" style={{
                border: 0, background: 'transparent', fontSize: 16, flex: 1,
                outline: 'none', fontFamily: 'inherit', color: HL.ink, padding: '16px 0',
              }} />
            </div>
            <button style={{
              padding: '14px', background: HL.cloud, border: 0, borderRadius: 14,
              cursor: 'pointer', color: HL.ink,
            }}><IconSliders size={18} /></button>
            <button style={{
              padding: '14px 22px', background: HL.ink, color: HL.pure,
              border: 0, borderRadius: 14, fontSize: 15, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>Search</button>
          </div>

          <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: HL.zinc, marginRight: 4 }}>Try:</span>
            {[
              { text: 'Tonight', icon: <IconClock size={12} /> },
              { text: 'This weekend' }, { text: 'Free', accent: HL.emerald },
              { text: 'Music', accent: HL.blue }, { text: 'With kids' },
              { text: 'Date night' }, { text: 'Food & Drink', accent: HL.orange }, { text: 'Outdoors', accent: HL.fern },
            ].map(s => (
              <span key={s.text} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '6px 12px', background: HL.pure, border: `1px solid ${HL.mist}`,
                borderRadius: 999, fontSize: 13, fontWeight: 600, color: s.accent || HL.ink,
              }}>
                {s.accent && <span style={{ width: 6, height: 6, borderRadius: 999, background: s.accent }} />}
                {s.icon}{s.text}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
          <HeroFeaturedCard big />
          <QuickGlanceCard />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: HL.ink, margin: '36px 0 16px' }}>Browse by category</h2>
        <CategoryStrip />
      </div>
      <TonightScroll />
    </div>
  );
}

function VarC_Home_Mobile() {
  return (
    <div style={{ background: HL.white, minHeight: 760, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <MobileHeader />
      <div style={{ background: HL.ice, padding: '22px 16px 24px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: HL.teal, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Thursday · April 22
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', color: HL.ink, margin: '6px 0 0', lineHeight: 1.05 }}>
          Good evening,<br/>Milwaukee.
        </h1>
        <div style={{ marginTop: 16, background: HL.pure, borderRadius: 16,
          boxShadow: '0 6px 20px rgba(2,2,3,0.08)', padding: 6,
          display: 'flex', gap: 4, alignItems: 'center' }}>
          <div style={{ flex: 1, display: 'flex', gap: 8, padding: '10px 12px', alignItems: 'center' }}>
            <div style={{ color: HL.zinc }}><IconSearch size={16} /></div>
            <span style={{ fontSize: 14, color: HL.zinc }}>Try 'jazz saturday'</span>
          </div>
          <button style={{ padding: '11px 16px', background: HL.ink, color: HL.pure, border: 0, borderRadius: 12, fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}>Go</button>
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { t: 'Tonight', icon: <IconClock size={11} /> },
            { t: 'Free', accent: HL.emerald }, { t: 'Music', accent: HL.blue },
            { t: 'Kids' }, { t: 'Weekend' },
          ].map(s => (
            <span key={s.t} style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '5px 10px', background: HL.pure, border: `1px solid ${HL.mist}`,
              borderRadius: 999, fontSize: 12, fontWeight: 600, color: s.accent || HL.ink,
            }}>
              {s.accent && <span style={{ width: 5, height: 5, borderRadius: 999, background: s.accent }} />}
              {s.icon}{s.t}
            </span>
          ))}
        </div>
      </div>
      <div style={{ padding: '16px' }}>
        <HeroFeaturedCard />
        <h2 style={{ fontSize: 18, fontWeight: 800, color: HL.ink, margin: '20px 0 12px' }}>Categories</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {CATEGORIES.slice(0, 6).map(c => (
            <a key={c.name} style={{ background: c.color, color: HL.pure, padding: '14px 14px', borderRadius: 14, textDecoration: 'none' }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{c.name}</div>
              <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>{c.count} events</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Slim archive variants — A and C lose the big search bar
   since search is now at home. B stays the same (segments work).
   ───────────────────────────────────────────────────────────────── */

function VarA_Archive_Slim() {
  const [active, setActive] = React.useState({
    categories: ['Music', 'Food & Drink'],
    goodFor: ['Date night'],
    budget: 'Free',
  });
  const activeCount = active.categories.length + active.goodFor.length + (active.budget ? 1 : 0);
  const catColor = (name) => CATEGORIES.find(c => c.name === name)?.color || HL.blue;

  return (
    <div style={{ background: HL.white, minHeight: 760, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <SiteHeader />
      {/* Slim bar — no full search, just refine */}
      <div style={{ position: 'sticky', top: 0, background: HL.pure, borderBottom: `1px solid ${HL.mist}` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 13, color: HL.zinc, fontWeight: 600 }}>Filter:</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <QuickPick icon={<IconClock size={13} />} label="Tonight" />
            <QuickPick label="Weekend" />
            <QuickPick label="Free" accent={HL.emerald} />
            <QuickPick label="With kids" />
          </div>
          <div style={{ width: 1, height: 24, background: HL.mist, margin: '0 4px' }} />
          <div style={{ display: 'flex', gap: 6, flex: 1, flexWrap: 'wrap' }}>
            {active.categories.map(c => (
              <Token key={c} label={c} color={catColor(c)} onRemove={() => setActive(a => ({ ...a, categories: a.categories.filter(x => x !== c) }))} />
            ))}
            {active.goodFor.map(g => (
              <Token key={g} label={g} onRemove={() => setActive(a => ({ ...a, goodFor: a.goodFor.filter(x => x !== g) }))} />
            ))}
            {active.budget && <Token label={active.budget} color={HL.emerald} onRemove={() => setActive(a => ({ ...a, budget: null }))} />}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ color: HL.zinc }}><IconSearch size={15} /></div>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px',
              background: HL.ink, color: HL.pure, border: 0, borderRadius: 999,
              fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <IconSliders size={15} /> Filters
              <span style={{ background: HL.blue, color: HL.pure, fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 999 }}>{activeCount}</span>
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px' }}>
        <div style={{ fontSize: 13, color: HL.zinc, marginBottom: 6 }}>Home · Events</div>
        <h1 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.02em', color: HL.ink, margin: 0 }}>All Events</h1>
        <div style={{ marginTop: 6, color: HL.zinc, fontSize: 15 }}>
          <b style={{ color: HL.ink }}>89</b> events match
        </div>
        <ResultsPreview />
      </div>
    </div>
  );
}

function VarC_Archive_Slim() {
  return (
    <div style={{ background: HL.white, minHeight: 760, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <SiteHeader />
      {/* Compact applied-summary row only */}
      <div style={{ background: HL.pure, borderBottom: `1px solid ${HL.mist}`, padding: '14px 32px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: HL.zinc, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Active:</span>
          <span style={{ padding: '5px 11px', background: `${HL.blue}1f`, color: HL.blue, borderRadius: 999, fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, background: HL.blue, borderRadius: 999 }} />
            Music <IconClose size={11} />
          </span>
          <span style={{ padding: '5px 11px', background: HL.cloud, color: HL.ink, borderRadius: 999, fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>Date night <IconClose size={11} /></span>
          <span style={{ flex: 1 }} />
          <button style={{
            padding: '8px 14px', background: HL.pure, border: `1px solid ${HL.mist}`, borderRadius: 999,
            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            display: 'inline-flex', alignItems: 'center', gap: 6, color: HL.ink,
          }}>
            <IconSliders size={14} /> Refine <span style={{ color: HL.orange }}>(2)</span>
          </button>
          <span style={{ fontSize: 13, fontWeight: 700, color: HL.ink }}>89 matches</span>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px' }}>
        <div style={{ fontSize: 13, color: HL.zinc, marginBottom: 6 }}>Home · Events</div>
        <h1 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.02em', color: HL.ink, margin: 0 }}>Music · Date night</h1>
        <div style={{ marginTop: 6, color: HL.zinc, fontSize: 15 }}>89 events match your refinements</div>
        <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {[
            { title: 'Jazz at the Pabst', venue: 'Pabst Theater', when: 'Tonight · 8pm', cat: 'Music', color: HL.blue, price: 'Free' },
            { title: 'Indigo Quartet', venue: 'Jazz Gallery', when: 'Sat · 7pm', cat: 'Music', color: HL.blue, price: '$12' },
            { title: 'Wine & Wax', venue: 'Bay View', when: 'Sun · 6pm', cat: 'Nightlife', color: HL.plum, price: '$20' },
          ].map((r, i) => (
            <div key={i} style={{ background: HL.pure, border: `1px solid ${HL.mist}`, borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ height: 140, background: `repeating-linear-gradient(45deg, ${r.color}22 0 10px, ${r.color}11 10px 20px)`, padding: 12 }}>
                <span style={{ padding: '4px 10px', background: r.color, color: HL.pure, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', borderRadius: 999 }}>{r.cat}</span>
              </div>
              <div style={{ padding: 14 }}>
                <div style={{ fontSize: 12, color: HL.zinc }}>{r.when}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: HL.ink, marginTop: 3 }}>{r.title}</div>
                <div style={{ fontSize: 13, color: HL.zinc, marginTop: 2 }}>{r.venue}</div>
                <div style={{ marginTop: 8, fontSize: 13, fontWeight: 600, color: r.price === 'Free' ? HL.emerald : HL.ink }}>{r.price}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  VarA_Home, VarA_Home_Mobile, VarA_Archive_Slim,
  VarB_Home, VarB_Home_Mobile,
  VarC_Home, VarC_Home_Mobile, VarC_Archive_Slim,
  HeroFeaturedCard, CategoryStrip,
});
