# Catalog intake v0.1 — S/M энергетика и тепло

Frozen source: `komleff/u2@cdc490e3517c8455f662f82579c45813cdbb9a76`.
Маршрут: U2 `docs/INDEX.md` v2.244 → `ADR-INDEX.md` v0.89 → current thematic owner → только именованные dependencies. Полные исходники не копировались в public Lab; JSON содержит 44 source records с точными path/blob/status и адресными section/row refs. Исходный PL intake создавался как ignored рабочий артефакт без code/Beads mutations. Эта адресная копия фактов и provenance опубликована для реализации стенда; полного GDD здесь нет.

## Главный результат

Готовы **два полностью численно заданных экспериментальных lab parameter sets**: S/Civilian/G1 Diesel и M/Civilian/G1 Diesel. Это вход для DEV, **не утверждённые корабельные SKU, не runtime projection и не доказанная полная material/thermal closure**. Канонические рабочие якоря, производные и предложения разделены в `parameters`, `experimental_proposals`, `configurations`.

| Поле | S Civilian G1 | M Civilian G1 | Происхождение |
|---|---:|---:|---|
| Сухой корпус | 42 500 kg | 170 000 kg | force-grid §8.8 |
| Полный движительный пакет | 5 000 kg | 20 000 kg | force-grid §8.8 |
| Маршевая сила | 2 950 000 N | 8 820 000 N | force-grid §8.8; это не универсальный ×4 |
| Diesel Generator: rated electrical | 2 000 000 W | 8 000 000 W | current S power Class §2; M — explicit family law §3 |
| Diesel Generator: dry mass | 1 600 kg | 6 400 kg | explicit Civilian recipe и family ×4 |
| Аккумулятор | XS, 1 500 kg | S, 6 000 kg | Civilian caliber/recipe; lab выбор размера |
| Аккумулятор: stored / usable | 3.6825 / 3.31425 GJ | 14.73 / 13.257 GJ | e_acc(G1)=2.455 MJ/kg; usable×0.90 |
| Diesel бак: dry / fuel | 300 / 6 000 kg | 1 200 / 24 000 kg | current storage construction row |
| Защищённый hull background | 2 500 W | 10 000 W | power_load §5–§6 |
| Mining Laser: actual rated bus | 3 000 000 W | 12 000 000 W | S current laser owner; M **experiment** |
| Mining beam fraction G1 | 0.5001 | 0.5001 | current η_laser law |
| Passive Radiator: area / ε | 490 m² / 0.90 | 1 960 m² / 0.90 | S exact first slice; M **experiment** |
| Total dry / full-fuel mass | 55 050 / 61 050 kg | 220 200 / 244 200 kg | explicit selected mass sum |
| K_rad,total | 897.45 m² | 3 589.8 m² | **experiment**: hull proxy+fitted area |
| C_ship | 35 659 900 J/K | 142 639 600 J/K | **experiment**: reference C + added material bills |
| Source AUTO ON / OFF | 0.90 / 1.00 SoC | 0.90 / 1.00 SoC | Civilian Balanced governor |
| Background floors | SoC 0.80; fuel0.20; margin10 K | те же | automatic scheduler |

**Главный новый numerical owner:** `docs/gdd/gdd_s_power_class_specialization_balance_v0.1_draft.md`, active v1.0, blob `fa3a033cd7e7e4db305c3d1ec883f85137e2b16d`, §§2–4. Он явно фиксирует S Civilian1.60t/2.00MW, ×4 dry mass/rated output per Size step и текущий e_acc(G).

`p(G)=1−0.93^G`; G1 означает `GenerationState={majorGeneration:1,minorStage:0}`, p(1)=0.07. `e_acc=2+(8.5−2)p(G)` MJ/kg. MinorStage без authored stage contract запрещён. Обязательный аккумулятор остаётся одним общим электрическим резервом.

## Численные recipes

