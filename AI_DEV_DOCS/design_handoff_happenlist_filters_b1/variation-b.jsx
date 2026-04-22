/* Variation B — "Segmented Picker"
   Desktop: 4 segments (Category · When · Good for · Budget) in one pill bar.
   Each segment shows its current selection inline (e.g. "Music, Food" as subtitle).
   Clicking opens a rich popover with chips/calendar/etc.
   Mobile: same segments in a 2x2 grid, each opens a bottom sheet.
*/

function VarB_Desktop() {
  const [openSeg, setOpenSeg] = React.useState(null); // 'category' | 'when' | 'goodFor' | 'budget'
  const [sel, setSel] = React.useState({
    category: ['Music', 'Food & Drink'],
    when: 'This weekend',
    goodFor: ['Date night'],
    budget: 'Free',
  });

  const catColor = (name) => CATEGORIES.find(c => c.name === name)?.color || HL.blue;

  const segments = [
    { key: 'category', icon: <IconTag />, label: 'Category',
      display: sel.category.length ? sel.category.join(', ') : 'Any category',
      accent: sel.category.length ? catColor(sel.category[0]) : null,
    },
    { key: 'when', icon: <IconClock />, label: 'When',
      display: sel.when || 'Anytime',
    },
    { key: 'goodFor', icon: <IconSparkles />, label: 'Good for',
      display: sel.goodFor.length ? sel.goodFor.join(', ') : 'Anything',
    },
    { key: 'budget', icon: <IconWallet />, label: 'Budget',
      display: sel.budget || 'Any price',
      accent: sel.budget === 'Free' ? HL.emerald : null,
    },
  ];

  return (
    <div style={{ background: HL.white, minHeight: 760, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <SiteHeader />

      {/* Unified picker bar */}
      <div style={{ background: HL.pure, borderBottom: `1px solid ${HL.mist}`, padding: '20px 32px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 10, alignItems: 'center' }}>

          {/* Search */}
          <div style={{
            flex: '0 0 240px', display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 14px', background: HL.cloud, borderRadius: 999,
          }}>
            <div style={{ color: HL.zinc }}><IconSearch /></div>
            <input placeholder="Search" style={{
              border: 0, background: 'transparent', fontSize: 14, flex: 1,
              outline: 'none', fontFamily: 'inherit', color: HL.ink,
            }} />
          </div>

          {/* Pill with 4 segments */}
          <div style={{
            flex: 1, display: 'flex', alignItems: 'stretch',
            background: HL.pure, border: `1px solid ${HL.mist}`, borderRadius: 999,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}>
            {segments.map((s, i) => {
              const isOpen = openSeg === s.key;
              const hasValue = s.display !== 'Any category' && s.display !== 'Anytime'
                && s.display !== 'Anything' && s.display !== 'Any price';
              return (
                <React.Fragment key={s.key}>
                  {i > 0 && <div style={{ width: 1, background: HL.mist, margin: '8px 0' }} />}
                  <button onClick={() => setOpenSeg(isOpen ? null : s.key)} style={{
                    flex: 1, padding: '8px 18px', background: isOpen ? HL.cloud : 'transparent',
                    border: 0, cursor: 'pointer', fontFamily: 'inherit',
                    borderRadius: i === 0 ? '999px 0 0 999px' : i === segments.length - 1 ? '0 999px 999px 0' : 0,
                    textAlign: 'left', display: 'flex', flexDirection: 'column', justifyContent: 'center',
                    position: 'relative',
                  }}>
                    <div style={{
                      fontSize: 11, fontWeight: 700, color: HL.zinc,
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}>
                      <span style={{ color: s.accent || HL.zinc }}>{s.icon}</span>
                      {s.label}
                    </div>
                    <div style={{
                      fontSize: 14, fontWeight: hasValue ? 700 : 500,
                      color: hasValue ? HL.ink : HL.zinc,
                      marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      {hasValue && s.accent && (
                        <span style={{ width: 8, height: 8, borderRadius: 999, background: s.accent, flexShrink: 0 }} />
                      )}
                      {s.display}
                    </div>
                  </button>
                </React.Fragment>
              );
            })}
            <button style={{
              margin: 6, padding: '0 18px', background: HL.blue, color: HL.pure,
              border: 0, borderRadius: 999, fontSize: 13.5, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <IconSearch size={14} /> Show 89
            </button>
          </div>

          <button style={{
            flexShrink: 0, padding: '10px 14px', background: HL.pure, color: HL.ink,
            border: `1px solid ${HL.mist}`, borderRadius: 999,
            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <IconSliders size={14} /> More
          </button>
        </div>

        {/* Popover */}
        {openSeg && (
          <div style={{
            maxWidth: 1100, margin: '14px auto 0', position: 'relative',
          }}>
            <Popover type={openSeg} sel={sel} setSel={setSel} onClose={() => setOpenSeg(null)} />
          </div>
        )}
      </div>

      {/* Page body */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 32px' }}>
        <div style={{ fontSize: 13, color: HL.zinc, marginBottom: 8 }}>Home · Events</div>
        <h1 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.02em', color: HL.ink, margin: 0 }}>
          This weekend in Milwaukee
        </h1>
        <div style={{ marginTop: 6, color: HL.zinc, fontSize: 15 }}>
          <b style={{ color: HL.ink }}>89</b> events match · Music, Food & Drink · Date night · Free
        </div>

        <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {[
            { title: 'Jazz at the Pabst', venue: 'Pabst Theater', when: 'Tonight · 8pm', cat: 'Music', color: HL.blue, price: 'Free' },
            { title: 'Taco Fest MKE', venue: 'Lakefront', when: 'Sat · 12pm', cat: 'Food & Drink', color: HL.orange, price: '$15' },
            { title: 'Summer Sips', venue: 'Third Ward', when: 'Sun · 2pm', cat: 'Food & Drink', color: HL.orange, price: '$20' },
          ].map((r, i) => (
            <div key={i} style={{
              background: HL.pure, border: `1px solid ${HL.mist}`, borderRadius: 16,
              overflow: 'hidden',
            }}>
              <div style={{
                height: 150, background: `repeating-linear-gradient(45deg, ${r.color}22 0 10px, ${r.color}11 10px 20px)`,
                display: 'flex', alignItems: 'flex-start', padding: 12,
              }}>
                <span style={{
                  padding: '4px 10px', background: r.color, color: HL.pure,
                  fontSize: 10.5, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                  borderRadius: 999,
                }}>{r.cat}</span>
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ fontSize: 12, color: HL.zinc }}>{r.when}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: HL.ink, marginTop: 3 }}>{r.title}</div>
                <div style={{ fontSize: 13, color: HL.zinc, marginTop: 2 }}>{r.venue}</div>
                <div style={{ marginTop: 8, fontSize: 13, fontWeight: 600,
                  color: r.price === 'Free' ? HL.emerald : HL.ink }}>{r.price}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Popover({ type, sel, setSel, onClose }) {
  const boxStyle = {
    background: HL.pure, borderRadius: 24, padding: 24,
    boxShadow: '0 20px 50px rgba(2,2,3,0.14), 0 2px 8px rgba(2,2,3,0.06)',
    border: `1px solid ${HL.mist}`,
  };

  if (type === 'category') {
    return (
      <div style={boxStyle}>
        <div style={{ fontSize: 12, fontWeight: 700, color: HL.zinc, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Pick categories</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {CATEGORIES.map(c => {
            const on = sel.category.includes(c.name);
            return (
              <button key={c.name} onClick={() => setSel(s => ({
                ...s,
                category: on ? s.category.filter(x => x !== c.name) : [...s.category, c.name],
              }))} style={{
                padding: '8px 14px', borderRadius: 999,
                background: on ? c.color : HL.pure,
                color: on ? HL.pure : HL.ink,
                border: `1px solid ${on ? c.color : HL.mist}`,
                fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                display: 'inline-flex', alignItems: 'center', gap: 7,
              }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: on ? HL.pure : c.color }} />
                {c.name}
                <span style={{ fontSize: 11, opacity: 0.7 }}>{c.count}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (type === 'when') {
    return (
      <div style={boxStyle}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: HL.zinc, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Quick picks</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {['Today', 'Tomorrow', 'This weekend', 'Next 7 days', 'Next 30 days', 'Pick dates'].map(d => (
                <button key={d} onClick={() => setSel(s => ({ ...s, when: d }))} style={{
                  padding: '10px 14px', borderRadius: 12,
                  background: sel.when === d ? HL.ink : HL.pure,
                  color: sel.when === d ? HL.pure : HL.ink,
                  border: `1px solid ${sel.when === d ? HL.ink : HL.mist}`,
                  fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'left',
                  fontFamily: 'inherit',
                }}>{d}</button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: HL.zinc, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Time of day</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {TIMES.map(t => (
                <button key={t} style={{
                  padding: '8px 14px', borderRadius: 999,
                  background: HL.pure, color: HL.ink,
                  border: `1px solid ${HL.mist}`, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>{t}</button>
              ))}
            </div>
            <div style={{
              marginTop: 16, padding: 14, background: HL.ice, borderRadius: 12,
              fontSize: 13, color: HL.ink,
            }}>
              <b>This weekend</b><br/>
              <span style={{ color: HL.zinc }}>Sat Apr 25 – Sun Apr 26</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'goodFor') {
    return (
      <div style={boxStyle}>
        <div style={{ fontSize: 12, fontWeight: 700, color: HL.zinc, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Who's it for?</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {GOOD_FOR.map(g => {
            const on = sel.goodFor.includes(g);
            return (
              <button key={g} onClick={() => setSel(s => ({
                ...s,
                goodFor: on ? s.goodFor.filter(x => x !== g) : [...s.goodFor, g],
              }))} style={{
                padding: '10px 16px', borderRadius: 999,
                background: on ? HL.ink : HL.pure,
                color: on ? HL.pure : HL.ink,
                border: `1px solid ${on ? HL.ink : HL.mist}`,
                fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}>{g}</button>
            );
          })}
        </div>
      </div>
    );
  }

  if (type === 'budget') {
    return (
      <div style={boxStyle}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {BUDGETS.map(b => {
            const on = sel.budget === b;
            const isFree = b === 'Free';
            return (
              <button key={b} onClick={() => setSel(s => ({ ...s, budget: on ? null : b }))} style={{
                padding: '16px 10px', borderRadius: 16,
                background: on ? (isFree ? HL.emerald : HL.ink) : HL.pure,
                color: on ? HL.pure : HL.ink,
                border: `1px solid ${on ? (isFree ? HL.emerald : HL.ink) : HL.mist}`,
                fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              }}>{b}</button>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
}

/* ── Mobile: 2x2 segmented grid ──────────────────────────────────── */

function VarB_Mobile() {
  return (
    <div style={{ background: HL.white, minHeight: 760, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <MobileHeader />
      <div style={{ padding: '14px 16px', background: HL.pure, borderBottom: `1px solid ${HL.mist}` }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px', background: HL.cloud, borderRadius: 999,
        }}>
          <div style={{ color: HL.zinc }}><IconSearch size={15} /></div>
          <span style={{ fontSize: 14, color: HL.zinc }}>Search events</span>
        </div>

        {/* 2x2 segment grid */}
        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <MobileSegment label="Category" icon={<IconTag size={14} />}
            value="Music, Food" accent={HL.blue} />
          <MobileSegment label="When" icon={<IconClock size={14} />}
            value="This weekend" />
          <MobileSegment label="Good for" icon={<IconSparkles size={14} />}
            value="Date night" />
          <MobileSegment label="Budget" icon={<IconWallet size={14} />}
            value="Free" accent={HL.emerald} />
        </div>

        <button style={{
          marginTop: 10, width: '100%', padding: '12px', background: HL.blue,
          color: HL.pure, border: 0, borderRadius: 999, fontSize: 14, fontWeight: 700,
          fontFamily: 'inherit', cursor: 'pointer',
        }}>Show 89 events</button>
      </div>

      <div style={{ padding: '20px 16px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', color: HL.ink, margin: 0 }}>This weekend</h1>
        <div style={{ marginTop: 4, fontSize: 13, color: HL.zinc }}>89 events match</div>

        {/* Shows popover as bottom sheet preview */}
        <div style={{
          marginTop: 18,
          background: HL.pure, border: `1px solid ${HL.mist}`, borderRadius: 16, padding: 14,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: HL.zinc, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Tap a segment above</div>
          <div style={{ fontSize: 13, color: HL.zinc }}>
            Each opens a focused sheet — e.g. tapping <b style={{ color: HL.ink }}>Category</b> slides up just the category picker, full-screen.
          </div>
          <div style={{
            marginTop: 14, padding: 14, borderRadius: 12, background: HL.ice,
            display: 'flex', flexWrap: 'wrap', gap: 6,
          }}>
            {CATEGORIES.slice(0, 7).map(c => (
              <span key={c.name} style={{
                padding: '5px 10px', borderRadius: 999,
                background: c.name === 'Music' || c.name === 'Food & Drink' ? c.color : HL.pure,
                color: c.name === 'Music' || c.name === 'Food & Drink' ? HL.pure : HL.ink,
                fontSize: 12, fontWeight: 600, border: `1px solid ${HL.mist}`,
              }}>{c.name}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileSegment({ label, icon, value, accent }) {
  return (
    <button style={{
      padding: '10px 12px', background: HL.pure,
      border: `1.5px solid ${accent || HL.mist}`, borderRadius: 14,
      fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left',
    }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: HL.zinc, textTransform: 'uppercase',
        letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ color: accent || HL.zinc }}>{icon}</span>{label}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: HL.ink, marginTop: 3,
        display: 'flex', alignItems: 'center', gap: 6 }}>
        {accent && <span style={{ width: 7, height: 7, borderRadius: 999, background: accent }} />}
        {value}
      </div>
    </button>
  );
}

Object.assign(window, { VarB_Desktop, VarB_Mobile });
