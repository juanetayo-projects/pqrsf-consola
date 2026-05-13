/* ================================================================
   App 3 – Consola de Gestión PQRSF
   Clínica de Alta Complejidad Santa Bárbara
================================================================ */

/* ── Estado global ──────────────────────────────────────────── */
let allRecords   = [];   // todos los registros cargados
let filteredRecs = [];   // después de filtros
let currentRecord = null; // registro en modal
let isEditing    = false;
let sortCol      = 'id';
let sortDir      = 'desc';
let chartTipo, chartMes, chartSede, chartEstado;
/* ── Logo base64 incrustado (evita CORS / fetch) ────────────── */
const LOGO_B64 = 'data:image/png;base64,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';
let logoBase64 = LOGO_B64;

/* ── preloadLogo: logo ya incrustado, sin red ───────────────── */
async function preloadLogo() {
  logoBase64 = LOGO_B64;
}

const STAGES    = ['Recibida', 'En gestión', 'Respondida', 'Cerrada'];
const TIPO_CFG  = {
  'Petición'    : { color:'#2471c8', cls:'peticion'   },
  'Queja'       : { color:'#ea580c', cls:'queja'      },
  'Reclamo'     : { color:'#dc2626', cls:'reclamo'    },
  'Sugerencia'  : { color:'#16a34a', cls:'sugerencia' },
  'Felicitación': { color:'#ca8a04', cls:'felicitacion'},
};
const ESTADO_CLS = {
  'Recibida'  :'est-recibida',
  'En gestión':'est-gestion',
  'Respondida':'est-respondida',
  'Cerrada'   :'est-cerrada',
};

/* ════════════════════════════════════════════════════════════
   INIT
════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {
  // Guard
  const session = await requireAuth();
  if (!session) return;

  // User info
  const { data: profile } = await db
    .from('consola_perfiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  const nombre = profile?.nombre ?? session.user.email.split('@')[0];
  const rol    = profile?.rol    ?? 'analista';
  document.getElementById('userName').textContent  = nombre;
  document.getElementById('userRole').textContent  = rol;
  document.getElementById('userAvatar').textContent = nombre.charAt(0).toUpperCase();

  // Sidebar date
  document.getElementById('sbDate').textContent =
    new Date().toLocaleDateString('es-CO', { day:'2-digit', month:'short', year:'numeric' });

  // Hide delete for non-admin
  if (rol !== 'admin') {
    document.getElementById('btnDelete')?.style && (document.getElementById('btnDelete').style.display = 'none');
  }

  // Precargar logo para PDF
  await preloadLogo();

  // Load all data
  await loadAllData();

  showSection('dashboard');
});

/* ════════════════════════════════════════════════════════════
   DATA LOADING
════════════════════════════════════════════════════════════ */
async function loadAllData() {
  showLoading('Cargando datos…');
  try {
    const { data, error } = await db
      .from('reportes_pqrsf')
      .select(`
        *,
        respuestas_pqrsf (
          id, fecha_respuesta, respuesta, colaborador,
          respondido_por_nombre, respondido_por_email,
          archivo_url, archivo_nombre, created_at
        )
      `)
      .order('id', { ascending: false });

    if (error) throw error;
    allRecords   = data ?? [];
    filteredRecs = [...allRecords];

    populateFilterDropdowns();
    applyFilters();
    buildKanbanFilters();
    buildTableFilters();
  } catch (err) {
    console.error('loadAllData:', err);
  } finally {
    hideLoading();
  }
}

function populateFilterDropdowns() {
  const tipos     = [...new Set(allRecords.map(r => r.tipo_reporte).filter(Boolean))].sort();
  const estados   = [...new Set(allRecords.map(r => r.estado).filter(Boolean))].sort();
  const sedes     = [...new Set(allRecords.map(r => r.sede).filter(Boolean))].sort();
  const procesos  = [...new Set(allRecords.map(r => r.proceso).filter(Boolean))].sort();
  const convenios = [...new Set(allRecords.map(r => r.convenio_eps).filter(Boolean))].sort();

  fillSel('f-tipo',     tipos,     'Todos los tipos');
  fillSel('f-estado',   estados,   'Todos los estados');
  fillSel('f-sede',     sedes,     'Todas las sedes');
  fillSel('f-proceso',  procesos,  'Todos los procesos');
  fillSel('f-convenio', convenios, 'Todos los convenios');
  fillSel('k-tipo',     tipos,     'Todos los tipos');
  fillSel('k-sede',     sedes,     'Todas las sedes');
  fillSel('t-tipo',     tipos,     'Todos los tipos');
  fillSel('t-estado',   estados,   'Todos los estados');
  fillSel('t-sede',     sedes,     'Todas las sedes');
}

function fillSel(id, items, placeholder) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = `<option value="">${placeholder}</option>` +
    items.map(i => `<option value="${esc(i)}">${esc(i)}</option>`).join('');
}

