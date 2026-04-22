/* Variation C — "Smart Search + Drawer"
   Desktop: prominent command-bar style search with natural language chips
   ("Tonight · Free · With kids") + a single "Advanced filters" icon.
   All granular fields live in a left-anchored drawer with grouped accordion sections.
   Mobile: a tall search card with stacked suggestion chips and a floating
   "Filters (2)" button pinned to the bottom.
*/

function VarC_Desktop() {
  const [drawer, setDrawer] = React.useState(false);
  const suggestions = [
    { text: 'Tonight', icon: <IconClock size={12} /> },
    { text: 'This weekend' },
    { text: 'Free', accent: HL.emerald },
    { text: 'Music', accent: HL.blue },
    { text: 'With kids' },
    { text: 'Date night' },
    { text: 'Food & Drink', accent: HL.orange },
    { text: 'Rainy day' },
  ];

  return (
    <div style={{ background: HL.white, minHeight: 760, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <SiteHeader />

      {/* Immersive hero filter zone */}
      <div style={{
        background: HL.ice, padding: '40px 32px 28px',
        borderBottom: `1px solid ${HL.mist}`,
      }}>
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: HL.teal, textTransform: 'uppercase',
            letterSpacing: '0.08em', marginBottom: 8 }}>What's happening</div>
          <h1 style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-0.02em', color: HL.ink,
            margin: 0, lineHeight: 1.05 }}>
            Find something to do<br/>in Milwaukee.
          </h1>

          {/* Big command bar */}
          <div style={{
            marginTop: 24, background: HL.pure, borderRadius: 20,
            boxShadow: '0 8px 28px rgba(2,2,3,0.08)', padding: 10,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 10,
              padding: '0 16px',
            }}>
              <div style={{ color: HL.zinc }}><IconSearch size={20} /></div>
              <input placeholder="Try 'jazz saturday' or 'free kids things'"
                style={{
                  border: 0, background: 'transparent', fontSize: 16, flex: 1,
                  outline: 'none', fontFamily: 'inherit', color: HL.ink, padding: '16px 0',
                }} />
            </div>
            <button onClick={() => setDrawer(true)} style={{
              padding: '14px', background: HL.cloud, border: 0,
              borderRadius: 14, cursor: 'pointer', color: HL.ink,
              position: 'relative',
            }}>
              <IconSliders size={18} />
              <span style={{
                position: 'absolute', top: -4, right: -4,
                background: HL.orange, color: HL.pure, fontSize: 10, fontWeight: 800,
                width: 18, height: 18, borderRadius: 999, display: 'grid',
                placeItems: 'center',
              }}>2</span>
            </button>
            <button style={{
              padding: '14px 22px', background: HL.ink, color: HL.pure,
              border: 0, borderRadius: 14, fontSize: 15, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>Search</button>
          </div>

          {/* Suggestion chips */}
          <div style={{
            marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center',
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: HL.zinc, marginRight: 4 }}>Try:</span>
            {suggestions.map(s => (
              <button key={s.text} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '6px 12px', background: HL.pure,
                border: `1px solid ${HL.mist}`, borderRadius: 999,
                fontSize: 13, fontWeight: 600, color: s.accent || HL.ink,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
                {s.accent && <span style={{ width: 6, height: 6, borderRadius: 999, background: s.accent }} />}
                {s.icon}
                {s.text}
              </button>
            ))}
          </div>

          {/* Applied summary row */}
          <div style={{
            marginTop: 18, padding: '14px 16px',
            background: HL.pure, borderRadius: 14, border: `1px solid ${HL.mist}`,
            display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: HL.zinc,
              textTransform: 'uppercase', letterSpacing: '0.06em' }}>Active:</span>
            <span style={{
              padding: '4px 10px', background: `${HL.blue}1f`, color: HL.blue,
              borderRadius: 999, fontSize: 13, fontWeight: 600,
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ width: 6, height: 6, background: HL.blue, borderRadius: 999 }} />
              Music <IconClose size={11} />
            </span>
            <span style={{
              padding: '4px 10px', background: HL.cloud, color: HL.ink,
              borderRadius: 999, fontSize: 13, fontWeight: 600,
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>Date night <IconClose size={11} /></span>
            <span style={{ flex: 1 }} />
            <button style={{
              fontSize: 12, fontWeight: 600, color: HL.zinc,
              background: 'transparent', border: 0, cursor: 'pointer',
              textDecoration: 'underline', fontFamily: 'inherit',
            }}>Clear all</button>
            <span style={{ fontSize: 13, fontWeight: 700, color: HL.ink }}>
              89 matches
            </span>
          </div>
        </div>
      </div>

      {/* Results below */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: HL.ink, margin: 0 }}>
            89 events
          </h2>
          <div style={{ fontSize: 13, color: HL.zinc }}>Sort: <b style={{ color: HL.ink }}>Soonest</b></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {[
            { title: 'Jazz at the Pabst', venue: 'Pabst Theater', when: 'Tonight · 8pm', cat: 'Music', color: HL.blue },
            { title: 'Summer Sips', venue: 'Third Ward', when: 'Sat · 5pm', cat: 'Food & Drink', color: HL.orange },
            { title: 'Indigo Quartet', venue: 'Jazz Gallery', when: 'Sun · 7pm', cat: 'Music', color: HL.blue },
          ].map((r, i) => (
            <div key={i} style={{
              background: HL.pure, border: `1px solid ${HL.mist}`, borderRadius: 16, overflow: 'hidden',
            }}>
              <div style={{
                height: 140, background: `repeating-linear-gradient(45deg, ${r.color}22 0 10px, ${r.color}11 10px 20px)`,
                padding: 12,
              }}>
                <span style={{
                  padding: '4px 10px', background: r.color, color: HL.pure,
                  fontSize: 10.5, fontWeight: 700, letterSpacing: '0.05em',
                  textTransform: 'uppercase', borderRadius: 999,
                }}>{r.cat}</span>
              </div>
              <div style={{ padding: 14 }}>
                <div style={{ fontSize: 12, color: HL.zinc }}>{r.when}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: HL.ink, marginTop: 3 }}>{r.title}</div>
                <div style={{ fontSize: 13, color: HL.zinc, marginTop: 2 }}>{r.venue}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {drawer && <FilterDrawerC onClose={() => setDrawer(false)} />}
    </div>
  );
}

function FilterDrawerC({ onClose }) {
  return (
    <>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0, background: 'rgba(2,2,3,0.5)', zIndex: 20,
      }} />
      <aside style={{
        position: 'absolute', top: 0, left: 0, bottom: 0, width: 380,
        background: HL.pure, zIndex: 21, display: 'flex', flexDirection: 'column',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>
        <div style={{
          padding: '20px 24px', borderBottom: `1px solid ${HL.mist}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: HL.ink }}>Refine</h2>
            <div style={{ fontSize: 12, color: HL.zinc, marginTop: 2 }}>2 active · 89 matches</div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, background: HL.cloud, border: 0, borderRadius: 999,
            cursor: 'pointer', display: 'grid', placeItems: 'center', color: HL.ink,
          }}><IconClose /></button>
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          <DrawerSection title="CATEGORY" count="15" defaultOpen>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {CATEGORIES.map(c => {
                const on = c.name === 'Music';
                return (
                  <span key={c.name} style={{
                    padding: '6px 11px', borderRadius: 999,
                    background: on ? c.color : HL.pure,
                    color: on ? HL.pure : HL.ink,
                    border: `1px solid ${on ? c.color : HL.mist}`,
                    fontSize: 12.5, fontWeight: 600,
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                  }}>
                    <span style={{ width: 7, height: 7, borderRadius: 999, background: on ? HL.pure : c.color }} />
                    {c.name}
                  </span>
                );
              })}
            </div>
          </DrawerSection>
          <DrawerSection title="WHEN" defaultOpen>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {['Today', 'Tomorrow', 'This weekend', 'Next 7 days'].map(d => (
                <button key={d} style={{
                  padding: '9px 10px', background: HL.pure, border: `1px solid ${HL.mist}`,
                  borderRadius: 10, fontSize: 13, fontWeight: 600, color: HL.ink,
                  cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                }}>{d}</button>
              ))}
            </div>
            <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {TIMES.map(t => (
                <span key={t} style={{
                  padding: '4px 9px', borderRadius: 999, background: HL.pure,
                  border: `1px solid ${HL.mist}`, fontSize: 12, fontWeight: 600, color: HL.ink,
                }}>{t}</span>
              ))}
            </div>
          </DrawerSection>
          <DrawerSection title="GOOD FOR">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {GOOD_FOR.map(g => (
                <span key={g} style={{
                  padding: '5px 10px', borderRadius: 999,
                  background: g === 'Date night' ? HL.ink : HL.pure,
                  color: g === 'Date night' ? HL.pure : HL.ink,
                  border: `1px solid ${g === 'Date night' ? HL.ink : HL.mist}`,
                  fontSize: 12.5, fontWeight: 600,
                }}>{g}</span>
              ))}
            </div>
          </DrawerSection>
          <DrawerSection title="BUDGET">
            <div style={{ display: 'flex', gap: 6 }}>
              {BUDGETS.map(b => (
                <span key={b} style={{
                  flex: 1, textAlign: 'center', padding: '9px', borderRadius: 10,
                  background: HL.pure, border: `1px solid ${HL.mist}`,
                  fontSize: 12.5, fontWeight: 700, color: HL.ink,
                }}>{b}</span>
              ))}
            </div>
          </DrawerSection>
          <DrawerSection title="NEIGHBORHOOD" />
          <DrawerSection title="ACCESSIBILITY" />
          <DrawerSection title="VIBE" />
        </div>
        <div style={{ padding: 16, borderTop: `1px solid ${HL.mist}`, display: 'flex', gap: 8 }}>
          <button style={{
            padding: '12px 14px', background: HL.pure, border: `1px solid ${HL.mist}`,
            borderRadius: 999, fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
          }}>Clear</button>
          <button style={{
            flex: 1, padding: '12px 14px', background: HL.blue, color: HL.pure,
            border: 0, borderRadius: 999, fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
          }}>Show 89 events</button>
        </div>
      </aside>
    </>
  );
}

function DrawerSection({ title, count, children, defaultOpen }) {
  const [open, setOpen] = React.useState(!!defaultOpen);
  return (
    <div style={{ borderBottom: `1px solid ${HL.mist}` }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', padding: '14px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'transparent', border: 0, cursor: 'pointer', fontFamily: 'inherit',
      }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: HL.ink,
          letterSpacing: '0.08em' }}>{title}
          {count && <span style={{ color: HL.zinc, marginLeft: 6, fontWeight: 600 }}>({count})</span>}
        </span>
        <span style={{ color: HL.zinc }}><IconChevron size={12} dir={open ? 'up' : 'down'} /></span>
      </button>
      {open && <div style={{ padding: '0 24px 16px' }}>{children}</div>}
    </div>
  );
}

/* ── Mobile: hero search + floating filter button ─────────────────── */

function VarC_Mobile() {
  return (
    <div style={{ background: HL.white, minHeight: 760, fontFamily: "'Plus Jakarta Sans', sans-serif", position: 'relative' }}>
      <MobileHeader />

      <div style={{ background: HL.ice, padding: '24px 16px 20px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', color: HL.ink,
          margin: 0, lineHeight: 1.1 }}>
          Find something<br/>to do tonight.
        </h1>

        <div style={{
          marginTop: 18, background: HL.pure, borderRadius: 16,
          boxShadow: '0 6px 20px rgba(2,2,3,0.08)', padding: 6,
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
          }}>
            <div style={{ color: HL.zinc }}><IconSearch size={16} /></div>
            <span style={{ fontSize: 14, color: HL.zinc }}>Try 'jazz saturday'</span>
          </div>
          <button style={{
            padding: '11px 16px', background: HL.ink, color: HL.pure,
            border: 0, borderRadius: 12, fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
          }}>Go</button>
        </div>

        <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {[
            { text: 'Tonight', icon: <IconClock size={11} /> },
            { text: 'Free', accent: HL.emerald },
            { text: 'With kids' },
            { text: 'Music', accent: HL.blue },
            { text: 'Weekend' },
            { text: 'Date night' },
          ].map(s => (
            <span key={s.text} style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '5px 10px', background: HL.pure, border: `1px solid ${HL.mist}`,
              borderRadius: 999, fontSize: 12, fontWeight: 600, color: s.accent || HL.ink,
            }}>
              {s.accent && <span style={{ width: 5, height: 5, borderRadius: 999, background: s.accent }} />}
              {s.icon}{s.text}
            </span>
          ))}
        </div>
      </div>

      <div style={{ padding: '20px 16px 100px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: HL.ink, margin: 0 }}>89 events</h2>
          <span style={{ fontSize: 12, color: HL.zinc }}>Soonest ↓</span>
        </div>

        <div style={{ marginTop: 14, display: 'grid', gap: 12 }}>
          {[
            { title: 'Jazz at the Pabst', venue: 'Pabst Theater', when: 'Tonight · 8pm', cat: 'Music', color: HL.blue, price: 'Free' },
            { title: 'Summer Sips', venue: 'Third Ward', when: 'Sat · 5pm', cat: 'Food & Drink', color: HL.orange, price: '$15' },
            { title: 'Indigo Quartet', venue: 'Jazz Gallery', when: 'Sun · 7pm', cat: 'Music', color: HL.blue, price: '$12' },
          ].map((r, i) => (
            <div key={i} style={{
              background: HL.pure, border: `1px solid ${HL.mist}`, borderRadius: 14,
              display: 'flex', gap: 10, padding: 8,
            }}>
              <div style={{
                width: 78, height: 78, borderRadius: 10,
                background: `repeating-linear-gradient(45deg, ${r.color}22 0 10px, ${r.color}11 10px 20px)`,
              }} />
              <div style={{ flex: 1 }}>
                <span style={{
                  padding: '2px 7px', background: `${r.color}1f`, color: r.color,
                  fontSize: 9.5, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                  borderRadius: 999,
                }}>{r.cat}</span>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: HL.ink, marginTop: 4 }}>{r.title}</div>
                <div style={{ fontSize: 12, color: HL.zinc, marginTop: 2 }}>{r.when} · {r.venue}</div>
                <div style={{ marginTop: 4, fontSize: 12.5, fontWeight: 600,
                  color: r.price === 'Free' ? HL.emerald : HL.ink }}>{r.price}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating filter button */}
      <div style={{
        position: 'absolute', bottom: 20, left: 0, right: 0,
        display: 'flex', justifyContent: 'center',
      }}>
        <button style={{
          padding: '12px 22px', background: HL.ink, color: HL.pure,
          border: 0, borderRadius: 999, fontSize: 14, fontWeight: 700,
          fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: '0 10px 28px rgba(2,2,3,0.3)',
        }}>
          <IconSliders size={15} /> Filters
          <span style={{
            background: HL.orange, color: HL.pure, fontSize: 11, fontWeight: 800,
            padding: '1px 8px', borderRadius: 999,
          }}>2</span>
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { VarC_Desktop, VarC_Mobile });
