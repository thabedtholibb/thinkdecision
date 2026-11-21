/* Auth screens — landing, dual login, register */

function Landing({ go }) {
  const { t, lang } = useLanguage();
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top nav */}
      <header className="px-4 sm:px-8 lg:px-16 py-5 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-2">
          <LanguageSwitchButton/>
          <Button variant="ghost" size="sm" onClick={() => go({ screen: 'login-creator' })}>{t('landing.signIn')}</Button>
          <Button size="sm" iconRight="arrowR" onClick={() => go({ screen: 'register' })}>{t('landing.tryFree')}</Button>
        </div>
      </header>

      <main className="flex-1 grid lg:grid-cols-2 gap-8 px-8 lg:px-16 py-10 items-center">
        <div className="max-w-xl">
          <h1 className="font-display text-[34px] sm:text-[48px] lg:text-[68px] leading-[0.98] tracking-tight text-ink-900 dark:text-ink-50 mt-0">
            {/* key remounts on language change so the word-cycle index resets
                (EN and ID sentences have different word counts). */}
            <TrueFocus
              key={lang}
              sentence={t('landing.headline')}
              blurAmount={3}
              borderColor="#6366f1"
              animationDuration={0.4}
              pauseBetweenAnimations={1.2}
            />
          </h1>
          <p className="text-[16px] text-ink-600 dark:text-ink-300 leading-relaxed mt-5">
            <b>Think Decision</b> {t('landing.lead')}
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Button size="lg" iconRight="arrowR" onClick={() => go({ screen: 'login-creator' })}>{t('landing.loginCreator')}</Button>
            <Button size="lg" variant="secondary" icon="users" onClick={() => go({ screen: 'login-expert' })}>{t('landing.loginExpert')}</Button>
          </div>
        </div>

        {/* Eye-catching elegant hero */}
        <div className="relative flex justify-center items-center min-h-[520px]">
          <div className="absolute inset-10 rounded-full bg-gradient-to-br from-brand-400/30 via-brand-500/10 to-transparent blur-3xl"/>
          <div className="absolute right-8 top-8 w-40 h-40 rounded-full bg-gradient-to-br from-emerald-400/20 to-transparent blur-2xl"/>
          <div className="relative w-full max-w-md anim-float">
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-brand-500/20 to-transparent blur-xl"/>
            <Card className="relative p-8 shadow-2xl shadow-brand-900/10 backdrop-blur-sm hover:shadow-2xl hover:shadow-brand-600/20 transition-all duration-300">
              <div className="mb-6">
                <span className="text-[10.5px] uppercase tracking-[0.2em] text-ink-500">{t('landing.workflow')}</span>
              </div>
              <ol className="space-y-5">
                {[
                  { n:'01', t: t('landing.step1Title'), d: t('landing.step1Desc'), c:'#6366f1' },
                  { n:'02', t: t('landing.step2Title'), d: t('landing.step2Desc'), c:'#0ea5e9' },
                  { n:'03', t: t('landing.step3Title'), d: t('landing.step3Desc'), c:'#10b981' },
                ].map((s) => (
                  <li key={s.n} className="flex items-start gap-4 group">
                    <span className="font-display text-[34px] leading-none text-ink-200 dark:text-ink-700 tabular-nums w-12 group-hover:text-brand-500 transition">{s.n}</span>
                    <div className="flex-1 pb-5 border-b border-ink-100 dark:border-ink-800 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-[22px] leading-tight text-ink-900 dark:text-ink-50">{s.t}</span>
                        <span className="w-2 h-2 rounded-full" style={{ background: s.c }}/>
                      </div>
                      <p className="text-[13px] text-ink-500 dark:text-ink-400 mt-0.5">{s.d}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="mt-7 pt-5 border-t border-ink-100 dark:border-ink-800 flex items-center gap-3">
                <div className="flex -space-x-2">
                  {['#6366f1','#0ea5e9','#10b981','#f59e0b'].map((c,i) => (
                    <span key={i} style={{background:c}} className="w-7 h-7 rounded-full border-2 border-white dark:border-ink-900"/>
                  ))}
                </div>
                <div className="text-[12px] text-ink-500 dark:text-ink-400">
                  {t('landing.sameCanvas')}
                </div>
              </div>
            </Card>
            <div className="absolute -top-4 -left-6 px-3 py-1.5 rounded-full bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-700 shadow-lg text-[11.5px] font-semibold text-brand-700 dark:text-brand-300">AHP</div>
            <div className="absolute top-1/3 -right-5 px-3 py-1.5 rounded-full bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-700 shadow-lg text-[11.5px] font-semibold text-sky-600 dark:text-sky-400">ANP</div>
            <div className="absolute -bottom-3 -right-2 px-3 py-1.5 rounded-full bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-700 shadow-lg text-[11.5px] font-semibold text-emerald-600 dark:text-emerald-400">Fuzzy</div>
          </div>
        </div>
      </main>

      <footer className="px-8 lg:px-16 py-4 border-t border-ink-200 dark:border-ink-800 text-[12px] text-ink-500 flex items-center justify-between">
        <span>© 2026 Think Decision</span>
      </footer>
    </div>
  );
}

// Loading Modal dengan Animated Clock
function LoadingModal() {
  const { t } = useLanguage();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm anim-fade">
      <div className="bg-white dark:bg-ink-900 rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4 anim-scale-in">
        <div className="relative w-16 h-16">
          <svg
            className="w-full h-full animate-spin text-brand-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="9" strokeWidth="2" opacity="0.25" />
            <path strokeWidth="2" d="M12 2a10 10 0 010 20 10 10 0 010-20z" opacity="0" />
            <path
              strokeWidth="2"
              d="M12 6v6l4 2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.8"
            />
          </svg>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-brand-600/30 border-r-brand-600/30 animate-pulse" />
        </div>
        <div className="text-center">
          <p className="font-medium text-ink-900 dark:text-ink-50">{t('loading.signingIn')}</p>
          <p className="text-[12px] text-ink-500 dark:text-ink-400 mt-1">{t('loading.verifying')}</p>
        </div>
      </div>
    </div>
  );
}