function getFilteredData(prefix = 'f') {
  const tipo     = gv(prefix + '-tipo');
  const estado   = gv(prefix + '-estado');
  const sede     = gv(prefix + '-sede');
  const proceso  = gv(prefix + '-proceso');
  const convenio = gv(prefix + '-convenio');
  const desde    = gv(prefix + '-desde');
  const hasta    = gv(prefix + '-hasta');

  return allRecords.filter(r => {
    if (tipo     && r.tipo_reporte !== tipo)     return false;
    if (estado   && r.estado !== estado)         return false;
    if (sede     && r.sede !== sede)             return false;
    if (proceso  && r.proceso !== proceso)       return false;
    if (convenio && r.convenio_eps !== convenio) return false;
    if (desde) {
      const d = r.fecha_manifestacion ?? r.created_at?.split('T')[0];
      if (d && d < desde) return false;
    }
    if (hasta) {
      const d = r.fecha_manifestacion ?? r.created_at?.split('T')[0];
      if (d && d > hasta) return false;
    }
    return true;
  });
}

/* ════════════════════════════════════════════════════════════
   NAVIGATION
════════════════════════════════════════════════════════════ */
function showSection(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('sec-' + name)?.classList.add('active');
  document.querySelector(`[data-section="${name}"]`)?.classList.add('active');
  if (name === 'kanban')  loadKanban();
  if (name === 'records') loadTable();
}

function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  const mc = document.getElementById('mainContent');
  sb.classList.toggle('collapsed');
  mc.classList.toggle('full');
}

/* ════════════════════════════════════════════════════════════
   DASHBOARD – STATS + CHARTS
════════════════════════════════════════════════════════════ */
function applyFilters() {
  filteredRecs = getFilteredData('f');
  updateStats(filteredRecs);
  buildCharts(filteredRecs);
}

function clearFilters() {
  ['f-tipo','f-estado','f-sede','f-proceso','f-convenio','f-desde','f-hasta']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  applyFilters();
}

function updateStats(recs) {
  const today = new Date();
  const total      = recs.length;
  const pendiente  = recs.filter(r => r.estado === 'Recibida' || r.estado === 'En gestión').length;
  const respondida = recs.filter(r => r.estado === 'Respondida' || r.estado === 'Cerrada').length;
  const vencida    = recs.filter(r => {
    if (r.estado === 'Respondida' || r.estado === 'Cerrada') return false;
    const d = r.fecha_manifestacion ?? r.created_at?.split('T')[0];
    if (!d) return false;
    const diff = (today - new Date(d)) / (1000*60*60*24);
    return diff > 15;
  }).length;
  const peticion  = recs.filter(r => r.tipo_reporte === 'Petición').length;
  const queja     = recs.filter(r => r.tipo_reporte === 'Queja').length;
  const reclamo   = recs.filter(r => r.tipo_reporte === 'Reclamo').length;
  const otro      = recs.filter(r => r.tipo_reporte === 'Sugerencia' || r.tipo_reporte === 'Felicitación').length;

  sv('s-total',     total);
  sv('s-pendiente', pendiente);
  sv('s-respondida',respondida);
  sv('s-vencida',   vencida);
  sv('s-peticion',  peticion);
  sv('s-queja',     queja);
  sv('s-reclamo',   reclamo);
  sv('s-otro',      otro);
}

function buildCharts(recs) {
  buildChartTipo(recs);
  buildChartMes(recs);
  buildChartSede(recs);
  buildChartEstado(recs);
}

/* ── Chart defaults – Odoo compact style ───────────────────── */
const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 400 },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(13,45,107,.85)',
      titleFont: { size: 11 }, bodyFont: { size: 11 },
      padding: 8, cornerRadius: 6,
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { size: 10 }, color: '#9ca3af', maxRotation: 30 },
      border: { display: false },
    },
    y: {
      grid: { color: '#f3f4f6' },
      ticks: { font: { size: 10 }, color: '#9ca3af', stepSize: 1 },
      border: { display: false },
      beginAtZero: true,
    },
  },
};

function buildChartTipo(recs) {
  const counts = {};
  recs.forEach(r => { if (r.tipo_reporte) counts[r.tipo_reporte] = (counts[r.tipo_reporte]||0)+1; });
  const labels = Object.keys(counts);
  const data   = Object.values(counts);
  const colors = labels.map(l => TIPO_CFG[l]?.color ?? '#6b7280');
  if (chartTipo) chartTipo.destroy();
  const ctx = document.getElementById('chartTipo').getContext('2d');
  chartTipo = new Chart(ctx, {
    type: 'doughnut',
    data: { labels, datasets:[{ data, backgroundColor: colors, borderWidth: 2, borderColor:'#fff', hoverOffset: 4 }]},
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 400 },
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font:{ size:10 }, padding: 8, boxWidth: 10, color:'#6b7280' }
        },
        tooltip: {
          backgroundColor:'rgba(13,45,107,.85)',
          titleFont:{size:11}, bodyFont:{size:11},
          padding:8, cornerRadius:6,
        },
      },
    }
  });
}

function buildChartMes(recs) {
  const byMonth = {};
  recs.forEach(r => {
    const d = r.fecha_manifestacion ?? r.created_at?.split('T')[0];
    if (!d) return;
    const key = d.substring(0, 7);
    byMonth[key] = (byMonth[key]||0)+1;
  });
  const sorted = Object.keys(byMonth).sort().slice(-6);
  const labels = sorted.map(k => {
    const [y,m] = k.split('-');
    return new Date(+y,+m-1,1).toLocaleDateString('es-CO',{month:'short'});
  });
  const data = sorted.map(k => byMonth[k]);
  if (chartMes) chartMes.destroy();
  const ctx = document.getElementById('chartMes').getContext('2d');
  chartMes = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets:[{
        label:'PQRSF', data,
        borderColor:'#2471c8', borderWidth: 2,
        backgroundColor:'rgba(36,113,200,.08)',
        fill: true, tension: 0.4,
        pointBackgroundColor:'#2471c8',
        pointRadius: 3, pointHoverRadius: 5,
      }]
    },
    options: { ...CHART_DEFAULTS }
  });
}

