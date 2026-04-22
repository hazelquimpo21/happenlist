/* Variation A — "Smart Summary Bar"
   Desktop: one clean header bar: search · quick-glance chips · Filters button.
   Active filters render as removable tokens in the bar itself.
   Clicking Filters opens a right-side sheet with ALL filter fields, grouped.
   Mobile: identical sticky bar, sheet slides up full-screen.

   Design moves that matter here:
   - Collapses 5 rows into 1 on both breakpoints
   - Active filters always visible as removable chips → no "hidden state" problem
   - Quick-picks (Tonight, Weekend, Free) sit before the Filters button as 1-tap shortcuts
   - Filter sheet has progressive disclosure — popular fields up top, advanced collapsed
*/

function VarA_Desktop() {
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState({
    categories: ['Music', 'Food & Drink'],
    goodFor: ['Date night'],
    budget: 'Free',
  });

  const activeCount =
    active.categories.length + active.goodFor.length + (active.budget ? 1 : 0);

  const removeCategory = (c) =>
    setActive(a => ({ ...a, categories: a.categories.filter(x => x !== c) }));
  const removeGoodFor = (g) =>
    setActive(a => ({ ...a, goodFor: a.goodFor.filter(x => x !== g) }));
  const clearBudget = () => setActive(a => ({ ...a, budget: null }));

  const catColor = (name) => CATEGORIES.find(c => c.name === name)?.color || HL.blue;

  return (
    <div style={{ background: HL.white, minHeight: 760, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <SiteHeader />

      {/* ── The Bar — single row, grouped zones ────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 5, background: HL.pure,
        borderBottom: `1px solid ${HL.mist}`,
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '14px 32px',
          display: 'flex', alignItems: 'center', gap: 12 }}>

          {/* Search */}
          <div style={{
            flex: '0 1 320px', display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 14px', background: HL.cloud, borderRadius: 999,
            border: `1px solid ${HL.mist}`,
          }}>
            <div style={{ color: HL.zinc }}><IconSearch size={16} /></div>
            <input placeholder="Search events" style={{
              border: 0, background: 'transparent', fontSize: 14, flex: 1, outline: 'none',
              fontFamily: 'inherit', color: HL.ink,
            }} />
          </div>

          {/* Quick-picks — one-tap shortcuts */}
          <div style={{ display: 'flex', gap: 6, paddingLeft: 6, paddingRight: 6,
            borderLeft: `1px solid ${HL.mist}`, borderRight: `1px solid ${HL.mist}` }}>
            <QuickPick icon={<IconClock size={13} />} label="Tonight" />
            <QuickPick label="This weekend" />
            <QuickPick label="Free" accent={HL.emerald} />
            <QuickPick label="With kids" />
          </div>

          {/* Active filter tokens */}
          <div style={{ display: 'flex', gap: 6, flex: 1, flexWrap: 'wrap', minWidth: 0 }}>
            {active.categories.map(c => (
              <Token key={c} label={c} color={catColor(c)} onRemove={() => removeCategory(c)} />
            ))}
            {active.goodFor.map(g => (
              <Token key={g} label={g} onRemove={() => removeGoodFor(g)} />
            ))}
            {active.budget && (
              <Token label={active.budget} color={HL.emerald} onRemove={clearBudget} />
            )}
          </div>

          {/* Filters button */}
          <button onClick={() => setOpen(true)} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 14px', background: activeCount > 0 ? HL.ink : HL.pure,
            color: activeCount > 0 ? HL.pure : HL.ink,
            border: `1px solid ${activeCount > 0 ? HL.ink : HL.mist}`,
            borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'inherit',
          }}>
            <IconSliders size={15} />
            <span>Filters</span>
            {activeCount > 0 && (
              <span style={{
                background: HL.blue, color: HL.pure, fontSize: 11, fontWeight: 700,
                padding: '1px 7px', borderRadius: 999, marginLeft: 2,
              }}>{activeCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* ── Page body ──────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '36px 32px' }}>
        <div style={{ fontSize: 13, color: HL.zinc, marginBottom: 8 }}>Home · Events</div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{
              fontSize: 40, fontWeight: 800, letterSpacing: '-0.02em', color: HL.ink, margin: 0,
            }}>All Events</h1>
            <div style={{ marginTop: 6, color: HL.zinc, fontSize: 15 }}>
              <b style={{ color: HL.ink }}>89</b> events match · sorted by soonest
            </div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, fontSize: 13,
            color: HL.zinc,
          }}>
            <span>Sort:</span>
            <div style={{
              padding: '7px 12px', background: HL.pure, border: `1px solid ${HL.mist}`,
              borderRadius: 8, display: 'flex', gap: 6, alignItems: 'center', color: HL.ink,
              fontWeight: 600,
            }}>
              Soonest first <IconChevron size={12} />
            </div>
          </div>
        </div>

        <ResultsPreview />
      </div>

      {/* Sheet */}
      {open && <FilterSheet onClose={() => setOpen(false)} active={active} setActive={setActive} />}
    </div>
  );
}

