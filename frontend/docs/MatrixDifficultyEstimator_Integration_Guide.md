# MatrixDifficultyEstimator - Integration & Data Flow Guide

**Component:** `src/components/MatrixDifficultyEstimator.jsx`  
**Purpose:** Display time estimate & difficulty before expert starts pairwise comparisons  
**Integration Points:** ExpertFill, MatrixFillWizard, CaseSetup  

---

## 1. COMPONENT ARCHITECTURE

```
┌─────────────────────────────────────────────────┐
│   Expert Fill / Case Setup Flow                  │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │ CaseSetup / Dashboard                    │  │
│  │ (Shows case with criteria count)          │  │
│  └─────────────┬──────────────────────────┘  │
│                │                              │
│                ▼                              │
│  ┌──────────────────────────────────────────┐  │
│  │ MatrixDifficultyEstimator                │  │
│  │ (Displays time estimate & difficulty)    │  │
│  │                                           │  │
│  │ Props:                                    │  │
│  │  - criteriaCount: 3                      │  │
│  │  - alternativeCount: 5                   │  │
│  │  - onDifficultyChange: callback          │  │
│  └─────────────┬──────────────────────────┘  │
│                │                              │
│  ┌─────────────┴──────────────────────────┐  │
│  │                                         │  │
│  ▼                                         ▼  │
│  Expert sees: "21 pairs,                    │  │
│  ~32 minutes (MODERATE)"                    │  │
│                                             │  │
│  ┌──────────────────────────────────────┐  │
│  │ MatrixFillWizard                     │  │
│  │ (Expert proceeds if ready)           │  │
│  └──────────────────────────────────────┘  │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 2. DATA FLOW DIAGRAM

### Input → Calculation → Output

```
┌──────────────────────────────────┐
│ 1. INPUT PROPS FROM PARENT       │
├──────────────────────────────────┤
│                                   │
│  criteriaCount: 4                │
│  (Number of criteria in hierarchy)│
│                                   │
│  alternativeCount: 3             │
│  (Number of alternatives)         │
│                                   │
│  onDifficultyChange: (level) => {}│
│  (Callback when difficulty changes)│
│                                   │
└─────────────────┬────────────────┘
                  │
                  ▼
┌──────────────────────────────────┐
│ 2. INPUT VALIDATION              │
├──────────────────────────────────┤
│                                   │
│  validateCount(4)                │
│  ├─ Is NaN? → No                 │
│  ├─ Is negative? → No            │
│  └─ Return: 4 (Integer)          │
│                                   │
│  validateCount(3)                │
│  └─ Return: 3 (Integer)          │
│                                   │
│  validCriteriaCount = 4          │
│  validAlternativeCount = 3       │
│                                   │
└─────────────────┬────────────────┘
                  │
                  ▼
┌──────────────────────────────────┐
│ 3. PAIR CALCULATION              │
├──────────────────────────────────┤
│                                   │
│  criteriaPairs = 4 * 3 / 2 = 6  │
│  (A-B, A-C, A-D, B-C, B-D, C-D) │
│                                   │
│  altPairsPerCrit = 3 * 2 / 2 = 3│
│  (Alt1-Alt2, Alt1-Alt3, Alt2-Alt3)
│                                   │
│  totalPairs = 6 + (4 × 3) = 18   │
│                                   │
│  totalPairs = 18                 │
│                                   │
└─────────────────┬────────────────┘
                  │
                  ▼
┌──────────────────────────────────┐
│ 4. TIME ESTIMATION               │
├──────────────────────────────────┤
│                                   │
│  estimatedMinutes = 18 × 1.5 = 27│
│  (1.5 minutes per pair average)  │
│                                   │
│  timeLabel = "27 minutes"        │
│                                   │
└─────────────────┬────────────────┘
                  │
                  ▼
