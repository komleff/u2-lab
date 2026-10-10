---
title: "Ship Fitting — недостающие модули M и электрические гибриды"
status: accepted scope / plan proposed
version: "1.0"
date: 2026-10-06
related:
  - docs/product/ship-fitting-catalog-0.2.1.md
  - docs/plans/2026-10-06-pony-signature-slot.md
---

# Задача и граница

Оператор: «Нужны модули М для полноценного тестирования средних кораблей».
Ранее разрешены недостающие лабораторные ТТХ с явным обозначением допущений.
В текущем каталоге M engine/generator/tank/battery/cargo/mining уже есть.
Нужно дополнить существующие семейства, без изменения моделей и прежних изделий.
Class/Generation наследуются от соответствующего S reference; Industrial/Civilian
корпуса не меняют свойства установленного SKU. National/weapon/sensor families
не добавляются этим поручением.

Следующий шаг после Пони0.2.2: new catalog0.2.3 добавляет5SKU.
Прежние0.2.0/0.2.1/0.2.2 сохраняют свои inventory/hull/preset snapshots.
Новый0.2.3 наследует однослотового Пони0.2.2. Штатные mounts питания/сигнатур
остаются прежними; новые M-модули доступны для осознанного fitting в совместимых
слотах. Штатные лазеры сохраняют принятую размерную/классовую принадлежность.

## Принятое расширение E-архитектуры

Оператор отдельно разрешил Power diesel/H₂ tanks и generators на электрических
кораблях для гибридного питания и H₂-охлаждения. После рекомендации сохранить
дополнительный H₂-контур на дизельных кораблях ответил «ок».

В new0.2.3 E profiles Power slots принимают battery/solar/generator/tank с обычными
ограничениями размера. Propulsion остаётся только Electric, единым для всех четырёх
ролей. Баки/генераторы не меняют тип двигателей; один Diesel ledger и один H₂ ledger
учитывают свои actual consumers отдельно. H₂ generator и cooler могут пользоваться
одним установленным криобаком и конкурируют за конечный запас. Дополнительных слотов,
скрытых запасов или cargo→fuel автоперелива нет. Корпуса A этим решением не меняются.
Old0.2.0/.1/.2 E profiles сохраняют прежнюю совместимость и численные снимки.

Это разрешение закрывает для Лабы explicit E architecture follow-up из current U2
slot delta0.1 §8. Diesel + auxiliary H₂ остаётся уже принятым правилом delta§2,
multi-fuel GDD0.1 §§2–5: однородный propulsion, отдельные utility circuits.

# MF-01: лабораторные численные опоры

Все числа ниже — **derived/experimental lab candidates**, не утверждённые
производственные SKU U2. Опора: actual S items каталога0.2.1 и default Size-step
TTX Master1.4 §4. Масса/площадь/ёмкость/поток ×4; удельные величины, температуры,
КПД, gate, chemistry и material cp не умножаются. Специальных generation/class
множителей поверх S reference нет.

| Новый ID / размер | Сухая масса | Численные параметры SI | Class/G |
|---|---:|---|---|
| radiator-active-M | 5400kg | effective area3528m²; auxiliary1200000W | Civilian/G2 |
| buffer-M | 20000kg | capacity8000000000J; max transfer80000000W; absorb290K/release280K | Civilian/G1 |
| h2-cooler-M | 3400kg | cooling cap80000000W; auxiliary200000W; specific heat export10000000J/kg | Civilian/G2 |
| thermoinverter-M | 3800kg | core cap80000000W; hot side800K; effective area1764m²; COP efficiency0.5 | Civilian/G4 |
| solar-M | 4000kg | collecting area400m²; efficiency0.25 | Civilian/G1 |

Для нового, отдельно версионированного эксперимента оператор 8 октября 2026 года принял [температурное правило H₂-охладителя](h2-cooler-temperature-law-v0.1.md): q зависит от T_ship−20 K, а мощность ограничена расходом H₂. Строка MF-01 выше остаётся исторической опорой каталогов и сохранённых опытов; новые результаты обязаны указывать версию правила.

Радиационные поля текущей Лабы уже содержат emissivity в effective area;
повторно умножать их на0.9 нельзя. Physical active M area3920m² соответствует
effective3528m² при ε0.9. Солнечная collecting area — отдельная геометрическая
величина, не радиатор и не сила солнечного ветра.

Это последовательно масштабированные варианты **текущей модели Лабы**, позволяющие
сравнивать размер при сохранении удельных свойств. M buffer6GJ/8t в module TTX
contract§8.2 — другой balance-first-cut; он не подменяет выбранный MF-01 variant.
Рецепты/материалы/thermal gates остаются explicit lab hypotheses, не BOM closure.
У термоинвертора сохраняется текущий lumped hot-side area model Лабы; соответствие
новому каноническому pooled-radiator controller этим добавлением не заявляется.

Current U2 source read main0fe06927ab496918b3547f43412134c100a6e0b4:
INDEX→TTX Master1.4 §4; thermal palette0.3 §§3–6; hot-environment/TI0.2 §§2–5;
module TTX contract0.3 §8.2. Source refs каждого нового поля указывают MF-01,
base S ID и формулу/унаследованное значение. UI раскрывает этот provenance.
Architecture source: slot delta0.1 §§1–4/8 и multi-fuel GDD0.1 §§2–5 по тому же INDEX.

