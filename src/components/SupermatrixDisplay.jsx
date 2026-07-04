/**
 * Supermatrix Display Component
 *
 * Visualizes the n×n ANP supermatrix as a heatmap showing:
 * - Which cells contain values
 * - Magnitude of values (color intensity)
 * - Structure of the network
 *
 * Props:
 *   supermatrix: 2D array - The n×n matrix
 *   elementNames: {id: name} - Display names for rows/columns
 *   elementList: [{id, type: 'criterion'|'alternative'}] - Element metadata
 *   isLoading: boolean
 *
 * @component
 * @example
 * <SupermatrixDisplay
 *   supermatrix={matrix}
 *   elementNames={names}
 *   elementList={elements}
 * />
 */

import React, { useState } from 'react';

function SupermatrixDisplay({
  supermatrix = [],
  elementNames = {},
  elementList = [],
  isLoading = false,
}) {
  // ===========================
  // STATE
  // ===========================

  const [selectedCell, setSelectedCell] = useState(null);
  const [showValues, setShowValues] = useState(true);

  // ===========================
  // HELPERS
  // ===========================

  const getElementName = (id) => {
    return elementNames[id] || id;
  };

  const getElementType = (id) => {
    return elementList.find((el) => el.id === id)?.type || 'unknown';
  };

  const getCellColor = (value) => {
    if (value === 0 || value === null || value === undefined) {
      return '#f3f4f6'; // Light gray - no value
    }

    // Value magnitude: darker = stronger influence
    // Range: typically 0.0 to 1.0 (normalized)
    const intensity = Math.min(Math.max(value, 0), 1);

    if (intensity < 0.1) {
      return '#dbeafe'; // Light blue
    } else if (intensity < 0.3) {
      return '#93c5fd'; // Blue
    } else if (intensity < 0.5) {
      return '#3b82f6'; // Medium blue
    } else if (intensity < 0.7) {
      return '#1d4ed8'; // Dark blue
    } else {
      return '#1e40af'; // Very dark blue
    }
  };

  const getTextColor = (value) => {
    if (value === 0 || !value) return '#6b7280';
    const intensity = Math.min(Math.max(value, 0), 1);
    return intensity > 0.5 ? '#ffffff' : '#111827';
  };

  const getStats = () => {
    let nonZeroCells = 0;
    let maxValue = 0;
    let totalValue = 0;

    for (let row = 0; row < supermatrix.length; row++) {
      for (let col = 0; col < supermatrix[row].length; col++) {
        const val = supermatrix[row][col];
        if (val && val > 0) {
          nonZeroCells++;
          maxValue = Math.max(maxValue, val);
          totalValue += val;
        }
      }
    }

    const totalCells = supermatrix.length * supermatrix.length;
    const density = ((nonZeroCells / totalCells) * 100).toFixed(1);

    return {
      nonZeroCells,
      totalCells,
      density,
      maxValue: maxValue.toFixed(3),
      avgValue: nonZeroCells > 0 ? (totalValue / nonZeroCells).toFixed(3) : '0.000',
    };
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center text-ink-600 dark:text-ink-400">
        <div className="animate-spin w-8 h-8 border-4 border-ink-300 border-t-[var(--td-green)] rounded-full mx-auto mb-2" />
        <p>Loading supermatrix...</p>
      </div>
    );
  }

  if (!supermatrix || supermatrix.length === 0) {
    return (
      <div className="p-6 text-center text-ink-600 dark:text-ink-400">
        <p>No supermatrix data available.</p>
        <p className="text-sm mt-2">Complete all pairwise comparisons to compute the supermatrix.</p>
      </div>
    );
  }

  const n = supermatrix.length;
  const stats = getStats();

  // ===========================
  // RENDER
  // ===========================

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-3 rounded-lg bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700">
          <div className="text-xs text-ink-600 dark:text-ink-400 font-bold">Matrix Size</div>
          <div className="text-2xl font-black text-ink-900 dark:text-ink-50">{n}×{n}</div>
        </div>
        <div className="p-3 rounded-lg bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700">
          <div className="text-xs text-ink-600 dark:text-ink-400 font-bold">Non-Zero Cells</div>
          <div className="text-2xl font-black text-ink-900 dark:text-ink-50">
            {stats.nonZeroCells}/{stats.totalCells}
          </div>
        </div>
        <div className="p-3 rounded-lg bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700">
          <div className="text-xs text-ink-600 dark:text-ink-400 font-bold">Density</div>
          <div className="text-2xl font-black text-ink-900 dark:text-ink-50">{stats.density}%</div>
        </div>
        <div className="p-3 rounded-lg bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700">
          <div className="text-xs text-ink-600 dark:text-ink-400 font-bold">Max Value</div>
          <div className="text-2xl font-black text-ink-900 dark:text-ink-50">{stats.maxValue}</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowValues(!showValues)}
          className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
            showValues
              ? 'bg-[var(--td-green)] text-white'
              : 'bg-ink-200 dark:bg-ink-700 text-ink-900 dark:text-ink-50 hover:bg-ink-300'
          }`}
        >
          {showValues ? '👁️ Hide' : '👁️ Show'} Values
        </button>
      </div>

      {/* Matrix Heatmap */}
      <div className="overflow-x-auto rounded-lg border border-ink-200 dark:border-ink-700">
        <table className="w-full border-collapse">
          {/* Header Row */}
          <thead>
            <tr>
              <th className="p-2 h-12 bg-ink-100 dark:bg-ink-800 text-ink-900 dark:text-ink-50 font-bold text-xs text-right pr-3">
                ↓ Row / Col →
              </th>
              {elementList.map((el, idx) => (
                <th
                  key={idx}
                  className="p-2 h-12 bg-ink-100 dark:bg-ink-800 text-ink-900 dark:text-ink-50 font-bold text-xs text-center min-w-16 border-l border-ink-200 dark:border-ink-600"
                  title={getElementName(el.id)}
                >
                  <div className="truncate text-xs">
                    {getElementType(el.id) === 'alternative' ? '🎯' : '📊'} {idx}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Matrix Cells */}
          <tbody>
            {elementList.map((rowEl, rowIdx) => (
              <tr key={rowIdx}>
                {/* Row Header */}
                <th
                  className="p-2 h-12 bg-ink-100 dark:bg-ink-800 text-ink-900 dark:text-ink-50 font-bold text-xs text-right pr-3 border-b border-ink-200 dark:border-ink-600"
                  title={getElementName(rowEl.id)}
                >
                  <div className="truncate text-xs">
                    {getElementType(rowEl.id) === 'alternative' ? '🎯' : '📊'} {rowIdx}
                  </div>
                </th>

                {/* Data Cells */}
                {elementList.map((colEl, colIdx) => {
                  const value = supermatrix[rowIdx]?.[colIdx] || 0;
                  const isSelected =
                    selectedCell && selectedCell.row === rowIdx && selectedCell.col === colIdx;
                  const cellColor = getCellColor(value);
                  const textColor = getTextColor(value);

                  return (
                    <td
                      key={colIdx}
                      className="p-0 h-12 border-b border-r border-ink-200 dark:border-ink-600 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setSelectedCell({ row: rowIdx, col: colIdx })}
                    >
                      <button
                        className={`w-full h-full flex items-center justify-center font-bold text-xs transition-all ${
                          isSelected ? 'ring-2 ring-[var(--td-green)]' : ''
                        }`}
                        style={{
                          backgroundColor: cellColor,
                          color: textColor,
                        }}
                        title={`${getElementName(rowEl.id)} → ${getElementName(
                          colEl.id
                        )}: ${value.toFixed(3)}`}
                      >
                        {showValues && value > 0 ? value.toFixed(2) : ''}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Selected Cell Details */}
      {selectedCell && (
        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
          <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-2">Cell Details</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-blue-700 dark:text-blue-400">Row Element</div>
              <div className="font-bold text-blue-900 dark:text-blue-100">
                {getElementName(elementList[selectedCell.row].id)}
              </div>
            </div>
            <div>
              <div className="text-xs text-blue-700 dark:text-blue-400">Column Element</div>
              <div className="font-bold text-blue-900 dark:text-blue-100">
                {getElementName(elementList[selectedCell.col].id)}
              </div>
            </div>
            <div>
              <div className="text-xs text-blue-700 dark:text-blue-400">Value</div>
              <div className="font-mono font-bold text-blue-900 dark:text-blue-100">
                {(supermatrix[selectedCell.row]?.[selectedCell.col] || 0).toFixed(6)}
              </div>
            </div>
            <div>
              <div className="text-xs text-blue-700 dark:text-blue-400">Relationship</div>
              <div className="font-bold text-blue-900 dark:text-blue-100">
                {supermatrix[selectedCell.row]?.[selectedCell.col] > 0 ? 'Influences' : 'No direct'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="p-4 rounded-lg bg-ink-50 dark:bg-ink-900/50 border border-ink-200 dark:border-ink-700">
        <h4 className="font-bold text-ink-900 dark:text-ink-50 mb-3">Color Legend</h4>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded" style={{ backgroundColor: '#f3f4f6' }}></div>
            <span className="text-ink-700 dark:text-ink-300">0 (No influence)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded" style={{ backgroundColor: '#dbeafe' }}></div>
            <span className="text-ink-700 dark:text-ink-300">0.0-0.1</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded" style={{ backgroundColor: '#3b82f6' }}></div>
            <span className="text-ink-700 dark:text-ink-300">0.3-0.5</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded" style={{ backgroundColor: '#1d4ed8' }}></div>
            <span className="text-ink-700 dark:text-ink-300">0.5-0.7</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded" style={{ backgroundColor: '#1e40af' }}></div>
            <span className="text-ink-700 dark:text-ink-300">0.7+ (Strong)</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-ink-300 dark:border-ink-700 text-xs text-ink-600 dark:text-ink-400">
          <p>
            Each cell shows how much criterion (row) influences criterion (column) in the ANP
            network.
          </p>
          <p className="mt-2">Click a cell to see details about that relationship.</p>
        </div>
      </div>

      {/* Element Legend */}
      <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
        <h4 className="font-bold text-amber-900 dark:text-amber-300 mb-3">Elements</h4>
        <div className="space-y-2 text-sm">
          {elementList.map((el, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="font-bold text-amber-900 dark:text-amber-200">
                {el.type === 'alternative' ? '🎯' : '📊'} {idx}
              </span>
              <span className="text-amber-800 dark:text-amber-300">{getElementName(el.id)}</span>
              <span className="text-xs px-2 py-1 rounded bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300">
                {el.type}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SupermatrixDisplay;