┌──────────────────────────────────┐
│ 5. DIFFICULTY ASSESSMENT         │
├──────────────────────────────────┤
│                                   │
│  getDifficultyLevel(18)          │
│  ├─ Is 18 <= 6? → No            │
│  ├─ Is 18 <= 15? → No           │
│  ├─ Is 18 <= 28? → Yes ✓        │
│  └─ Return: {                    │
│      level: 'CHALLENGING',       │
│      label: 'Challenging',       │
│      icon: '⚠',                  │
│      color: 'bg-amber-50',       │
│      textColor: 'text-amber-700' │
│    }                             │
│                                   │
│  difficulty = {CHALLENGING...}   │
│                                   │
└─────────────────┬────────────────┘
                  │
                  ▼
┌──────────────────────────────────┐
│ 6. RECOMMENDATION LOGIC          │
├──────────────────────────────────┤
│                                   │
│  getRecommendation()             │
│  ├─ Is 18 <= 6? → No            │
│  ├─ Is 18 <= 15? → No           │
│  ├─ Is 18 <= 28? → Yes ✓        │
│  └─ Return: {                    │
│      icon: '⏱️',                  │
│      text: "This will take ~27   │
│       minutes. Start with top 2  │
│       criteria first...",         │
│      color: 'text-amber-700'     │
│    }                             │
│                                   │
│  recommendation = {CHALLENGING...}
│                                   │
└─────────────────┬────────────────┘
                  │
                  ▼
┌──────────────────────────────────┐
│ 7. CALLBACK TRIGGER              │
├──────────────────────────────────┤
│                                   │
│  useEffect(() => {               │
│    if (onDifficultyChange &&     │
│        typeof === 'function')    │
│      onDifficultyChange(         │
│        'CHALLENGING'             │
│      )                           │
│  }, [difficulty.level])          │
│                                   │
│  Parent receives: level          │
│  → Can update UI accordingly     │
│  → Can disable submit if complex │
│                                   │
└─────────────────┬────────────────┘
                  │
                  ▼
┌──────────────────────────────────┐
│ 8. RENDER OUTPUT                 │
├──────────────────────────────────┤
│                                   │
│  ┌──────────────────────────────┐│
│  │ DIFFICULTY CARD              ││
│  │ ⚠ Challenging (30-45 min)   ││
│  │ 18 pairs to compare          ││
│  │ ⏱️ ~27 minutes              ││
│  └──────────────────────────────┘│
│                                   │
│  ┌──────────────────────────────┐│
│  │ BREAKDOWN                    ││
│  │ Criteria: 6 | Alternatives: 12││
│  └──────────────────────────────┘│
│                                   │
│  ┌──────────────────────────────┐│
│  │ RECOMMENDATION               ││
│  │ ⏱️ This will take ~27 minutes. ││
│  │ Start with top 2 criteria    ││
│  │ first, then add others.      ││
│  └──────────────────────────────┘│
│                                   │
└─────────────────────────────────┘
```

---

## 3. STATE MANAGEMENT

### Props → Calculation → Render

```javascript
// From parent component:
props = {
  criteriaCount: 4,
  alternativeCount: 3,
  onDifficultyChange: (level) => setDifficulty(level)
}

// Inside component:
validCriteriaCount = validateCount(4) = 4
validAlternativeCount = validateCount(3) = 3

criteriaPairs = 4 * (4-1) / 2 = 6
alternativePairsPerCriterion = 3 * (3-1) / 2 = 3
totalPairs = 6 + (4 * 3) = 18

estimatedMinutes = Math.ceil(18 * 1.5) = 27

difficulty = {
  level: 'CHALLENGING',
  label: 'Challenging (30-45 min)',
  color: 'bg-amber-50 dark:bg-amber-950/20',
  textColor: 'text-amber-700 dark:text-amber-300',
  icon: '⚠',
  borderColor: 'border-amber-200 dark:border-amber-900'
}

