/* B refinements: tabbed "Popular / New / This weekend" section
   replacing the dotted-list sidebar. Plus 2 new B variations:
   - B2: compact top-bar segmented picker (not centered hero)
   - B3: segmented picker with category-first visual treatment
*/

function TabbedDiscovery() {
  const [tab, setTab] = React.useState('popular');
  const data = {
    popular: [
      { title: 'Jazz at the Pabst', venue: 'Pabst Theater', when: 'Tonight · 8pm', cat: 'Music', color: HL.blue, meta: '340 going' },
      { title: 'Summerfest Preview', venue: 'Henry Maier Park', when: 'Sat · 1pm', cat: 'Festivals', color: HL.amber, meta: '1.2k interested' },
      { title: 'Taco Fest MKE', venue: 'Lakefront', when: 'Sat · 12pm', cat: 'Food & Drink', color: HL.orange, meta: '620 going' },
      { title: 'Indigo Quartet', venue: 'Jazz Gallery', when: 'Sun · 7pm', cat: 'Music', color: HL.blue, meta: '89 going' },
    ],
    new: [
      { title: 'Rooftop Sessions', venue: 'Third Ward', when: 'Fri · 7pm', cat: 'Nightlife', color: HL.plum, meta: 'Added 2h ago' },
      { title: 'Film Fest Night 3', venue: 'Oriental', when: 'Sat · 7:30', cat: 'Theater & Film', color: HL.indigo, meta: 'Added today' },
      { title: 'Pottery Pop-Up', venue: 'Bay View', when: 'Sun · 2pm', cat: 'Classes & Workshops', color: HL.emerald, meta: 'Added today' },
      { title: 'Comedy at Pabst', venue: 'Pabst Theater', when: 'Sat · 8pm', cat: 'Theater & Film', color: HL.indigo, meta: 'Added yesterday' },
    ],
    weekend: [
      { title: 'Gallery Walk', venue: 'Third Ward', when: 'Sat · 5pm', cat: 'Arts & Culture', color: HL.teal, meta: 'Free' },
      { title: 'Summer Sips', venue: 'Third Ward', when: 'Sat · 5pm', cat: 'Food & Drink', color: HL.orange, meta: '$15' },
      { title: 'Open Mic Night', venue: 'Cactus Club', when: 'Sun · 7pm', cat: 'Music', color: HL.blue, meta: 'Free' },
      { title: 'Lakefront Run', venue: 'Lakefront', when: 'Sat · 8am', cat: 'Sports & Fitness', color: HL.vermillion, meta: 'Free' },
    ],
  };
  const tabs = [
    { k: 'popular', l: 'Popular' },
    { k: 'new', l: 'New' },
    { k: 'weekend', l: 'This weekend' },
  ];

  return (
    <div style={{
      flex: '0 0 360px', background: HL.pure, borderRadius: 20, padding: 20,
      border: `1px solid ${HL.mist}`, display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        display: 'flex', gap: 4, padding: 4, background: HL.cloud, borderRadius: 999,
        marginBottom: 16,
      }}>
        {tabs.map(t => (
          <button key={t.k} onClick={() => setTab(t.k)} style={{
            flex: 1, padding: '7px 8px', border: 0, borderRadius: 999,
            background: tab === t.k ? HL.pure : 'transparent',
            color: tab === t.k ? HL.ink : HL.zinc,
            fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: tab === t.k ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
          }}>{t.l}</button>
        ))}
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        {data[tab].map((it, i) => (
          <div key={it.title} style={{
            display: 'flex', gap: 10, padding: '8px 4px',
            borderBottom: i < 3 ? `1px solid ${HL.mist}` : 0,
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 10, flexShrink: 0,
              background: `repeating-linear-gradient(45deg, ${it.color}44 0 8px, ${it.color}22 8px 16px)`,
              position: 'relative',
            }}>
              <span style={{
                position: 'absolute', top: 4, left: 4, width: 18, height: 18, borderRadius: 5,
                background: it.color, display: 'grid', placeItems: 'center',
              }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: it.color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{it.cat}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: HL.ink, marginTop: 1,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.title}</div>
              <div style={{ fontSize: 11.5, color: HL.zinc, marginTop: 1 }}>{it.when} · {it.meta}</div>
            </div>
          </div>
        ))}
      </div>
      <a style={{ marginTop: 14, fontSize: 13, fontWeight: 600, color: HL.blue, textDecoration: 'none' }}>
        See all →
      </a>
    </div>
  );
}

/* ── B1 refined — centered hero + tabbed discovery (replaces dotted list) ── */

