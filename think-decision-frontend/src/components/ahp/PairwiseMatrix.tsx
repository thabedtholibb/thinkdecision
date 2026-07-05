import { useState } from "react";

interface Props {
  elements: { id: string; name: string }[];
  onJudgmentChange: (a_id: string, b_id: string, value: number) => void;
}

const SCALE = [0.1, 0.14, 0.2, 0.33, 0.5, 1, 2, 3, 5, 7, 9];

export function PairwiseMatrix({ elements, onJudgmentChange }: Props) {
  const [judgments, setJudgments] = useState<Record<string, number>>({});

  function handleChange(a_id: string, b_id: string, value: number) {
    const key = `${a_id}__${b_id}`;
    const revKey = `${b_id}__${a_id}`;
    setJudgments({ ...judgments, [key]: value, [revKey]: 1 / value });
    onJudgmentChange(a_id, b_id, value);
  }

  function getJudgment(a_id: string, b_id: string) {
    return judgments[`${a_id}__${b_id}`] || 1;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border border-slate-300 bg-slate-100 p-2 text-left text-sm font-semibold text-slate-800"></th>
            {elements.map((e) => (
              <th key={e.id} className="border border-slate-300 bg-slate-100 p-2 text-center text-xs font-semibold text-slate-800 min-w-[120px]">
                {e.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {elements.map((rowElem, idx) => (
            <tr key={rowElem.id}>
              <td className="border border-slate-300 bg-slate-50 p-2 text-sm font-semibold text-slate-800 whitespace-nowrap">{rowElem.name}</td>
              {elements.map((colElem) => {
                const isIdentity = rowElem.id === colElem.id;
                const isLower = idx > elements.findIndex((e) => e.id === colElem.id);
                const judgment = getJudgment(rowElem.id, colElem.id);

                return (
                  <td key={colElem.id} className="border border-slate-300 p-2 text-center">
                    {isIdentity ? (
                      <div className="text-sm font-semibold text-slate-800">1.0</div>
                    ) : isLower ? (
                      <div className="text-sm text-slate-600 font-medium">{(1 / judgment).toFixed(2)}</div>
                    ) : (
                      <select value={judgment} onChange={(e) => handleChange(rowElem.id, colElem.id, parseFloat(e.target.value))} className="w-full px-2 py-1 border border-slate-300 rounded text-sm font-medium">
                        {SCALE.map((s) => (
                          <option key={s} value={s}>
                            {s.toFixed(2)}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-slate-500 mt-3">Skala: 1=Sama, 3=Sedikit Lebih Penting, 5=Lebih Penting, 7=Sangat Penting, 9=Ekstrem</p>
    </div>
  );
}