# HOW, проверки и поставка

As-built: Pony source3265a6870578d409586b416eb0adfabff3b9a574; те же
product blobs перенесены в основную копию0de894d67085dabe641488fd2a69ed964d8ccd9e.
Known editions .0/.1/.2 выбираются через editions.ts/fitHull. Catalog .2 содержит
45 SKU; civilian-M — единственный текущий E hull, Power4×M допускает только
battery/solar. validate.ts дополнительно запрещает E/A operating-fuel modules.
Поэтому нужны и additive inventory, и versioned E capability: одного списка
модулей недостаточно. Найден CR-PONY-B1: known snapshot может иметь extra resolved
module при legal nested fit. Исправление и его affected QA/scoped closure принадлежат
ulab-yj7; M runtime ждёт его завершения (Beads ulab-w6w зависит от ulab-yj7).
Source baseline перед кодом — финальный Pony .2 checkpoint;
main остаётся9469d3e8998dada5ec3a6f99712fae8345fb3f7f, merge не требуется.

PRODUCT — module parameters и принятое расширение совместимости E. Один существующий
Developer после завершения Pony delta, один independent Plan Review, QA и scoped
Code Review. Без новых kernel/controller algorithms, schema, migrations, зависимостей
или скрытого переоснащения. План/VC не готов к коду до independent PLAN_READY.

1. Additive data5SKU и registration/default0.2.3. Сохранить all prior catalogs,
   наследование Pony1slot и unchanged presets кроме edition stamp. До кода сохранить
   baseline0.2.2 digests. Existing kernel/controller/Worker unchanged.
   Новый data/modules-0.2.3.json; inventory явно .0=40, .1/.2=45, .3=50.
   catalogHasItem не должен открывать новые SKU всем версиям через условие !=.0.
   hullsForEdition наследует Pony1slot в .3, сохраняя прежние .0/.1/.2 profiles.
2. Versioned E capability/Power allowlists и focused validation: E engines only
   Electric; compatible utility generators/tanks разрешены только new profiles.
   Declared-edition hull resolver сохраняет old E ограничения, включая import.
   Расширение задаётся в профиле корпуса new .3; A и старые E profiles не получают
   его автоматически. Known-import проверяет объявленный каталог, а не доверяет
   разрешению из вложенного снимка. Existing C05 local variants остаются явными
   пользовательскими изделиями, не способом незаметно пополнить old global inventory.
3. Targeted TDD для MF01–MF04/HY01–HY02: числа MF-01, compatibility, actual compile
   bill/C, species/power/heat ledgers и исторические объекты. Unknown fixture использует
   действительно unregistered edition, не только номер следующего релиза.
   Normal guard, immutable build; changed owners fitting data/types/editions/catalog/
   validate и relevant tests, UI только для отображения existing family/provenance.
4. QA MF01–MF04/HY01–HY02 на exact candidate и genuine LAN, затем scoped Review;
   короткие reports/evidence. PM обновляет owned4188 и публикует результат.
   Старые артефакты и стенды сохраняются.

| Адрес | Ожидаемая проверка |
|---|---|
| MF01 | Ровно5 новых M SKU с указанными числами/units/Class/G/origins; все прежние45items неизменны. M slots принимают их по existing family/architecture rules; S slot Пони не принимает M. |
| MF02 | Actual compile dry mass/C/bill включает installed modules однократно; buffer лишь хранит конечное тепло, active pump потребляет энергию, H₂ расходует конечный Power tank без скрытого запаса, TI имеет electrical/hot-side balance, solar output зависит от света. Cold/off/exhausted случаи не создают ресурсов. |
| MF03 | Known0.2.0/.1/.2 fit/run/result сохраняют stamp/inventory/численные snapshots; новые global IDs под старым stamp без явного допустимого localVariant отклоняются, imports атомарны. C05 explicit local variants сохраняются. Current Pony сохраняет1slot, Industrial S3; matching laser presets и defaults0.2.1/.2 не откатываются. |
| MF04 | LAN: medium hull→выбор M cooling/power→short run→analysis→export→fresh reopen; видны actual M IDs и lab provenance. Графики/сравнение/active-next/reference/conditions сохраняют ownership. Mobile viewport не выдаётся за physical tablet QA. |
| HY01 | New Civilian M E принимает Diesel/H₂ generators и Power tanks, H₂ cooler имеет реальный источник. Все4 E roles остаются electric; chemical/mixed propulsion отклонён. Old E и A ограничения сохраняются; false old stamp/unknown/malformed import атомарно отклонён. |
| HY02 | Actual E+diesel generator/tank+H₂ cooler/cryotank fixture, E+H₂ generator/cooler shared tank и D+auxiliaryH₂: расход каждого species по purpose ledger, auxiliary draw/heat, fuel mass входят в баланс. Без нужного бака Start incomplete; с пустым баком consumer не производит/не охлаждает бесплатно. Нет трат H₂ электрическими двигателями или Diesel водородным cooler. |

Self-check: нет скрытого масштабирования КПД, удельной энтальпии, температур и
generation; конечные capacity/resource/available-power gates сохранены. Проверяется
полная цепочка нового fitting, без повторных12h/H3600/matrix passes.
Rollback — сохранённый immutable0.2.2 dist; пользовательские файлы не переписываются.
