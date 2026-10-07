const ism = require('../src/services/methods/ism');
const micmac = require('../src/services/methods/micmac');
const methods = require('../src/services/methods');

const elements = ['e1', 'e2', 'e3', 'e4'].map((id) => ({ id, name: id }));
const ids = elements.map((e) => e.id);
// Contract section 5 example.
const contractSsim = { '0-1': 'V', '0-2': 'O', '0-3': 'V', '1-2': 'A', '1-3': 'O', '2-3': 'V' };

describe('ism.computeResult (contract example)', () => {
  const payload = ism.computeResult([{ expert_id: 'x', name: 'A', order: ids, comparisons: contractSsim }], elements);

  test('reachability, levels, edges', () => {
    const R = [[1, 1, 0, 1], [0, 1, 0, 0], [0, 1, 1, 1], [0, 0, 0, 1]];
    expect(payload.initial_reachability).toEqual(R);
    expect(payload.final_reachability).toEqual(R);
    expect(payload.transitive_cells).toEqual([]);
    expect(payload.iterations).toEqual([
      { level: 1, elements: ['e2', 'e4'] },
      { level: 2, elements: ['e1', 'e3'] },
    ]);
    expect(payload.digraph_edges).toEqual([['e1', 'e2'], ['e1', 'e4'], ['e3', 'e2'], ['e3', 'e4']]);
    expect(payload.consensus_ssim[0]).toEqual([null, 'V', 'O', 'V']);
    expect(payload.consensus_ssim[1]).toEqual([null, null, 'A', 'O']);
  });

  test('MICMAC driving/dependence and sums', () => {
    const m = micmac.fromReachability(payload.final_reachability, payload.element_order);
    expect(m.threshold).toBe(2);
    expect(m.elements.map((e) => [e.driving, e.dependence])).toEqual([[3, 1], [1, 3], [3, 1], [1, 3]]);
    expect(m.elements.map((e) => e.quadrant)).toEqual(['independent', 'dependent', 'independent', 'dependent']);
    const ones = payload.final_reachability.flat().filter(Boolean).length;
    const sum = (k) => m.elements.reduce((a, e) => a + e[k], 0);
    expect(sum('driving')).toBe(ones);
    expect(sum('dependence')).toBe(ones);
  });

  test('expert order differing from canonical order is remapped', () => {
    // Same judgments, expert saw elements reversed: e4,e3,e2,e1.
    const rev = { '0-1': 'A', '0-2': 'O', '0-3': 'A', '1-2': 'V', '1-3': 'O', '2-3': 'A' };
    const p = ism.computeResult([{ expert_id: 'x', order: [...ids].reverse(), comparisons: rev }], elements);
    expect(p.final_reachability).toEqual(payload.final_reachability);
  });
});

describe('ism transitivity', () => {
  test('closure adds a 1* cell and reports it', () => {
    const els = ['a', 'b', 'c'].map((id) => ({ id }));
    const p = ism.computeResult([{ expert_id: 'x', order: ['a', 'b', 'c'], comparisons: { '0-1': 'V', '0-2': 'O', '1-2': 'V' } }], els);
    expect(p.initial_reachability[0][2]).toBe(0);
    expect(p.final_reachability[0][2]).toBe(1);
    expect(p.transitive_cells).toEqual([[0, 2]]);
    expect(p.digraph_edges).toEqual([['a', 'b'], ['b', 'c']]);
    expect(p.iterations.map((l) => l.elements)).toEqual([['c'], ['b'], ['a']]);
  });
});

describe('ism.majorityVote', () => {
  const M = (v) => [[1, v], [0, 1]];

  test('3 equal-weight experts 1/1/0 -> 1', () => {
    const r = ism.majorityVote([M(1), M(1), M(0)]);
    expect(r.matrix[0][1]).toBe(1);
    expect(r.ties).toEqual([]);
  });

  test('2 experts 1/0 -> tie decided 0', () => {
    const r = ism.majorityVote([M(1), M(0)]);
    expect(r.matrix[0][1]).toBe(0);
    expect(r.ties).toEqual([[0, 1]]);
    expect(r.score).toBe(0.5); // [1][0] unanimous, [0][1] not
  });

  test('weight flips the result', () => {
    expect(ism.majorityVote([M(1), M(0), M(0)], [3, 1, 1]).matrix[0][1]).toBe(1);
    expect(ism.majorityVote([M(1), M(1), M(0)], [1, 1, 3]).matrix[0][1]).toBe(0);
  });
});

