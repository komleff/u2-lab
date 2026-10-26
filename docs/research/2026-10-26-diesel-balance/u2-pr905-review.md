---
title: "U2 PR #905: принятая физическая ревизия и границы Лабы"
status: "accepted физические данные / runtime qualification pending"
version: "1.1"
date: 2026-10-26
related:
  - docs/research/2026-10-26-diesel-balance/README.md
  - docs/research/2026-10-26-diesel-balance/balance-parameters.json
  - docs/architecture/source-authority.md
---

# Единый физический пакет q1-accepted.5

Оператор принял весь `proposed-adjustments.md` U2 #905 на
`ff58b7125d3325e85f72d449d7719c55c5c2cc8b`.
[Дословное решение](accepted-operator-decision.json) и
[точные исходные bytes](proposed-adjustments-source-ff58b712.md), SHA-256
`8b913836815e7200cbbbfb34acc95e69b9ad728837af28f96279a3007bfb9958`, сохранены
в U2 и Lab. Запись принятия отдельно фиксирует финальную узкую область Лабы.

## Применено к данным

- Физическая сухая масса = shell + фактически установленный состав по одному разу;
  топливо и груз отдельно, прежний F1 scalar остаётся историческим reference.
- Pony shell 31500 kg, C_shell 14805000 J/K; своя Industrial/G0 серия,
  manufacturer/national UNKNOWN. Силы, alpha и КПД прежней .4 exact сохранены,
  заводские Industrial S числа не подставлялись.
- Новый courier борт T300 K, полные бак/полезный заряд, R1, груз пуст;
  один passive radiator в каждом из трёх составов, Мир D.
- Normal 370 K, cold 225/230 K, прежние margins и class dispatch; Quiet запрещён.
- Только генераторы: Industrial 3,125e-5 1/s, Civilian×1,33. Коэффициенты двигателей/лазера
  exact .4 сохранены; generic Lab engine1e-6 этим пакетом не ускоряется.
- Ordinary200/220/230/500/480/550 K, отдельные diesel tanks150/200/180/500/550/570 K;
  host40% собственных потерь дизельного двигателя после engine/path efficiencies.
  Генераторные топологии не заменены этим коэффициентом.
- Body/fixed/passive поверхности отдельны: fixed40×0,9 (Sputnik/Pony),400×0,9(Mir),
  passiveS 490×0,9/M1960×0,9, C334900/1339600 J/K, без повторного bill/epsilon.

| Курьерский состав | Физическая сухая масса, kg | C, J/K | Старт с полным топливом, kg |
|---|---:|---:|---:|
| Спутник D | 52837,3876192 | 24809809,6810 | 58837,3876192 |
| Мир D | 231630,641410 | 108771351,463 | 255630,641410 |
| Пони D | 46733,8676077 | 21947317,7756 | 58733,8676077 |

Три курьерских состава F2 не подменяют 14 добычных сборок Лабы: у них иные
установленные лазеры/трюмы. Их общие mass/C не обязаны совпадать. Вход паспортов
Lab frozen `c58a300536a3fe865b65f333e099f69887d5a8e9`, генератор и exact pins —
[sync-manifest.json](sync-manifest.json). Полные профили/параметры зеркалируются bytes.

## Принятие услуг и физическая область Лабы

Тарифы/карта станций/repair envelope/страховая замена приняты в U2. Их дальнейшая
реализация и экономические измерения переданы PM F2. Здесь не вводятся economic
payload, кошелёк, quotes, purchasing, service screen, fleet/insurance workflow
или новые механики ремонта. В Лабе остаётся физика тепла/энергии/ТТХ,
ресурсная готовность, actual burn, охлаждение/подогрев и обесточенная стоянка.
Benchmark replenishment — явный stationInput/resource ledger, не игровая покупка.

Монтаж сохраняет архитектуры: Pony D/E, Volna H/E, U D/H/E; source каждому
consumer нужен для save/start. Неполный fit можно редактировать. RAM и
управляемая Stealth-shell остаются встроенными; свободный сменный монтаж не принят.

## Проверка и ограничения

Генератор U2 повторно строит три профиля из frozen паспортов, проверяет
физические равенства, accepted source, startup/automation, новые generator rates
и exact старые коэффициенты двигателей/лазера/flightBinding. SHA и source commits manifest
исправляют DOC49-B1; предыдущие пять несовпавших hashes не наследуются.

`runtimeAuthorization:false`, `qualificationStatus:BLOCKED_RESTART_SCHEMA`
сохраняются. U2 GovernorSchemaV03.cs на frozen observed source требует
restartCold≤workLow и restartHot≥workHigh и отвергает230/480 K. Данные не
зажаты под дефект схемы. Production U2, configs/gamecode/protocol/server,
новый runtime Lab и его UI QA здесь **NOT RUN**.

35 прежних опытов и fitting-аудит относятся к историческому runtime. Их
payload/receipts/results и `manifest.sourceKernelFiles` сохранены без изменения;
исторический pin — Lab f0732d326f346bf557ed582b8bbe7cdba60caa29. Это не
квалификация .5, нового каталога или будущей обесточенной стоянки.