function VarB_Home_v2() {
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
          <div style={{
            marginTop: 30, display: 'inline-flex', alignItems: 'stretch',
            background: HL.pure, borderRadius: 999, boxShadow: '0 10px 40px rgba(2,2,3,0.10)',
            border: `1px solid ${HL.mist}`, padding: 6,
          }}>
            {segments.map((s, i) => (
              <React.Fragment key={s.key}>
                {i > 0 && <div style={{ width: 1, background: HL.mist, margin: '10px 0' }} />}
                <button style={{ padding: '10px 22px', background: 'transparent', border: 0, cursor: 'pointer',
                  fontFamily: 'inherit', textAlign: 'left', borderRadius: 999 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: HL.zinc,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ color: s.accent || HL.zinc }}>{s.icon}</span>{s.label}
                  </div>
                  <div style={{ fontSize: 14,
                    fontWeight: s.display.startsWith('Any') || s.display === 'Anything' ? 500 : 700,
                    color: s.display.startsWith('Any') || s.display === 'Anything' ? HL.zinc : HL.ink,
                    marginTop: 2 }}>{s.display}</div>
                </button>
              </React.Fragment>
            ))}
            <button style={{ marginLeft: 6, padding: '0 24px', background: HL.blue, color: HL.pure,
              border: 0, borderRadius: 999, fontSize: 14, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconSearch size={15} /> Find events
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 32px' }}>
        <div style={{ display: 'flex', gap: 20 }}>
          <HeroFeaturedCard big />
          <TabbedDiscovery />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: HL.ink, margin: '36px 0 16px' }}>Browse by category</h2>
        <CategoryStrip />
      </div>
    </div>
  );
}

/* ── B2: compact top-bar — search-first layout, segments as a bar ── */

