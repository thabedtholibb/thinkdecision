# SaatyReferenceGuide - Integration & Data Flow Guide

## 1. COMPONENT ARCHITECTURE

```
┌─────────────────────────────────────────────────────┐
│   Expert Matrix Fill Flow                           │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌─────────────────┐                                │
│  │ MatrixFillView  │ (Parent Container)             │
│  └────────┬────────┘                                │
│           │                                         │
│      ┌────┴─────────────┬──────────────────┐       │
│      │                  │                  │        │
│      ▼                  ▼                  ▼        │
│  ┌──────────┐    ┌──────────────┐   ┌──────────┐  │
│  │ Saaty    │    │ Saaty        │   │ Matrix   │  │
│  │Reference │────│ ScaleInput   │   │ Display  │  │
│  │Guide     │    │              │   │          │  │
│  │(GUIDANCE)│    │ (INPUT)      │   │(PREVIEW) │  │
│  └──────────┘    └──────────────┘   └──────────┘  │
│      ▲                  │                          │
│      │                  │                          │
│      └──────────────────┴──────────────────────────┤
│         Props: currentScale, comparisonContext     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## 2. DATA FLOW DIAGRAM

### Input → Validation → Rendering Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. INPUT PROPS                                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  currentScale: 5              comparisonContext: {               │
│  (could be: 1-9,                item1: "Durability",            │
│   "5", 5.7, NaN,                item2: "Price"                  │
│   undefined, etc)              }                                │
│                                                                   │
└───────────────────────┬────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. VALIDATION                                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  validateScale(5)                                               │
│  ├─ Is NaN? → false                                             │
│  ├─ Is < 1 or > 9? → false                                      │
│  ├─ Is float? → false                                           │
│  └─ Return: 5 (Integer)                                         │
│                                                                   │
│  validScale = 5                                                  │
│                                                                   │
│  Validation Status: ✅ PASS                                      │
│                                                                   │
└───────────────────────┬────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. DATA LOOKUP                                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  getCurrentDefinition()                                         │
│  ├─ Find scaleDefinitions[validScale]                          │
│  └─ Found: {                                                    │
│      value: 5,                                                  │
│      label: "Strong Importance",                               │
│      semantics: "One is strongly more important",              │
│      examples: ["Safety 5x...", "Reliability 5x..."],         │
│      color: "bg-amber-50 dark:bg-amber-950/20"                │
│    }                                                            │
│                                                                   │
│  currentDef = {definition object}                              │
│                                                                   │
└───────────────────────┬────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. RENDER STRUCTURE                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────┐                       │
│  │ Guide Header                         │                       │
│  │ "SAATY SCALE GUIDE"                  │                       │
│  └──────────────────────────────────────┘                       │
│           │                                                       │
│  ┌────────▼──────────────────────────────┐                      │
│  │ Scale Items (1-9)                    │                      │
│  │                                       │                      │
│  │ [1] [Equal]                    ◎      │ Normal               │
│  │ [2] [Nearly Equal]                   │ Normal               │
│  │ [3] [Moderate]                       │ Normal               │
│  │ [4] [Moderately Strong]              │ Normal               │
│  │ [5] [Strong] ████ (Selected)    ✓    │ ← HIGHLIGHTED        │
│  │ [6] [Strongly Very Strong]           │ Normal               │
│  │ [7] [Very Strong]                    │ Normal               │
│  │ [8] [Very Very Strong]               │ Normal               │
│  │ [9] [Extreme]                        │ Normal               │
│  │                                       │                      │
│  └────────┬──────────────────────────────┘                      │
│           │                                                       │
│  ┌────────▼──────────────────────────────┐                      │
│  │ Selection Summary Box                │                      │
│  │ "Your selection: 5 = Strong Imp..."  │                      │
│  │ 💡 "This means: Durability is 5x..." │  (if context given) │
│  │ 📌 "Example: Safety 5x more imp..."  │                      │
│  └────────┬──────────────────────────────┘                      │
│           │                                                       │
│  ┌────────▼──────────────────────────────┐                      │
│  │ Scale Legend                         │                      │
│  │ [1-3] Weak   [4-6] Moderate [7-9] ST │                      │
│  └────────────────────────────────────────┘                      │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## 3. STATE MANAGEMENT

### Props → Internal State → Render

```
componentProps:
  {
    currentScale: 5,
    comparisonContext: {
      item1: "Durability",
      item2: "Price"
    }
  }
          │
          ▼
validScale = validateScale(5) = 5
          │
          ▼
currentDef = getCurrentDefinition() = {
  value: 5,
  label: "Strong Importance",
  ...
}
          │
          ▼
Render Output:
  ├─ Display all 9 scale items
  ├─ Highlight item at index 4 (scale 5)
  ├─ Show "Strong Importance" description
  ├─ Show context help: "Durability is 5x more important than Price"
  └─ Show example: "Safety 5x more important..."
