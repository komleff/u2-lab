import type {Page} from '@playwright/test';

export async function showArchiveCompilation(page:Page){
  if(!await page.locator('#sm-compilation').evaluate(node=>(node as HTMLDetailsElement).open))await page.locator('#sm-compilation > summary').click();
}