// Render:
<div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 ...">
  <span className="text-2xl">⚠</span>
  <div className="font-bold text-sm text-amber-700">
    Challenging (30-45 min)
  </div>
  <div className="text-xs">18 pairs to compare</div>
  
  <div className="text-right">
    <div className="text-sm font-mono font-bold">
      ⏱️ 27 minutes
    </div>
  </div>
</div>
```

---

## 4. ERROR HANDLING FLOW

```
Input: criteriaCount (could be: 4, "4", 4.7, NaN, -5, undefined)
  │
  ├─ Type Check: Is it a number or convertible?
  │  ├─ "4" → Number("4") = 4 ✓
  │  ├─ 4.7 → Math.floor(4.7) = 4 ✓
  │  ├─ NaN → console.warn + return 0
  │  ├─ -5 → console.warn + return 0
  │  └─ undefined → use default (0)
  │
  └─ Safe Value: Guaranteed 0 or positive integer
     ↓
     Use in calculations with confidence
     ↓
     No crashes, no NaN propagation
```

---

## 5. INTEGRATION WITH PARENT COMPONENTS

### Usage in CaseSetup / ExpertFill

```jsx
// PARENT: CaseWizard.jsx or ExpertFill.jsx

import MatrixDifficultyEstimator from './MatrixDifficultyEstimator';

function ExpertFill({ case }) {
  const [difficulty, setDifficulty] = useState(null);
  const [canStartMatrix, setCanStartMatrix] = useState(true);
  
  const handleDifficultyChange = (level) => {
    setDifficulty(level);
    
    // Optional: Disable start if too complex
    if (level === 'COMPLEX') {
      // Show warning but don't disable
      console.warn('Complex task - expert should plan multiple sessions');
    }
  };
  
  return (
    <div>
      {/* Show time estimate before matrix entry */}
      <MatrixDifficultyEstimator
        criteriaCount={case.hierarchy.criteria.length}
        alternativeCount={case.hierarchy.alternatives.length}
        onDifficultyChange={handleDifficultyChange}
      />
      
      {/* Expert can proceed despite difficulty */}
      <button 
        onClick={() => startMatrixFill()}
        disabled={!canStartMatrix}
      >
        Start Filling Matrix
      </button>
      
      {difficulty === 'COMPLEX' && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
          ⚠️ This is a complex task. Consider taking breaks every 20 minutes.
        </div>
      )}
    </div>
  );
}
```

### Data Flow: Parent → Component → Callback

```
1. Parent passes criteriaCount and alternativeCount
   ↓
2. MatrixDifficultyEstimator calculates and displays
   ↓
3. Expert sees time estimate and difficulty
   ↓
4. Component calls onDifficultyChange('CHALLENGING')
   ↓
5. Parent receives callback, can:
   - Update UI (show/hide warning)
   - Disable/enable start button
   - Set deadline reminder
   - Log analytics (complex cases take longer)
