// MICMAC is derived from an ISM final reachability matrix (no expert input).
const meta = {
  code: 'MICMAC', label: 'MICMAC',
  description: 'Analisis driving power dan dependence power dari hasil ISM.',
  family: 'structural', structure_tier: 'single_tier', judgment_shape: null,
  consistency_kind: 'none', result_shape: 'quadrant_scatter', max_elements: 40,
  is_selectable: false, derived_from: 'ISM', sort_order: 60,
};

// key: `${highDriving}${highDependence}`
const QUADRANTS = { '00': 'autonomous', '01': 'dependent', '11': 'linkage', '10': 'independent' };

// driving = row sum, dependence = column sum (both incl. diagonal); high = value >= n/2.
const fromReachability = (R, elementOrder) => {
  const threshold = R.length / 2;
  return {
    source_analysis: 'ISM',
    threshold,
    elements: elementOrder.map((id, i) => {
      const driving = R[i].reduce((a, b) => a + b, 0);
      const dependence = R.reduce((a, row) => a + row[i], 0);
      return {
        id,
        driving,
        dependence,
        quadrant: QUADRANTS[`${+(driving >= threshold)}${+(dependence >= threshold)}`],
        on_boundary: driving === threshold || dependence === threshold,
      };
    }),
  };
};

module.exports = { meta, fromReachability };