function buildChartSede(recs) {
  const counts = {};
  recs.forEach(r => { if (r.sede) counts[r.sede] = (counts[r.sede]||0)+1; });
  const sorted = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const labels = sorted.map(e => e[0].length > 12 ? e[0].substring(0,12)+'…' : e[0]);
  const data   = sorted.map(e=>e[1]);
  if (chartSede) chartSede.destroy();
  const ctx = document.getElementById('chartSede').getContext('2d');
  chartSede = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets:[{
      label:'Cantidad', data,
      backgroundColor:'rgba(22,163,74,.75)',
      borderRadius: 4, borderSkipped: false,
    }]},
    options: { ...CHART_DEFAULTS }
  });
}

function buildChartEstado(recs) {
  const orden  = STAGES;
  const counts = {};
  orden.forEach(s => { counts[s] = 0; });
  recs.forEach(r => { if (r.estado && counts[r.estado] !== undefined) counts[r.estado]++; });
  const colors = ['#60a5fa','#fb923c','#4ade80','#d1d5db'];
  if (chartEstado) chartEstado.destroy();
  const ctx = document.getElementById('chartEstado').getContext('2d');
  chartEstado = new Chart(ctx, {
    type: 'bar',
    data: { labels: orden, datasets:[{
      label:'Cantidad', data: orden.map(s=>counts[s]),
      backgroundColor: colors,
      borderRadius: 4, borderSkipped: false,
    }]},
    options: { ...CHART_DEFAULTS }
  });
}

/* ════════════════════════════════════════════════════════════
   KANBAN VIEW
════════════════════════════════════════════════════════════ */
function buildKanbanFilters() {}

function loadKanban() {
  const tipo  = gv('k-tipo');
  const sede  = gv('k-sede');
  const desde = gv('k-desde');
  const hasta = gv('k-hasta');

  let recs = allRecords.filter(r => {
    if (tipo  && r.tipo_reporte !== tipo) return false;
    if (sede  && r.sede !== sede)         return false;
    if (desde) { const d = r.fecha_manifestacion; if (d && d < desde) return false; }
    if (hasta) { const d = r.fecha_manifestacion; if (d && d > hasta) return false; }
    return true;
  });

  const board = document.getElementById('kanbanBoard');
  board.innerHTML = '';

  STAGES.forEach(stage => {
    const stageRecs = recs.filter(r => (r.estado ?? 'Recibida') === stage);
    const col = document.createElement('div');
    col.className = 'kanban-col';
    col.dataset.stage = stage;
    col.innerHTML = `
      <div class="kanban-col-header">
        ${stage}
        <span class="col-count">${stageRecs.length}</span>
      </div>
      <div class="kanban-cards" id="kc-${stage.replace(' ','_')}">
        ${stageRecs.length === 0
          ? '<div class="kanban-empty">Sin registros</div>'
          : stageRecs.map(r => buildKanbanCard(r)).join('')}
      </div>`;
    board.appendChild(col);
  });
}

function buildKanbanCard(r) {
  const radicado = `PQRSF-${String(r.id).padStart(6,'0')}`;
  const cfg      = TIPO_CFG[r.tipo_reporte] ?? { color:'#6b7280', cls:'default' };
  const hasResp  = r.respuestas_pqrsf?.length > 0;
  const fecha    = r.fecha_manifestacion
    ? new Date(r.fecha_manifestacion + 'T12:00:00').toLocaleDateString('es-CO',{day:'2-digit',month:'short',year:'numeric'})
    : '—';
  return `
  <div class="kanban-card" onclick="openRecord(${r.id})" style="border-left-color:${cfg.color}">
    <div class="kc-top">
      <span class="kc-radicado">${radicado}</span>
      <span class="kc-badge ${cfg.cls}">${r.tipo_reporte ?? ''}</span>
    </div>
    <div class="kc-patient">${esc(r.nombre_paciente ?? 'Sin nombre')}</div>
    <div class="kc-sub">
      ${r.entidad  ? `<span><i class="fa-solid fa-hospital"></i>${esc(r.entidad)}</span>`  : ''}
      ${r.proceso  ? `<span><i class="fa-solid fa-sitemap"></i>${esc(r.proceso)}</span>`   : ''}
      ${r.convenio_eps ? `<span><i class="fa-solid fa-handshake"></i>${esc(r.convenio_eps)}</span>` : ''}
    </div>
    <div class="kc-footer">
      <span class="kc-date"><i class="fa-solid fa-calendar" style="margin-right:3px"></i>${fecha}</span>
      <span class="kc-resp ${hasResp?'yes':'no'}">${hasResp?'✓ Respondida':'Pendiente'}</span>
    </div>
  </div>`;
}

/* ════════════════════════════════════════════════════════════
   TABLE VIEW
════════════════════════════════════════════════════════════ */
function buildTableFilters() {}