function VarB_Home_v3() {
  const segments = [
    { key: 'category', label: 'Category', display: 'Any' },
    { key: 'when', label: 'When', display: 'Tonight', accent: HL.blue },
    { key: 'goodFor', label: 'Good for', display: 'Anything' },
    { key: 'budget', label: 'Budget', display: 'Any' },
  ];
  return (
    <div style={{ background: HL.white, minHeight: 760, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <SiteHeader />

      {/* Split hero: editorial image + segmented bar sitting ON TOP of the image */}
      <div style={{ position: 'relative', height: 440, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(180deg, rgba(2,2,3,0.1) 0%, rgba(2,2,3,0.85) 100%),
                       repeating-linear-gradient(45deg, ${HL.plum}cc 0 40px, ${HL.magenta}aa 40px 80px)`,
        }} />
        <div style={{ position: 'relative', maxWidth: 1280, margin: '0 auto', padding: '60px 32px',
          color: HL.pure, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: HL.pure, opacity: 0.85,
              letterSpacing: '0.08em', textTransform: 'uppercase' }}>Thursday · April 22 · 5:42 PM</div>
            <h1 style={{ fontSize: 68, fontWeight: 800, letterSpacing: '-0.03em', margin: '10px 0 0', lineHeight: 0.95, maxWidth: 820 }}>
              What's the vibe tonight?
            </h1>
            <p style={{ fontSize: 17, opacity: 0.9, marginTop: 14, maxWidth: 540 }}>
              557 events running now — 42 free, 12 with kids, 8 within walking distance of you.
            </p>
          </div>

          <div style={{
            background: HL.pure, borderRadius: 20, padding: 8,
            display: 'flex', alignItems: 'stretch', gap: 0,
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)', maxWidth: 900,
          }}>
            {segments.map((s, i) => (
              <React.Fragment key={s.key}>
                {i > 0 && <div style={{ width: 1, background: HL.mist, margin: '10px 0' }} />}
                <button style={{ flex: 1, padding: '12px 18px', background: 'transparent',
                  border: 0, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  borderRadius: 14 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 800, color: HL.zinc,
                    textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
                  <div style={{ fontSize: 15,
                    fontWeight: s.display === 'Any' || s.display === 'Anything' ? 500 : 800,
                    color: s.display === 'Any' || s.display === 'Anything' ? HL.zinc : HL.ink,
                    marginTop: 3,
                    display: 'flex', alignItems: 'center', gap: 6 }}>
                    {s.accent && <span style={{ width: 8, height: 8, borderRadius: 999, background: s.accent }} />}
                    {s.display}
                  </div>
                </button>
              </React.Fragment>
            ))}
            <button style={{ padding: '0 22px', background: HL.ink, color: HL.pure,
              border: 0, borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8,
              margin: 0 }}>
              Show 557 <IconSearch size={15} />
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '36px 32px' }}>
        <div style={{ display: 'flex', gap: 20 }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: HL.ink, margin: '0 0 16px' }}>Tonight's picks</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { title: 'Indigo Quartet', venue: 'Jazz Gallery', when: 'Tonight · 9pm', cat: 'Music', color: HL.blue },
                { title: 'Comedy at Pabst', venue: 'Pabst Theater', when: 'Tonight · 8pm', cat: 'Theater & Film', color: HL.indigo },
                { title: 'Rooftop Sessions', venue: 'Third Ward', when: 'Tonight · 7pm', cat: 'Nightlife', color: HL.plum },
                { title: 'Film Fest Night 3', venue: 'Oriental', when: 'Tonight · 7:30', cat: 'Theater & Film', color: HL.indigo },
              ].map((r, i) => (
                <div key={i} style={{ background: HL.pure, border: `1px solid ${HL.mist}`, borderRadius: 14, overflow: 'hidden' }}>
                  <div style={{ height: 120, background: `repeating-linear-gradient(45deg, ${r.color}33 0 10px, ${r.color}1a 10px 20px)`, padding: 10 }}>
                    <span style={{ padding: '3px 9px', background: r.color, color: HL.pure,
                      fontSize: 9.5, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', borderRadius: 999 }}>{r.cat}</span>
                  </div>
                  <div style={{ padding: 12 }}>
                    <div style={{ fontSize: 11, color: HL.zinc }}>{r.when}</div>
                    <div style={{ fontSize: 14.5, fontWeight: 700, color: HL.ink, marginTop: 3 }}>{r.title}</div>
                    <div style={{ fontSize: 12, color: HL.zinc, marginTop: 1 }}>{r.venue}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <TabbedDiscovery />
        </div>
      </div>
    </div>
  );
}

/* ── B3: segmented picker wrapped with "Mood" chips as an above-the-bar layer ── */

function VarB_Home_v4() {
  const [mood, setMood] = React.useState('date-night');
  const moods = [
    { k: 'date-night', label: 'Date night', color: HL.magenta, count: 34 },
    { k: 'with-kids', label: 'With kids', color: HL.golden, count: 46 },
    { k: 'solo', label: 'Solo', color: HL.teal, count: 28 },
    { k: 'friends', label: "Girls' night", color: HL.plum, count: 17 },
    { k: 'foodies', label: 'Foodies', color: HL.orange, count: 22 },
    { k: 'outdoors', label: 'Outdoors', color: HL.fern, count: 19 },
  ];
  const selected = moods.find(m => m.k === mood);

  const segments = [
    { key: 'category', icon: <IconTag />, label: 'Category', display: 'Any' },
    { key: 'when', icon: <IconClock />, label: 'When', display: 'Tonight', accent: HL.blue },
    { key: 'budget', icon: <IconWallet />, label: 'Budget', display: 'Any' },
  ];

  return (
    <div style={{ background: HL.white, minHeight: 760, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <SiteHeader />
      <div style={{ background: HL.pure, padding: '48px 32px 32px', borderBottom: `1px solid ${HL.mist}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h1 style={{ fontSize: 52, fontWeight: 800, letterSpacing: '-0.03em', color: HL.ink, margin: 0, lineHeight: 1 }}>
            Start with a mood.
          </h1>
          <p style={{ fontSize: 16, color: HL.zinc, marginTop: 12 }}>
            Pick what fits tonight — refine from there.
          </p>

          {/* Big mood tiles */}
          <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
            {moods.map(m => {
              const on = mood === m.k;
              return (
                <button key={m.k} onClick={() => setMood(m.k)} style={{
                  padding: '18px 14px', borderRadius: 18,
                  background: on ? m.color : HL.pure,
                  color: on ? HL.pure : HL.ink,
                  border: `2px solid ${on ? m.color : HL.mist}`,
                  cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  transition: 'all .15s',
                }}>
                  <div style={{ fontSize: 15, fontWeight: 800 }}>{m.label}</div>
                  <div style={{ fontSize: 11.5, opacity: on ? 0.9 : 1, color: on ? HL.pure : HL.zinc, marginTop: 4 }}>{m.count} events</div>
                </button>
              );
            })}
          </div>

          {/* Segmented refine */}
          <div style={{
            marginTop: 20, display: 'flex', alignItems: 'stretch', gap: 0,
            background: HL.cloud, borderRadius: 999, padding: 6, border: `1px solid ${HL.mist}`,
          }}>
            <div style={{
              padding: '10px 18px', background: selected.color, color: HL.pure,
              borderRadius: 999, fontSize: 13, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: HL.pure }} />
              {selected.label}
            </div>
            {segments.map((s, i) => (
              <React.Fragment key={s.key}>
                <div style={{ width: 1, background: HL.mist, margin: '10px 4px' }} />
                <button style={{
                  padding: '6px 18px', background: 'transparent', border: 0, cursor: 'pointer',
                  fontFamily: 'inherit', textAlign: 'left', borderRadius: 999,
                }}>
                  <div style={{ fontSize: 10.5, fontWeight: 800, color: HL.zinc,
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ color: s.accent || HL.zinc }}>{s.icon}</span>{s.label}
                  </div>
                  <div style={{ fontSize: 14,
                    fontWeight: s.display === 'Any' ? 500 : 800,
                    color: s.display === 'Any' ? HL.zinc : HL.ink, marginTop: 2 }}>{s.display}</div>
                </button>
              </React.Fragment>
            ))}
            <button style={{
              marginLeft: 'auto', padding: '0 22px', background: HL.ink, color: HL.pure,
              border: 0, borderRadius: 999, fontSize: 14, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit',
            }}>Show {selected.count}</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '36px 32px' }}>
        <div style={{ display: 'flex', gap: 20 }}>
          <HeroFeaturedCard big />
          <TabbedDiscovery />
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  TabbedDiscovery, VarB_Home_v2, VarB_Home_v3, VarB_Home_v4,
});
