const copy = (zh, en) => document.documentElement.lang === 'en' ? en : zh;
const fieldNames = {
  id: ['记录序号', 'Record ID'], month: ['出生月份', 'Birth month'], age: ['年龄', 'Age'],
  class: ['班级', 'Class'], gender: ['性别', 'Gender'], count: ['记录数量', 'Record count'], mean: ['平均年龄', 'Mean age']
};
const fieldLabel = key => copy(...fieldNames[key]);

export function aggregateStudents(rows, field, measure) {
  const groups = new Map();
  for (const row of rows) {
    const key = String(row[field]);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  return [...groups].map(([key, values]) => ({ key, count: values.length, value: measure === 'mean' ? values.reduce((sum, row) => sum + row.age, 0) / values.length : values.length }))
    .sort((a, b) => a.key.localeCompare(b.key, 'zh-CN', { numeric: true }));
}

export function initLab() {
  const root = document.getElementById('lab');
  if (!root) return;
  const controls = Object.fromEntries(['type', 'x', 'y', 'group', 'measure'].map(key => [key, document.getElementById(`lab-${key}`)]));
  const mount = document.getElementById('lab-chart');
  const status = document.getElementById('lab-status');
  const insight = document.getElementById('lab-insight');
  const retry = document.getElementById('lab-retry');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let d3, rows, loading = false, attempted = false, resizeFrame, width = 0;
  function state() { return Object.fromEntries(Object.entries(controls).map(([key, el]) => [key, el.value])); }
  function groupLabel(key, field) {
    if (document.documentElement.lang !== 'en') return key;
    if (field === 'gender') return key === '男' ? 'Male' : key === '女' ? 'Female' : key;
    if (field === 'class') return key.replace('软件工程', 'Software Eng. ').replace('计算机科学', 'Computer Sci. ').replace('数据科学', 'Data Sci. ').replace('班', '');
    return key;
  }
  function updateTable(headers, values, caption) {
    const table = d3.select('#lab-table');
    table.select('caption').text(caption);
    const header = table.select('thead').selectAll('tr').data([headers]).join('tr');
    header.selectAll('th').data(d => d).join('th').attr('scope', 'col').text(d => d);
    const body = table.select('tbody').selectAll('tr').data(values).join('tr');
    body.selectAll('td').data(d => d).join('td').text(d => d);
  }
  function render() {
    const s = state();
    const bar = s.type === 'bar';
    document.getElementById('lab-scatter-controls').hidden = bar;
    document.getElementById('lab-bar-controls').hidden = !bar;
    if (!rows || !d3) return;
    width = Math.max(280, mount.clientWidth);
    const narrow = width < 580;
    const height = narrow ? 340 : 350;
    const margin = { top: 28, right: 20, bottom: bar ? (narrow ? 105 : 76) : 55, left: 58 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;
    const svg = d3.select(mount).selectAll('svg').data([null]).join('svg').attr('viewBox', `0 0 ${width} ${height}`).attr('role', 'img').attr('aria-labelledby', 'lab-svg-title lab-svg-desc');
    svg.selectAll('*').interrupt();
    svg.selectAll('*').remove();
    svg.append('title').attr('id', 'lab-svg-title').text(bar ? copy('合成新生数据的分组柱状图', 'Grouped bar chart of synthetic student data') : copy('合成新生数据的散点图', 'Scatterplot of synthetic student data'));
    const desc = svg.append('desc').attr('id', 'lab-svg-desc');
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    let x, y, yTitle;
    const fmt = value => Number.isInteger(value) ? String(value) : value.toFixed(1);
    const duration = reduced.matches ? 0 : 420;
    if (bar) {
      const values = aggregateStudents(rows, s.group, s.measure);
      x = d3.scaleBand().domain(values.map(d => d.key)).range([0, innerW]).padding(.35);
      y = d3.scaleLinear().domain([0, d3.max(values, d => d.value) * 1.14 || 1]).nice().range([innerH, 0]);
      yTitle = fieldLabel(s.measure);
      g.append('g').attr('class', 'lab-axis').call(d3.axisLeft(y).ticks(5).tickSize(-innerW).tickFormat(s.measure === 'count' ? d3.format('d') : d3.format('.1f')));
      const axis = g.append('g').attr('class', 'lab-axis').attr('transform', `translate(0,${innerH})`).call(d3.axisBottom(x).tickSize(0).tickPadding(12).tickFormat(key => groupLabel(key, s.group)));
      if (s.group === 'class') axis.selectAll('text').attr('transform', 'rotate(-25)').style('text-anchor', 'end').style('font-size', narrow ? '9px' : '11px');
      const bars = g.selectAll('.lab-bar').data(values).join('rect').attr('class', 'lab-bar').attr('x', d => x(d.key)).attr('width', x.bandwidth()).attr('y', innerH).attr('height', 0).attr('rx', 2);
      bars.append('title').text(d => `${groupLabel(d.key, s.group)} · ${yTitle}: ${fmt(d.value)} (${d.count} ${copy('条记录', 'records')})`);
      bars.transition().duration(duration).attr('y', d => y(d.value)).attr('height', d => innerH - y(d.value));
      g.selectAll('.lab-bar-value').data(values).join('text').attr('class', 'lab-bar-value').attr('text-anchor', 'middle').attr('x', d => x(d.key) + x.bandwidth() / 2).attr('y', d => y(d.value) - 9).text(d => fmt(d.value));
      status.textContent = copy(`${rows.length} 条合成记录 · ${values.length} 组 · ${fieldLabel(s.group)} → ${yTitle}`, `${rows.length} synthetic records · ${values.length} groups · ${fieldLabel(s.group)} → ${yTitle}`);
      insight.textContent = s.measure === 'count' ? copy('观察提示：柱高表示每组的记录数量，所有柱子的数量合计等于样本总数。切换“平均年龄”，观察同一分组下统计方式如何改变图形。', 'Notice: bar heights show group counts and sum to the sample size. Switch to mean age to see how aggregation changes the chart.') : copy('观察提示：柱高现在表示每组的平均年龄，不再表示人数。纵轴从 0 开始，避免夸大组间差异；平均值相近也不代表分布相同。', 'Notice: heights now show mean age, not group size. The zero baseline avoids exaggerating differences; similar means can still hide different distributions.');
      const headers = s.measure === 'count' ? [fieldLabel(s.group), yTitle] : [fieldLabel(s.group), fieldLabel('count'), yTitle];
      const tableValues = values.map(d => s.measure === 'count' ? [groupLabel(d.key, s.group), d.count] : [groupLabel(d.key, s.group), d.count, fmt(d.value)]);
      updateTable(headers, tableValues, copy('柱状图分组结果', 'Grouped values shown in the chart'));
      g.append('text').attr('class', 'lab-axis-label').attr('text-anchor', 'end').attr('x', innerW).attr('y', height - margin.top - 8).text(fieldLabel(s.group));
    } else {
      const extent = field => {
        const [lo, hi] = d3.extent(rows, d => d[field]);
        const pad = field === 'id' ? 1 : .5;
        return [lo - pad, hi + pad];
      };
      x = d3.scaleLinear().domain(extent(s.x)).range([0, innerW]);
      y = d3.scaleLinear().domain(extent(s.y)).range([innerH, 0]);
      yTitle = fieldLabel(s.y);
      g.append('g').attr('class', 'lab-axis').call(d3.axisLeft(y).tickValues(d3.ticks(...y.domain(), 5).filter(Number.isInteger)).tickSize(-innerW).tickFormat(d3.format('d')));
      g.append('g').attr('class', 'lab-axis').attr('transform', `translate(0,${innerH})`).call(d3.axisBottom(x).tickValues(d3.ticks(...x.domain(), narrow ? 4 : 8).filter(Number.isInteger)).tickSize(0).tickPadding(10).tickFormat(d3.format('d')));
      const dots = g.selectAll('.lab-dot').data(rows).join('circle').attr('class', 'lab-dot').attr('cx', d => x(d[s.x])).attr('cy', d => y(d[s.y])).attr('r', 0);
      dots.append('title').text(d => `#${d.id} · ${fieldLabel(s.x)}: ${d[s.x]} · ${yTitle}: ${d[s.y]}`);
      dots.transition().duration(duration).attr('r', narrow ? 4 : 4.5);
      const positions = new Set(rows.map(d => `${d[s.x]},${d[s.y]}`)).size;
      status.textContent = copy(`${rows.length} 条合成记录 · 每点一条记录 · ${fieldLabel(s.x)} × ${yTitle}`, `${rows.length} synthetic records · One dot per record · ${fieldLabel(s.x)} × ${yTitle}`);
      insight.textContent = s.x === s.y ? copy('观察提示：两轴选了同一个字段，点落在对角线上是映射本身的结果，不能说明两个变量存在关系。试着给两轴选择不同字段。', 'Notice: both axes use the same field. The diagonal is a result of the mapping, not evidence of a relationship between two variables. Try different fields.') : copy(`观察提示：${rows.length} 条记录落在 ${positions} 个不同位置，重合的点会遮挡。序号只是记录标识，合成样本中的图形关系不能当作真实人群规律。`, `Notice: ${rows.length} records occupy ${positions} distinct positions, so overlapping points may hide records. IDs are identifiers; patterns in synthetic samples are not population findings.`);
      updateTable([fieldLabel('id'), `X · ${fieldLabel(s.x)}`, `Y · ${yTitle}`], rows.map(d => [d.id, d[s.x], d[s.y]]), copy('散点图映射后的记录', 'Records mapped to scatterplot coordinates'));
      g.append('text').attr('class', 'lab-axis-label').attr('text-anchor', 'end').attr('x', innerW).attr('y', innerH + 45).text(fieldLabel(s.x));
    }
    g.append('text').attr('class', 'lab-axis-label').attr('x', -margin.left + 4).attr('y', -12).text(yTitle);
    desc.text(`${status.textContent}. ${insight.textContent} ${copy('可展开下方数据表查看精确数值。', 'Expand the data table below for exact values.')}`);
  }
  async function load() {
    if (loading || rows) return;
    attempted = true; loading = true; retry.hidden = true;
    status.textContent = copy('正在加载 D3.js 与课程数据…', 'Loading D3.js and course data…');
    const abort = new AbortController();
    let deadline;
    try {
      const timeout = new Promise((_, reject) => { deadline = setTimeout(() => { abort.abort(); reject(new Error('Loading timed out')); }, 15000); });
      const [library, response] = await Promise.race([Promise.all([import('https://cdn.jsdelivr.net/npm/d3@7/+esm'), fetch('lesson-01/data/newstudent.csv', { signal: abort.signal })]), timeout]);
      if (!response.ok) throw new Error('Dataset unavailable');
      const parsed = library.csvParse(await response.text(), d => ({ id: +d['序号'], age: +d['年龄'], month: +d['生日']?.split('-')[1], class: d['班级']?.trim(), gender: d['性别']?.trim() }));
      if (!parsed.length || parsed.some(d => !Number.isFinite(d.id) || !Number.isFinite(d.age) || !(d.month >= 1 && d.month <= 12) || !d.class || !d.gender)) throw new Error('Invalid dataset');
      d3 = library; rows = parsed; render();
    } catch {
      status.textContent = copy('图表暂未加载成功，请检查网络后重试。课程讲解与章节导航仍可使用。', 'The chart could not load. Check your connection and retry; course content and navigation remain available.');
      retry.hidden = false;
    } finally { clearTimeout(deadline); loading = false; }
  }
  Object.values(controls).forEach(el => el.addEventListener('change', () => { render(); if (!attempted) load(); }));
  retry.addEventListener('click', load);
  document.addEventListener('wbl:localechange', () => {
    if (rows) render();
    else if (loading) status.textContent = copy('正在加载 D3.js 与课程数据…', 'Loading D3.js and course data…');
    else if (attempted) status.textContent = copy('图表暂未加载成功，请检查网络后重试。课程讲解与章节导航仍可使用。', 'The chart could not load. Check your connection and retry; course content and navigation remain available.');
  });
  const observer = new ResizeObserver(() => {
    if (Math.abs(mount.clientWidth - width) < 1 || !rows) return;
    cancelAnimationFrame(resizeFrame); resizeFrame = requestAnimationFrame(render);
  });
  observer.observe(mount);
  if ('IntersectionObserver' in window) {
    const lazy = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) { load(); lazy.disconnect(); } }, { rootMargin: '240px' });
    lazy.observe(root);
  } else load();
}