function loadTable() {
  filterTable();
}

function filterTable() {
  const q     = (document.getElementById('tableSearch')?.value ?? '').toLowerCase();
  const tipo  = gv('t-tipo');
  const estado= gv('t-estado');
  const sede  = gv('t-sede');
  const desde = gv('t-desde');
  const hasta = gv('t-hasta');

  let recs = allRecords.filter(r => {
    if (tipo   && r.tipo_reporte !== tipo)  return false;
    if (estado && r.estado !== estado)       return false;
    if (sede   && r.sede !== sede)           return false;
    if (desde) { const d = r.fecha_manifestacion; if (d && d < desde) return false; }
    if (hasta) { const d = r.fecha_manifestacion; if (d && d > hasta) return false; }
    if (q) {
      const rad = `pqrsf-${String(r.id).padStart(6,'0')}`;
      const hay = [r.nombre_paciente, r.numero_identificacion, r.entidad,
                   r.sede, r.proceso, r.descripcion, rad]
        .filter(Boolean).join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  // Sort
  recs.sort((a,b) => {
    let va = a[sortCol] ?? '', vb = b[sortCol] ?? '';
    if (typeof va === 'string') va = va.toLowerCase();
    if (typeof vb === 'string') vb = vb.toLowerCase();
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ?  1 : -1;
    return 0;
  });

  filteredRecs = recs;
  renderTable(recs);
}

function sortTable(col) {
  if (sortCol === col) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
  else { sortCol = col; sortDir = 'asc'; }
  filterTable();
}

function renderTable(recs) {
  const tbody = document.getElementById('tableBody');
  if (!recs.length) {
    tbody.innerHTML = '<tr><td colspan="10" class="table-loading">Sin registros para mostrar</td></tr>';
    document.getElementById('tableFooter').textContent = '0 registros';
    return;
  }
  tbody.innerHTML = recs.map(r => {
    const radicado = `PQRSF-${String(r.id).padStart(6,'0')}`;
    const cfg      = TIPO_CFG[r.tipo_reporte] ?? { color:'#6b7280' };
    const estCls   = ESTADO_CLS[r.estado] ?? 'est-default';
    const hasResp  = r.respuestas_pqrsf?.length > 0;
    const fecha    = r.fecha_manifestacion
      ? new Date(r.fecha_manifestacion+'T12:00:00').toLocaleDateString('es-CO',{day:'2-digit',month:'2-digit',year:'numeric'})
      : '—';
    return `<tr>
      <td style="font-weight:700;color:#0d2d6b;font-size:12px">${radicado}</td>
      <td><span class="badge-tipo-table" style="background:${cfg.color}">${esc(r.tipo_reporte??'')}</span></td>
      <td>${esc(r.nombre_paciente??'—')}</td>
      <td>${esc(r.entidad??'—')}</td>
      <td>${esc(r.sede??'—')}</td>
      <td style="font-size:12px">${esc(r.proceso??'—')}</td>
      <td style="font-size:12px;white-space:nowrap">${fecha}</td>
      <td><span class="badge-estado-table ${estCls}">${esc(r.estado??'Recibida')}</span></td>
      <td><span class="resp-dot ${hasResp?'yes':'no'}" title="${hasResp?'Respondida':'Sin respuesta'}"></span> ${hasResp?'Sí':'No'}</td>
      <td><div class="table-actions">
        <button class="btn-tbl view" onclick="openRecord(${r.id})" title="Ver"><i class="fa-solid fa-eye"></i></button>
        <button class="btn-tbl pdf"  onclick="generatePDFById(${r.id})" title="PDF"><i class="fa-solid fa-file-pdf"></i></button>
        <button class="btn-tbl del"  onclick="confirmDeleteById(${r.id},'${radicado}')" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
      </div></td>
    </tr>`;
  }).join('');
  document.getElementById('tableFooter').innerHTML =
    `<span>${recs.length} registro${recs.length!==1?'s':''}</span><span>Última actualización: ${new Date().toLocaleTimeString('es-CO')}</span>`;
}

/* ════════════════════════════════════════════════════════════
   RECORD MODAL – VER / EDITAR
════════════════════════════════════════════════════════════ */
function openRecord(id) {
  currentRecord = allRecords.find(r => r.id === id);
  if (!currentRecord) return;
  isEditing = false;
  renderModal(currentRecord);
  document.getElementById('recordModal').style.display = 'flex';
}

function renderModal(r) {
  const radicado = `PQRSF-${String(r.id).padStart(6,'0')}`;
  const cfg      = TIPO_CFG[r.tipo_reporte] ?? { color:'#1a4f9b' };
  const estado   = r.estado ?? 'Recibida';
  const resp     = r.respuestas_pqrsf?.[0] ?? null;

  // Title
  document.getElementById('modalTitle').innerHTML =
    `<span style="color:#0d2d6b;letter-spacing:1px;font-size:15px">${radicado}</span>
     <span style="background:${cfg.color};color:#fff;font-size:11px;font-weight:700;padding:3px 12px;border-radius:99px;margin-left:8px">${r.tipo_reporte??''}</span>`;

  // Statusbar
  const stageIdx = STAGES.indexOf(estado);
  document.getElementById('modalStatusbar').innerHTML = STAGES.map((s,i) => {
    const cls = i < stageIdx ? 'done' : i === stageIdx ? 'current' : '';
    return `<div class="modal-stage ${cls}" onclick="changeEstado('${s}')" title="Cambiar a: ${s}">${i<stageIdx?'✓ ':''} ${s}</div>`;
  }).join('');

  if (isEditing) {
    renderEditForm(r, resp);
  } else {
    renderViewForm(r, resp);
  }

  // Edit/Save buttons
  document.getElementById('btnEdit').style.display = isEditing ? 'none' : 'flex';
  document.getElementById('btnSave').style.display = isEditing ? 'flex' : 'none';
}

function renderViewForm(r, resp) {
  const fecha = r.fecha_manifestacion
    ? new Date(r.fecha_manifestacion+'T12:00:00').toLocaleDateString('es-CO',{year:'numeric',month:'long',day:'numeric'})
    : '—';

  let html = `
  <!-- PQRSF Data (azul) -->
  <div class="modal-section">
    <div class="modal-section-title blue"><i class="fa-solid fa-file-circle-info"></i> Datos del Reporte PQRSF</div>
    <div class="detail-grid">
      ${df('Entidad',              r.entidad)}
      ${df('Sede',                 r.sede)}
      ${df('Proceso / Servicio',   r.proceso)}
      ${df('Fuente',               r.fuente)}
      ${df('Fecha manifestación',  fecha)}
      ${df('Estado',               r.estado)}
      ${df('Tipo usuario',         r.tipo_usuario)}
      ${df('Convenio / EPS',       r.convenio_eps)}
      ${df('Régimen',              r.regimen)}
      ${df('Nombre paciente',      r.nombre_paciente)}
      ${df('Identificación',       r.numero_identificacion)}
      ${df('Teléfono',             r.telefono)}
      ${df('Correo paciente',      r.email_reporta)}
      ${df('Dirección',            r.direccion)}
      ${df('Falla / Atributo',     r.falla_atributo)}
      ${df('Especialidad',         r.especialidad)}
      ${df('Colaborador reporte',  r.colaborador)}
      ${r.archivo_nombre ? `<div class="detail-field full"><div class="detail-label">Documento adjunto</div>
        <div class="detail-value"><a href="${esc(r.archivo_url??'#')}" target="_blank" style="color:#2471c8"><i class="fa-solid fa-paperclip"></i> ${esc(r.archivo_nombre)}</a></div></div>` : ''}
    </div>
    ${r.descripcion ? `<div class="description-box" style="margin-top:12px">
      <div class="detail-label">Descripción del caso</div>
      <div class="detail-value">${esc(r.descripcion)}</div></div>` : ''}
  </div>`;

  if (resp) {
    const fechaResp = resp.fecha_respuesta
      ? new Date(resp.fecha_respuesta+'T12:00:00').toLocaleDateString('es-CO',{year:'numeric',month:'long',day:'numeric'})
      : '—';
    html += `
  <!-- Respuesta (verde) -->
  <div class="modal-section">
    <div class="modal-section-title green"><i class="fa-solid fa-reply"></i> Respuesta Oficial</div>
    <div class="detail-grid">
      ${df('Fecha respuesta',       fechaResp)}
      ${df('Respondido por',        resp.respondido_por_nombre)}
      ${df('Correo responsable',    resp.respondido_por_email)}
      ${df('Colaborador involucrado', resp.colaborador)}
      ${resp.archivo_nombre ? `<div class="detail-field full"><div class="detail-label">Documento adjunto</div>
        <div class="detail-value"><a href="${esc(resp.archivo_url??'#')}" target="_blank" style="color:#16a34a"><i class="fa-solid fa-paperclip"></i> ${esc(resp.archivo_nombre)}</a></div></div>` : ''}
    </div>
    <div class="description-box" style="margin-top:12px;border-left-color:#16a34a;background:#f0fdf4">
      <div class="detail-label" style="color:#166534">Texto de la respuesta</div>
      <div class="detail-value">${esc(resp.respuesta)}</div></div>
  </div>`;
  } else {
    html += `<div class="modal-section">
      <div class="modal-section-title orange"><i class="fa-solid fa-clock"></i> Respuesta</div>
      <div class="no-response-box"><i class="fa-solid fa-hourglass-half" style="font-size:24px;margin-bottom:8px;display:block"></i>Este PQRSF aún no tiene respuesta registrada</div>
    </div>`;
  }

  document.getElementById('modalBody').innerHTML = html;
}

function renderEditForm(r, resp) {
  const ESTADOS_OPT = STAGES.map(s => `<option value="${s}" ${r.estado===s?'selected':''}>${s}</option>`).join('');

  let html = `
  <div class="modal-section">
    <div class="modal-section-title blue"><i class="fa-solid fa-pen"></i> Editar Reporte PQRSF</div>
    <div class="detail-grid">
      <div class="detail-field"><div class="detail-label">Estado</div>
        <select class="edit-input edit-select" id="e-estado">${ESTADOS_OPT}</select></div>
      <div class="detail-field"><div class="detail-label">Nombre paciente</div>
        <input class="edit-input" id="e-nombre" value="${esc(r.nombre_paciente??'')}"/></div>
      <div class="detail-field"><div class="detail-label">Identificación</div>
        <input class="edit-input" id="e-id" value="${esc(r.numero_identificacion??'')}"/></div>
      <div class="detail-field"><div class="detail-label">Teléfono</div>
        <input class="edit-input" id="e-tel" value="${esc(r.telefono??'')}"/></div>
      <div class="detail-field"><div class="detail-label">Correo paciente</div>
        <input class="edit-input" id="e-email" type="email" value="${esc(r.email_reporta??'')}"/></div>
      <div class="detail-field"><div class="detail-label">Especialidad</div>
        <input class="edit-input" id="e-esp" value="${esc(r.especialidad??'')}"/></div>
      <div class="detail-field"><div class="detail-label">Colaborador</div>
        <input class="edit-input" id="e-col" value="${esc(r.colaborador??'')}"/></div>
      <div class="detail-field full"><div class="detail-label">Descripción</div>
        <textarea class="edit-input edit-textarea" id="e-desc">${esc(r.descripcion??'')}</textarea></div>
    </div>
  </div>`;

  document.getElementById('modalBody').innerHTML = html;
}

async function saveRecord() {
  if (!currentRecord) return;
  showLoading('Guardando cambios…');

  const updates = {
    estado              : gv('e-estado'),
    nombre_paciente     : gv('e-nombre'),
    numero_identificacion: gv('e-id'),
    telefono            : gv('e-tel'),
    email_reporta       : gv('e-email'),
    especialidad        : gv('e-esp'),
    colaborador         : gv('e-col'),
    descripcion         : gv('e-desc'),
  };

  const { error } = await db
    .from('reportes_pqrsf')
    .update(updates)
    .eq('id', currentRecord.id);

  hideLoading();
  if (error) { alert('Error: ' + error.message); return; }

  // Update local data
  Object.assign(currentRecord, updates);
  const idx = allRecords.findIndex(r => r.id === currentRecord.id);
  if (idx >= 0) Object.assign(allRecords[idx], updates);

  isEditing = false;
  renderModal(currentRecord);
  applyFilters();
  if (document.getElementById('sec-records').classList.contains('active')) filterTable();
  if (document.getElementById('sec-kanban').classList.contains('active')) loadKanban();
}

function toggleEdit() {
  isEditing = !isEditing;
  renderModal(currentRecord);
}

async function changeEstado(newEstado) {
  if (!currentRecord) return;
  showLoading('Actualizando estado…');
  const { error } = await db.from('reportes_pqrsf').update({ estado: newEstado }).eq('id', currentRecord.id);
  hideLoading();
  if (error) { alert('Error: ' + error.message); return; }
  currentRecord.estado = newEstado;
  const idx = allRecords.findIndex(r => r.id === currentRecord.id);
  if (idx >= 0) allRecords[idx].estado = newEstado;
  renderModal(currentRecord);
  applyFilters();
  if (document.getElementById('sec-kanban').classList.contains('active')) loadKanban();
}

/* ── Delete ─────────────────────────────────────────────────── */
function confirmDelete() {
  if (!currentRecord) return;
  const radicado = `PQRSF-${String(currentRecord.id).padStart(6,'0')}`;
  document.getElementById('deleteRadicado').textContent = radicado;
  document.getElementById('deleteModal').style.display = 'flex';
}

function confirmDeleteById(id, radicado) {
  currentRecord = allRecords.find(r => r.id === id);
  document.getElementById('deleteRadicado').textContent = radicado;
  document.getElementById('deleteModal').style.display = 'flex';
}

async function deleteRecord() {
  if (!currentRecord) return;
  closeModal('deleteModal');
  showLoading('Eliminando registro…');

  // Delete responses first (cascade should handle it, but explicit is safer)
  await db.from('respuestas_pqrsf').delete().eq('reporte_id', currentRecord.id);
  const { error } = await db.from('reportes_pqrsf').delete().eq('id', currentRecord.id);

  hideLoading();
  if (error) { alert('Error: ' + error.message); return; }

  allRecords = allRecords.filter(r => r.id !== currentRecord.id);
  currentRecord = null;
  closeModal('recordModal');
  applyFilters();
  filterTable();
  loadKanban();
}

/* ── New record ─────────────────────────────────────────────── */
function openNewRecord() {
  window.open('../pqrsf-reporte/index.html', '_blank') ||
  window.open('https://juanetayo-projects.github.io/pqrsf-reporte/', '_blank');
}

/* ════════════════════════════════════════════════════════════
   PDF GENERATION
════════════════════════════════════════════════════════════ */
function generatePDF() {
  if (currentRecord) generatePDFById(currentRecord.id);
}

function generatePDFById(id) {
  const r    = allRecords.find(rec => rec.id === id);
  if (!r) return;
  const resp = r.respuestas_pqrsf?.[0] ?? null;
  const { jsPDF } = window.jspdf;
  const doc  = new jsPDF({ unit:'mm', format:'a4' });
  const W    = 210, ml = 15, mr = 15, cw = W - ml - mr;

  // Header background
  doc.setFillColor(13,45,107);
  doc.rect(0, 0, W, 38, 'F');

  // Logo incrustado — dimensiones fijas (logo.png: 575×677 px → ratio ≈ 0.85)
  const logoH  = 28;
  const logoW  = logoH * (575 / 677); // ≈ 23.8 mm
  // jsPDF 2.x: pasar SÓLO los bytes base64 sin el prefijo "data:image/png;base64,"
  const logoData = LOGO_B64.split(',')[1]; // extrae la parte pura base64
  try {
    doc.addImage(logoData, 'PNG', ml, (38 - logoH) / 2, logoW, logoH);
    const tx = ml + logoW + 5;
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13); doc.setFont('helvetica', 'bold');
    doc.text('Clínica de Alta Complejidad Santa Bárbara', tx, 13);
    doc.setFontSize(9);  doc.setFont('helvetica', 'normal');
    doc.text('SIAU – Sistema PQRSF', tx, 21);
    doc.setFontSize(8);
    doc.text('Peticiones · Quejas · Reclamos · Sugerencias · Felicitaciones', tx, 29);
  } catch (e) {
    console.error('addImage error:', e);
    // Fallback texto centrado
    doc.setTextColor(255,255,255);
    doc.setFontSize(14); doc.setFont('helvetica','bold');
    doc.text('Clínica de Alta Complejidad Santa Bárbara', W/2, 14, {align:'center'});
    doc.setFontSize(10); doc.setFont('helvetica','normal');
    doc.text('SIAU – Sistema PQRSF', W/2, 21, {align:'center'});
    doc.setFontSize(9);
    doc.text('Peticiones · Quejas · Reclamos · Sugerencias · Felicitaciones', W/2, 29, {align:'center'});
  }

  // Radicado box
  const radicado = `PQRSF-${String(r.id).padStart(6,'0')}`;
  doc.setFillColor(240,246,255);
  doc.roundedRect(ml, 43, cw, 18, 3, 3, 'F');
  doc.setTextColor(13,45,107); doc.setFontSize(18); doc.setFont('helvetica','bold');
  doc.text(radicado, W/2, 54, {align:'center'});
  doc.setFontSize(9); doc.setFont('helvetica','normal'); doc.setTextColor(107,114,128);
  doc.text(`Tipo: ${r.tipo_reporte ?? '—'}   |   Estado: ${r.estado ?? 'Recibida'}   |   Generado: ${new Date().toLocaleDateString('es-CO')}`, W/2, 61, {align:'center'});

  let y = 70;

  // PQRSF data table
  doc.setFontSize(10); doc.setFont('helvetica','bold'); doc.setTextColor(13,45,107);
  doc.text('DATOS DEL REPORTE', ml, y); y += 5;
  doc.autoTable({
    startY: y,
    head: [['Campo', 'Valor']],
    body: [
      ['Entidad',          r.entidad??'—'],
      ['Sede',             r.sede??'—'],
      ['Proceso/Servicio', r.proceso??'—'],
      ['Fecha manifestación', r.fecha_manifestacion??'—'],
      ['Fuente',           r.fuente??'—'],
      ['Tipo de usuario',  r.tipo_usuario??'—'],
      ['Convenio/EPS',     r.convenio_eps??'—'],
      ['Régimen',          r.regimen??'—'],
      ['Nombre paciente',  r.nombre_paciente??'—'],
      ['Identificación',   r.numero_identificacion??'—'],
      ['Teléfono',         r.telefono??'—'],
      ['Correo',           r.email_reporta??'—'],
      ['Falla/Atributo',   r.falla_atributo??'—'],
      ['Especialidad',     r.especialidad??'—'],
      ['Colaborador',      r.colaborador??'—'],
    ],
    margin: { left: ml, right: mr },
    headStyles:{ fillColor:[26,79,155], textColor:255, fontSize:9, fontStyle:'bold' },
    bodyStyles:{ fontSize:8.5, textColor:[55,65,81] },
    alternateRowStyles:{ fillColor:[240,246,255] },
    columnStyles:{ 0:{ fontStyle:'bold', cellWidth:55 } },
  });
  y = doc.lastAutoTable.finalY + 6;

  // Description
  if (r.descripcion) {
    doc.setFillColor(240,246,255);
    doc.setDrawColor(26,79,155); doc.setLineWidth(.5);
    doc.roundedRect(ml, y, cw, 6, 1, 1, 'F');
    doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.setTextColor(26,79,155);
    doc.text('DESCRIPCIÓN DEL CASO', ml+3, y+4.2); y+=9;
    const lines = doc.splitTextToSize(r.descripcion, cw - 6);
    doc.setFont('helvetica','normal'); doc.setTextColor(55,65,81); doc.setFontSize(9);
    doc.text(lines, ml+3, y); y += lines.length * 5 + 6;
  }

  // Response
  if (resp) {
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFontSize(10); doc.setFont('helvetica','bold'); doc.setTextColor(22,163,74);
    doc.text('RESPUESTA OFICIAL', ml, y); y += 5;
    doc.autoTable({
      startY: y,
      body: [
        ['Fecha respuesta',    resp.fecha_respuesta??'—'],
        ['Respondido por',     resp.respondido_por_nombre??'—'],
        ['Correo responsable', resp.respondido_por_email??'—'],
        ['Colaborador',        resp.colaborador??'—'],
      ],
      margin:{ left:ml, right:mr },
      headStyles:{ fillColor:[22,163,74] },
      bodyStyles:{ fontSize:8.5, textColor:[55,65,81] },
      alternateRowStyles:{ fillColor:[240,253,244] },
      columnStyles:{ 0:{ fontStyle:'bold', cellWidth:55, fillColor:[240,253,244] } },
    });
    y = doc.lastAutoTable.finalY + 4;
    const rlines = doc.splitTextToSize(resp.respuesta ?? '', cw - 6);
    doc.setFillColor(240,253,244); doc.roundedRect(ml, y, cw, rlines.length*5+10, 2, 2, 'F');
    doc.setFont('helvetica','normal'); doc.setTextColor(22,101,52); doc.setFontSize(9);
    doc.text(rlines, ml+4, y+6); y += rlines.length * 5 + 14;
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(13,45,107);
    doc.rect(0, 287, W, 10, 'F');
    doc.setTextColor(255,255,255); doc.setFontSize(8); doc.setFont('helvetica','normal');
    doc.text('Clínica de Alta Complejidad Santa Bárbara – SIAU', ml, 293);
    doc.text(`Página ${i} de ${pageCount}`, W - mr, 293, {align:'right'});
  }

  doc.save(`${radicado}.pdf`);
}

/* ════════════════════════════════════════════════════════════
   EXCEL EXPORT
════════════════════════════════════════════════════════════ */
function exportExcel() {
  const data = (filteredRecs.length > 0 ? filteredRecs : allRecords).map(r => {
    const resp = r.respuestas_pqrsf?.[0] ?? {};
    return {
      'Radicado'              : `PQRSF-${String(r.id).padStart(6,'0')}`,
      'Tipo PQRSF'            : r.tipo_reporte ?? '',
      'Estado'                : r.estado ?? '',
      'Entidad'               : r.entidad ?? '',
      'Sede'                  : r.sede ?? '',
      'Proceso'               : r.proceso ?? '',
      'Fecha Manifestación'   : r.fecha_manifestacion ?? '',
      'Fuente'                : r.fuente ?? '',
      'Tipo Usuario'          : r.tipo_usuario ?? '',
      'Convenio/EPS'          : r.convenio_eps ?? '',
      'Régimen'               : r.regimen ?? '',
      'Nombre Paciente'       : r.nombre_paciente ?? '',
      'Identificación'        : r.numero_identificacion ?? '',
      'Teléfono'              : r.telefono ?? '',
      'Correo Paciente'       : r.email_reporta ?? '',
      'Falla/Atributo'        : r.falla_atributo ?? '',
      'Especialidad'          : r.especialidad ?? '',
      'Colaborador Reporte'   : r.colaborador ?? '',
      'Descripción'           : r.descripcion ?? '',
      'Tiene Respuesta'       : resp.id ? 'Sí' : 'No',
      'Fecha Respuesta'       : resp.fecha_respuesta ?? '',
      'Respondido por'        : resp.respondido_por_nombre ?? '',
      'Texto Respuesta'       : resp.respuesta ?? '',
      'Colaborador Respuesta' : resp.colaborador ?? '',
      'Fecha Registro'        : r.created_at ? r.created_at.split('T')[0] : '',
    };
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'PQRSF');

  // Column widths
  ws['!cols'] = [
    {wch:16},{wch:14},{wch:14},{wch:24},{wch:18},{wch:22},{wch:18},
    {wch:14},{wch:16},{wch:22},{wch:12},{wch:26},{wch:14},{wch:14},
    {wch:26},{wch:22},{wch:16},{wch:22},{wch:50},{wch:12},{wch:16},
    {wch:22},{wch:60},{wch:22},{wch:16}
  ];

  const fecha = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `PQRSF_Reporte_${fecha}.xlsx`);
}

/* ════════════════════════════════════════════════════════════
   PRINT
════════════════════════════════════════════════════════════ */
function printDashboard() {
  window.print();
}

function printRecord() {
  if (!currentRecord) return;
  const modal = document.querySelector('#recordModal .modal-box').cloneNode(true);
  const orig  = document.body.innerHTML;
  document.body.innerHTML = modal.outerHTML;
  window.print();
  document.body.innerHTML = orig;
  window.location.reload();
}

/* ════════════════════════════════════════════════════════════
   GLOBAL SEARCH
════════════════════════════════════════════════════════════ */
function globalSearchHandler() {
  const q = document.getElementById('globalSearch').value.trim();
  if (!q) return;
  if (document.getElementById('sec-records').classList.contains('active')) {
    document.getElementById('tableSearch').value = q;
    filterTable();
  } else {
    showSection('records');
    setTimeout(() => { document.getElementById('tableSearch').value = q; filterTable(); }, 100);
  }
}

/* ════════════════════════════════════════════════════════════
   UTILS
════════════════════════════════════════════════════════════ */
function gv(id) { const el = document.getElementById(id); return el ? el.value.trim() : ''; }
function sv(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }
function esc(s) { if (!s) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
function df(label, value) {
  const v = value ?? '';
  return `<div class="detail-field"><div class="detail-label">${label}</div><div class="detail-value ${v?'':'empty'}">${v?esc(v):'—'}</div></div>`;
}
function showLoading(msg) { document.getElementById('loadingMsg').textContent = msg||'Cargando…'; document.getElementById('loadingOverlay').classList.add('visible'); }
function hideLoading()    { document.getElementById('loadingOverlay').classList.remove('visible'); }
function closeModal(id)   { document.getElementById(id).style.display = 'none'; }

// Close modal on overlay click
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) closeModal(e.target.id);
});
