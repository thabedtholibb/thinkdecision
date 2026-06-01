/* Shared components for DecideAI prototype */
const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ------------------------------------------------------------
// Brand mark — abstract decision tree glyph (no external icons)
// ------------------------------------------------------------
function Logo({ size = 28, withWord = true }) {
  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
        <defs>
          <linearGradient id="lg1" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#6366f1"/>
            <stop offset="100%" stopColor="#312e81"/>
          </linearGradient>
        </defs>
        <rect x="1" y="1" width="30" height="30" rx="8" fill="url(#lg1)"/>
        <circle cx="16" cy="9" r="2.4" fill="#fff"/>
        <circle cx="9" cy="20" r="2" fill="#c7d2fe"/>
        <circle cx="16" cy="20" r="2" fill="#c7d2fe"/>
        <circle cx="23" cy="20" r="2" fill="#c7d2fe"/>
        <path d="M16 11.4 L9 18 M16 11.4 L16 18 M16 11.4 L23 18" stroke="#a5b4fc" strokeWidth="1.2" strokeLinecap="round"/>
        <path d="M9 22 v3 M16 22 v3 M23 22 v3" stroke="#a5b4fc" strokeWidth="1.2" strokeLinecap="round"/>
        <circle cx="9" cy="27" r="1.4" fill="#e0e7ff"/>
        <circle cx="16" cy="27" r="1.4" fill="#e0e7ff"/>
        <circle cx="23" cy="27" r="1.4" fill="#e0e7ff"/>
      </svg>
      {withWord && (
        <div className="flex items-baseline gap-1">
          <span className="font-display text-[19px] leading-none text-ink-900 dark:text-ink-50">Think</span>
          <span className="font-display text-[19px] leading-none text-brand-600 dark:text-brand-400">Decision</span>
        </div>
      )}
    </div>
  );
}

// Tiny inline icons (stroke-based, single-style)
function Icon({ name, className = "w-4 h-4", strokeWidth = 1.8 }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const map = {
    grid:        <><rect x="3" y="3" width="7" height="7" {...p}/><rect x="14" y="3" width="7" height="7" {...p}/><rect x="3" y="14" width="7" height="7" {...p}/><rect x="14" y="14" width="7" height="7" {...p}/></>,
    plus:        <><path d="M12 5v14M5 12h14" {...p}/></>,
    minus:       <><path d="M5 12h14" {...p}/></>,
    check:       <><path d="M5 13l4 4L19 7" {...p}/></>,
    x:           <><path d="M6 6l12 12M18 6L6 18" {...p}/></>,
    bell:        <><path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9zM10 21a2 2 0 0 0 4 0" {...p}/></>,
    user:        <><circle cx="12" cy="8" r="4" {...p}/><path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6" {...p}/></>,
    users:       <><circle cx="9" cy="8" r="3.5" {...p}/><path d="M2 20c1-3.5 4-5 7-5s6 1.5 7 5" {...p}/><circle cx="17" cy="9" r="2.8" {...p}/><path d="M14 15c2 0 5 1 6.5 4" {...p}/></>,
    moon:        <><path d="M21 13.5A8.5 8.5 0 1 1 10.5 3a7 7 0 0 0 10.5 10.5z" {...p}/></>,
    sun:         <><circle cx="12" cy="12" r="4" {...p}/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" {...p}/></>,
    chevronR:    <><path d="M9 6l6 6-6 6" {...p}/></>,
    chevronL:    <><path d="M15 6l-6 6 6 6" {...p}/></>,
    chevronD:    <><path d="M6 9l6 6 6-6" {...p}/></>,
    arrowR:      <><path d="M5 12h14M13 6l6 6-6 6" {...p}/></>,
    arrowL:      <><path d="M19 12H5M11 6l-6 6 6 6" {...p}/></>,
    sparkle:     <><path d="M12 3v6M12 15v6M3 12h6M15 12h6M6 6l3 3M15 15l3 3M6 18l3-3M15 9l3-3" {...p}/></>,
    layers:      <><path d="M12 3 2 8l10 5 10-5-10-5zM2 16l10 5 10-5M2 12l10 5 10-5" {...p}/></>,
    chart:       <><path d="M4 20V8M10 20V4M16 20v-7M22 20H2" {...p}/></>,
    download:    <><path d="M12 4v12M6 12l6 6 6-6M4 20h16" {...p}/></>,
    settings:    <><circle cx="12" cy="12" r="3" {...p}/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.5 4.5l2 2M17.5 17.5l2 2M4.5 19.5l2-2M17.5 6.5l2-2" {...p}/></>,
    flask:       <><path d="M9 3h6M10 3v6L4 20a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3l-6-11V3" {...p}/></>,
    file:        <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6" {...p}/></>,
    eye:         <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" {...p}/><circle cx="12" cy="12" r="3" {...p}/></>,
    edit:        <><path d="M3 21l4-1 11-11-3-3L4 17l-1 4z" {...p}/></>,
    trash:       <><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M5 6l1 14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-14" {...p}/></>,
    send:        <><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" {...p}/></>,
    mail:        <><rect x="3" y="5" width="18" height="14" rx="2" {...p}/><path d="M3 7l9 7 9-7" {...p}/></>,
    lock:        <><rect x="4" y="11" width="16" height="10" rx="2" {...p}/><path d="M8 11V7a4 4 0 1 1 8 0v4" {...p}/></>,
    home:        <><path d="M3 11l9-8 9 8M5 9v11h14V9" {...p}/></>,
    book:        <><path d="M4 4h11a4 4 0 0 1 4 4v13H8a4 4 0 0 1-4-4z M4 17a4 4 0 0 1 4-4h11" {...p}/></>,
    info:        <><circle cx="12" cy="12" r="9" {...p}/><path d="M12 8h.01M11 12h1v5h1" {...p}/></>,
    warn:        <><path d="M12 3 2 21h20L12 3z M12 9v6M12 18h.01" {...p}/></>,
    star:        <><path d="m12 3 2.7 6 6.3.6-4.8 4.3 1.4 6.5L12 17l-5.6 3.4 1.4-6.5L3 9.6 9.3 9z" {...p}/></>,
    refresh:     <><path d="M3 12a9 9 0 0 1 15-6.7L21 8 M21 3v5h-5 M21 12a9 9 0 0 1-15 6.7L3 16 M3 21v-5h5" {...p}/></>,
    target:      <><circle cx="12" cy="12" r="9" {...p}/><circle cx="12" cy="12" r="5" {...p}/><circle cx="12" cy="12" r="1.5" {...p}/></>,
    branch:      <><circle cx="6" cy="5" r="2" {...p}/><circle cx="6" cy="19" r="2" {...p}/><circle cx="18" cy="12" r="2" {...p}/><path d="M6 7v10M8 5h6a4 4 0 0 1 4 4v1M6 17a6 6 0 0 0 6-6" {...p}/></>,
    search:      <><circle cx="11" cy="11" r="7" {...p}/><path d="m20 20-3.5-3.5" {...p}/></>,
    play:        <><path d="M6 4l14 8-14 8z" {...p}/></>,
    save:        <><path d="M5 3h11l3 3v15H5z M8 3v6h8V3 M8 21v-7h8v7" {...p}/></>,
    logout:      <><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4 M10 17l-5-5 5-5 M5 12h12" {...p}/></>,
  };
  return <svg viewBox="0 0 24 24" className={className} aria-hidden="true">{map[name] || null}</svg>;
}