```

## 4. ERROR HANDLING FLOW

```
Input: currentScale
  │
  ├─ Type Check
  │  ├─ Is it a number? (or convertible to number)
  │  │  YES: Continue
  │  │  NO:  console.warn("Invalid scale"); Return 1
  │  │
  │  └─ Convert string to number if needed
  │
  ├─ Range Check
  │  ├─ Is it 1-9?
  │  │  YES: Continue
  │  │  NO:  console.warn("Out of range"); Return 1
  │  │
  │  └─ Round float to integer
  │
  └─ Fallback
     If any error: Use default scale (1)
     Result: Guaranteed valid integer 1-9
```

## 5. INTEGRATION WITH PARENT COMPONENTS

### Usage in SaatyScaleInput

```jsx
// PARENT: SaatyScaleInput.jsx

function SaatyScaleInput({ item1, item2, value, onChange }) {
  return (
    <div className="space-y-2">
      {/* Show reference guide */}
      <SaatyReferenceGuide
        currentScale={value}
        comparisonContext={{item1, item2}}
      />

      {/* Scale input */}
      <input
        type="range"
        min="1"
        max="9"
        value={value}
        onChange={e => onChange(parseInt(e.target.value))}
      />
    </div>
  );
}
```

**Data Flow:**
```
user moves slider → onChange triggered
                 → new value passed to SaatyScaleInput
                 → SaatyScaleInput re-renders
                 → currentScale prop updated
                 → SaatyReferenceGuide re-renders
                 → Guide highlights new scale
                 → Example text updates
```

## 6. CONTEXT OBJECT STRUCTURE

### Valid Context

```javascript
// Valid
{
  item1: "Durability",
  item2: "Price"
}

// Valid (will skip context-specific help)
{
  item1: "Durability"  // Missing item2
}

// Valid (no context)
null

// Valid (will skip context)
{}

// Invalid (handled gracefully)
undefined  // Will not render context help
{item1: null}  // Will not render context help
```

## 7. RENDERING DECISION TREE

```
Should render SaatyReferenceGuide?
├─ YES: Always render (it's the guide)
│
└─ Should show context-specific help?
   ├─ Is comparisonContext provided?
   │  ├─ YES: Is item1 and item2 present?
   │  │  ├─ YES: Render "Durability is 5x more important than Price"
   │  │  └─ NO: Skip context help section
   │  └─ NO: Skip context help section
   │
   └─ Should show example?
      ├─ Does currentDef.examples exist?
      │  ├─ YES: Is it an array?
      │  │  ├─ YES: Render first example
      │  │  └─ NO: Skip example section
      │  └─ NO: Skip example section
```

## 8. TEST INTEGRATION SCENARIOS

### Scenario A: Matrix Entry Flow
```
1. Expert clicks matrix entry button
   ↓
2. MatrixFillView renders with criteria pair
   ├─ Criteria A: "Durability"
   └─ Criteria B: "Price"
   ↓
3. SaatyScaleInput renders with:
   ├─ item1="Durability"
   ├─ item2="Price"
   └─ value=1 (default)
   ↓
4. SaatyReferenceGuide renders with:
   ├─ currentScale=1
   └─ comparisonContext={item1:"Durability", item2:"Price"}
   ↓
5. Expert sees: "Equal Importance with example"
   ↓
6. Expert moves slider to 5
   ↓
7. SaatyReferenceGuide updates:
   ├─ Highlights scale 5
   ├─ Shows "Strong Importance"
   └─ Shows "Durability is 5x more important than Price"
   ↓
8. Expert submits comparison (value=5 saved)
```

### Scenario B: Edge Case Handling
```
1. Parent passes invalid currentScale=15
   ↓
2. validateScale(15) → console.warn + returns 1
   ↓
3. SaatyReferenceGuide shows scale 1 (Equal Importance)
   ↓
4. Expert doesn't see error but sees default guide
   ✓ No crash, graceful degradation
```

## 9. PERFORMANCE CHECKLIST

- [ ] Component renders in < 50ms
- [ ] Scale switching updates in < 20ms
- [ ] No re-renders when props unchanged
- [ ] No memory leaks on unmount
- [ ] No excessive DOM updates

## 10. INTEGRATION TESTING STEPS

```bash
# 1. Unit tests pass
npm test SaatyReferenceGuide.test.jsx

# 2. Integration test: With SaatyScaleInput
npm test SaatyScaleInput.integration.test.jsx

# 3. Visual regression test
npm run test:visual SaatyReferenceGuide

# 4. Manual testing in browser
npm start
→ Navigate to expert matrix fill
→ Test with all 9 scales
→ Test on mobile
→ Test dark mode

# 5. Accessibility audit
npm run a11y:test
```

## 11. DEPLOYMENT CHECKLIST

Before deploying to production:

- [ ] All tests pass
- [ ] No console errors
- [ ] Mobile responsive tested
- [ ] Dark mode validated
- [ ] Accessibility audit passed
- [ ] Performance benchmarks met
- [ ] Integration with parent components works
- [ ] Data flow validated
- [ ] Edge cases handled
- [ ] Documentation complete

---

**Version:** 1.0  
**Last Updated:** 2026-05-30  
**Status:** Ready for Integration Testing
