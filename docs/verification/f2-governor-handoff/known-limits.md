# F2-G2 — известные границы early handoff

Этот пакет фиксирует только чистое synthetic-ядро governor 0.3 и воспроизводимое evidence. Он не разрешает runtime-включение: `runtimeAuthorization=false`.

- `/4`, Worker, UI, persistence adapter и default activation — не реализованы и NOT RUN; это F2-G3.
- U2 runtime, Unity, server, network parity, device и deploy — не реализованы и NOT RUN.
- Реальные корабельные ТТХ, игровые цены и balance acceptance — PRODUCT GAP; synthetic значения не являются каноном U2.
- Station/service UX, payment, session и cloud save — вне F2-G2 и NOT RUN.
- T31 service/rebind принадлежит F2-G4 и в этом пакете NOT RUN.
- T35/T36 water propulsion и local steam имеют scope OUT и NOT RUN.
- Detection, sensor/radar acceptance, flight, towing, cargo и mining не входят в текущую приёмку.
- Node 24 mandatory CI, независимые QA/Code Review, Ready/merge и публикация остаются PM/operator-owned NOT RUN.

Пакет нельзя использовать как утверждение о готовности U2 runtime или релиза.