```

---

## 6. CONTEXT OBJECT STRUCTURE

Not needed for this component. Props are simple scalars:
- `criteriaCount: number` (required)
- `alternativeCount: number` (required)
- `onDifficultyChange: function` (optional)

---

## 7. RENDERING DECISION TREE

```
Should render MatrixDifficultyEstimator?
├─ YES: Always render (it's the estimate display)
│
└─ Should show time estimate?
   ├─ totalPairs > 0?
   │  ├─ YES: Show full card with difficulty level
   │  └─ NO: Show "No comparisons" message
   │
   └─ Should show breakdown details?
      ├─ totalPairs > 0?
      │  ├─ YES: Show "Criteria Pairs" and "Alt Pairs" grid
      │  └─ NO: Hide breakdown (nothing to break down)
      │
      └─ Should show recommendation?
         ├─ totalPairs > 0?
         │  ├─ YES: Show context-specific recommendation
         │  └─ NO: Hide recommendation
```

---

## 8. TEST INTEGRATION SCENARIOS

### Scenario A: Simple Case (Expert Fills Quick)
```
1. Expert opens case with 2 criteria, 2 alternatives
   └─ MatrixDifficultyEstimator shows: "3 pairs" / "Easy (5-10 min)"
   ↓
2. Recommendation: "Great! This is a quick task."
   ↓
3. Expert feels confident → Starts filling immediately
   ↓
4. Expert completes in 5-7 minutes
✓ Time estimate accurate, expert satisfied
```

### Scenario B: Complex Case (Expert Plans Sessions)
```
1. Expert opens case with 8 criteria, 6 alternatives
   └─ MatrixDifficultyEstimator shows: "76 pairs" / "Complex (60+ min)"
   ↓
2. Recommendation: "Break into multiple sessions. Start with 3-4 important criteria."
   ↓
3. Expert sees onDifficultyChange callback triggered
   └─ Parent can show deadline recommendation UI
   ↓
4. Expert plans: Session 1 (top criteria), Session 2 (remaining)
   ↓
5. Expert sets own deadline (3-5 days instead of 1 day)
✓ Prevents expert rushing, improves CR quality
```

### Scenario C: Edge Case (Invalid Input)
```
1. Parent buggy: Passes criteriaCount="abc"
   ↓
2. MatrixDifficultyEstimator:
   └─ validateCount("abc") → console.warn + return 0
   ↓
3. Shows: "0 pairs" / "No comparisons"
   ↓
4. Expert sees no estimate but no crash
   ↓
5. Parent fixed, component re-renders with correct data
✓ Graceful error handling, no UI crash
```

---

## 9. PERFORMANCE CHECKLIST

- [ ] Component renders in < 50ms
- [ ] Calculation is instant (pure math, no loops)
- [ ] No re-renders when props unchanged
- [ ] No memory leaks on unmount
- [ ] Scales to 100+ pair counts without lag

---

## 10. INTEGRATION TESTING STEPS

```bash
# 1. Unit tests pass
npm test MatrixDifficultyEstimator.test.jsx

# 2. Integration test: With ExpertFill parent
npm test ExpertFill.integration.test.jsx

# 3. Manual testing in browser
npm start
→ Navigate to case setup
→ Open matrix entry
→ See time estimate display
→ Test on mobile

# 4. Verify callback firing
→ Open DevTools Console
→ Check onDifficultyChange logs
→ Verify parent receives difficulty level
```

---

## 11. DEPLOYMENT CHECKLIST

Before deploying to production:

- [ ] All tests pass
- [ ] No console errors
- [ ] Time estimates validated against real data
- [ ] Mobile responsive tested
- [ ] Dark mode validated
- [ ] Accessibility audit passed
- [ ] Integration with parent components works
- [ ] Data flow validated
- [ ] Callback logic verified
- [ ] Documentation complete

---

## 12. DATA ACCURACY NOTES

### Time Estimate Calibration
The 1.5 minutes per pair is based on:
- Understanding the comparison (20-30 sec)
- Entering the judgment (10-20 sec)
- Validation and uncertainty (20-30 sec)

**May vary based on:**
- Expert experience level
- Criteria familiarity
- Matrix complexity
- Language (if non-English)

**Future enhancement:** Could adjust multiplier based on expert level or offer calibration.

---

## 13. USAGE EXAMPLE

```jsx
import MatrixDifficultyEstimator from './MatrixDifficultyEstimator';

// Simple usage
<MatrixDifficultyEstimator 
  criteriaCount={3} 
  alternativeCount={5} 
/>

// With callback to parent
<MatrixDifficultyEstimator 
  criteriaCount={numCriteria}
  alternativeCount={numAlternatives}
  onDifficultyChange={(level) => {
    console.log('Difficulty:', level); // EASY, MODERATE, CHALLENGING, COMPLEX
    if (level === 'COMPLEX') {
      showWarning('This task may take a while');
    }
  }}
/>
```

---

**Version:** 1.0  
**Last Updated:** 2026-05-30  
**Status:** Ready for Integration Testing
