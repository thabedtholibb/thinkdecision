/* FormField — reusable form input with validation */
function FormField({
  name,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  touched,
  placeholder,
  required,
  disabled = false,
  autoComplete,
  className = '',
  helperText,
}) {
  const showError = error && touched;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={name} className="text-sm font-medium text-ink-700 dark:text-ink-200">
          {label}
          {required && <span className="text-rose-600 dark:text-rose-400 ml-1">*</span>}
        </label>
      )}

      {type === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          className={classNames(
            'px-3 py-2 rounded-lg border text-sm transition-colors',
            'bg-white dark:bg-ink-900',
            'text-ink-900 dark:text-ink-100',
            'placeholder-ink-400 dark:placeholder-ink-500',
            showError
              ? 'border-rose-500 dark:border-rose-600 focus:ring-rose-500/40'
              : 'border-ink-300 dark:border-ink-700 focus:ring-brand-500/40',
            'focus:outline-none focus:ring-2 focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className
          )}
          rows="4"
        />
      ) : (
        <input
          id={name}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          className={classNames(
            'px-3 py-2 rounded-lg border text-sm transition-colors',
            'bg-white dark:bg-ink-900',
            'text-ink-900 dark:text-ink-100',
            'placeholder-ink-400 dark:placeholder-ink-500',
            showError
              ? 'border-rose-500 dark:border-rose-600 focus:ring-rose-500/40'
              : 'border-ink-300 dark:border-ink-700 focus:ring-brand-500/40',
            'focus:outline-none focus:ring-2 focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className
          )}
        />
      )}

      {showError && (
        <p className="text-[12px] text-rose-600 dark:text-rose-400 flex items-center gap-1">
          <Icon name="warn" className="w-3 h-3 shrink-0" />
          {error}
        </p>
      )}

      {helperText && !showError && (
        <p className="text-[12px] text-ink-500 dark:text-ink-400">{helperText}</p>
      )}
    </div>
  );
}

// Export
if (typeof window !== 'undefined') {
  window.FormField = FormField;
}
