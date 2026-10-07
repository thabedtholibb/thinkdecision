// AHP math stays in ../ahpService.js; this module only carries metadata.
module.exports = {
  meta: {
    code: 'AHP', label: 'AHP',
    description: 'Analytic Hierarchy Process: perbandingan berpasangan skala Saaty, hasil peringkat alternatif.',
    family: 'pairwise_ratio', structure_tier: 'two_tier', judgment_shape: 'ratio_matrix',
    consistency_kind: 'cr', result_shape: 'ranking', max_elements: 20,
    is_selectable: true, derived_from: null, sort_order: 10,
  },
};
