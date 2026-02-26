import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Missing auth header' }), { status: 401 });

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const userClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: authData } = await userClient.auth.getUser();
    const callerId = authData.user?.id;
    if (!callerId) return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });

    const { data: callerProfile } = await admin.from('profiles').select('role').eq('id', callerId).single();
    if (callerProfile?.role !== 'master') {
      return new Response(JSON.stringify({ error: 'Only master can create contador users' }), { status: 403 });
    }

    const { email, password, full_name, role } = await req.json();
    if (!email || !password || !full_name) {
      return new Response(JSON.stringify({ error: 'email, password and full_name are required' }), { status: 400 });
    }

    const userRole = role === 'master' ? 'master' : 'contador';

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role: userRole }
    });

    if (createError || !created.user) {
      return new Response(JSON.stringify({ error: createError?.message || 'Could not create user' }), { status: 400 });
    }

    const { error: profileError } = await admin.from('profiles').upsert({
      id: created.user.id,
      full_name,
      role: userRole
    }, { onConflict: 'id' });

    if (profileError) {
      return new Response(JSON.stringify({ error: profileError.message }), { status: 400 });
    }

    return new Response(JSON.stringify({ user_id: created.user.id, email: created.user.email, role: userRole }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
  }
});