// Target-language label is a proper noun (doesn't translate), so it's a
// plain lookup here, not routed through t(). Shared with TopBar's switcher.
const LANGUAGE_SWITCH_LABEL = { en: 'ID', id: 'EN' };
const LANGUAGE_SWITCH_TITLE = { en: 'Switch to Bahasa Indonesia', id: 'Switch to English' };

function LanguageSwitchButton({ className = '' }) {
  const { lang, toggleLanguage } = useLanguage();
  return (
    <button
      onClick={toggleLanguage}
      className={`h-8 px-2.5 grid place-items-center rounded-lg border border-ink-200 dark:border-ink-700 hover:bg-ink-50 dark:hover:bg-ink-800 text-ink-600 dark:text-ink-300 text-[11px] font-semibold tracking-wide ${className}`}
      title={LANGUAGE_SWITCH_TITLE[lang]}
    >
      {LANGUAGE_SWITCH_LABEL[lang]}
    </button>
  );
}

// Auth shell — split layout
function AuthShell({ accent = 'brand', children, side }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-[1fr_520px]">
      <div className={
        accent === 'brand'
          ? 'hidden lg:flex flex-col justify-between p-12 relative overflow-hidden bg-gradient-to-br from-brand-700 to-brand-950 text-white'
          : 'hidden lg:flex flex-col justify-between p-12 relative overflow-hidden bg-gradient-to-br from-emerald-700 to-emerald-950 text-white'
      }>
        <div className="inline-flex w-fit px-4 py-3 rounded-xl bg-white shadow-lg">
          <Logo/>
        </div>
        <div className="space-y-6">
          {side}
        </div>
        <div className="text-[12px] opacity-70">© 2026 Think Decision</div>
        <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-white/5"/>
        <div className="absolute -top-24 -right-12 w-48 h-48 rounded-full bg-white/5"/>
      </div>
      <div className="relative flex items-center justify-center p-8 bg-white dark:bg-ink-950">
        <LanguageSwitchButton className="absolute top-4 right-4"/>
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}

