interface ImportMetaEnv {
  readonly PUBLIC_UMAMI_SRC?: string;
  readonly PUBLIC_UMAMI_ID?: string;
  readonly PUBLIC_YM_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