// ------------------------------------------------------------
// Form primitives
// ------------------------------------------------------------
function Button({ children, variant = 'primary', size = 'md', icon, iconRight, full, type = 'button', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap relative overflow-hidden group';
  const sizes = { sm: 'h-8 px-3 text-[13px]', md: 'h-10 px-4 text-sm', lg: 'h-11 px-5 text-[15px]' };
  const variants = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 hover:shadow-lg hover:shadow-brand-600/30 shadow-md shadow-brand-600/20 hover:translate-y-[-2px]',
    secondary: 'bg-white dark:bg-ink-800 text-ink-800 dark:text-ink-100 border border-ink-200 dark:border-ink-700 hover:bg-ink-50 dark:hover:bg-ink-700 hover:shadow-md hover:shadow-ink-400/10 dark:hover:shadow-ink-700/20 hover:translate-y-[-1px]',
    ghost:  'text-ink-700 dark:text-ink-200 hover:bg-ink-100 dark:hover:bg-ink-800 hover:shadow-sm',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 hover:shadow-lg hover:shadow-rose-600/30 shadow-md shadow-rose-600/20 hover:translate-y-[-2px]',
    success:'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-600/30 shadow-md shadow-emerald-600/20 hover:translate-y-[-2px]',
    outline:'bg-transparent border border-brand-300 dark:border-brand-700 text-brand-700 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-950 hover:border-brand-500 dark:hover:border-brand-500 hover:shadow-sm',
  };
  return (
    <button type={type} className={classNames(base, sizes[size], variants[variant], full && 'w-full', className)} {...props}>
      {/* Shimmer overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500 pointer-events-none" />
      {icon && <Icon name={icon} className="w-4 h-4" />}
      <span className="relative">{children}</span>
      {iconRight && <Icon name={iconRight} className="w-4 h-4" />}
    </button>
  );
}

function Input({ label, hint, error, icon, className = '', as = 'input', state = 'default', helperText = null, ...props }) {
  const Tag = as;

  // State styling
  const stateStyles = {
    'default': {
      border: 'border-ink-200 dark:border-ink-700',
      bg: 'bg-white dark:bg-ink-900',
      focus: 'focus:ring-brand-500/30 focus:border-brand-400',
      helperText: 'text-ink-500 dark:text-ink-400',
    },
    'valid': {
      border: 'border-emerald-400 dark:border-emerald-600',
      bg: 'bg-emerald-50/40 dark:bg-emerald-950/20',
      focus: 'focus:ring-emerald-500/30 focus:border-emerald-500',
      helperText: 'text-emerald-700 dark:text-emerald-300',
      icon: 'check',
    },
    'invalid': {
      border: 'border-rose-400 dark:border-rose-600',
      bg: 'bg-rose-50/40 dark:bg-rose-950/20',
      focus: 'focus:ring-rose-500/30 focus:border-rose-500',
      helperText: 'text-rose-700 dark:text-rose-300',
      icon: 'close',
    },
    'warning': {
      border: 'border-amber-400 dark:border-amber-600',
      bg: 'bg-amber-50/40 dark:bg-amber-950/20',
      focus: 'focus:ring-amber-500/30 focus:border-amber-500',
      helperText: 'text-amber-700 dark:text-amber-300',
      icon: 'alertCircle',
    },
  };

  const style = stateStyles[state] || stateStyles['default'];
  const displayError = error || (state === 'invalid' && helperText);
  const displayHint = helperText || hint;

  return (
    <label className={classNames('block', className)}>
      {label && <span className="block text-[13px] font-medium text-ink-700 dark:text-ink-200 mb-1.5">{label}</span>}
      <div className={classNames('relative flex items-center', (icon || style.icon) && 'pl-0')}>
        {icon && <span className="absolute left-3 text-ink-400"><Icon name={icon} /></span>}
        {!icon && style.icon && (
          <span className={classNames('absolute right-3', state === 'valid' && 'text-emerald-600', state === 'invalid' && 'text-rose-600', state === 'warning' && 'text-amber-600')}>
            <Icon name={style.icon} className="w-4 h-4" />
          </span>
        )}
        <Tag
          className={classNames(
            'block w-full border rounded-lg text-sm text-ink-900 dark:text-ink-100 transition-all duration-150',
            'placeholder:text-ink-400 dark:placeholder:text-ink-500',
            'focus:outline-none focus:ring-2',
            style.border,
            style.bg,
            style.focus,
            icon ? 'pl-10' : 'px-3',
            style.icon && !icon ? 'pr-10' : 'pr-3',
            as === 'textarea' ? 'py-2.5 min-h-[88px] px-3' : 'h-10',
          )}
          {...props}
        />
      </div>
      {displayHint && !displayError && <span className={classNames('block text-xs mt-1.5', style.helperText)}>{displayHint}</span>}
      {displayError && <span className={classNames('block text-xs mt-1.5', style.helperText)}>{displayError}</span>}
    </label>
  );
}

function Card({ children, className = '', as: As = 'div', ...rest }) {
  return (
    <As className={classNames(
      'bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-xl',
      className
    )} {...rest}>
      {children}
    </As>
  );
}

function Badge({ children, tone = 'slate', icon, className = '' }) {
  const tones = {
    slate:   'bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-300',
    brand:   'bg-brand-100 text-brand-800 dark:bg-brand-950/60 dark:text-brand-300',
    green:   'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
    yellow:  'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
    red:     'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
    sky:     'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300',
    violet:  'bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300',
  };
  return (
    <span className={classNames('inline-flex items-center gap-1 px-2 h-6 rounded-md text-[11px] font-medium leading-none', tones[tone], className)}>
      {icon && <Icon name={icon} className="w-3 h-3" strokeWidth={2.2}/>}
      {children}
    </span>
  );
}

function StatusBadge({ status }) {
  const map = {
    draft:       { tone: 'slate',  label: 'Draft' },
    active:      { tone: 'sky',    label: 'Aktif' },
    completed:   { tone: 'green',  label: 'Selesai' },
    invited:     { tone: 'slate',  label: 'Diundang' },
    in_progress: { tone: 'yellow', label: 'Mengisi' },
    declined:    { tone: 'red',    label: 'Menolak' },
  };
  const m = map[status] || { tone: 'slate', label: status };
  const dotColor = { slate:'bg-ink-400', sky:'bg-sky-500', green:'bg-emerald-500', yellow:'bg-amber-500', red:'bg-rose-500', brand:'bg-brand-500', violet:'bg-violet-500' }[m.tone];
  return (
    <Badge tone={m.tone}>
      <span className={classNames('w-1.5 h-1.5 rounded-full', dotColor)}/>
      {m.label}
    </Badge>
  );
}

function MethodBadge({ method }) {
  const tone = method?.startsWith('Fuzzy') ? 'violet' : method === 'ANP' ? 'sky' : 'brand';
  return <Badge tone={tone}>{method}</Badge>;
}

// Avatar (initials)
function Avatar({ name = '', color = '#6366f1', size = 32 }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0]?.toUpperCase()).join('');
  return (
    <span style={{ width:size, height:size, background:color }} className="inline-flex items-center justify-center rounded-full text-white font-semibold text-[12px] shrink-0">
      {initials || '·'}
    </span>
  );
}

// ------------------------------------------------------------
// Layout shell — sidebar + topbar
// ------------------------------------------------------------
function Sidebar({ items, active, onChange, footer, isOpen = true, onToggle }) {
  return (
    <>
      <aside className={classNames(
        'shrink-0 relative z-30 border-r border-ink-200 dark:border-ink-800 bg-gradient-to-b from-brand-50 to-white dark:from-brand-950/20 dark:to-ink-900 flex flex-col transition-all duration-200',
        isOpen ? 'w-[240px]' : 'w-16'
      )}>
        <div className={classNames('px-5 py-4 border-b border-ink-200 dark:border-ink-800 flex items-center justify-between')}>
          {isOpen && <Logo />}
          <button onClick={onToggle} className={classNames(
            'w-8 h-8 grid place-items-center rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 text-ink-600 dark:text-ink-300 transition',
            !isOpen && 'mx-auto'
          )} title={isOpen ? 'Tutup sidebar' : 'Buka sidebar'}>
            <Icon name={isOpen ? 'chevronL' : 'chevronR'} className="w-4 h-4" />
          </button>
        </div>
        <nav className="p-3 space-y-0.5 flex-1">
          {items.map(it => (
            <button key={it.id} onClick={() => onChange(it.id)} title={isOpen ? '' : it.label}
              className={classNames(
                'w-full flex items-center gap-1.5 pl-3 pr-3 h-9 rounded-lg text-[13.5px] font-medium transition justify-start',
                active === it.id
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300'
                  : 'text-ink-600 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-800/60',
              )}>
              <Icon name={it.icon} className="w-4 h-4 shrink-0" />
              {isOpen && (
                <>
                  <span className="truncate">{it.label}</span>
                  {it.badge != null && (
                    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-brand-100 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 shrink-0">
                      {it.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          ))}
        </nav>
        {isOpen && footer}
      </aside>
    </>
  );
}

function TopBar({ title, subtitle, actions, breadcrumbs, theme, onToggleTheme, onSwitchRole, role, notifications = [], unreadCount = 0, onMarkAsRead, onMarkAllAsRead }) {
  return (
    <header className="h-16 px-6 flex items-center justify-between border-b border-ink-200 dark:border-ink-800 bg-white/70 dark:bg-ink-900/60 backdrop-blur sticky top-0 z-20">
      <div className="min-w-0">
        {breadcrumbs && (
          <div className="flex items-center gap-1.5 text-[12px] text-ink-500 dark:text-ink-400 mb-0.5">
            {breadcrumbs.map((b, i) => (
              <React.Fragment key={i}>
                <span className={i === breadcrumbs.length - 1 ? 'text-ink-700 dark:text-ink-200 font-medium' : ''}>{b}</span>
                {i < breadcrumbs.length - 1 && <Icon name="chevronR" className="w-3 h-3 opacity-60"/>}
              </React.Fragment>
            ))}
          </div>
        )}
        <h1 className="font-serif text-[22px] leading-tight text-ink-900 dark:text-ink-50 truncate">{title}</h1>
        {subtitle && <p className="text-[12.5px] text-ink-500 dark:text-ink-400 -mt-0.5 truncate">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {actions}
        {(notifications.length > 0 || unreadCount > 0) && (
          <NotificationCenter
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAsRead={onMarkAsRead}
            onMarkAllAsRead={onMarkAllAsRead}
          />
        )}
        <button onClick={onToggleTheme} className="h-9 w-9 grid place-items-center rounded-lg border border-ink-200 dark:border-ink-700 hover:bg-ink-50 dark:hover:bg-ink-800 text-ink-600 dark:text-ink-300" title="Toggle theme">
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
        </button>
      </div>
    </header>
  );
}

// ------------------------------------------------------------
// Stepper / progress
// ------------------------------------------------------------
function Stepper({ steps, current }) {
  return (
    <ol className="flex items-center gap-3">
      {steps.map((s, i) => {
        const done = i < current, active = i === current;
        return (
          <li key={s.id} className="flex items-center gap-3 min-w-0 flex-1">
            <div className={classNames(
              'flex items-center gap-2.5 min-w-0',
              active ? 'text-ink-900 dark:text-ink-50' : done ? 'text-ink-700 dark:text-ink-200' : 'text-ink-400 dark:text-ink-500',
            )}>
              <span className={classNames(
                'shrink-0 w-7 h-7 rounded-full grid place-items-center text-[12px] font-semibold',
                done ? 'bg-emerald-600 text-white' : active ? 'bg-brand-600 text-white' : 'bg-ink-100 dark:bg-ink-800 text-ink-500 dark:text-ink-400',
              )}>
                {done ? <Icon name="check" className="w-3.5 h-3.5"/> : i + 1}
              </span>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold leading-tight truncate">{s.label}</div>
                <div className="text-[11px] text-ink-500 dark:text-ink-400 leading-tight truncate">{s.hint}</div>
              </div>
            </div>
            {i < steps.length - 1 && <div className={classNames('h-px flex-1 mx-1', done ? 'bg-emerald-400/60' : 'bg-ink-200 dark:bg-ink-800')}/>}
          </li>
        );
      })}
    </ol>
  );
}

// ------------------------------------------------------------
// Saaty scale input — slider + text input with discrete steps + label (Improvement 6)
// ------------------------------------------------------------
function SaatyScaleInput({ value = 1, onChange, leftLabel = 'A', rightLabel = 'B' }) {
  const steps = SAATY_STEPS;
  const [inputMode, setInputMode] = useState(false);
  const [textValue, setTextValue] = useState('');

  // Find exact matching index with very tight tolerance
  let idx = steps.findIndex(v => Math.abs(v - value) < 1e-9);
  if (idx < 0) {
    idx = steps.reduce((best, v, i) => {
      const distBest = Math.abs(steps[best] - value);
      const distCur = Math.abs(v - value);
      return distCur < distBest ? i : best;
    }, 0);
  }
  const cur = steps[idx];
  const isDominantLeft = cur > 1;
  const displayValue = cur > 1 ? Math.round(cur * 1000) / 1000 : (1 / Math.round(1 / cur * 1000) * 1000);

  const parseTextInput = (text) => {
    const trimmed = text.trim();
    if (!trimmed) return null;
    if (trimmed.includes('/')) {
      const [num, den] = trimmed.split('/').map(s => parseFloat(s.trim()));
      if (!isNaN(num) && !isNaN(den) && den !== 0) return num / den;
    }
    const parsed = parseFloat(trimmed);
    if (!isNaN(parsed) && parsed > 0) return parsed;
    return null;
  };

  const handleTextChange = () => {
    const parsed = parseTextInput(textValue);
    if (parsed !== null) {
      let nearest = 0, minDist = Infinity;
      steps.forEach((s, i) => {
        const dist = Math.abs(Math.log(s) - Math.log(parsed));
        if (dist < minDist) { minDist = dist; nearest = i; }
      });
      onChange(steps[nearest]);
      setInputMode(false);
      setTextValue('');
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-[11px] font-medium text-ink-600 dark:text-ink-300 mb-1">
        <span className={classNames("truncate max-w-[40%]", isDominantLeft && 'font-bold text-ink-900 dark:text-ink-100')}>{leftLabel} {isDominantLeft ? 'dominan' : ''}</span>
        <span className={classNames(
          'tabular-nums px-2 h-5 rounded grid place-items-center text-[11px] cursor-pointer hover:opacity-80 transition',
          cur === 1 ? 'bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300' :
          cur > 1  ? 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300' :
                     'bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300'
        )} onClick={() => setInputMode(true)} title="Klik untuk edit nilai">
          {saatyToFraction(cur)} {cur !== 1 ? `(${displayValue.toFixed(3)})` : ''} · {saatyLabel(cur)}
        </span>
        <span className={classNames("truncate max-w-[40%] text-right", !isDominantLeft && 'font-bold text-ink-900 dark:text-ink-100')}>{!isDominantLeft ? 'dominan ' : ''}{rightLabel}</span>
      </div>

      {inputMode ? (
        <div className="flex items-center gap-1.5 mb-1.5">
          <input
            type="text"
            value={textValue}
            onChange={e => setTextValue(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleTextChange();
              if (e.key === 'Escape') { setInputMode(false); setTextValue(''); }
            }}
            placeholder="cth: 3, 1/5, 0.33"
            autoFocus
            className="flex-1 px-2 h-7 text-[11px] bg-white dark:bg-ink-900 border border-brand-400 dark:border-brand-600 rounded text-ink-900 dark:text-ink-100 focus:outline-none"
          />
          <button onClick={handleTextChange} className="h-7 px-2 text-[10px] bg-brand-500 text-white rounded hover:bg-brand-600 font-medium">OK</button>
          <button onClick={() => { setInputMode(false); setTextValue(''); }} className="h-7 px-2 text-[10px] bg-ink-200 dark:bg-ink-700 text-ink-700 dark:text-ink-200 rounded hover:bg-ink-300 dark:hover:bg-ink-600 font-medium">Batalkan</button>
        </div>
      ) : (
        <>
          {/* Saaty Scale Labels */}
          <div className="mb-2.5 bg-ink-50 dark:bg-ink-900/40 rounded-lg p-2 border border-ink-100 dark:border-ink-800">
            <div className="flex justify-between text-[10px] font-medium gap-1">
              {[
                { val: 1/9, label: 'Ekstrem', pos: 0 },
                { val: 1/5, label: 'Sangat Kuat', pos: 3 },
                { val: 1/3, label: 'Kuat', pos: 6 },
                { val: 1, label: 'Sama Penting', pos: 8 },
                { val: 3, label: 'Kuat', pos: 10 },
                { val: 5, label: 'Sangat Kuat', pos: 13 },
                { val: 9, label: 'Ekstrem', pos: 16 }
              ].map((scale, i) => {
                const isSelected = Math.abs(cur - scale.val) < 0.01;
                return (
                  <button key={i} onClick={() => onChange(scale.val)}
                    className={classNames(
                      'flex-1 px-1 py-1 rounded text-[9px] leading-tight transition',
                      isSelected
                        ? 'bg-brand-500 dark:bg-brand-600 text-white font-bold shadow-sm'
                        : 'bg-white dark:bg-ink-800 text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-700'
                    )}
                    title={saatyToFraction(scale.val)}
                  >
                    <div className="font-semibold">{saatyToFraction(scale.val)}</div>
                    <div className="truncate">{scale.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slider */}
          <input
            type="range" min={0} max={steps.length - 1} step={1} value={idx}
            onChange={e => {
              const newIdx = parseInt(e.target.value, 10);
              const newValue = steps[newIdx];
              onChange(newValue);
            }}
            className="w-full"
          />
          <div className="flex justify-between text-[9px] text-ink-400 mt-0.5 font-mono">
            <span>1/9</span><span>1/5</span><span>1/3</span><span className="font-bold text-ink-500">1</span><span>3</span><span>5</span><span>9</span>
          </div>
        </>
      )}
    </div>
  );
}

// ------------------------------------------------------------
// Triangular Fuzzy Number slider
// ------------------------------------------------------------
function TFNSlider({ value = [1,1,1], onChange }) {
  const [l, m, u] = value;
  const set = (idx, v) => {
    const next = [...value];
    next[idx] = parseFloat(v);
    // enforce l <= m <= u
    if (next[0] > next[1]) next[1] = next[0];
    if (next[1] > next[2]) next[2] = next[1];
    if (idx === 1 && next[1] < next[0]) next[0] = next[1];
    if (idx === 2 && next[2] < next[1]) next[1] = next[2];
    onChange(next);
  };
  // viz
  const w = 220, h = 56;
  const min = 1/9, max = 9;
  const x = (v) => {
    // log scale because Saaty span
    const lo = Math.log(min), hi = Math.log(max);
    return ((Math.log(Math.max(min, v)) - lo) / (hi - lo)) * w;
  };
  const lx = x(l), mx = x(m), ux = x(u);
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2 text-[11px]">
        {['l (lower)','m (mode)','u (upper)'].map((lbl, i) => (
          <label key={lbl} className="space-y-1">
            <div className="flex justify-between text-ink-600 dark:text-ink-300"><span>{lbl}</span><span className="font-mono tabular-nums">{value[i].toFixed(2)}</span></div>
            <input type="range" min={1/9} max={9} step={0.1} value={value[i]} onChange={e => set(i, e.target.value)} className="w-full"/>
          </label>
        ))}
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-12">
        <line x1="0" y1={h-8} x2={w} y2={h-8} stroke="currentColor" className="text-ink-200 dark:text-ink-700" strokeWidth="1"/>
        <line x1={x(1)} y1="2" x2={x(1)} y2={h-6} stroke="currentColor" className="text-ink-300 dark:text-ink-600" strokeDasharray="2 3" strokeWidth="0.8"/>
        <polygon points={`${lx},${h-8} ${mx},6 ${ux},${h-8}`} fill="rgba(99,102,241,0.18)" stroke="#6366f1" strokeWidth="1.4" strokeLinejoin="round"/>
        <circle cx={mx} cy="6" r="2.6" fill="#4f46e5"/>
        <circle cx={lx} cy={h-8} r="2.2" fill="#818cf8"/>
        <circle cx={ux} cy={h-8} r="2.2" fill="#818cf8"/>
      </svg>
    </div>
  );
}

// ------------------------------------------------------------
// Consistency indicator
// ------------------------------------------------------------
function ConsistencyIndicator({ cr, compact }) {
  const ok = cr <= 0.10;
  const warn = cr > 0.10 && cr <= 0.15;
  const bad = cr > 0.15;
  const tone = ok ? 'green' : warn ? 'yellow' : 'red';
  const label = ok ? 'Konsisten' : warn ? 'Perlu Review' : 'Tidak Konsisten';
  if (compact) {
    return <Badge tone={tone} icon={ok ? 'check' : warn ? 'info' : 'warn'}>CR {cr.toFixed(3)}</Badge>;
  }
  return (
    <div className={classNames(
      'flex items-center gap-3 px-3.5 py-2.5 rounded-lg border',
      ok ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900' :
      warn ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900' :
            'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900',
    )}>
      <div className={classNames(
        'w-9 h-9 rounded-full grid place-items-center text-white',
        ok ? 'bg-emerald-600' : warn ? 'bg-amber-500' : 'bg-rose-600',
      )}>
        <Icon name={ok ? 'check' : warn ? 'info' : 'warn'} className="w-4 h-4" strokeWidth={2.2}/>
      </div>
      <div className="min-w-0">
        <div className={classNames('text-[13px] font-semibold',
          ok ? 'text-emerald-800 dark:text-emerald-200' : warn ? 'text-amber-800 dark:text-amber-200' : 'text-rose-800 dark:text-rose-200',
        )}>{label} · CR = {cr.toFixed(3)}</div>
        <div className="text-[11.5px] text-ink-600 dark:text-ink-400 leading-snug">
          {ok && 'CR ≤ 0.10 — penilaian Anda dapat dipertanggungjawabkan.'}
          {warn && 'CR antara 0.10–0.15 — sebaiknya tinjau ulang baris yang ditandai kuning.'}
          {bad && 'CR > 0.15 — rasio inkonsistensi tinggi, mohon perbaiki sel berwarna merah.'}
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Pairwise matrix — interactive with reciprocal autofill
// ------------------------------------------------------------
function PairwiseMatrix({ items, values, onChange, mode = 'saaty' }) {
  // values: {`${i}-${j}`: number} for i<j only; fuzzy: triple [l,m,u]
  const n = items.length;
  // compute current numeric matrix for highlighting + CR (saaty mode)
  const numericMatrix = useMemo(() => {
    if (mode !== 'saaty') return null;
    return buildMatrix(n, values);
  }, [n, values, mode]);
  const cr = useMemo(() => {
    if (!numericMatrix || n < 3) return null;
    return ahpCRfromMatrix(numericMatrix);
  }, [numericMatrix, n]);

  // Calculate problematic pairs using sensitivity analysis
  const crImpactData = useMemo(() => {
    if (!numericMatrix || !cr || cr.CR <= 0.10) return { topPairs: [], currentCR: 0 };
    const itemNames = items.map(it => it.name);
    return calculateCRImpact(numericMatrix, itemNames);
  }, [numericMatrix, cr, items]);

  // detect inconsistent cells/rows for highlighting
  const inconsistent = useMemo(() => {
    if (!numericMatrix) return { rows: new Set(), cells: new Set() };
    const rows = new Set();
    const cells = new Set();
    if (cr && cr.CR > 0.10) {
      // find rows with largest deviation from priority vector
      const w = cr.w;
      const devs = [];
      for (let i = 0; i < n; i++) {
        let aw = 0;
        for (let j = 0; j < n; j++) aw += numericMatrix[i][j] * w[j];
        devs.push(Math.abs(aw / (w[i]||1e-9) - n));
      }
      const max = Math.max(...devs);
      devs.forEach((d, i) => { if (d > max * 0.7) rows.add(i); });

      // Highlight specific problematic pairs
      crImpactData.topPairs.forEach(pair => {
        cells.add(`${pair.i}-${pair.j}`);
      });
    }
    return { rows, cells };
  }, [numericMatrix, cr, n, crImpactData]);

  const setCell = (i, j, v) => {
    onChange({ ...values, [`${i}-${j}`]: v });
  };

  const filled = Object.keys(values).length;
  const total  = (n * (n - 1)) / 2;

  return (
    <div className="space-y-4">
      {/* CR Guidance Alert */}
      {cr && cr.CR > 0.10 && crImpactData.topPairs.length > 0 && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-lg">
          <div className="text-[12px] font-semibold text-rose-900 dark:text-rose-200 mb-2">
            CR = {cr.CR.toFixed(3)} (Tinggi). Coba sesuaikan pasangan:
          </div>
          <ul className="text-[11px] text-rose-800 dark:text-rose-300 space-y-1">
            {crImpactData.topPairs.map((pair, idx) => (
              <li key={idx}>
                • <span className="font-medium">{pair.itemA} vs {pair.itemB}</span>
                (potensi kurangi CR hingga {(pair.crReductionPotential * 100).toFixed(1)}%)
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="overflow-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="p-2 sticky left-0 bg-ink-50 dark:bg-ink-900/60 border-b border-r border-ink-200 dark:border-ink-800 text-left text-[12px] font-medium text-ink-500"></th>
              {items.map((it, j) => (
                <th key={j} className="p-2 border-b border-ink-200 dark:border-ink-800 text-[12px] font-semibold text-ink-700 dark:text-ink-200 min-w-[110px]">
                  <div className="truncate">{it.name}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((rowIt, i) => (
              <tr key={i} className={classNames(inconsistent.rows.has(i) && 'bg-rose-50/40 dark:bg-rose-950/20')}>
                <th className="p-2 sticky left-0 bg-white dark:bg-ink-900 border-b border-r border-ink-200 dark:border-ink-800 text-left text-[12px] font-semibold text-ink-700 dark:text-ink-200 whitespace-nowrap">
                  {rowIt.name}
                </th>
                {items.map((colIt, j) => {
                  if (i === j) {
                    return <td key={j} className="p-3 text-center border-b border-ink-200 dark:border-ink-800 text-ink-300 dark:text-ink-600 bg-ink-50/40 dark:bg-ink-900/40">—</td>;
                  }
                  if (i > j) {
                    // reciprocal — read-only display
                    const v = values[`${j}-${i}`];
                    const reciprocal = v ? (Array.isArray(v) ? [1/v[2], 1/v[1], 1/v[0]] : 1/v) : null;
                    const isProblematic = inconsistent.cells.has(`${j}-${i}`);
                    return (
                      <td key={j} className={classNames(
                        'p-3 text-center border-b border-ink-200 dark:border-ink-800 text-ink-400 dark:text-ink-500 italic text-[12px]',
                        isProblematic ? 'bg-rose-100 dark:bg-rose-900/40 border-l-2 border-l-rose-400' : 'bg-ink-50/30 dark:bg-ink-950/30'
                      )}>
                        {reciprocal ? (
                          Array.isArray(reciprocal) ?
                            `[${reciprocal[0].toFixed(2)}, ${reciprocal[1].toFixed(2)}, ${reciprocal[2].toFixed(2)}]` :
                            saatyToFraction(reciprocal)
                        ) : '·'}
                      </td>
                    );
                  }
                  // i < j  → editable
                  const v = values[`${i}-${j}`] || 1;
                  const isProblematic = inconsistent.cells.has(`${i}-${j}`);
                  return (
                    <td key={j} className={classNames(
                      'p-2.5 border-b border-ink-200 dark:border-ink-800 align-middle',
                      isProblematic
                        ? 'bg-rose-100 dark:bg-rose-900/40 border-l-2 border-l-rose-500 shadow-sm'
                        : values[`${i}-${j}`] ? '' : 'bg-amber-50/40 dark:bg-amber-950/10',
                    )}>
                      {mode === 'saaty' ? (
                        <SaatyScaleInput value={v} onChange={(nv) => setCell(i, j, nv)}
                          leftLabel={rowIt.name} rightLabel={colIt.name} />
                      ) : (
                        <TFNSlider value={values[`${i}-${j}`] || [1,1,1]}
                          onChange={(nv) => setCell(i, j, nv)} />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-[12px] text-ink-500 dark:text-ink-400">
          {filled} dari {total} perbandingan terisi
          <div className="w-48 h-1.5 mt-1 bg-ink-100 dark:bg-ink-800 rounded-full overflow-hidden">
            <div className="h-full bg-brand-500" style={{ width: `${(filled/total)*100}%` }}/>
          </div>
        </div>
        {cr && filled === total && <ConsistencyIndicator cr={cr.CR} />}
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Hierarchy viewer — SVG, zoom + pan, click node
// ------------------------------------------------------------
function HierarchyViewer({ data, mode = 'view', onSelect, dependencies = [], maxLevel, height = 360, compact = false }) {
  // data: { goal:{id,name}, criteria:[{id,name,status,weight}], alternatives:[{id,name}] }
  const wrapRef = useRef(null);
  const [tx, setTx] = useState({ x: 0, y: 0, k: 1 });
  const [drag, setDrag] = useState(null);
  const [active, setActive] = useState(null);

  const onWheel = (e) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.0015;
    const k = clamp(tx.k * (1 + delta), 0.5, 2.4);
    setTx(prev => ({ ...prev, k }));
  };
  const onDown = (e) => {
    setDrag({ x: e.clientX - tx.x, y: e.clientY - tx.y });
  };
  const onMove = (e) => {
    if (!drag) return;
    setTx(prev => ({ ...prev, x: e.clientX - drag.x, y: e.clientY - drag.y }));
  };
  const onUp = () => setDrag(null);

  // layout
  const W = 880, H = 480;
  const goal = data.goal;
  const crits = data.criteria || [];
  const alts  = data.alternatives || [];
  const yGoal = 50, yCrit = 200, yAlt = 360;
  const xCenter = W / 2;
  const critX = (i) => xCenter + (i - (crits.length - 1) / 2) * 170;
  const altX  = (i) => xCenter + (i - (alts.length - 1) / 2) * 175;

  const NodeBox = ({ x, y, label, sub, status, kind, onClick, w = 140, h = 52 }) => {
    const colors = {
      ok:    { fill:'#ecfdf5', dark:'#022c22', stroke:'#10b981' },
      part:  { fill:'#fffbeb', dark:'#3b2e0a', stroke:'#f59e0b' },
      none:  { fill:'#f1f5f9', dark:'#1e293b', stroke:'#94a3b8' },
      goal:  { fill:'#eef2ff', dark:'#1e1b4b', stroke:'#6366f1' },
      alt:   { fill:'#ffffff', dark:'#0f172a', stroke:'#64748b' },
    };
    const k = kind === 'goal' ? colors.goal : kind === 'alt' ? colors.alt : (status === 'ok' ? colors.ok : status === 'part' ? colors.part : colors.none);
    const isActive = active === label;
    return (
      <g style={{ cursor: onClick ? 'pointer' : 'default' }}
         onClick={(e)=>{ e.stopPropagation(); setActive(label); onClick && onClick(); }}>
        <rect x={x - w/2} y={y - h/2} width={w} height={h} rx={kind === 'goal' ? 12 : 8}
              fill={k.fill} stroke={isActive ? '#4f46e5' : k.stroke} strokeWidth={isActive ? 2.4 : 1.4}
              className="dark:hidden"/>
        <rect x={x - w/2} y={y - h/2} width={w} height={h} rx={kind === 'goal' ? 12 : 8}
              fill={k.dark} stroke={isActive ? '#a5b4fc' : k.stroke} strokeWidth={isActive ? 2.4 : 1.4}
              className="hidden dark:block"/>
        <text x={x} y={y - 3} textAnchor="middle" className="fill-ink-900 dark:fill-ink-50" style={{ fontSize: 12.5, fontWeight: 600 }}>
          {label.length > 20 ? label.slice(0, 19) + '…' : label}
        </text>
        {sub && <text x={x} y={y + 12} textAnchor="middle" className="fill-ink-500 dark:fill-ink-400" style={{ fontSize: 10 }}>{sub}</text>}
      </g>
    );
  };

  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-gradient-to-br from-ink-50 to-ink-100 dark:from-ink-900 dark:to-ink-950 border border-ink-200 dark:border-ink-800"
         style={{ height }} ref={wrapRef}
         onWheel={onWheel} onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full select-none" style={{ cursor: drag ? 'grabbing' : 'grab' }}>
        <defs>
          <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1" className="fill-ink-300/40 dark:fill-ink-700/40"/>
          </pattern>
          <marker id="arrowDown" viewBox="0 0 10 10" refX="5" refY="9" markerWidth="6" markerHeight="6" orient="0">
            <path d="M 0 0 L 10 0 L 5 10 z" className="fill-ink-400 dark:fill-ink-600"/>
          </marker>
          <marker id="arrowANP" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" className="fill-violet-400 dark:fill-violet-500"/>
          </marker>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots)" opacity="0.4"/>
        <g transform={`translate(${tx.x} ${tx.y}) scale(${tx.k})`}>
          {/* edges goal->crit (AHP - downward) */}
          {(!maxLevel || maxLevel >= 1) && crits.map((c, i) => (
            <path key={`gc-${i}`} d={`M ${xCenter} ${yGoal + 26} C ${xCenter} ${yGoal + 80}, ${critX(i)} ${yCrit - 80}, ${critX(i)} ${yCrit - 26}`}
                  className="stroke-ink-400 dark:stroke-ink-600" fill="none" strokeWidth="1.8" markerEnd="url(#arrowDown)"/>
          ))}
          {/* dependencies (ANP - bidirectional) */}
          {dependencies.map((d, i) => {
            const fi = crits.findIndex(c => c.id === d.from);
            const ti = crits.findIndex(c => c.id === d.to);
            if (fi < 0 || ti < 0) return null;
            const x1 = critX(fi), x2 = critX(ti);
            const cy = yCrit - 60;
            return (
              <path key={`dep-${i}`} d={`M ${x1} ${yCrit-26} Q ${(x1+x2)/2} ${cy}, ${x2} ${yCrit-26}`}
                    fill="none" stroke="#a78bfa" strokeWidth="2" strokeDasharray="4 3" markerEnd="url(#arrowANP)"/>
            );
          })}
          {/* edges crit->alt: each alt connects to ALL crits (canonical AHP) */}
          {!compact && (!maxLevel || maxLevel >= 2) && crits.flatMap((c, ci) =>
            alts.map((a, ai) => (
              <path key={`ca-${ci}-${ai}`} d={`M ${critX(ci)} ${yCrit + 26} C ${critX(ci)} ${yCrit + 80}, ${altX(ai)} ${yAlt - 80}, ${altX(ai)} ${yAlt - 26}`}
                    className="stroke-ink-300 dark:stroke-ink-700" fill="none" strokeWidth="1.2" opacity="0.7" markerEnd="url(#arrowDown)"/>
            ))
          )}
          {/* goal */}
          <NodeBox x={xCenter} y={yGoal} label={goal?.name || 'Goal'} kind="goal" w={210} h={52}
                   onClick={() => onSelect && onSelect({ kind: 'goal', node: goal })}/>
          {/* criteria */}
          {(!maxLevel || maxLevel >= 1) && crits.map((c, i) => (
            <NodeBox key={c.id} x={critX(i)} y={yCrit} label={c.name}
                     sub={c.weight != null ? `w=${c.weight.toFixed(2)}` : (c.status === 'ok' ? 'lengkap' : c.status === 'part' ? 'sebagian' : 'kosong')}
                     status={c.status || 'none'} kind="crit" w={150}
                     onClick={() => onSelect && onSelect({ kind: 'criterion', node: c })}/>
          ))}
          {/* alternatives */}
          {!compact && (!maxLevel || maxLevel >= 2) && alts.map((a, i) => (
            <NodeBox key={a.id} x={altX(i)} y={yAlt} label={a.name} kind="alt" w={150}
                     onClick={() => onSelect && onSelect({ kind: 'alternative', node: a })}/>
          ))}
        </g>
      </svg>
      {/* zoom controls */}
      <div className="absolute right-3 bottom-3 flex flex-col bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-lg shadow-sm overflow-hidden">
        <button onClick={() => setTx(p => ({...p, k: clamp(p.k*1.15, 0.5, 2.4)}))} className="w-8 h-8 grid place-items-center hover:bg-ink-50 dark:hover:bg-ink-800 text-ink-600 dark:text-ink-300"><Icon name="plus"/></button>
        <button onClick={() => setTx(p => ({...p, k: clamp(p.k*0.87, 0.5, 2.4)}))} className="w-8 h-8 grid place-items-center hover:bg-ink-50 dark:hover:bg-ink-800 text-ink-600 dark:text-ink-300 border-t border-ink-200 dark:border-ink-700"><Icon name="minus"/></button>
        <button onClick={() => setTx({x:0,y:0,k:1})} className="w-8 h-8 grid place-items-center hover:bg-ink-50 dark:hover:bg-ink-800 text-ink-600 dark:text-ink-300 border-t border-ink-200 dark:border-ink-700"><Icon name="target"/></button>
      </div>
      {mode === 'edit' && (
        <div className="absolute left-3 top-3 px-2 py-1 rounded-md bg-white/90 dark:bg-ink-900/90 border border-ink-200 dark:border-ink-800 text-[11px] text-ink-600 dark:text-ink-300 backdrop-blur">
          <span className="inline-flex items-center gap-1.5"><Icon name="edit" className="w-3 h-3"/>Mode Edit · drag untuk pan, scroll untuk zoom</span>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------
// Weight bar chart (Recharts)
// ------------------------------------------------------------
function WeightBarChart({ data, dataKey = 'weight', xKey = 'name', height = 220, color = '#6366f1', formatter = fmtPct, layout = 'vertical' }) {
  const { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip, LabelList } = Recharts;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout={layout} margin={{ top: 8, right: 24, left: 4, bottom: 8 }}>
        {layout === 'vertical' ? (
          <>
            <XAxis type="number" tickFormatter={formatter} stroke="currentColor" className="text-ink-400 text-[11px]"/>
            <YAxis type="category" dataKey={xKey} width={120} stroke="currentColor" className="text-ink-500 text-[11px]" tickLine={false} axisLine={false}/>
          </>
        ) : (
          <>
            <XAxis dataKey={xKey} stroke="currentColor" className="text-ink-500 text-[11px]" tickLine={false} axisLine={false}/>
            <YAxis tickFormatter={formatter} stroke="currentColor" className="text-ink-400 text-[11px]"/>
          </>
        )}
        <Tooltip
          formatter={(v) => formatter(v)}
          contentStyle={{ background: 'rgba(15,23,42,0.95)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12 }}
          cursor={{ fill: 'rgba(99,102,241,0.08)' }}
        />
        <Bar dataKey={dataKey} radius={[6,6,6,6]}>
          {data.map((d, i) => <Cell key={i} fill={d.color || color}/>)}
          <LabelList dataKey={dataKey} position={layout === 'vertical' ? 'right' : 'top'} formatter={formatter} className="fill-ink-700 dark:fill-ink-200" style={{ fontSize: 11, fontWeight: 600 }}/>
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ------------------------------------------------------------
// Aggregation method toggle
// ------------------------------------------------------------
function AggregationToggle({ value, onChange }) {
  const options = [
    { id: 'AIJ', label: 'AIJ', sub: 'Aggregation of Individual Judgments' },
    { id: 'AIP', label: 'AIP', sub: 'Aggregation of Individual Priorities' },
  ];
  return (
    <div className="inline-flex p-1 bg-ink-100 dark:bg-ink-800 rounded-lg">
      {options.map(o => (
        <button key={o.id} onClick={() => onChange(o.id)} title={o.sub}
          className={classNames(
            'px-3 h-8 text-[12.5px] font-semibold rounded-md transition-colors',
            value === o.id ? 'bg-white dark:bg-ink-900 text-brand-700 dark:text-brand-300 shadow-sm' : 'text-ink-500 hover:text-ink-700 dark:hover:text-ink-200'
          )}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ------------------------------------------------------------
// Expert status card
// ------------------------------------------------------------
function ExpertStatusCard({ expert }) {
  const cr = expert.cr;
  return (
    <Card className="p-4 flex items-center gap-3">
      <Avatar name={expert.name} color={expert.avatarColor} size={40}/>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-ink-900 dark:text-ink-50 truncate">{expert.name}</span>
          <StatusBadge status={expert.status}/>
        </div>
        <div className="text-[11.5px] text-ink-500 dark:text-ink-400 truncate">{expert.role} · {expert.email}</div>
      </div>
      {cr != null && <ConsistencyIndicator cr={cr} compact/>}
    </Card>
  );
}

// ------------------------------------------------------------
// Modal
// ------------------------------------------------------------
function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  if (!open) return null;
  const sizes = { sm:'max-w-md', md:'max-w-xl', lg:'max-w-3xl', xl:'max-w-5xl' };
  return (
    <div className="fixed inset-0 z-50 backdrop-blur-sm flex items-center justify-center anim-fade p-4 pt-20" onClick={onClose}>
      <div
        className={classNames('relative w-11/12 bg-white dark:bg-ink-900 rounded-xl border border-ink-200 dark:border-ink-800 shadow-2xl max-h-[85vh] overflow-hidden flex flex-col my-auto', sizes[size])}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-200 dark:border-ink-800 flex-shrink-0">
          <h3 className="font-serif text-[18px] font-bold text-ink-900 dark:text-ink-50">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-md hover:bg-ink-100 dark:hover:bg-ink-800 text-ink-500 transition"><Icon name="x"/></button>
        </div>
        <div className="px-6 py-5 overflow-y-auto flex-1">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-ink-200 dark:border-ink-800 bg-ink-50/50 dark:bg-ink-950/40 rounded-b-xl flex items-center justify-between gap-3 flex-shrink-0">{footer}</div>}
      </div>
    </div>
  );
}

// Stat card (KPI tile)
function StatCard({ label, value, delta, icon, tone = 'brand' }) {
  const tones = {
    brand: 'text-brand-600 bg-brand-50 dark:bg-brand-950/40',
    sky:   'text-sky-600 bg-sky-50 dark:bg-sky-950/40',
    green: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40',
    amber: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40',
  };
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11.5px] uppercase tracking-wider text-ink-500 dark:text-ink-400 font-semibold">{label}</span>
        <span className={classNames('w-8 h-8 grid place-items-center rounded-lg', tones[tone])}><Icon name={icon}/></span>
      </div>
      <div className="font-serif text-[34px] leading-none text-ink-900 dark:text-ink-50">{value}</div>
      {delta && <div className="text-[11.5px] text-ink-500 dark:text-ink-400 mt-1.5">{delta}</div>}
    </Card>
  );
}

// Expert Password Detail Modal
function ExpertPasswordModal({ expert, password: initialPassword, onClose }) {
  const [copied, setCopied] = useState(false);
  const [password, setPassword] = useState(initialPassword);
  const [resetting, setResetting] = useState(false);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetPassword = async () => {
    if (!expert?.id) return;
    setResetting(true);
    try {
      const response = await window.expertsService.resetPassword(expert.id);
      const tempPassword = response?.data?.tempPassword || response?.tempPassword;
      if (tempPassword) {
        setPassword(tempPassword);
      } else {
        console.error('No tempPassword in response:', response);
        alert('Gagal mendapat password baru');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      alert('Gagal reset password: ' + error.message);
    } finally {
      setResetting(false);
    }
  };

  if (!expert) return null;

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={`Detail Pakar: ${expert.name}`}
      size="md"
      footer={
        <div className="flex items-center gap-2 justify-between w-full">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleResetPassword}
            disabled={resetting}
          >
            {resetting ? '⟳ Reset...' : '🔄 Reset Password'}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Tutup
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        {/* Expert Info */}
        <div className="bg-ink-50 dark:bg-ink-950/40 rounded-lg p-3">
          <div className="flex items-start gap-2.5">
            <Avatar name={expert.name} color={expert.avatarColor || '#6366f1'} size="40" />
            <div className="flex-1 min-w-0">
              <h4 className="text-[13px] font-semibold text-ink-900 dark:text-ink-50">{expert.name}</h4>
              <p className="text-[11px] text-ink-500 dark:text-ink-400 truncate">{expert.email}</p>
              {expert.institution && (
                <p className="text-[11px] text-ink-500 dark:text-ink-400 truncate">{expert.institution}</p>
              )}
            </div>
          </div>
        </div>

        {/* Password Section */}
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-lg p-3">
          <div className="mb-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Password Sementara</label>
          </div>
          {password ? (
            <>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 bg-white dark:bg-ink-900 px-2.5 py-2 rounded-md border border-emerald-200 dark:border-emerald-800 font-mono text-[13px] font-semibold text-emerald-700 dark:text-emerald-300 break-all">
                  {password}
                </div>
                <button
                  onClick={() => copyToClipboard(password)}
                  className="px-2.5 py-2 rounded-md bg-emerald-100 dark:bg-emerald-900/40 hover:bg-emerald-200 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold transition whitespace-nowrap"
                  title="Copy password"
                >
                  {copied ? '✓ Disalin' : 'Salin'}
                </button>
              </div>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Password di-generate otomatis oleh sistem.</p>
            </>
          ) : (
            <div className="text-center py-1.5">
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                Klik "Reset Password" untuk generate password baru
              </p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900 rounded-lg p-3">
          <h4 className="text-[12px] font-semibold text-sky-900 dark:text-sky-100 mb-2">📋 Login Pakar:</h4>
          <ol className="space-y-1.5 text-[11px] text-sky-800 dark:text-sky-200">
            <li><span className="font-semibold">1.</span> Pakar buka https://localhost:8000/DecideAI.html</li>
            <li><span className="font-semibold">2.</span> Pilih "Login Pakar" → email: <span className="font-mono text-[10px]">{expert.email}</span>, password: <span className="font-mono text-[10px]">{password}</span></li>
            <li><span className="font-semibold">3.</span> Kasus yang diundang muncul di dashboard pakar</li>
            <li><span className="font-semibold">4.</span> Isi penilaian dengan skala Saaty 1-9, lalu submit</li>
          </ol>
        </div>

      </div>
    </Modal>
  );
}

// Case Card — displays case info with progress, deadline, and quick actions
function CaseCard({ data, onEdit, onInvite, onViewResults, onDelete }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const deadlineStatus = getDeadlineStatus(data.deadline);
  const daysLeft = deadlineStatus.daysLeft;
  const isDeadlineNear = deadlineStatus.isDue;
  const isDeadlinePassed = deadlineStatus.isOverdue;

  // Handle both API response formats
  const totalExperts = data.totalExperts || data.expertsCount || 0;
  const completedExperts = data.completedExperts || (data.progress && totalExperts > 0 ? Math.round((data.progress / 100) * totalExperts) : 0);
  const progressPercent = data.progress || (totalExperts > 0 ? Math.round((completedExperts / totalExperts) * 100) : 0);

  return (
    <Card className={classNames(
      'p-4 hover:shadow-md transition flex flex-col h-full',
      isDeadlinePassed && 'border-rose-300 dark:border-rose-900 bg-rose-50/30 dark:bg-rose-950/10',
      isDeadlineNear && 'border-amber-300 dark:border-amber-900 bg-amber-50/30 dark:bg-amber-950/10'
    )}>
      {/* Header */}
      <div className="mb-3">
        <div className="flex items-start gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-[14px] text-ink-900 dark:text-ink-50 truncate">{data.name}</h4>
            <p className="text-[12px] text-ink-500 dark:text-ink-400 line-clamp-2">{data.description || 'Tanpa deskripsi'}</p>
          </div>
          <MethodBadge method={data.method} />
        </div>
      </div>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-semibold text-ink-700 dark:text-ink-200">Progress Pakar</span>
          <span className="text-[11px] font-mono text-brand-600">{progressPercent}%</span>
        </div>
        <div className="h-1.5 bg-ink-100 dark:bg-ink-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="text-[10px] text-ink-500 mt-1">{completedExperts}/{totalExperts} pakar selesai</div>
      </div>

      {/* Deadline */}
      <div className="mb-4">
        <div className={classNames(
          'px-3 py-2 rounded-lg text-[12px] font-medium',
          isDeadlinePassed ? 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300' :
          isDeadlineNear ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300' :
          'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300'
        )}>
          <div className="flex items-center gap-2">
            <span>📅 {new Date(data.deadline).toLocaleDateString('id-ID')}</span>
            <span className="text-[11px]">
              {isDeadlinePassed ? '⏰ Lewat' : isDeadlineNear ? `${daysLeft} hari` : `${daysLeft} hari`}
            </span>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="mb-4 flex items-center gap-2 flex-wrap">
        <StatusBadge status={data.status || 'active'} />
        {data.createdBy && <span className="text-[11px] text-ink-500">Dibuat oleh {data.createdBy.split(' ')[0]}</span>}
      </div>

      {/* Actions */}
      <div className="mt-auto space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" variant="secondary" icon="edit" onClick={onEdit}>Edit</Button>
          <Button size="sm" variant="secondary" icon="users" onClick={onInvite}>Undang</Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" variant="outline" icon="arrowR" onClick={onViewResults}>Lihat</Button>
          <Button size="sm" variant="outline" tone="red" icon="trash" onClick={() => setShowDeleteConfirm(true)}>Hapus</Button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <Modal
          title="Hapus Kasus?"
          description={`Anda yakin ingin menghapus "${data.name}"? Tindakan ini tidak bisa dibatalkan.`}
          footer={
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Batal</Button>
              <Button tone="red" onClick={() => { onDelete(); setShowDeleteConfirm(false); }}>Hapus</Button>
            </div>
          }
          size="sm"
        />
      )}
    </Card>
  );
}

// =====================================================
// NotificationCenter — bell icon & notification panel
// =====================================================
function NotificationCenter({ notifications = [], unreadCount = 0, onMarkAsRead, onMarkAllAsRead, onNotificationClick }) {
  const [isOpen, setIsOpen] = useState(false);

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Sekarang';
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return date.toLocaleDateString('id-ID');
  };

  const iconMap = {
    'expert_submission': 'check',
    'case_completed': 'check',
    'judgment_reminder': 'bell',
    'invitation': 'users',
    'default': 'info'
  };

  return (
    <div className="relative">
      {/* Bell icon button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-9 w-9 grid place-items-center rounded-lg border border-ink-200 dark:border-ink-700 hover:bg-ink-50 dark:hover:bg-ink-800 text-ink-600 dark:text-ink-300 transition"
        title="Notifikasi"
      >
        <Icon name="bell" className="w-5 h-5"/>
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 grid place-items-center rounded-full bg-red-600 text-white text-[10px] font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification panel */}
      {isOpen && (
        <div className="absolute top-12 right-0 w-80 bg-white dark:bg-ink-900 rounded-lg border border-ink-200 dark:border-ink-700 shadow-xl z-50 anim-fade">
          <div className="flex items-center justify-between p-4 border-b border-ink-200 dark:border-ink-800">
            <h3 className="font-serif text-[16px] text-ink-900 dark:text-ink-50">Notifikasi</h3>
            <button onClick={() => setIsOpen(false)} className="text-ink-400 hover:text-ink-600 dark:hover:text-ink-300">
              <Icon name="close" className="w-4 h-4"/>
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-ink-100 dark:divide-ink-800">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-ink-500 text-[13px]">Belum ada notifikasi</div>
            ) : (
              notifications.map((notif, idx) => {
                const isRead = notif.read;
                const iconName = iconMap[notif.type] || iconMap['default'];
                return (
                  <div
                    key={notif.id || idx}
                    onClick={() => {
                      if (!isRead && onMarkAsRead) onMarkAsRead(notif.id);
                      if (onNotificationClick) onNotificationClick(notif);
                    }}
                    className={classNames(
                      'p-4 cursor-pointer transition hover:bg-ink-50 dark:hover:bg-ink-800/50',
                      !isRead && 'bg-brand-50/40 dark:bg-brand-950/20'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-950/40 grid place-items-center text-brand-700 dark:text-brand-300 shrink-0">
                        <Icon name={iconName} className="w-4 h-4"/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-[13px] font-semibold text-ink-900 dark:text-ink-50 truncate">
                            {notif.title || notif.message}
                          </div>
                          {!isRead && <span className="w-2 h-2 rounded-full bg-brand-600 shrink-0 mt-1.5"/>}
                        </div>
                        {notif.title && notif.message && (
                          <div className="text-[12px] text-ink-600 dark:text-ink-400 truncate mt-0.5">{notif.message}</div>
                        )}
                        <div className="text-[11px] text-ink-500 dark:text-ink-400 mt-1">
                          {formatTime(notif.created_at || notif.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t border-ink-200 dark:border-ink-800 text-center">
              <button
                onClick={() => {
                  if (onMarkAllAsRead) onMarkAllAsRead();
                  setIsOpen(false);
                }}
                className="text-[12.5px] text-brand-600 dark:text-brand-300 hover:underline font-medium"
              >
                Tandai semua sudah dibaca
              </button>
            </div>
          )}
        </div>
      )}

      {/* Overlay click to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

// ============================================================
// SKELETON LOADERS (better UX than plain spinners)
// ============================================================

function SkeletonCard({ count = 1, height = 'h-20' }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-4 bg-gradient-to-r from-ink-100 to-ink-50 dark:from-ink-800/50 dark:to-ink-900/30 border-ink-200/50 dark:border-ink-800/50">
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-ink-200 dark:bg-ink-700 rounded w-3/4"></div>
            <div className="h-3 bg-ink-200 dark:bg-ink-700 rounded w-1/2"></div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function SkeletonBar({ count = 3, width = 'w-full' }) {
  return (
    <div className={`space-y-2 ${width}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 animate-pulse">
          <div className="h-8 w-20 bg-ink-200 dark:bg-ink-700 rounded"></div>
          <div className="flex-1 h-3 bg-ink-200 dark:bg-ink-700 rounded"></div>
        </div>
      ))}
    </div>
  );
}

function SkeletonTable({ rows = 3, cols = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3 animate-pulse">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="flex-1 h-10 bg-ink-200 dark:bg-ink-700 rounded"></div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// CUSTOM SVG ILLUSTRATIONS (replace gradient blobs)
// ============================================================

function IllustrationDecision() {
  return (
    <svg width="240" height="200" viewBox="0 0 240 200" className="w-full h-auto opacity-80 dark:opacity-60">
      {/* Background gradient */}
      <defs>
        <linearGradient id="decGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.1"/>
          <stop offset="100%" stopColor="#312e81" stopOpacity="0.05"/>
        </linearGradient>
      </defs>
      <rect width="240" height="200" fill="url(#decGrad)"/>

      {/* Central node */}
      <circle cx="120" cy="60" r="20" fill="#6366f1" opacity="0.3"/>
      <circle cx="120" cy="60" r="16" fill="none" stroke="#6366f1" strokeWidth="2"/>
      <circle cx="120" cy="60" r="8" fill="#6366f1"/>

      {/* Left branch */}
      <path d="M 105 73 L 60 120" stroke="#6366f1" strokeWidth="2" fill="none" opacity="0.4"/>
      <circle cx="60" cy="120" r="12" fill="none" stroke="#6366f1" strokeWidth="2" opacity="0.6"/>
      <circle cx="60" cy="120" r="6" fill="#0ea5e9" opacity="0.5"/>

      {/* Right branch */}
      <path d="M 135 73 L 180 120" stroke="#6366f1" strokeWidth="2" fill="none" opacity="0.4"/>
      <circle cx="180" cy="120" r="12" fill="none" stroke="#6366f1" strokeWidth="2" opacity="0.6"/>
      <circle cx="180" cy="120" r="6" fill="#10b981" opacity="0.5"/>

      {/* Bottom branches */}
      <path d="M 60 132 L 40 180" stroke="#0ea5e9" strokeWidth="1.5" fill="none" opacity="0.3"/>
      <path d="M 60 132 L 80 180" stroke="#0ea5e9" strokeWidth="1.5" fill="none" opacity="0.3"/>
      <path d="M 180 132 L 160 180" stroke="#10b981" strokeWidth="1.5" fill="none" opacity="0.3"/>
      <path d="M 180 132 L 200 180" stroke="#10b981" strokeWidth="1.5" fill="none" opacity="0.3"/>
    </svg>
  );
}

function IllustrationResults() {
  return (
    <svg width="240" height="200" viewBox="0 0 240 200" className="w-full h-auto opacity-80 dark:opacity-60">
      <defs>
        <linearGradient id="resGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981"/>
          <stop offset="100%" stopColor="#059669"/>
        </linearGradient>
      </defs>

      {/* Bars */}
      <rect x="30" y="140" width="30" height="50" fill="url(#resGrad)" rx="4" opacity="0.7"/>
      <rect x="75" y="100" width="30" height="90" fill="url(#resGrad)" rx="4" opacity="0.9"/>
      <rect x="120" y="110" width="30" height="80" fill="url(#resGrad)" rx="4" opacity="0.8"/>
      <rect x="165" y="130" width="30" height="60" fill="url(#resGrad)" rx="4" opacity="0.6"/>

      {/* Labels */}
      <text x="45" y="200" fontSize="10" fill="#6b7280" textAnchor="middle">A</text>
      <text x="90" y="200" fontSize="10" fill="#6b7280" textAnchor="middle">B</text>
      <text x="135" y="200" fontSize="10" fill="#6b7280" textAnchor="middle">C</text>
      <text x="180" y="200" fontSize="10" fill="#6b7280" textAnchor="middle">D</text>

      {/* Winner crown */}
      <path d="M 95 80 L 85 60 L 90 50 L 105 55 L 120 45 L 135 55 L 150 50 L 155 60 L 145 80" fill="#f59e0b" opacity="0.6"/>
    </svg>
  );
}

function IllustrationWaiting() {
  return (
    <svg width="240" height="200" viewBox="0 0 240 200" className="w-full h-auto opacity-70 dark:opacity-50">
      {/* Clock */}
      <circle cx="120" cy="80" r="35" fill="none" stroke="#6366f1" strokeWidth="2.5" opacity="0.4"/>
      <circle cx="120" cy="80" r="30" fill="none" stroke="#6366f1" strokeWidth="2" opacity="0.6"/>

      {/* Clock hands */}
      <line x1="120" y1="80" x2="120" y2="50" stroke="#6366f1" strokeWidth="2"/>
      <line x1="120" y1="80" x2="140" y2="80" stroke="#6366f1" strokeWidth="2"/>
      <circle cx="120" cy="80" r="4" fill="#6366f1"/>

      {/* Animated dots */}
      <circle cx="80" cy="140" r="3" fill="#0ea5e9" opacity="0.6" className="animate-bounce" style={{animationDelay: '0s'}}/>
      <circle cx="120" cy="145" r="3" fill="#0ea5e9" opacity="0.6" className="animate-bounce" style={{animationDelay: '0.2s'}}/>
      <circle cx="160" cy="140" r="3" fill="#0ea5e9" opacity="0.6" className="animate-bounce" style={{animationDelay: '0.4s'}}/>
    </svg>
  );
}

// ============================================================
// SMALL INTERACTIVE CHARTS FOR DASHBOARD
// ============================================================

function MiniPieChart({ data = [], title = '' }) {
  const total = data.reduce((sum, item) => sum + (item.value || 0), 0);
  const colors = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444'];
  let currentAngle = 0;

  const slices = data.map((item, i) => {
    const percentage = item.value / total;
    const angle = percentage * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const x1 = 50 + 40 * Math.cos(startRad);
    const y1 = 50 + 40 * Math.sin(startRad);
    const x2 = 50 + 40 * Math.cos(endRad);
    const y2 = 50 + 40 * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;
    const pathData = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`;

    currentAngle = endAngle;

    return (
      <path key={i} d={pathData} fill={colors[i % colors.length]} opacity="0.7" className="hover:opacity-100 transition-opacity cursor-pointer"/>
    );
  });

  return (
    <div className="flex flex-col items-center">
      <svg width="120" height="120" viewBox="0 0 100 100" className="w-24 h-24">
        {slices}
        <circle cx="50" cy="50" r="20" fill="white" className="dark:fill-ink-900"/>
      </svg>
      {title && <p className="text-[11px] text-ink-600 dark:text-ink-400 mt-2">{title}</p>}
    </div>
  );
}

function MiniLineChart({ data = [], title = '', height = 60 }) {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data.map(d => d.value || 0));
  const min = Math.min(...data.map(d => d.value || 0));
  const range = max - min || 1;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = ((max - (d.value || 0)) / range) * height;
    return { x, y, value: d.value };
  });

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div className="flex flex-col">
      <svg width="100%" height={height + 20} viewBox={`0 0 100 ${height + 20}`} className="w-full">
        <defs>
          <linearGradient id="miniGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d={`${pathData} L 100 ${height} L 0 ${height} Z`} fill="url(#miniGrad)"/>
        <path d={pathData} stroke="#6366f1" strokeWidth="1.5" fill="none"/>
      </svg>
      {title && <p className="text-[10px] text-ink-600 dark:text-ink-400 mt-1">{title}</p>}
    </div>
  );
}

// ============================================================
// CUSTOM STAT CARD WITH MINI VISUALIZATION
// ============================================================

function StatCardWithChart({ icon, label, value, change, trend = 'up', miniChart = null, color = 'brand' }) {
  const colorClass = {
    brand: 'bg-brand-50 dark:bg-brand-950/30 border-brand-200 dark:border-brand-900 text-brand-700 dark:text-brand-300',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300',
    sky: 'bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-900 text-sky-700 dark:text-sky-300',
    amber: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300',
  }[color] || 'bg-brand-50 dark:bg-brand-950/30';

  return (
    <Card className={`p-4 border ${colorClass}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider opacity-70 mb-1">{label}</div>
          <div className="text-[26px] font-serif text-ink-900 dark:text-ink-50">{value}</div>
          {change && (
            <div className="text-[12px] mt-2 flex items-center gap-1">
              <span className={trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                {trend === 'up' ? '↗' : '↘'} {change}
              </span>
            </div>
          )}
        </div>
        {miniChart && (
          <div className="w-20 h-16 shrink-0">
            {miniChart}
          </div>
        )}
      </div>
    </Card>
  );
}

// ColorBends — animated background using Three.js
function ColorBends({
  className = '',
  style = {},
  rotation = 90,
  speed = 0.2,
  colors = [],
  transparent = true,
  autoRotate = 0,
  scale = 1,
  frequency = 1,
  warpStrength = 1,
  mouseInfluence = 1,
  parallax = 0.5,
  noise = 0.15,
  iterations = 1,
  intensity = 1.5,
  bandWidth = 6
}) {
  // Return empty div if THREE is not available
  if (!window.THREE) {
    return (
      <div
        className={`color-bends-container ${className}`}
        style={{ ...style, backgroundColor: 'transparent' }}
      />
    );
  }

  const THREE = window.THREE;
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const rafRef = useRef(null);
  const materialRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const rotationRef = useRef(rotation);
  const autoRotateRef = useRef(autoRotate);
  const pointerTargetRef = useRef(null);
  const pointerCurrentRef = useRef(null);

  const MAX_COLORS = 8;

  const fragShader = `
#define MAX_COLORS ${MAX_COLORS}
uniform vec2 uCanvas;
uniform float uTime;
uniform float uSpeed;
uniform vec2 uRot;
uniform int uColorCount;
uniform vec3 uColors[MAX_COLORS];
uniform int uTransparent;
uniform float uScale;
uniform float uFrequency;
uniform float uWarpStrength;
uniform vec2 uPointer;
uniform float uMouseInfluence;
uniform float uParallax;
uniform float uNoise;
uniform int uIterations;
uniform float uIntensity;
uniform float uBandWidth;
varying vec2 vUv;
void main() {
  float t = uTime * uSpeed;
  vec2 p = vUv * 2.0 - 1.0;
  p += uPointer * uParallax * 0.1;
  vec2 rp = vec2(p.x * uRot.x - p.y * uRot.y, p.x * uRot.y + p.y * uRot.x);
  vec2 q = vec2(rp.x * (uCanvas.x / uCanvas.y), rp.y);
  q /= max(uScale, 0.0001);
  q /= 0.5 + 0.2 * dot(q, q);
  q += 0.2 * cos(t) - 7.56;
  vec2 toward = (uPointer - rp);
  q += toward * uMouseInfluence * 0.2;
  for (int j = 0; j < 5; j++) {
    if (j >= uIterations - 1) break;
    vec2 rr = sin(1.5 * (q.yx * uFrequency) + 2.0 * cos(q * uFrequency));
    q += (rr - q) * 0.15;
  }
  vec3 col = vec3(0.0);
  float a = 1.0;
  if (uColorCount > 0) {
    vec2 s = q;
    vec3 sumCol = vec3(0.0);
    float cover = 0.0;
    for (int i = 0; i < MAX_COLORS; ++i) {
      if (i >= uColorCount) break;
      s -= 0.01;
      vec2 r = sin(1.5 * (s.yx * uFrequency) + 2.0 * cos(s * uFrequency));
      float m0 = length(r + sin(5.0 * r.y * uFrequency - 3.0 * t + float(i)) / 4.0);
      float kBelow = clamp(uWarpStrength, 0.0, 1.0);
      float kMix = pow(kBelow, 0.3);
      float gain = 1.0 + max(uWarpStrength - 1.0, 0.0);
      vec2 disp = (r - s) * kBelow;
      vec2 warped = s + disp * gain;
      float m1 = length(warped + sin(5.0 * warped.y * uFrequency - 3.0 * t + float(i)) / 4.0);
      float m = mix(m0, m1, kMix);
      float w = 1.0 - exp(-uBandWidth / exp(uBandWidth * m));
      sumCol += uColors[i] * w;
      cover = max(cover, w);
    }
    col = clamp(sumCol, 0.0, 1.0);
    a = uTransparent > 0 ? cover : 1.0;
  } else {
    vec2 s = q;
    for (int k = 0; k < 3; ++k) {
      s -= 0.01;
      vec2 r = sin(1.5 * (s.yx * uFrequency) + 2.0 * cos(s * uFrequency));
      float m0 = length(r + sin(5.0 * r.y * uFrequency - 3.0 * t + float(k)) / 4.0);
      float kBelow = clamp(uWarpStrength, 0.0, 1.0);
      float kMix = pow(kBelow, 0.3);
      float gain = 1.0 + max(uWarpStrength - 1.0, 0.0);
      vec2 disp = (r - s) * kBelow;
      vec2 warped = s + disp * gain;
      float m1 = length(warped + sin(5.0 * warped.y * uFrequency - 3.0 * t + float(k)) / 4.0);
      float m = mix(m0, m1, kMix);
      col[k] = 1.0 - exp(-uBandWidth / exp(uBandWidth * m));
    }
    a = uTransparent > 0 ? max(max(col.r, col.g), col.b) : 1.0;
  }
  col *= uIntensity;
  if (uNoise > 0.0001) {
    float n = fract(sin(dot(gl_FragCoord.xy + vec2(uTime), vec2(12.9898, 78.233))) * 43758.5453123);
    col += (n - 0.5) * uNoise;
    col = clamp(col, 0.0, 1.0);
  }
  vec3 rgb = (uTransparent > 0) ? col * a : col;
  gl_FragColor = vec4(rgb, a);
}
  `;

  const vertShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
  `;

  useEffect(() => {
    if (!window.THREE || !containerRef.current) return;
    const THREE = window.THREE;

    // Initialize pointer refs if not already done
    if (!pointerTargetRef.current) pointerTargetRef.current = new THREE.Vector2(0, 0);
    if (!pointerCurrentRef.current) pointerCurrentRef.current = new THREE.Vector2(0, 0);

    const container = containerRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geometry = new THREE.PlaneGeometry(2, 2);
    const uColorsArray = Array.from({ length: MAX_COLORS }, () => new THREE.Vector3(0, 0, 0));
    const material = new THREE.ShaderMaterial({
      vertexShader: vertShader,
      fragmentShader: fragShader,
      uniforms: {
        uCanvas: { value: new THREE.Vector2(1, 1) },
        uTime: { value: 0 },
        uSpeed: { value: speed },
        uRot: { value: new THREE.Vector2(1, 0) },
        uColorCount: { value: 0 },
        uColors: { value: uColorsArray },
        uTransparent: { value: transparent ? 1 : 0 },
        uScale: { value: scale },
        uFrequency: { value: frequency },
        uWarpStrength: { value: warpStrength },
        uPointer: { value: new THREE.Vector2(0, 0) },
        uMouseInfluence: { value: mouseInfluence },
        uParallax: { value: parallax },
        uNoise: { value: noise },
        uIterations: { value: iterations },
        uIntensity: { value: intensity },
        uBandWidth: { value: bandWidth }
      },
      premultipliedAlpha: true,
      transparent: true
    });
    materialRef.current = material;
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: 'high-performance',
      alpha: true
    });
    rendererRef.current = renderer;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, transparent ? 0 : 1);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);
    const clock = new THREE.Clock();
    const handleResize = () => {
      const w = container.clientWidth || 1;
      const h = container.clientHeight || 1;
      renderer.setSize(w, h, false);
      material.uniforms.uCanvas.value.set(w, h);
    };
    handleResize();
    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver(handleResize);
      ro.observe(container);
      resizeObserverRef.current = ro;
    } else {
      window.addEventListener('resize', handleResize);
    }
    const loop = () => {
      const dt = clock.getDelta();
      const elapsed = clock.elapsedTime;
      material.uniforms.uTime.value = elapsed;
      const deg = (rotationRef.current % 360) + autoRotateRef.current * elapsed;
      const rad = (deg * Math.PI) / 180;
      const c = Math.cos(rad);
      const s = Math.sin(rad);
      material.uniforms.uRot.value.set(c, s);
      const cur = pointerCurrentRef.current;
      const tgt = pointerTargetRef.current;
      const amt = Math.min(1, dt * 8);
      cur.lerp(tgt, amt);
      material.uniforms.uPointer.value.copy(cur);
      renderer.render(scene, camera);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (resizeObserverRef.current) resizeObserverRef.current.disconnect();
      else window.removeEventListener('resize', handleResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    const material = materialRef.current;
    if (!material) return;
    rotationRef.current = rotation;
    autoRotateRef.current = autoRotate;
    material.uniforms.uSpeed.value = speed;
    material.uniforms.uScale.value = scale;
    material.uniforms.uFrequency.value = frequency;
    material.uniforms.uWarpStrength.value = warpStrength;
    material.uniforms.uMouseInfluence.value = mouseInfluence;
    material.uniforms.uParallax.value = parallax;
    material.uniforms.uNoise.value = noise;
    material.uniforms.uIterations.value = iterations;
    material.uniforms.uIntensity.value = intensity;
    material.uniforms.uBandWidth.value = bandWidth;
    const toVec3 = hex => {
      const h = hex.replace('#', '').trim();
      const v = h.length === 3
        ? [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16)]
        : [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
      return new THREE.Vector3(v[0] / 255, v[1] / 255, v[2] / 255);
    };
    const arr = (colors || []).filter(Boolean).slice(0, MAX_COLORS).map(toVec3);
    for (let i = 0; i < MAX_COLORS; i++) {
      const vec = material.uniforms.uColors.value[i];
      if (i < arr.length) vec.copy(arr[i]);
      else vec.set(0, 0, 0);
    }
    material.uniforms.uColorCount.value = arr.length;
    material.uniforms.uTransparent.value = transparent ? 1 : 0;
  }, [rotation, autoRotate, speed, scale, frequency, warpStrength, mouseInfluence, parallax, noise, iterations, intensity, bandWidth, colors, transparent]);

  useEffect(() => {
    const material = materialRef.current;
    const container = containerRef.current;
    if (!material || !container) return;
    const handlePointerMove = e => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / (rect.width || 1)) * 2 - 1;
      const y = -(((e.clientY - rect.top) / (rect.height || 1)) * 2 - 1);
      pointerTargetRef.current.set(x, y);
    };
    container.addEventListener('pointermove', handlePointerMove);
    return () => container.removeEventListener('pointermove', handlePointerMove);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`color-bends-container ${className}`}
      style={{ ...style, position: style.position || 'relative', width: style.width || '100%', height: style.height || '100%', overflow: 'hidden' }}
    />
  );
}

Object.assign(window, {
  Logo, Icon, Button, Input, Card, Badge, StatusBadge, MethodBadge, Avatar,
  Sidebar, TopBar, Stepper,
  SaatyScaleInput, TFNSlider, ConsistencyIndicator, PairwiseMatrix,
  HierarchyViewer, WeightBarChart, AggregationToggle, ExpertStatusCard,
  Modal, StatCard, ExpertPasswordModal, CaseCard, NotificationCenter,
  // New components
  SkeletonCard, SkeletonBar, SkeletonTable,
  IllustrationDecision, IllustrationResults, IllustrationWaiting,
  MiniPieChart, MiniLineChart, StatCardWithChart, ColorBends,
});
