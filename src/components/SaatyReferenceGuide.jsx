/**
 * SaatyReferenceGuide Component
 *
 * Displays visual Saaty scale guide with:
 * - All 9 levels with semantic meanings
 * - Real-world examples
 * - Current selection highlighting
 * - Context-specific anchoring
 *
 * @component
 * @example
 * <SaatyReferenceGuide
 *   currentScale={5}
 *   comparisonContext={{item1: "Durability", item2: "Price"}}
 * />
 */

/**
 * Validates that currentScale is within valid Saaty range
 */
const validateScale = (scale) => {
  const num = Number(scale);
  if (isNaN(num) || num < 1 || num > 9) {
    console.warn(`Invalid Saaty scale: ${scale}. Using default value 1.`);
    return 1;
  }
  return Math.round(num); // Ensure integer
};

function SaatyReferenceGuide({ currentScale = 1, comparisonContext = null }) {
  // Validate input
  const validScale = validateScale(currentScale);
  // Saaty scale definitions with examples
  const scaleDefinitions = [
    {
      value: 1,
      label: "Equal Importance",
      semantics: "Two factors contribute equally",
      examples: [
        "Quality and Reliability equally important",
        "Price and Availability equally valued"
      ],
      color: "bg-gray-100 dark:bg-gray-800"
    },
    {
      value: 2,
      label: "Nearly Equal / Weak",
      semantics: "Slight preference for one over the other",
      examples: ["Slightly prefer Brand A over Brand B"],
      color: "bg-blue-50 dark:bg-blue-950/20"
    },
    {
      value: 3,
      label: "Moderate Importance",
      semantics: "One is moderately more important",
      examples: [
        "Quality 3x more important than Speed",
        "Durability 3x preferred over Convenience"
      ],
      color: "bg-blue-100 dark:bg-blue-950/30"
    },
    {
      value: 4,
      label: "Moderately Strong",
      semantics: "One is more strongly preferred than moderate",
      examples: ["Reliability 4x more important than Appearance"],
      color: "bg-blue-50 dark:bg-blue-950/20"
    },
    {
      value: 5,
      label: "Strong Importance",
      semantics: "One is strongly more important",
      examples: [
        "Safety 5x more important than Speed",
        "Reliability 5x more critical than Cost"
      ],
      color: "bg-amber-50 dark:bg-amber-950/20"
    },
    {
      value: 6,
      label: "Strongly Very Strong",
      semantics: "One is very strongly preferred",
      examples: ["Performance 6x more important than Aesthetics"],
      color: "bg-blue-50 dark:bg-blue-950/20"
    },
    {
      value: 7,
      label: "Very Strong Importance",
      semantics: "One is very strongly more important",
      examples: [
        "Safety 7x more critical than Convenience",
        "Environmental Impact 7x more important than Color"
      ],
      color: "bg-orange-50 dark:bg-orange-950/20"
    },
    {
      value: 8,
      label: "Very Very Strong",
      semantics: "One is extremely more important",
      examples: ["Legal Compliance 8x more critical than Features"],
      color: "bg-blue-50 dark:bg-blue-950/20"
    },
    {
      value: 9,
      label: "Extreme Importance",
      semantics: "One is absolutely dominant",
      examples: [
        "Life Safety 9x more critical than Anything Else",
        "Regulatory Compliance 9x more important than Cost"
      ],
      color: "bg-red-50 dark:bg-red-950/20"
    }
  ];

  const getCurrentDefinition = () => {
    const def = scaleDefinitions.find(d => d.value === validScale);
    if (!def) {
      console.error(`Scale definition not found for value: ${validScale}`);
      return scaleDefinitions[0]; // Fallback to scale 1
    }
    return def;
  };

  const currentDef = getCurrentDefinition();

  return (
    <div className="sticky top-0 z-10 bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-700 rounded-lg p-4 mb-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-ink-900 dark:text-ink-50">
          📊 SAATY SCALE GUIDE
        </h3>
        <span className="text-xs text-ink-500">Select your preference below</span>
      </div>

      {/* Scale items */}
      <div className="space-y-1.5">
        {scaleDefinitions.map(def => {
          const isSelected = currentScale === def.value;

          return (
            <div
              key={def.value}
              className={`
                flex items-center gap-3 p-2.5 rounded-md cursor-pointer transition
                ${isSelected
                  ? 'ring-2 ring-brand-600 ring-offset-2 dark:ring-offset-ink-900 ' + def.color
                  : 'hover:' + def.color.replace('100', '200').replace('50', '75')
                }
              `}
              role="button"
              tabIndex={0}
              aria-selected={isSelected}
            >
              {/* Scale number - prominent */}
              <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 text-white font-bold text-sm">
                {def.value}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-ink-900 dark:text-ink-50">
                  {def.label}
                </div>
                <div className="text-xs text-ink-600 dark:text-ink-400 line-clamp-1">
                  {def.semantics}
                </div>
              </div>

              {/* Checkmark for selected */}
              {isSelected && (
                <div className="flex-shrink-0 text-brand-600 dark:text-brand-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Current selection summary */}
      {currentDef && (
        <div className="mt-4 p-3 bg-gradient-to-r from-brand-50 to-blue-50 dark:from-brand-950/30 dark:to-blue-950/30 rounded-lg border border-brand-200 dark:border-brand-900">
          <div className="text-sm">
            <span className="text-ink-600 dark:text-ink-300">Your selection: </span>
            <span className="font-bold text-brand-700 dark:text-brand-300">{currentDef.value}</span>
            <span className="text-ink-600 dark:text-ink-300"> = </span>
            <span className="font-bold text-brand-700 dark:text-brand-300">{currentDef.label}</span>
          </div>

          {/* Context-specific help text */}
          {comparisonContext && comparisonContext.item1 && comparisonContext.item2 && (
            <div className="mt-2 text-xs text-brand-700 dark:text-brand-300">
              💡 This means: <strong>{comparisonContext.item1}</strong> is
              <strong> {currentDef.value}x more important</strong> than
              <strong> {comparisonContext.item2}</strong>
            </div>
          )}

          {/* Example sentence */}
          {currentDef.examples && Array.isArray(currentDef.examples) && currentDef.examples.length > 0 && (
            <div className="mt-2 text-xs text-brand-700 dark:text-brand-300 italic">
              📌 Example: {currentDef.examples[0]}
            </div>
          )}
        </div>
      )}

      {/* Scale legend */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-ink-500 dark:text-ink-400 border-t border-ink-200 dark:border-ink-800 pt-3">
        <div className="text-center">
          <div className="font-semibold">1-3</div>
          <div>Weak</div>
        </div>
        <div className="text-center">
          <div className="font-semibold">4-6</div>
          <div>Moderate</div>
        </div>
        <div className="text-center">
          <div className="font-semibold">7-9</div>
          <div>Strong</div>
        </div>
      </div>
    </div>
  );
}

export default SaatyReferenceGuide;