describe('ism.validateComparisons', () => {
  const check = (order, cmp, opts) => ism.validateComparisons(order, cmp, ['a', 'b', 'c'], opts);

  test('accepts a partial draft', () => {
    expect(check(['c', 'a', 'b'], { '0-1': 'V' })).toEqual({ errors: [], missing: [] });
  });

  test('rejects i >= j and out-of-range keys', () => {
    expect(check(['a', 'b', 'c'], { '1-0': 'V' }).errors).toHaveLength(1);
    expect(check(['a', 'b', 'c'], { '1-1': 'V' }).errors).toHaveLength(1);
    expect(check(['a', 'b', 'c'], { '0-3': 'V' }).errors).toHaveLength(1);
  });

  test('rejects bad symbols and empty comparisons', () => {
    expect(check(['a', 'b', 'c'], { '0-1': 'Z' }).errors).toHaveLength(1);
    expect(check(['a', 'b', 'c'], { '0-1': 3 }).errors).toHaveLength(1);
    expect(check(['a', 'b', 'c'], {}).errors).toHaveLength(1);
  });

  test('rejects non-permutation order', () => {
    expect(check(['a', 'b'], { '0-1': 'V' }).errors).toHaveLength(1);
    expect(check(['a', 'a', 'b'], { '0-1': 'V' }).errors).toHaveLength(1);
    expect(check(['a', 'b', 'z'], { '0-1': 'V' }).errors).toHaveLength(1);
  });

  test('submit reports missing cells', () => {
    expect(check(['a', 'b', 'c'], { '0-1': 'V' }, { submit: true }).missing).toEqual(['0-2', '1-2']);
    expect(check(['a', 'b', 'c'], { '0-1': 'V', '0-2': 'O', '1-2': 'X' }, { submit: true }).missing).toEqual([]);
  });
});

describe('ism.validateStructure', () => {
  const three = [{ id: '1' }, { id: '2' }, { id: '3' }];
  test('accepts 3 plain elements, rejects too few / subs / alternatives', () => {
    expect(ism.validateStructure({ criteria: three })).toEqual([]);
    expect(ism.validateStructure({ criteria: three.slice(0, 2) })).toHaveLength(1);
    expect(ism.validateStructure({ criteria: [...three, { id: '4', subs: [{}] }] })).toHaveLength(1);
    expect(ism.validateStructure({ criteria: three, alternatives: [{ id: 'x' }] })).toHaveLength(1);
  });
});

describe('methods registry', () => {
  test('normalizeCode maps legacy labels and passes unknown through', () => {
    expect(methods.normalizeCode('Fuzzy AHP')).toBe('FUZZY_AHP');
    expect(methods.normalizeCode('Fuzzy ANP')).toBe('FUZZY_ANP');
    expect(methods.normalizeCode('ISM')).toBe('ISM');
    expect(methods.normalizeCode('FOO')).toBe('FOO');
  });

  test('selectableCodes excludes MICMAC; list sorted', () => {
    expect(methods.selectableCodes()).toEqual(['AHP', 'ANP', 'FUZZY_AHP', 'FUZZY_ANP', 'ISM']);
    expect(methods.list().map((m) => m.code)).toEqual(['AHP', 'ANP', 'FUZZY_AHP', 'FUZZY_ANP', 'ISM', 'MICMAC']);
  });

  test('methodSchema accepts legacy labels, rejects MICMAC', () => {
    expect(methods.methodSchema.validate('Fuzzy ANP').value).toBe('FUZZY_ANP');
    expect(methods.methodSchema.validate('MICMAC').error).toBeTruthy();
  });
});
