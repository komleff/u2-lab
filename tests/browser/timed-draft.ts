import type { Page } from '@playwright/test';
import { getPresetFit, loadCandidateCatalog } from '../../src/fitting/catalog';
import { makeMiningRun } from '../../src/scenarios/fitting';
import type { ShipFit } from '../../src/fitting/types';
// Сохранённые цепочки проверяют прежнюю модель заданных фаз с её явным tag.
// Default новой страницы и физический рейс проверяются отдельной нативной цепочкой.
export async function openTimedDraft(page:Page,fit:ShipFit=getPresetFit('sputnik:1')) {
 const p=makeMiningRun(fit,loadCandidateCatalog(),{durationSeconds:600});if(!p.ok)throw Error(JSON.stringify(p));
 await page.locator('#fit-import').setInputFiles({name:'old-timed-experiment.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(p.value))});
 await page.locator('#fit-work-seconds').waitFor();
}
