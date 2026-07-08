/* ── Supabase client ────────────────────────────────────────── */
const SUPABASE_URL = 'https://cdarbygwhtwkdgkelktw.supabase.co';
const SUPABASE_KEY = 'sb_publishable_hBoCRcO2ozNu8l9lcRSTOw_NHWUZ-Qb';
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/* ── Login page functions ───────────────────────────────────── */
async function doLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const pwd   = document.getElementById('loginPwd').value;
  const btn   = document.getElementById('btnLogin');
  const errEl = document.getElementById('loginError');
  errEl.style.display = 'none';
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verificando…';

  const { data, error } = await db.auth.signInWithPassword({ email, password: pwd });

  if (error) {
    errEl.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> ' +
      (error.message === 'Invalid login credentials'
        ? 'Correo o contraseña incorrectos.'
        : error.message);
    errEl.style.display = 'flex';
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Iniciar sesión';
    return;
  }
  window.location.href = 'console.html';
}

function togglePwd() {
  const input = document.getElementById('loginPwd');
  const icon  = document.getElementById('pwdIcon');
  if (input.type === 'password') {
    input.type = 'text';
    icon.className = 'fa-solid fa-eye-slash';
  } else {
    input.type = 'password';
    icon.className = 'fa-solid fa-eye';
  }
}

/* ── Guard for console.html ─────────────────────────────────── */
async function requireAuth() {
  const { data: { session } } = await db.auth.getSession();
  if (!session) {
    window.location.href = 'index.html';
    return null;
  }
  return session;
}

async function doLogout() {
  await db.auth.signOut();
  window.location.href = 'index.html';
}

/* ── Auto-check session on login page ──────────────────────── */
if (document.getElementById('loginForm')) {
  // Si el enlace de reset de contraseña aterriza aquí, redirigir a reset-password.html
  const _hash = window.location.hash;
  if (_hash.includes('type=recovery') || _hash.includes('type=invite')) {
    window.location.href = 'reset-password.html' + _hash;
  } else {
    db.auth.getSession().then(({ data: { session } }) => {
      if (session) window.location.href = 'console.html';
    });
  }
}