function LoginCreator({ go }) {
  const { login } = useAuth();
  const { t } = useLanguage();

  const form = useFormValidation(
    { email: '', password: '', remember: false },
    {
      email: [window.validators.required, window.validators.email],
      password: window.validators.required,
    },
    async (values, { setSubmitting, setErrors }) => {
      try {
        const response = await window.authService.loginCreator(values.email, values.password);
        const user = response.data || {};
        // Role is server truth — the login endpoint already filters role='creator',
        // so a non-creator role here means something is wrong; refuse loudly.
        if (user.role && user.role !== 'creator') {
          setErrors({ submit: t('loginCreator.notCreator') });
          setSubmitting(false);
          return;
        }
        login({ role: 'creator', ...user });
        go({
          screen: 'creator-dashboard',
          role: 'creator'
        });
      } catch (error) {
        setErrors({ submit: t('loginCreator.invalid') });
        go({ toast: { message: t('loginCreator.invalid'), type: 'error' } });
        setSubmitting(false);
      }
    }
  );
  return (
    <>
      {form.isSubmitting && <LoadingModal />}
      <AuthShell side={
        <div>
          <h2 className="font-serif text-[44px] leading-[1.05]">{t('loginCreator.sideTitle')}</h2>
          <p className="text-white/80 text-[15px] mt-3 max-w-sm">
            {t('loginCreator.sideBody')}
          </p>
          <ul className="space-y-2 mt-6 text-[13.5px] text-white/85">
            {[t('loginCreator.feature1'), t('loginCreator.feature2'), t('loginCreator.feature3')].map(f => (
              <li key={f} className="flex items-center gap-2"><Icon name="check" className="w-4 h-4"/>{f}</li>
            ))}
          </ul>
        </div>
      }>
        <Badge tone="brand" icon="user">{t('loginCreator.badge')}</Badge>
        <h1 className="font-serif text-[34px] mt-3 mb-1 text-ink-900 dark:text-ink-50">{t('loginCreator.title')}</h1>
        <p className="text-[13.5px] text-ink-500 mb-6">{t('loginCreator.subtitle')}</p>
        <form onSubmit={form.handleSubmit} className="space-y-3.5">
          <FormField
            name="email"
            label={t('auth.email')}
            type="email"
            placeholder={t('auth.emailPlaceholder')}
            value={form.values.email}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            error={form.errors.email}
            touched={form.touched.email}
            autoComplete="email"
            required
          />
          <FormField
            name="password"
            label={t('auth.password')}
            type="password"
            placeholder="••••••••"
            value={form.values.password}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            error={form.errors.password}
            touched={form.touched.password}
            autoComplete="current-password"
            required
          />
          <div className="flex items-center justify-between text-[12px]">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" name="remember" checked={form.values.remember} onChange={form.handleChange} className="accent-brand-600"/>
              {t('auth.rememberMe')}
            </label>
            <a className="text-brand-600 hover:underline" href="#" onClick={e=>e.preventDefault()}>{t('auth.forgotPassword')}</a>
          </div>
          {form.submitError && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 text-[13px] text-rose-700 dark:text-rose-300">
              {form.submitError}
            </div>
          )}
          <Button type="submit" full size="lg" iconRight="arrowR" disabled={form.isSubmitting}>{form.isSubmitting ? t('loading.signingIn') : t('landing.loginCreator')}</Button>
        </form>
        <div className="text-center text-[12.5px] text-ink-500 mt-6">
          {t('loginCreator.noAccount')} <a className="text-brand-600 font-medium hover:underline" href="#" onClick={e=>{e.preventDefault();go({screen:'register'});}}>{t('loginCreator.registerHere')}</a>
        </div>
        <div className="text-center text-[12px] mt-3">
          {t('loginCreator.areYouExpert')} <a className="text-emerald-600 font-medium hover:underline" href="#" onClick={e=>{e.preventDefault();go({screen:'login-expert'});}}>{t('loginCreator.expertLogin')}</a>
        </div>
        <div className="mt-6 text-center"><a href="#" onClick={e=>{e.preventDefault();go({screen:'landing'});}} className="text-[12px] text-ink-500 hover:underline">{t('auth.backHome')}</a></div>
      </AuthShell>
    </>
  );
}