В JSON — восемь адресных recipes. Exact authored S slice `first_loop_production_closure_v0.1.csv`, blob `63f4c04c2868b71ac17f2bf70aa77aed527e4504`:

| Family | Protected mass / discrete recipe | Материалы, kg |
|---|---:|---|
| march | 2631.579 / 2650 | Steel2040, Plastic310, Cu180, Glass120 |
| retro | 1052.632 / 1050 | Steel910, Plastic65, Cu60, Glass15 |
| strafe pair | 657.895 / 650 | Steel555, Plastic70, Cu17.5, Glass7.5 |
| turn pair | 657.895 / 650 | те же |
| mining laser | 2200 / 2200 | Steel1140, Plastic200, Cu280, Glass580 |
| passive radiator G0 | 750 / 750 | Iron710, Cu40 |

Это SKU-level PRODUCTION_COMPLETE Neutral reference, не family-wide completion всех национальных/размерных вариантов. Дискретное округление не переписывает protected engine mass.

Civilian Generator G1: C03@S+C04@S+C06@S+C09@S+C02@S=1.60t. Civilian Accumulator G1: C07@S×5+C08@S×2+C02@S×2=6.00t; меньший аккумулятор — caliber shift. Exact Class recipes — `class_recipe_overrides_v0.1.csv`, blob `d2cf144e261c71027f90803f36ece42b59d0b319`. C06/C07 G1 material flattening здесь не извлекался: остаток не заполнен выдуманным материалом.

Tank G0 S: Iron297.5kg+Cu2.5kg, C_i=134837.5J/K, upper T_work500K/T_crit570K — закрытый current storage owner. Cargo universal G0 S: Iron1200kg, C_i540000J/K,12SCU; explicit cellular capacity Size law×4. Fuel/cargo не входят бесплатно в C_ship.

Reference c_p Steel470, Plastic2200, Glass830, Cu385, Iron450, Ni443 J/(kg·K) получены из **reference**, а не current material calibration: `gdd_ship_material_physics_s_g1_civilian_balance_v0.1_draft.md`, blob `0c0583b86e244ff5fb6564a81450fffdacc96c44`, §2. Hull first-fit Steel36125+Plastic4250+Glass1700+Cu425kg; C_hull27.90MJ/K. Использование этого reference в полном preset — **X3 experiment**. Current material owner требует C=Σm·c_p и не разрешает generic class heat-capacity bonus.

## Термограницы и proposal closure

`thermal_profiles.csv`, blob `902f34612d2a3997b6e890e73d2092a5a903a41d`, имеет **candidate**, не approved SKU, статус:

| Civilian G1 profile | Upper working | Upper critical |
|---|---:|---:|
| precision | 470 K | 510 K |
| general | 510 K | 570 K |
| propulsion/rugged | 570 K | 700 K |

В двух конфигурациях general510/570K и rugged570/700K — открыто маркированный X4. Предложения lower working200K, lower critical150K, lower restart180K; upper restart550K general/tank и680K rugged. Tank G0 upper500/570K sourced; его lower/restart всё ещё proposal. Current ADR-0043 и thermal doctrine требуют двусторонний коридор и per-module hysteresis, но этих чисел не задают. `tau_restart`, wear/R rates **не закрыты**; ни канонический моторесурс, ни полная durability simulation не заявлены.

Other proposal fields: G1 η_gen0.35 и useful path0.90 из low-tech/Pony anchors; G1 direct-diesel α5.65e−7kg/(N·s), useful fraction0.32, host share0.05 от non-useful input; точная G1/national refinement отсутствует. Химическая входная плотность **43MJ/kg**,13.76MJ/kg — полезная propulsion density и не подходит как generator fuel divisor. Diesel45% собственных waste наружу,55% в host; этот exhaust не охлаждает накопленное тепло корабля.

X7 фиксирует lab bookkeeping: charge efficiency1.0, discharge0.9, Q_min0J и дополнительный H_env0W. Usable fraction0.9 реализуется **один раз** через discharge efficiency; generator path0.9 — отдельная выбранная потеря, не скрытое второе ограничение ёмкости. Каждая потеря входит в host heat.

