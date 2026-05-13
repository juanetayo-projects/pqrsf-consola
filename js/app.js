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
let logoBase64   = null; // logo precargado para PDF

/* ── Precargar logo para PDF (fetch → base64) ───────────────── */
async function preloadLogo() {
  // Intentar múltiples fuentes en orden
  const urls = [
    'assets/logo.png',
    'https://juanetayo-projects.github.io/consolarondas/logo.png',
    'https://raw.githubusercontent.com/juanetayo-projects/consolarondas/master/logo.png',
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: 'force-cache' });
      if (!res.ok) continue;
      const blob = await res.blob();
      const b64  = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror  = reject;
        reader.readAsDataURL(blob);
      });
      if (b64 && b64.length > 100) {
        logoBase64 = b64;
        console.log('Logo cargado desde:', url);
        return;
      }
    } catch (e) {
      continue;
    }
  }
  console.warn('Logo no disponible para PDF');
  logoBase64 = null;
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

  // Logo (si está disponible)
  if (logoBase64) {
    try {
      // Calcular dimensiones proporcionales (alto máx 28mm)
      const tmpImg = new Image();
      tmpImg.src = logoBase64;
      const ratio  = tmpImg.width  / tmpImg.height;
      const logoH  = 26;
      const logoW  = Math.min(logoH * ratio, 45); // máx 45mm de ancho
      doc.addImage(logoBase64, 'PNG', ml, (38 - logoH) / 2, logoW, logoH);
      // Texto a la derecha del logo
      const tx = ml + logoW + 6;
      doc.setTextColor(255,255,255);
      doc.setFontSize(13); doc.setFont('helvetica','bold');
      doc.text('Clínica de Alta Complejidad Santa Bárbara', tx, 14);
      doc.setFontSize(9); doc.setFont('helvetica','normal');
      doc.text('SIAU – Sistema PQRSF', tx, 21);
      doc.setFontSize(8);
      doc.text('Peticiones · Quejas · Reclamos · Sugerencias · Felicitaciones', tx, 28);
    } catch(e) {
      // Fallback sin logo
      doc.setTextColor(255,255,255);
      doc.setFontSize(14); doc.setFont('helvetica','bold');
      doc.text('Clínica de Alta Complejidad Santa Bárbara', W/2, 14, {align:'center'});
      doc.setFontSize(10); doc.setFont('helvetica','normal');
      doc.text('SIAU – Sistema PQRSF', W/2, 21, {align:'center'});
      doc.setFontSize(9);
      doc.text('Peticiones · Quejas · Reclamos · Sugerencias · Felicitaciones', W/2, 29, {align:'center'});
    }
  } else {
    // Sin logo: texto centrado
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
