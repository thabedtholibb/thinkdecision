/* ISM / MICMAC — element form, V/A/X/O input, level-partition and MICMAC results */

const ISM_SYMBOLS = ['V', 'A', 'X', 'O'];
const ISM_SYMBOL_TONE = {
  V: 'bg-brand-100 text-brand-800 dark:bg-brand-950/60 dark:text-brand-300',
  A: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300',
  X: 'bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300',
  O: 'bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300',
};
const MICMAC_QUADRANTS = {
  autonomous:  { label: 'I — Autonomous',             color: '#94a3b8' },
  dependent:   { label: 'II — Dependent',             color: '#0ea5e9' },
  linkage:     { label: 'III — Linkage',              color: '#f59e0b' },
  independent: { label: 'IV — Independent (Driver)',  color: '#6366f1' },
};

function ismLegend(relation) {
  const r = relation || 'memengaruhi';
  return [
    ['V', `baris i ${r} kolom j`],
    ['A', `kolom j ${r} baris i`],
    ['X', `saling ${r} (dua arah)`],
    ['O', 'tidak berhubungan'],
  ];
}

// Wizard step for single_tier methods: flat element list + contextual relation
function ElementListForm({ items, max, relation, errors = {}, onRelation, onAdd, onRemove, onUpdate }) {
  return (
    <Card className="p-6 anim-fade space-y-6">
      <div>
        <h2 className="font-serif text-[28px] font-medium text-ink-900 dark:text-ink-50">Elemen / Faktor</h2>
        <p className="text-[13px] text-ink-500 dark:text-ink-400 mt-2">Daftar elemen yang akan dipetakan hubungannya oleh pakar (minimal 3, maksimal {max}).</p>
      </div>
      <div className="max-w-xl">
        <Input
          label="Relasi kontekstual"
          value={relation}
          maxLength={200}
          error={errors.relation}
          helperText={errors.relation || 'Contoh: "memengaruhi" — dibaca "elemen i memengaruhi elemen j".'}
          state={errors.relation ? 'invalid' : 'default'}
          onChange={e => onRelation(e.target.value)}
          placeholder="memengaruhi"
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Badge tone="sky" icon="layers">ELEMEN</Badge>
            <span className="text-[12px] text-ink-500">{items.length} / {max}</span>
            {errors.crits && <span className="text-[12px] text-rose-600">· {errors.crits}</span>}
          </div>
          <Button variant="secondary" size="sm" icon="plus" onClick={onAdd} disabled={items.length >= max}>Tambah Elemen</Button>
        </div>
        <div className="space-y-2">
          {items.map((c, i) => (
            <div key={c.id} className="flex items-center gap-2 p-3 rounded-lg border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900">
              <span className="w-6 h-6 grid place-items-center rounded-md bg-sky-100 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 text-[11px] font-mono">{i + 1}</span>
              <input value={c.name} aria-label={`Nama elemen ${i + 1}`} onChange={e => onUpdate(c.id, { name: e.target.value })}
                className="flex-1 bg-transparent font-semibold text-[14px] text-ink-900 dark:text-ink-50 focus:outline-none focus:ring-2 focus:ring-brand-500/30 rounded px-1.5 -mx-1.5 py-0.5"/>
              <input value={c.desc || ''} aria-label={`Deskripsi elemen ${i + 1}`} placeholder="Deskripsi (opsional)..." onChange={e => onUpdate(c.id, { desc: e.target.value })}
                className="flex-1 bg-transparent text-[12px] text-ink-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 rounded px-1.5 py-0.5"/>
              <button onClick={() => onRemove(c.id)} aria-label={`Hapus ${c.name}`} className="w-7 h-7 grid place-items-center rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-400"><Icon name="trash" className="w-4 h-4"/></button>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// Upper-triangle V/A/X/O grid; values = { "i-j": "V" }
function RelationMatrixInput({ elements, relation, values, onChange, readOnly = false }) {
  const n = elements.length;
  const total = n * (n - 1) / 2;
  const filled = Object.keys(values).filter(k => values[k]).length;
  const set = (key, v) => {
    const next = { ...values };
    if (v) next[key] = v; else delete next[key];
    onChange(next);
  };
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-ink-600 dark:text-ink-300">
        {ismLegend(relation).map(([s, t]) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span className={classNames('w-6 h-6 grid place-items-center rounded font-mono font-semibold', ISM_SYMBOL_TONE[s])}>{s}</span>{t}
          </span>
        ))}
        <span className="ml-auto font-mono tabular-nums font-semibold text-ink-800 dark:text-ink-100" aria-live="polite" data-testid="ism-progress">terisi {filled} dari {total}</span>
      </div>
      <div className="overflow-auto max-h-[70vh] rounded-lg border border-ink-200 dark:border-ink-800">
        <table className="text-[12px] border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="sticky top-0 left-0 z-20 bg-ink-50 dark:bg-ink-900 px-2 py-1.5 text-left font-semibold text-ink-500 border-b border-r border-ink-200 dark:border-ink-800">i \ j</th>
              {elements.map((e, j) => (
                <th key={e.id} title={e.name} scope="col" className="sticky top-0 z-10 bg-ink-50 dark:bg-ink-900 px-1 py-1.5 min-w-[52px] font-mono font-semibold text-ink-500 border-b border-ink-200 dark:border-ink-800">{j + 1}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {elements.map((r, i) => (
              <tr key={r.id}>
                <th scope="row" className="sticky left-0 z-10 bg-white dark:bg-ink-900 px-2 py-1 text-left font-medium text-ink-800 dark:text-ink-100 whitespace-nowrap max-w-[220px] truncate border-r border-ink-200 dark:border-ink-800" title={r.name}>
                  <span className="font-mono text-ink-400 mr-1.5">{i + 1}</span>{r.name}
                </th>
                {elements.map((c, j) => {
                  if (j <= i) return <td key={c.id} className="p-0.5 bg-ink-50/60 dark:bg-ink-950/40"/>;
                  const key = `${i}-${j}`;
                  const v = values[key] || '';
                  return (
                    <td key={c.id} className="p-0.5 text-center">
                      <select
                        value={v}
                        disabled={readOnly}
                        aria-label={`Relasi ${r.name} terhadap ${c.name}`}
                        onChange={e => set(key, e.target.value)}
                        className={classNames(
                          'w-12 h-8 rounded text-center font-mono font-semibold border border-ink-200 dark:border-ink-700 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer',
                          v ? ISM_SYMBOL_TONE[v] : 'bg-white dark:bg-ink-900 text-ink-400'
                        )}>
                        <option value="">·</option>
                        {ISM_SYMBOLS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Expert screen for judgment_shape = binary_relation_matrix
function IsmExpertFill({ go, theme, onToggleTheme, onSwitchRole, user, caseId, caseData, currentUserId }) {
  const elements = (caseData?.criteria || []).filter(c => !c.parent_criteria_id);
  const order = elements.map(e => e.id);
  const relation = caseData?.method_config?.contextual_relation || '';
  const [values, setValues] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [saveState, setSaveState] = useState(null);
  const [showSubmit, setShowSubmit] = useState(false);
  const [busy, setBusy] = useState(false);
  const dirty = useRef(false);
  const total = order.length * (order.length - 1) / 2;
  const filled = Object.keys(values).length;

  useEffect(() => {
    (async () => {
      try {
        const resp = await window.judgmentsService.getMyJudgments(caseId);
        const row = (resp.data || []).find(r => (r.level_id || r.levelId) === 'structure');
        if (row) {
          const saved = row.order || order;
          const flip = { V: 'A', A: 'V', X: 'X', O: 'O' };
          const next = {};
          Object.entries(row.comparisons || {}).forEach(([k, s]) => {
            const [a, b] = k.split('-').map(Number);
            const p = order.indexOf(saved[a]), q = order.indexOf(saved[b]);
            if (p < 0 || q < 0 || p === q) return;
            next[p < q ? `${p}-${q}` : `${q}-${p}`] = p < q ? s : flip[s];
          });
          setValues(next);
          setSubmitted(!!row.submitted);
        }
      } catch (err) {
        console.warn('[IsmExpertFill] Could not load saved judgments:', err);
      } finally {
        setLoaded(true);
      }
    })();
  }, [caseId]);

  const saveDraft = async (vals = values) => {
    if (!Object.keys(vals).length) return true;
    try {
      setSaveState('saving');
      await window.judgmentsService.saveDraft(caseId, 'structure', vals, order);
      setSaveState(new Date());
      return true;
    } catch (err) {
      setSaveState('error');
      return false;
    }
  };

  useEffect(() => {
    if (!loaded || submitted || !dirty.current) return;
    const t = setTimeout(() => saveDraft(values), 1200);
    return () => clearTimeout(t);
  }, [values, loaded]);

  const submit = async () => {
    setBusy(true);
    try {
      if (!(await saveDraft())) throw new Error('Draf gagal disimpan ke server');
      await window.judgmentsService.submitJudgments(currentUserId || user?.id, caseId);
      go({ screen: 'expert-dashboard', toast: 'Penilaian berhasil dikirim. Terima kasih, Pakar!' });
    } catch (err) {
      const missing = err.details?.missing?.length;
      go({ toast: { message: missing ? `Masih ada ${missing} sel kosong` : 'Gagal mengirim penilaian: ' + (err.message || 'Unknown error'), type: 'error' } });
    } finally {
      setBusy(false);
      setShowSubmit(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-ink-50 dark:bg-ink-950">
      <Sidebar items={EXPERT_NAV} active="cases" onChange={() => go({ screen: 'expert-dashboard' })}/>
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar
          breadcrumbs={['Kasus Saya', caseData?.name]}
          title={caseData?.name}
          theme={theme} onToggleTheme={onToggleTheme}
          onSwitchRole={onSwitchRole} role="expert"
          actions={<>
            <MethodBadge method={caseData?.method}/>
            <Button variant="ghost" size="sm" icon="arrowL" onClick={() => go({ screen: 'expert-dashboard' })}>Kembali</Button>
          </>}
        />
        <main className="p-6 space-y-4 min-w-0">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-ink-500 font-semibold">Matriks SSIM</div>
            <h2 className="font-serif text-[26px] text-ink-900 dark:text-ink-50 leading-tight">Relasi antar elemen</h2>
            <p className="text-[12.5px] text-ink-500 dark:text-ink-400">Untuk tiap pasangan, pilih simbol yang menggambarkan apakah elemen baris <b>{relation || 'memengaruhi'}</b> elemen kolom.</p>
          </div>
          {submitted && (
            <div className="rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/30 p-3 text-[12.5px] text-emerald-800 dark:text-emerald-200">Penilaian sudah dikirim dan dikunci.</div>
          )}
          <Card className="p-4">
            {loaded
              ? <RelationMatrixInput elements={elements} relation={relation} values={values} onChange={v => { dirty.current = true; setValues(v); }} readOnly={submitted}/>
              : <p className="text-[13px] text-ink-500">Memuat penilaian...</p>}
          </Card>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="text-[12px] text-ink-500" aria-live="polite">
              {saveState === 'saving' ? 'Menyimpan draf...' : saveState === 'error' ? 'Draf gagal disimpan ke server' : saveState ? `Draf tersimpan ${saveState.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}` : ''}
            </span>
            {!submitted && (
              <div className="flex items-center gap-2">
                <Button variant="secondary" icon="save" onClick={() => saveDraft()} disabled={!filled}>Simpan Draf</Button>
                <Button variant="success" icon="send" onClick={() => setShowSubmit(true)} disabled={!filled}>Selesai & Kirim</Button>
              </div>
            )}
          </div>
        </main>
      </div>
      <Modal open={showSubmit} onClose={() => setShowSubmit(false)} size="md" title="Kirim Penilaian Anda?"
        footer={<>
          <Button variant="ghost" onClick={() => setShowSubmit(false)}>Tinjau Lagi</Button>
          <Button variant="success" icon="send" disabled={busy || filled < total} onClick={submit}>Ya, Kirim</Button>
        </>}>
        <div className="rounded-lg bg-ink-50/60 dark:bg-ink-950/40 border border-ink-200 dark:border-ink-800 p-3 text-[12.5px] space-y-1.5">
          <div className="flex items-center justify-between"><span className="text-ink-500">Sel terisi</span><span className="font-mono tabular-nums">{filled} / {total}</span></div>
          <div className="flex items-center justify-between"><span className="text-ink-500">Sel kosong</span><span className={classNames('font-mono tabular-nums', filled < total ? 'text-rose-600' : 'text-emerald-600')}>{total - filled}</span></div>
        </div>
        {filled < total && <p className="text-[12.5px] text-rose-600 mt-3">Lengkapi semua sel sebelum mengirim.</p>}
      </Modal>
    </div>
  );
}

function IsmMatrixTable({ names, cell }) {
  return (
    <div className="overflow-auto max-h-[60vh] rounded-lg border border-ink-200 dark:border-ink-800">
      <table className="text-[12px] border-separate border-spacing-0">
        <thead>
          <tr>
            <th className="sticky top-0 left-0 z-20 bg-ink-50 dark:bg-ink-900 px-2 py-1.5 border-b border-r border-ink-200 dark:border-ink-800"/>
            {names.map((nm, j) => <th key={j} title={nm} className="sticky top-0 z-10 bg-ink-50 dark:bg-ink-900 px-2 py-1.5 font-mono text-ink-500 border-b border-ink-200 dark:border-ink-800">{j + 1}</th>)}
            {cell.extraHead && <th className="sticky top-0 z-10 bg-ink-50 dark:bg-ink-900 px-2 py-1.5 text-ink-500 border-b border-l border-ink-200 dark:border-ink-800">{cell.extraHead}</th>}
          </tr>
        </thead>
        <tbody>
          {names.map((nm, i) => (
            <tr key={i}>
              <th scope="row" className="sticky left-0 z-10 bg-white dark:bg-ink-900 px-2 py-1 text-left font-medium text-ink-800 dark:text-ink-100 whitespace-nowrap border-r border-ink-200 dark:border-ink-800"><span className="font-mono text-ink-400 mr-1.5">{i + 1}</span>{nm}</th>
              {names.map((_, j) => <td key={j} className="px-2 py-1 text-center font-mono">{cell(i, j)}</td>)}
              {cell.extraCol && <td className="px-2 py-1 text-center font-mono font-semibold border-l border-ink-200 dark:border-ink-800">{cell.extraCol(i)}</td>}
            </tr>
          ))}
          {cell.extraRow && (
            <tr>
              <th scope="row" className="sticky left-0 z-10 bg-ink-50 dark:bg-ink-900 px-2 py-1 text-left text-ink-500 border-t border-r border-ink-200 dark:border-ink-800">{cell.extraRowHead}</th>
              {names.map((_, j) => <td key={j} className="px-2 py-1 text-center font-mono font-semibold border-t border-ink-200 dark:border-ink-800">{cell.extraRow(j)}</td>)}
              {cell.extraCol && <td className="border-t border-l border-ink-200 dark:border-ink-800"/>}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function IsmDigraph({ levels, edges, nameOf }) {
  const W = 150, H = 40, GX = 24, GY = 70, PAD = 20;
  const maxCols = Math.max(1, ...levels.map(l => l.elements.length));
  const width = PAD * 2 + maxCols * W + (maxCols - 1) * GX;
  const height = PAD * 2 + levels.length * H + (levels.length - 1) * GY;
  const pos = {};
  levels.forEach((l, r) => {
    const rowW = l.elements.length * W + (l.elements.length - 1) * GX;
    l.elements.forEach((id, c) => {
      pos[id] = { x: (width - rowW) / 2 + c * (W + GX), y: PAD + r * (H + GY) };
    });
  });
  const path = ([from, to]) => {
    const a = pos[from], b = pos[to];
    if (!a || !b) return null;
    if (a.y === b.y) {
      const x1 = a.x + W / 2, x2 = b.x + W / 2, y = a.y;
      return `M${x1},${y} Q${(x1 + x2) / 2},${y - 36} ${x2},${y}`;
    }
    const down = b.y > a.y;
    return `M${a.x + W / 2},${down ? a.y + H : a.y} L${b.x + W / 2},${down ? b.y : b.y + H}`;
  };
  return (
    <div className="overflow-x-auto rounded-lg border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900">
      <svg width={width} height={height} role="img" aria-label="Digraf hierarki ISM">
        <defs>
          <marker id="ism-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="#64748b"/>
          </marker>
        </defs>
        {edges.map((e, i) => { const d = path(e); return d && <path key={i} d={d} fill="none" stroke="#64748b" strokeWidth="1.4" markerEnd="url(#ism-arrow)"/>; })}
        {levels.map((l, r) => (
          <text key={'L' + l.level} x={4} y={PAD + r * (H + GY) - 6} fontSize="10" fill="#94a3b8">Level {l.level}</text>
        ))}
        {Object.entries(pos).map(([id, p]) => {
          const nm = nameOf(id);
          return (
            <g key={id}>
              <title>{nm}</title>
              <rect x={p.x} y={p.y} width={W} height={H} rx="8" fill="#eef2ff" stroke="#6366f1"/>
              <text x={p.x + W / 2} y={p.y + H / 2 + 4} textAnchor="middle" fontSize="12" fill="#1e1b4b">{nm.length > 20 ? nm.slice(0, 19) + '…' : nm}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function IsmLevelView({ data }) {
  const p = data.payload;
  const ids = p.element_order || [];
  const names = Object.fromEntries((data.elements || []).map(e => [e.id, e.name]));
  const nameOf = id => names[id] || id;
  const list = ids.map(nameOf);
  const M = p.final_reachability || [];
  const trans = new Set((p.transitive_cells || []).map(([i, j]) => `${i}-${j}`));
  const ties = p.consensus?.ties || [];
  const idx = Object.fromEntries(ids.map((id, i) => [id, i]));
  const done = new Set();
  const partition = (p.iterations || []).map(l => {
    const remaining = ids.filter(id => !done.has(id));
    const rows = l.elements.map(id => {
      const i = idx[id];
      const R = remaining.filter(x => M[i]?.[idx[x]]);
      const A = remaining.filter(x => M[idx[x]]?.[i]);
      return { id, R, A, I: R.filter(x => A.includes(x)) };
    });
    l.elements.forEach(id => done.add(id));
    return { level: l.level, rows };
  });
  const setText = s => s.map(x => idx[x] + 1).join(', ');
  const section = 'text-[13px] font-semibold text-ink-900 dark:text-ink-50 uppercase tracking-wider mb-3';

  const reachCell = (i, j) => {
    const v = M[i]?.[j];
    if (!v) return <span className="text-ink-300">0</span>;
    return trans.has(`${i}-${j}`) ? <span className="text-amber-600 font-semibold">1*</span> : '1';
  };
  reachCell.extraHead = 'Driving';
  reachCell.extraCol = i => (M[i] || []).reduce((a, b) => a + b, 0);
  reachCell.extraRowHead = 'Dependence';
  reachCell.extraRow = j => M.reduce((a, row) => a + (row[j] || 0), 0);

  const ssimCell = (i, j) => {
    const s = p.consensus_ssim?.[i]?.[j];
    return s ? <span className={classNames('inline-block w-6 rounded font-semibold', ISM_SYMBOL_TONE[s])}>{s}</span> : '';
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="p-4">
          <div className="text-[10.5px] uppercase tracking-wider text-ink-500 font-semibold">Skor kesepakatan</div>
          <div className="font-serif text-[30px] text-ink-900 dark:text-ink-50">{fmtPct(p.consensus?.score || 0)}</div>
          <div className="text-[11.5px] text-ink-500">sel reachability yang disepakati semua pakar</div>
        </Card>
        <Card className="p-4">
          <div className="text-[10.5px] uppercase tracking-wider text-ink-500 font-semibold">Pakar</div>
          <div className="font-serif text-[30px] text-ink-900 dark:text-ink-50">{data.completedExpertCount} / {data.expertCount}</div>
          <div className="text-[11.5px] text-ink-500">sudah submit</div>
        </Card>
        <Card className="p-4">
          <div className="text-[10.5px] uppercase tracking-wider text-ink-500 font-semibold">Relasi kontekstual</div>
          <div className="font-serif text-[22px] text-ink-900 dark:text-ink-50 mt-1">{data.contextual_relation || '—'}</div>
          <div className="text-[11.5px] text-ink-500">{ids.length} elemen · {(p.iterations || []).length} level</div>
        </Card>
      </div>

      <div className="rounded-lg border border-amber-200/60 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/30 p-3 text-[12.5px] text-amber-900/90 dark:text-amber-100/90">
        <b>Aturan seri:</b> sel dengan suara tepat 50% dianggap tidak berhubungan (0).
        {ties.length > 0
          ? <> Ditemukan {ties.length} sel seri: {ties.map(([i, j]) => `${list[i]} → ${list[j]}`).join('; ')}.</>
          : ' Tidak ada sel seri.'}
      </div>

      <div>
        <h3 className={section}>Digraf hierarki ISM</h3>
        <IsmDigraph levels={p.iterations || []} edges={p.digraph_edges || []} nameOf={nameOf}/>
        <p className="text-[11.5px] text-ink-500 mt-1.5">Level 1 di atas (paling dipengaruhi). Panah: elemen asal {data.contextual_relation || 'memengaruhi'} elemen tujuan.</p>
      </div>

      <div>
        <h3 className={section}>Partisi level</h3>
        <div className="overflow-x-auto rounded-lg border border-ink-200 dark:border-ink-800">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="bg-ink-50/60 dark:bg-ink-950/30 text-[11px] uppercase tracking-wider text-ink-500">
                <th className="text-left font-semibold px-3 py-2">Level</th>
                <th className="text-left font-semibold px-3 py-2">Elemen</th>
                <th className="text-left font-semibold px-3 py-2">Reachability set</th>
                <th className="text-left font-semibold px-3 py-2">Antecedent set</th>
                <th className="text-left font-semibold px-3 py-2">Intersection</th>
              </tr>
            </thead>
            <tbody>
              {partition.map(l => l.rows.map((r, k) => (
                <tr key={r.id} className="border-t border-ink-100 dark:border-ink-800">
                  {k === 0 && <td rowSpan={l.rows.length} className="px-3 py-2 align-top font-semibold">{l.level}</td>}
                  <td className="px-3 py-2"><span className="font-mono text-ink-400 mr-1.5">{idx[r.id] + 1}</span>{nameOf(r.id)}</td>
                  <td className="px-3 py-2 font-mono">{setText(r.R)}</td>
                  <td className="px-3 py-2 font-mono">{setText(r.A)}</td>
                  <td className="px-3 py-2 font-mono">{setText(r.I)}</td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className={section}>Final Reachability Matrix</h3>
        <IsmMatrixTable names={list} cell={reachCell}/>
        <p className="text-[11.5px] text-ink-500 mt-1.5"><span className="text-amber-600 font-semibold">1*</span> = relasi hasil transitivitas.</p>
      </div>

      <div>
        <h3 className={section}>SSIM konsensus</h3>
        <IsmMatrixTable names={list} cell={ssimCell}/>
      </div>

      {(p.expert_agreement || []).length > 0 && (
        <div>
          <h3 className={section}>Kesesuaian pakar terhadap konsensus</h3>
          <div className="space-y-2 max-w-xl">
            {p.expert_agreement.map(e => (
              <div key={e.expert_id} className="flex items-center gap-3 text-[12.5px]">
                <span className="w-40 truncate text-ink-800 dark:text-ink-100">{e.name}</span>
                <div className="flex-1 h-2 bg-ink-100 dark:bg-ink-800 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500" style={{ width: `${(e.score || 0) * 100}%` }}/>
                </div>
                <span className="w-14 text-right font-mono tabular-nums">{fmtPct(e.score || 0)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MicmacScatter({ payload, elements }) {
  const { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, ReferenceLine, Tooltip, ResponsiveContainer, LabelList, Cell } = Recharts;
  const names = Object.fromEntries((elements || []).map(e => [e.id, e.name]));
  const rows = (payload.elements || []).map(e => ({ ...e, name: names[e.id] || e.id }));
  const n = Math.max(rows.length, 1);
  const groups = {};
  rows.forEach(r => {
    const k = `${r.dependence}-${r.driving}`;
    groups[k] = groups[k] || { dependence: r.dependence, driving: r.driving, quadrant: r.quadrant, names: [] };
    groups[k].names.push(r.name);
  });
  const points = Object.values(groups).map(g => ({ ...g, label: g.names.join(', ') }));
  return (
    <div className="space-y-6">
      <div className="h-[420px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 24, right: 24, bottom: 28, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
            <XAxis type="number" dataKey="dependence" name="Dependence" domain={[0, n]} allowDecimals={false}
              label={{ value: 'Dependence power', position: 'insideBottom', offset: -16, fontSize: 12 }}/>
            <YAxis type="number" dataKey="driving" name="Driving" domain={[0, n]} allowDecimals={false}
              label={{ value: 'Driving power', angle: -90, position: 'insideLeft', fontSize: 12 }}/>
            <ReferenceLine x={payload.threshold} stroke="#94a3b8" strokeDasharray="4 4"/>
            <ReferenceLine y={payload.threshold} stroke="#94a3b8" strokeDasharray="4 4"/>
            <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v, k) => [v, k]} labelFormatter={() => ''}
              content={({ payload: pl }) => pl && pl[0] ? (
                <div className="rounded-md bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-700 px-2.5 py-1.5 text-[12px] shadow">
                  <b>{pl[0].payload.label}</b><br/>Driving {pl[0].payload.driving} · Dependence {pl[0].payload.dependence}
                </div>) : null}/>
            <Scatter data={points} isAnimationActive={false}>
              {points.map((pt, i) => <Cell key={i} fill={(MICMAC_QUADRANTS[pt.quadrant] || {}).color || '#6366f1'}/>)}
              <LabelList dataKey="label" position="top" style={{ fontSize: 11, fill: '#475569' }}/>
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-4 text-[12px] text-ink-600 dark:text-ink-300">
        {Object.entries(MICMAC_QUADRANTS).map(([k, q]) => (
          <span key={k} className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-full" style={{ background: q.color }}/>{q.label}</span>
        ))}
        <span className="text-ink-400">Batas = {payload.threshold} (n/2)</span>
      </div>
      <div className="overflow-x-auto rounded-lg border border-ink-200 dark:border-ink-800">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="bg-ink-50/60 dark:bg-ink-950/30 text-[11px] uppercase tracking-wider text-ink-500">
              <th className="text-left font-semibold px-3 py-2">Elemen</th>
              <th className="text-right font-semibold px-3 py-2">Driving</th>
              <th className="text-right font-semibold px-3 py-2">Dependence</th>
              <th className="text-left font-semibold px-3 py-2">Kuadran</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-t border-ink-100 dark:border-ink-800">
                <td className="px-3 py-2">{r.name}</td>
                <td className="px-3 py-2 text-right font-mono">{r.driving}</td>
                <td className="px-3 py-2 text-right font-mono">{r.dependence}</td>
                <td className="px-3 py-2">
                  <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: (MICMAC_QUADRANTS[r.quadrant] || {}).color }}/>{(MICMAC_QUADRANTS[r.quadrant] || {}).label || r.quadrant}</span>
                  {r.on_boundary && <Badge tone="yellow" className="ml-2">di batas</Badge>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Results screen body for result_shape = level_partition
function IsmResults({ data, caseData }) {
  const [tab, setTab] = useState('ism');
  const [exporting, setExporting] = useState(false);
  const ref = useRef(null);
  const micmac = (data.secondary || []).find(s => s.result_shape === 'quadrant_scatter' && s.payload);

  if (!data.payload) {
    return (
      <Card className="p-12 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-64 h-40 mx-auto mb-6"><IllustrationWaiting/></div>
          <h3 className="font-serif text-[26px] text-ink-900 dark:text-ink-50 mb-3">Belum ada pakar yang submit</h3>
          <p className="text-[14px] text-ink-600 dark:text-ink-300">Hasil ISM dihitung dari penilaian pakar yang sudah dikirim ({data.completedExpertCount || 0} dari {data.expertCount || 0} pakar).</p>
        </div>
      </Card>
    );
  }

  const exportPdf = async () => {
    if (!window.html2pdf) return;
    setExporting(true);
    await new Promise(r => setTimeout(r, 400));
    try {
      await window.html2pdf().set({
        margin: 10, filename: `ISM_${(caseData?.name || 'hasil').replace(/\s+/g, '_')}.pdf`,
        html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
        pagebreak: { mode: ['css', 'legacy'] },
      }).from(ref.current).save();
    } finally {
      setExporting(false);
    }
  };

  const tabs = [{ id: 'ism', label: 'ISM', icon: 'layers' }, micmac && { id: 'micmac', label: 'MICMAC', icon: 'chart' }].filter(Boolean);
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl text-ink-900 dark:text-ink-50 mb-1">{caseData?.name}</h1>
          <p className="text-ink-500">{caseData?.description}</p>
        </div>
        <Button variant="secondary" size="sm" icon="download" onClick={exportPdf} disabled={exporting}>{exporting ? 'Menyiapkan...' : 'Ekspor PDF'}</Button>
      </div>
      <Card>
        <div className="flex items-center gap-1 px-2 border-b border-ink-200 dark:border-ink-800 overflow-x-auto" role="tablist">
          {tabs.map(t => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={classNames(
              'h-12 px-4 text-[13px] font-semibold border-b-2 -mb-px flex items-center gap-2 whitespace-nowrap transition',
              tab === t.id ? 'border-brand-600 text-brand-700 dark:text-brand-300' : 'border-transparent text-ink-500 dark:text-ink-400 hover:text-ink-800 dark:hover:text-ink-100'
            )}>
              <Icon name={t.icon} className="w-4 h-4"/>{t.label}
            </button>
          ))}
        </div>
        <div className="p-5" ref={ref}>
          {exporting && <h2 className="font-serif text-[22px] mb-4">{caseData?.name} — ISM</h2>}
          {(exporting || tab === 'ism') && <IsmLevelView data={data}/>}
          {micmac && (exporting || tab === 'micmac') && (
            <div style={exporting ? { pageBreakBefore: 'always' } : undefined}>
              {exporting && <h2 className="font-serif text-[22px] my-4">MICMAC</h2>}
              <MicmacScatter payload={micmac.payload} elements={data.elements}/>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

Object.assign(window, { ElementListForm, RelationMatrixInput, IsmExpertFill, IsmLevelView, MicmacScatter, IsmResults });
