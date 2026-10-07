module.exports = {
  meta: {
    code: 'FUZZY_ANP', label: 'Fuzzy ANP',
    description: 'ANP dengan bilangan fuzzy segitiga (TFN).',
    family: 'pairwise_ratio', structure_tier: 'two_tier', judgment_shape: 'fuzzy_ratio_matrix',
    consistency_kind: 'cr', result_shape: 'network_ranking', max_elements: 20,
    is_selectable: true, derived_from: null, sort_order: 40,
  },
};
