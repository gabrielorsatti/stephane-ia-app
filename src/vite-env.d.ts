/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_LLM_API_KEY?: string;
  readonly VITE_LLM_BASE_URL?: string;
  readonly VITE_LLM_MODEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