function QuickPick({ label, icon, accent }) {
  return (
    <button style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '7px 11px', background: 'transparent',
      border: `1px dashed ${HL.silver}`, borderRadius: 999,
      fontSize: 13, fontWeight: 600, color: accent || HL.ink,
      cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
    }}>
      {icon}{label}
    </button>
  );
}

function Token({ label, color, onRemove }) {
  const bg = color ? `${color}1f` : HL.cloud;
  const fg = color || HL.ink;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '6px 4px 6px 11px', background: bg,
      color: fg, borderRadius: 999,
      fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
    }}>
      {color && <span style={{ width: 7, height: 7, background: color, borderRadius: 999, marginRight: -2 }} />}
      {label}
      <button onClick={onRemove} aria-label={`remove ${label}`} style={{
        width: 20, height: 20, background: 'transparent', border: 0,
        borderRadius: 999, display: 'grid', placeItems: 'center', cursor: 'pointer',
        color: fg, opacity: 0.7,
      }}><IconClose size={12} /></button>
    </span>
  );
}

function FilterSheet({ onClose, active, setActive }) {
  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(2,2,3,0.5)', zIndex: 20,
      }} />
      <aside style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 440,
        background: HL.pure, zIndex: 21, display: 'flex', flexDirection: 'column',
        boxShadow: '-12px 0 40px rgba(0,0,0,0.15)', fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: `1px solid ${HL.mist}`,
        }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: HL.ink }}>All filters</h2>
          <button onClick={onClose} style={{
            width: 32, height: 32, background: HL.cloud, border: 0, borderRadius: 999,
            cursor: 'pointer', display: 'grid', placeItems: 'center', color: HL.ink,
          }}><IconClose size={14} /></button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '8px 24px 24px' }}>
          <SheetGroup title="Category" icon={<IconTag />}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {CATEGORIES.map(c => {
                const on = active.categories.includes(c.name);
                return (
                  <button key={c.name} onClick={() => setActive(a => ({
                    ...a,
                    categories: on ? a.categories.filter(x => x !== c.name) : [...a.categories, c.name],
                  }))} style={{
                    padding: '6px 12px', borderRadius: 999,
                    background: on ? c.color : HL.pure,
                    color: on ? HL.pure : HL.ink,
                    border: `1px solid ${on ? c.color : HL.mist}`,
                    fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                  }}>
                    <span style={{
                      width: 8, height: 8, borderRadius: 999,
                      background: on ? HL.pure : c.color,
                    }} />
                    {c.name}
                    <span style={{ fontSize: 11, opacity: 0.7, fontWeight: 500 }}>{c.count}</span>
                  </button>
                );
              })}
            </div>
          </SheetGroup>

          <SheetGroup title="Good for" icon={<IconSparkles />}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {GOOD_FOR.map(g => {
                const on = active.goodFor.includes(g);
                return (
                  <button key={g} onClick={() => setActive(a => ({
                    ...a,
                    goodFor: on ? a.goodFor.filter(x => x !== g) : [...a.goodFor, g],
                  }))} style={{
                    padding: '6px 12px', borderRadius: 999,
                    background: on ? HL.ink : HL.pure,
                    color: on ? HL.pure : HL.ink,
                    border: `1px solid ${on ? HL.ink : HL.mist}`,
                    fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  }}>{g}</button>
                );
              })}
            </div>
          </SheetGroup>

          <SheetGroup title="When" icon={<IconClock />}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {['Today', 'Tomorrow', 'This weekend', 'Next 7 days'].map(d => (
                <DateBtn key={d} label={d} />
              ))}
            </div>
            <div style={{ fontSize: 12, color: HL.zinc, fontWeight: 600, marginTop: 14, marginBottom: 6, letterSpacing: '0.02em', textTransform: 'uppercase' }}>Time of day</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {TIMES.map(t => (
                <button key={t} style={{
                  padding: '6px 12px', borderRadius: 999, background: HL.pure,
                  color: HL.ink, border: `1px solid ${HL.mist}`, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>{t}</button>
              ))}
            </div>
          </SheetGroup>

          <SheetGroup title="Budget" icon={<IconWallet />}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {BUDGETS.map(b => {
                const on = active.budget === b;
                return (
                  <button key={b} onClick={() => setActive(a => ({ ...a, budget: on ? null : b }))} style={{
                    padding: '6px 12px', borderRadius: 999,
                    background: on ? HL.emerald : HL.pure,
                    color: on ? HL.pure : HL.ink,
                    border: `1px solid ${on ? HL.emerald : HL.mist}`,
                    fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  }}>{b}</button>
                );
              })}
            </div>
          </SheetGroup>

          <SheetGroup title="Neighborhood" icon={<IconMapPin />} collapsed>
            <div style={{ fontSize: 13, color: HL.zinc }}>Tap to set location…</div>
          </SheetGroup>

          <SheetGroup title="Accessibility & vibe" icon={<IconUsers />} collapsed>
            <div style={{ fontSize: 13, color: HL.zinc }}>Wheelchair access, sensory-friendly, solo-friendly…</div>
          </SheetGroup>
        </div>

        <div style={{
          display: 'flex', gap: 10, padding: '16px 24px',
          borderTop: `1px solid ${HL.mist}`, background: HL.pure,
        }}>
          <button style={{
            flex: '0 0 auto', padding: '12px 18px', background: HL.pure,
            border: `1px solid ${HL.mist}`, borderRadius: 999, fontSize: 14,
            fontWeight: 600, color: HL.ink, cursor: 'pointer', fontFamily: 'inherit',
          }}>Clear all</button>
          <button style={{
            flex: 1, padding: '12px 18px', background: HL.blue,
            border: 0, borderRadius: 999, fontSize: 14,
            fontWeight: 700, color: HL.pure, cursor: 'pointer', fontFamily: 'inherit',
          }}>Show 89 events</button>
        </div>
      </aside>
    </>
  );
}