function LoginExpert({ go }) {
  const { login } = useAuth();
  const { t } = useLanguage();

  const form = useFormValidation(
    { email: '', password: '', remember: false },
    {
      email: [window.validators.required, window.validators.email],
      password: window.validators.required,
    },
    async (values, { setSubmitting, setErrors }) => {
      try {
        const response = await window.authService.loginExpert(values.email, values.password);
        const user = response.data || {};
        if (user.role && user.role !== 'expert') {
          setErrors({ submit: t('loginExpert.notExpert') });
          setSubmitting(false);
          return;
        }
        login({ role: 'expert', ...user });
        go({
          screen: 'expert-dashboard',
          role: 'expert'
        });
      } catch (error) {
        setErrors({ submit: t('loginExpert.invalid') });
        go({ toast: { message: t('loginExpert.invalid'), type: 'error' } });
        setSubmitting(false);
      }
    }
  );

  return (
    <>
      {form.isSubmitting && <LoadingModal />}
      <AuthShell accent="emerald" side={
        <div>
          <h2 className="font-serif text-[44px] leading-[1.05]">{t('loginExpert.sideTitle1')}<br/>{t('loginExpert.sideTitle2')}</h2>
          <p className="text-white/80 text-[15px] mt-3 max-w-sm">
            {t('loginExpert.sideBody')}
          </p>
        </div>
      }>
        <Badge tone="green" icon="users">{t('loginExpert.badge')}</Badge>
        <h1 className="font-serif text-[34px] mt-3 mb-1 text-ink-900 dark:text-ink-50">{t('loginExpert.title')}</h1>
        <p className="text-[13.5px] text-ink-500 mb-6">{t('loginExpert.subtitle')}</p>
        <form onSubmit={form.handleSubmit} className="space-y-3.5">
          <FormField
            name="email"
            label={t('loginExpert.emailLabel')}
            type="email"
            placeholder={t('auth.emailPlaceholder')}
            value={form.values.email}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            error={form.errors.email}
            touched={form.touched.email}
            autoComplete="email"
            required
          />
          <FormField
            name="password"
            label={t('loginExpert.passwordLabel')}
            type="password"
            placeholder="••••••••"
            value={form.values.password}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            error={form.errors.password}
            touched={form.touched.password}
            helperText={t('loginExpert.passwordHelper')}
            autoComplete="current-password"
            required
          />
          {form.submitError && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 text-[13px] text-rose-700 dark:text-rose-300">
              {form.submitError}
            </div>
          )}
          <Button type="submit" variant="success" full size="lg" iconRight="arrowR" disabled={form.isSubmitting}>{form.isSubmitting ? t('loading.signingIn') : t('landing.loginExpert')}</Button>
        </form>
        <div className="text-center text-[12.5px] text-ink-500 mt-6">
          {t('loginExpert.areYouCreator')} <a className="text-brand-600 font-medium hover:underline" href="#" onClick={e=>{e.preventDefault();go({screen:'login-creator'});}}>{t('loginExpert.creatorLogin')}</a>
        </div>
        <div className="mt-6 text-center"><a href="#" onClick={e=>{e.preventDefault();go({screen:'landing'});}} className="text-[12px] text-ink-500 hover:underline">{t('auth.backHome')}</a></div>
      </AuthShell>
    </>
  );
}