Start300K/100K environment/SoC100%, dt0.1s, duration1800s и flight→mining→retro→idle scenario — reproducible lab experiment settings. Нулевой Background demand выбран потому, что реальные current process families L+; для проверки scheduler нужен отдельно обозначенный synthetic demand. Linear SoC headroom80→100% — X6 proposal, owner требует только постепенный рост.

## Важные границы

- Legacy S0.68/M2.7MW из power_load §5 — **рабочее среднее**, а current rated S2/M8MW — generator cap.
- Legacy6.84MJ/kg не используется universal early-game battery value; current S power owner явно отменяет такое чтение.
- Laser current S/G1 3MW и η0.5001 сильнее generic aggregate0.6MW shortcut/old f_emit0.35.
- Radiator6/12MW — лишь700K cold-reference ratings; signed T⁴ radiation, никакого constant-MW sink.
- Thermal palette active0.3 задаёт S Buffer5t/2GJ/20MW, H2 Cooler0.85t/aux0.05MW, efficient10MJ/kg &20MW host cap, cold3MJ/kg &10MW только Stealth mode; ни hidden H2 tank, ни cargo auto-feed.
- Hot-environment owner задаёт TI0.95t/core20MW/η_HP0.50/T_hot,max800K и real radiator/COP constraint; compact TI/Buffer candidates не подменяют stronger owner.
- Current H2 G5 curve S dry6650.887832kg/fuel633.457580kg, M dry24125.654735kg/fuel3647.570429kg. Это explicit independent square-cube curve, не универсальный ×4; material/thermal closure PHYSICAL_BLOCKER.
- **Diesel Pony S/G0/Class UNKNOWN/National UNKNOWN** отделён: accepted K_rad225m², C≈21.2MJ/K first-fit, XS source0.50MW→0.45MW useful, normal0.20MW/mining1.20MW scenario, buffer9GJ usable; Thin460/500K. Совпадение силового якоря не присваивает ему Civilian/G1.

## Для DEV

JSON содержит полные SI numerics, источники, conservative energy/heat equations и семь named gaps. Background guards проверять **within-step** после Active/local-cap recovery и battery recovery; не разрешать hidden accumulator discharge или overspend shared fuel. C_ship/fuel/cargo и fitted radiating area считать ровно один раз; absorbed buffer power ограничивать и ёмкостью, и throughput.

Два presets запускать с видимой меткой **«Экспериментальная конфигурация»** и editable proposal fields. Они готовы как численные fixtures для implementation, но требуют slot validation, runtime config projection, actual simulation tests и named thermal/material closure до любого заявления «approved baseline».

## Correction: positive consumable and radiation coefficients

Устранён дефект сериализации: blanket near-integer rounding ошибочно превращал малые положительные коэффициенты в0. Числа сохраняются без такого округления.

- **α=5.65e−7 kg/(N·s)**: source `spec_power_components_v0.1.md`, frozen blob `bc9a55064e389566f6e8009cb02b71fe712d4b26`, §§3.2/4.1; source0.565kg/(MN·s), conversion÷1e6. В обеих G1 configurations это **X2 experimental proposal**, потому что exact G1 efficiency-specific alpha не закрыт.
- Полный марш S2.95MN расходует1.66675kg/s, за10s16.6675kg; M8.82MN —4.9833kg/s, за10s49.833kg.
- Также восстановлен **σ_SB=5.670374419e−8 W/(m²·K⁴)**, ошибочно обнулённый тем же преобразованием. Signed T⁴ radiation остаётся физической формулой.

Numeric invariants PASS: finite positive α/σ; exact SI conversion; равенство parameter/X2/S/M fields; ненулевой расход при positive actual force; ненулевое radiative rejection300K→100K. Проверена JSON round-trip serialization обеих копий. Runtime tests NOT RUN.
