import { serve }        from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL              = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const CORS = {
  'Access-Control-Allow-Origin' : '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    // ── 1. Verificar que el llamante es un admin autenticado ────
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
    const callerClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: { user: caller }, error: authErr } = await callerClient.auth.getUser(jwt);
    if (authErr || !caller) {
      return new Response(
        JSON.stringify({ ok: false, error: 'No autenticado' }),
        { status: 401, headers: { ...CORS, 'Content-Type': 'application/json' } },
      );
    }

    // Verificar rol admin en consola_perfiles
    const { data: perfil } = await callerClient
      .from('consola_perfiles')
      .select('rol')
      .eq('id', caller.id)
      .single();

    if (perfil?.rol !== 'admin') {
      return new Response(
        JSON.stringify({ ok: false, error: 'Sin permisos de administrador' }),
        { status: 403, headers: { ...CORS, 'Content-Type': 'application/json' } },
      );
    }

    // ── 2. Leer payload ────────────────────────────────────────
    const { email, password, nombre, rol, proceso } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Correo y contraseña son obligatorios' }),
        { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } },
      );
    }

    // ── 3. Crear usuario en Supabase Auth ─────────────────────
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,           // confirmar email automáticamente
      user_metadata: {
        nombre : nombre || email.split('@')[0],
        rol    : rol    || 'analista',
        proceso: proceso || '',
      },
    });

    if (createErr) {
      // Error común: usuario ya existe
      if (createErr.message.includes('already registered')) {
        return new Response(
          JSON.stringify({ ok: false, error: `El correo ${email} ya está registrado.` }),
          { status: 409, headers: { ...CORS, 'Content-Type': 'application/json' } },
        );
      }
      throw createErr;
    }

    // ── 4. El trigger handle_new_user crea consola_perfiles ───
    // Pero por seguridad también hacemos upsert explícito
    await adminClient.from('consola_perfiles').upsert({
      id     : newUser.user!.id,
      nombre : nombre || email.split('@')[0],
      email,
      rol    : rol    || 'analista',
      proceso: proceso || null,
      activo : true,
    }, { onConflict: 'id' });

    return new Response(
      JSON.stringify({ ok: true, id: newUser.user!.id, email }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } },
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } },
    );
  }
});
