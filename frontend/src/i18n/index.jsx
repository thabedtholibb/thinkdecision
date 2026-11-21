// i18n — merges the per-domain dictionaries (I18N_COMMON, I18N_AUTH, ...)
// into one lookup table. Load order: this file loads after every I18N_*
// file so they're all defined as globals by the time this runs.
const TRANSLATIONS = {
  en: { ...I18N_COMMON.en, ...I18N_AUTH.en, ...I18N_CREATOR.en, ...I18N_EXPERT.en, ...I18N_TUTORIALS.en },
  id: { ...I18N_COMMON.id, ...I18N_AUTH.id, ...I18N_CREATOR.id, ...I18N_EXPERT.id, ...I18N_TUTORIALS.id },
};

// Falls back to English, then to the key itself, so a missing translation
// never renders blank. `params` does plain {name} substitution — no plural
// rules, no ICU — this app's strings don't need that complexity.
function translate(key, lang, params) {
  let str = TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.en[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    }
  }
  return str;
}

Object.assign(window, { TRANSLATIONS, translate });