function RegisterCreator({ go }) {
  const { login } = useAuth();
  const { t } = useLanguage();
  const [f, setF] = useState({ name:'', inst:'', email:'', pw:'', pw2:'' });
  const [errs, setErrs] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!f.name.trim()) e.name = t('register.nameRequired');
    if (!f.inst.trim()) e.inst = t('register.institutionRequired');
    if (!/^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(f.email)) e.email = t('register.emailInvalid');
    if (f.pw.length < 6) e.pw = t('register.passwordMin');
    if (f.pw !== f.pw2) e.pw2 = t('register.passwordMismatch');
    setErrs(e); return !Object.keys(e).length;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    try {
      const response = await window.authService.registerCreator({
        name: f.name,
        institution: f.inst,
        email: f.email,
        password: f.pw,
        defaultMethod: 'AHP'
      });
      const user = response.data || {};
      login({ role: 'creator', ...user });
      go({
        screen: 'creator-dashboard',
        role: 'creator',
        user: { role: 'creator', ...user }
      });
    } catch (error) {
      setErrs({ submit: error.message || t('register.failed') });
      console.error('Register error:', error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <AuthShell side={
      <div>
        <h2 className="font-serif text-[44px] leading-[1.05]">{t('register.sideTitle1')}<br/>{t('register.sideTitle2')}</h2>
        <p className="text-white/80 text-[15px] mt-3 max-w-sm">
          {t('register.sideBody')}
        </p>
      </div>
    }>
      <h1 className="font-serif text-[32px] mb-1 text-ink-900 dark:text-ink-50">{t('register.title')}</h1>
      <p className="text-[13.5px] text-ink-500 mb-5">{t('register.subtitle')}</p>
      <form onSubmit={submit} className="space-y-3.5">
        <Input label={t('register.fullName')} icon="user" placeholder={t('register.namePlaceholder')} value={f.name} error={errs.name} onChange={e=>setF({...f, name:e.target.value})}/>
        <Input label={t('register.institution')} icon="book" placeholder={t('register.institutionPlaceholder')} value={f.inst} error={errs.inst} onChange={e=>setF({...f, inst:e.target.value})}/>
        <Input label={t('auth.email')} icon="mail" placeholder={t('auth.emailPlaceholder')} value={f.email} error={errs.email} onChange={e=>setF({...f, email:e.target.value})}/>
        <div className="grid grid-cols-2 gap-3">
          <Input label={t('auth.password')} icon="lock" type="password" value={f.pw} error={errs.pw} onChange={e=>setF({...f, pw:e.target.value})}/>
          <Input label={t('register.confirm')} icon="lock" type="password" value={f.pw2} error={errs.pw2} onChange={e=>setF({...f, pw2:e.target.value})}/>
        </div>
        {errs.submit && <div className="text-[12px] text-rose-600">{errs.submit}</div>}
        <Button type="submit" full size="lg" iconRight="arrowR" disabled={loading}>{loading ? t('register.submitting') : t('register.submit')}</Button>
      </form>
      <div className="text-center text-[12.5px] text-ink-500 mt-5">
        {t('register.haveAccount')} <a className="text-brand-600 font-medium hover:underline" href="#" onClick={e=>{e.preventDefault();go({screen:'login-creator'});}}>{t('register.signIn')}</a>
      </div>
      <div className="mt-4 text-center"><a href="#" onClick={e=>{e.preventDefault();go({screen:'landing'});}} className="text-[12px] text-ink-500 hover:underline">{t('auth.back')}</a></div>
    </AuthShell>
  );
}

Object.assign(window, { Landing, LoginCreator, LoginExpert, RegisterCreator });
