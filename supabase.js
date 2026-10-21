// supabase.js
// Cliente do Supabase usado pelo site.
//
// A chave aqui é a PUBLISHABLE (anon) — ela é feita para ficar no navegador e
// só é segura porque o RLS limita o que ela pode ler. A chave `sb_secret_...`
// NUNCA pode entrar neste arquivo: ela ignora o RLS e dá acesso total ao banco.
//
// Projeto: kiozwryulztunsrfqdus (conta sac@iworldprime).
// O projeto anterior (itkojecfwoxlxozywdcf) ficou para trás — estava em outra
// conta, sem acesso pelo painel, e por isso o RLS nunca pôde ser aplicado lá.
const supabaseUrl = 'https://kiozwryulztunsrfqdus.supabase.co';
const supabaseKey = 'sb_publishable_Rt1TFzLwV8YWhPVk2rMYLA_MFTMYXzH';
const mySupabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Torna o cliente acessível globalmente
window.supabaseClient = mySupabase;
