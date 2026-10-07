module.exports = {
  meta: {
    code: 'FUZZY_AHP', label: 'Fuzzy AHP',
    description: 'AHP dengan bilangan fuzzy segitiga (TFN) untuk menangkap ketidakpastian penilaian.',
    family: 'pairwise_ratio', structure_tier: 'two_tier', judgment_shape: 'fuzzy_ratio_matrix',
    consistency_kind: 'cr', result_shape: 'ranking', max_elements: 20,
    is_selectable: true, derived_from: null, sort_order: 30,
  },
};