function SheetGroup({ title, icon, children, collapsed }) {
  const [open, setOpen] = React.useState(!collapsed);
  return (
    <div style={{ padding: '16px 0', borderBottom: `1px solid ${HL.mist}` }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
        fontFamily: 'inherit', marginBottom: open ? 14 : 0,
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: HL.ink }}>
          <span style={{ color: HL.zinc }}>{icon}</span>
          <span style={{ fontSize: 15, fontWeight: 700 }}>{title}</span>
        </span>
        <span style={{ color: HL.zinc }}><IconChevron size={14} dir={open ? 'up' : 'down'} /></span>
      </button>
      {open && children}
    </div>
  );
}

function DateBtn({ label, active }) {
  return (
    <button style={{
      padding: '10px 12px', borderRadius: 12,
      background: active ? HL.blue : HL.pure,
      color: active ? HL.pure : HL.ink,
      border: `1px solid ${active ? HL.blue : HL.mist}`,
      fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'left',
      fontFamily: 'inherit',
    }}>{label}</button>
  );
}

function ResultsPreview() {
  const rows = [
    { title: 'Jazz at the Pabst', venue: 'Pabst Theater', when: 'Tonight · 8pm', cat: 'Music', color: HL.blue, price: 'Free' },
    { title: 'Taco Fest MKE', venue: 'Lakefront', when: 'Sat · 12pm', cat: 'Food & Drink', color: HL.orange, price: '$15' },
    { title: 'Gallery Night', venue: 'Third Ward', when: 'Fri · 5pm', cat: 'Arts & Culture', color: HL.teal, price: 'Free' },
    { title: 'Summerfest Preview', venue: 'Henry Maier Park', when: 'Sun · 1pm', cat: 'Festivals', color: HL.amber, price: '$25' },
  ];
  return (
    <div style={{
      marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20,
    }}>
      {rows.map((r, i) => (
        <div key={i} style={{
          background: HL.pure, border: `1px solid ${HL.mist}`, borderRadius: 16,
          overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}>
          <div style={{
            height: 130, background: `repeating-linear-gradient(45deg, ${r.color}22 0 10px, ${r.color}11 10px 20px)`,
            position: 'relative', display: 'flex', alignItems: 'flex-start', padding: 12,
          }}>
            <span style={{
              padding: '4px 10px', background: r.color, color: HL.pure,
              fontSize: 10.5, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
              borderRadius: 999,
            }}>{r.cat}</span>
          </div>
          <div style={{ padding: 14 }}>
            <div style={{ fontSize: 12, color: HL.zinc, fontWeight: 500 }}>{r.when}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: HL.ink, marginTop: 3 }}>{r.title}</div>
            <div style={{ fontSize: 13, color: HL.zinc, marginTop: 2 }}>{r.venue}</div>
            <div style={{ marginTop: 8, fontSize: 13, fontWeight: 600,
              color: r.price === 'Free' ? HL.emerald : HL.ink }}>{r.price}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Mobile treatment ──────────────────────────────────────────────── */

function VarA_Mobile() {
  const [open, setOpen] = React.useState(false);
  const [active] = React.useState({
    categories: ['Music'],
    goodFor: ['Date night'],
    budget: null,
  });

  return (
    <div style={{ background: HL.white, minHeight: 760, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <MobileHeader />

      <div style={{
        position: 'sticky', top: 0, zIndex: 5, background: HL.pure,
        borderBottom: `1px solid ${HL.mist}`, padding: '12px 16px',
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 12px', background: HL.cloud, borderRadius: 999,
          }}>
            <div style={{ color: HL.zinc }}><IconSearch size={15} /></div>
            <span style={{ fontSize: 14, color: HL.zinc }}>Search</span>
          </div>
          <button onClick={() => setOpen(true)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '9px 14px', background: HL.ink, color: HL.pure,
            border: 0, borderRadius: 999, fontSize: 13, fontWeight: 700,
            fontFamily: 'inherit', cursor: 'pointer',
          }}>
            <IconSliders size={14} /> Filters
            <span style={{
              background: HL.blue, color: HL.pure, fontSize: 10.5, fontWeight: 700,
              padding: '1px 6px', borderRadius: 999,
            }}>2</span>
          </button>
        </div>
        {/* Active tokens row — mobile scrolls horizontally */}
        <div style={{
          marginTop: 10, display: 'flex', gap: 6, overflowX: 'auto',
          scrollbarWidth: 'none',
        }}>
          <Token label="Music" color={HL.blue} onRemove={() => {}} />
          <Token label="Date night" onRemove={() => {}} />
          <QuickPick label="+ Tonight" />
          <QuickPick label="+ Free" accent={HL.emerald} />
        </div>
      </div>

      <div style={{ padding: '24px 16px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', color: HL.ink, margin: 0 }}>All Events</h1>
        <div style={{ marginTop: 4, color: HL.zinc, fontSize: 13 }}>
          <b style={{ color: HL.ink }}>89</b> events match
        </div>

        {/* Mobile cards */}
        <div style={{ marginTop: 18, display: 'grid', gap: 14 }}>
          {[
            { title: 'Jazz at the Pabst', venue: 'Pabst Theater', when: 'Tonight · 8pm', cat: 'Music', color: HL.blue, price: 'Free' },
            { title: 'Taco Fest MKE', venue: 'Lakefront', when: 'Sat · 12pm', cat: 'Food & Drink', color: HL.orange, price: '$15' },
            { title: 'Gallery Night', venue: 'Third Ward', when: 'Fri · 5pm', cat: 'Arts & Culture', color: HL.teal, price: 'Free' },
          ].map((r, i) => (
            <div key={i} style={{
              background: HL.pure, border: `1px solid ${HL.mist}`, borderRadius: 16,
              display: 'flex', gap: 12, padding: 10,
            }}>
              <div style={{
                width: 86, height: 86, borderRadius: 12,
                background: `repeating-linear-gradient(45deg, ${r.color}22 0 10px, ${r.color}11 10px 20px)`,
                flexShrink: 0,
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{
                  padding: '2px 8px', background: `${r.color}1f`, color: r.color,
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                  borderRadius: 999,
                }}>{r.cat}</span>
                <div style={{ fontSize: 15, fontWeight: 700, color: HL.ink, marginTop: 5 }}>{r.title}</div>
                <div style={{ fontSize: 12, color: HL.zinc, marginTop: 2 }}>{r.when} · {r.venue}</div>
                <div style={{ marginTop: 5, fontSize: 13, fontWeight: 600,
                  color: r.price === 'Free' ? HL.emerald : HL.ink }}>{r.price}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {open && <MobileSheet onClose={() => setOpen(false)} />}
    </div>
  );
}

function MobileSheet({ onClose }) {
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      background: HL.pure, zIndex: 30, display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px', borderBottom: `1px solid ${HL.mist}`,
      }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: HL.ink }}>All filters</h2>
        <button onClick={onClose} style={{
          width: 32, height: 32, background: HL.cloud, border: 0, borderRadius: 999,
          display: 'grid', placeItems: 'center', cursor: 'pointer', color: HL.ink,
        }}><IconClose /></button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '4px 16px 16px' }}>
        <SheetGroup title="Category" icon={<IconTag />}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {CATEGORIES.slice(0, 9).map(c => (
              <span key={c.name} style={{
                padding: '6px 10px', borderRadius: 999,
                background: c.name === 'Music' ? c.color : HL.pure,
                color: c.name === 'Music' ? HL.pure : HL.ink,
                border: `1px solid ${c.name === 'Music' ? c.color : HL.mist}`,
                fontSize: 12.5, fontWeight: 600,
              }}>{c.name}</span>
            ))}
            <span style={{
              padding: '6px 10px', borderRadius: 999, background: HL.cloud,
              color: HL.zinc, fontSize: 12.5, fontWeight: 600,
            }}>+ 6 more</span>
          </div>
        </SheetGroup>
        <SheetGroup title="Good for" icon={<IconSparkles />}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {GOOD_FOR.slice(0, 6).map(g => (
              <span key={g} style={{
                padding: '6px 10px', borderRadius: 999,
                background: g === 'Date night' ? HL.ink : HL.pure,
                color: g === 'Date night' ? HL.pure : HL.ink,
                border: `1px solid ${g === 'Date night' ? HL.ink : HL.mist}`,
                fontSize: 12.5, fontWeight: 600,
              }}>{g}</span>
            ))}
          </div>
        </SheetGroup>
        <SheetGroup title="When" icon={<IconClock />}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {['Today', 'Tomorrow', 'This weekend', 'Next 7 days'].map(d => <DateBtn key={d} label={d} />)}
          </div>
        </SheetGroup>
        <SheetGroup title="Budget" icon={<IconWallet />} collapsed />
        <SheetGroup title="Neighborhood" icon={<IconMapPin />} collapsed />
      </div>
      <div style={{
        display: 'flex', gap: 10, padding: '14px 16px',
        borderTop: `1px solid ${HL.mist}`,
      }}>
        <button style={{
          padding: '12px 16px', background: HL.pure, border: `1px solid ${HL.mist}`,
          borderRadius: 999, fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
        }}>Clear</button>
        <button style={{
          flex: 1, padding: '12px 16px', background: HL.blue, color: HL.pure,
          border: 0, borderRadius: 999, fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
        }}>Show 89 events</button>
      </div>
    </div>
  );
}

Object.assign(window, { VarA_Desktop, VarA_Mobile });
