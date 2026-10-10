// Отдельный конфиг для проверочных опытов вне репозитория
export default {
  root: "/private/tmp/claude-501/-Users-komleff-Documents-GitHub-u2-lab/071d6f03-bc84-4af5-bd22-702c5dfac98b/scratchpad/probe",
  test: { include: ["*.probe.ts"], testTimeout: 120000, server: { deps: { fallbackCJS: true } } },
  server: { fs: { strict: false } },
};
