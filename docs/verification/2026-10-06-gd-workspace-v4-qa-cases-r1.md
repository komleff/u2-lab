---
title: "GD workspace v4 — QA1 case results"
date: 2026-10-06
candidate: 17bb6b66e6384ee53ee1250e8dc2399ef4a2256f
result: FAIL
---

Семь source-first адресов, три representative whole chains (1440/820/LAN390), дополнительные slices. 6 PASS/1 FAIL в измеренном scope, не семь полных chains на каждой ширине. V4-02 содержит validated desktop BLOCKER V4-B1; быстрый click и touch PASS его не отменяют. Непроверенные edges остаются NOT RUN в отчёте.

| Case | Source AC | Выполненный метод | Result | Evidence в execution-r1/ |
|---|---|---|---|---|
| V4-01 | WF01–03, WF15 | 1440: Pony1/2/3 → preview/cancel/apply → copy/hull → builtin → вернуть laser; паспорт и roster из собственных exports. Отдельные full-width группы и signature проверены на 1440/820/390. | PASS | V4-01-desktop.json; V4-01-addressed-completion.json; V4-07-{width}.json |
| V4-02 | WF04–06, WF12 | На трёх ширинах ×1 RUNNING edit/navigation/foreign next draft → Pause/Step/Resume/Cancel; H20 MAX. Дополнительно genuine first-message/late-message delivery slice и реальное held-pointer desktop. | FAIL · V4-B1 | V4-02-boundary.json; pointer-boundary-1440-input.json; pointer-boundary-1440.png; V4-07-{width}.json |
| V4-03 | WF07–09 | Собственный результат → шесть overview вопросов → channel hide/show → выбранный bucket K и mean=sum/count, min/max/count → event navigation. Цвет и стиль сопоставлены по channel ID. | PASS | V4-07-{width}.json; {width}-overview.png; {width}-color-hidden.png; {width}-selected-time.png |
| V4-04 | WF10–12 | Paused Freeze активного A при выбранном B → Step/Resume/Cancel A → собственный B MAX → cross-hull Compare → stale edit B → три сортировки с неизменной явной базой. Completed Freeze измерен отдельно. | PASS | V4-07-{width}.json; V4-05-hypothesis.json; {width}-compare-stale.png |
| V4-05 | WF01, WF03, WF06, WF13 | 1440: T315 K, charge .5/fuel .75, фазы 2/4/2/1/1 и repeat true/false; efficiency .6 с provenance, powerW не меняется; реальные snapshots. Invalid efficiency0/negative phase сохраняют valid fit и active spec. | PASS | V4-05-hypothesis.json; hypothesis-fit.json; hypothesis-before-run.json; hypothesis-result.json |
| V4-06 | WF01, WF06, WF13 | Собственные fit/run/result → новые QA pages → native open → честный type/hull/conditions → export/replay. Result на трёх ширинах восстанавливает state/metrics/trace без численного Start; run запускается только явно. | PASS | V4-06-fit.json; V4-06-run.json; V4-06-result-{width}.json; {width}-opened-result.png |
| V4-07 | WF13–15 и linked WF01–12 | Три representative whole workflows на 1440/820/ordinary LAN390: open/edit/run/analyse/freeze/compare/export/reopen. Десять bad-result классов атомарны; Unicode filename/header+F3/cancel/active progress; footer; touch scroll. Desktop held-pointer counterexample учтён V4-02. | PASS · representative chains | V4-07-{width}.json; chains-summary.json; {width}-import-error.png; {width}-footer.png |
