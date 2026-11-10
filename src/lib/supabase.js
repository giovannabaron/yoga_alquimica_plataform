import { createClient } from "@supabase/supabase-js";

// As duas linhas abaixo leem as chaves do arquivo .env (veja o .env.example).
// A chave "anon" é pública por natureza: quem protege os dados são as regras
// do banco (RLS), não o segredo dessa chave.
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(url, anonKey);