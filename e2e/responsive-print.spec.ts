import { test, expect, type Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

const evidence = 'generated-artifacts/responsive-print';
const screenshots = 'qa-screens/responsive';
async function seed(page: Page, lang: 'en' | 'ur') {
  await page.goto('/app');
  await page.evaluate(lang => {
    const now = new Date().toISOString();
    const measurements = { kameezLambai:40,teera:18,bazu:24,gala:16,chhaati:42,kamar:40,ghera:24,shalwarLambai:40,paincha:8,asan:14,shalwarGhera:28 };
    localStorage.setItem('darzi-khata-accounts', JSON.stringify([{
      id:'responsive',name:'QA Owner',email:'qa@example.test',passwordHash:'',shopName:'QA Tailors',role:'owner',createdAt:now,
    }]));
    sessionStorage.setItem('darzi-khata-session','responsive');
    localStorage.setItem('darzi-khata-intro-seen-responsive','true');
    localStorage.setItem('darzi-khata-demo-mode-responsive','false');
    localStorage.setItem('darzi-khata-settings-responsive',JSON.stringify({
      shopName:'QA Tailors',phone:'03001234567',address:'Shop 1',language:lang,darkMode:false,zindigiWallet:'03001234567',accountTitle:'QA Tailors',
    }));
    localStorage.setItem('darzi-khata-customers-responsive',JSON.stringify(['A','B'].map(id=>({
      id,name:`Customer ${id}`,phone:'03001234567',notes:'',profiles:[],createdAt:now,updatedAt:now,
    }))));
    localStorage.setItem('darzi-khata-orders-responsive',JSON.stringify(['A','B'].map((id,i)=>({
      id,customerId:id,customerName:`Customer ${id}`,phone:'03001234567',orderDate:now,deliveryDate:'2026-12-10T00:00:00Z',createdAt:now,
      serialNumber:`DK-00${i+1}`,urgent:false,suitCount:1,fabric:'Cotton',measurements,
      items:[{id:`item-${id}`,garmentType:'gents',quantity:1,unitPrice:1500,measurements}],
      collarType:'Normal Collar',damanType:'Choras (Square)',pockets:'Front Pocket',cuffType:'Simple',
      specialNotes:'',totalAmount:1500,advanceAmount:0,status:'pending',
    }))));
  },lang);
  await page.goto('/app');
  await expect(page.getByTestId('card-order-A')).toBeVisible();
}

async function noOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const viewport = innerWidth;
    // Check boxes too: overflow-x:clip must not conceal a broken layout.
    const bad = [...document.querySelectorAll<HTMLElement>('main *, [data-testid="desktop-sidebar"]')]
      .filter(el => {
        const rect = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        return rect.width > 0 && rect.height > 0 && style.position !== 'fixed' &&
          style.visibility !== 'hidden' && (rect.right > viewport + 2 || rect.left < -2) &&
          !el.closest('[data-radix-popper-content-wrapper], [data-testid="print-frame"], .sr-only, .overflow-x-auto');
      }).map(el => ({tag:el.tagName,tid:el.dataset.testid,cls:el.className})).slice(0,8);
    return {width:document.documentElement.scrollWidth,viewport,bad};
  });
  expect(overflow.width).toBeLessThanOrEqual(overflow.viewport);
  expect(overflow.bad).toEqual([]);
}

for (const lang of ['en','ur'] as const) for (const width of [375,768,1366,1920]) {
  test(`responsive pages ${lang} ${width}`, async ({page})=>{
    test.setTimeout(120_000);
    await mkdir(screenshots,{recursive:true});
    await page.setViewportSize({width,height:width===375?812:900});
    await seed(page,lang);
    for (const [name,route] of [['orders',''],['customers','customers'],['more','more'],['settings','settings'],['hisaab','hisaab'],['credit','credit'],['impact','impact']] as const) {
      await page.goto(`/app${route?'/'+route:''}`);
      await expect(page.getByTestId(width>=1024?'desktop-sidebar':'nav-more')).toBeVisible();
      await page.evaluate(()=>document.fonts.ready);
      await expect(page.locator('html')).toHaveAttribute('dir',lang==='ur'?'rtl':'ltr');
      await noOverflow(page);
      if(width>=1024) {
        await expect(page.getByTestId('nav-more')).not.toBeVisible();
        const box=await page.getByTestId('desktop-sidebar').boundingBox();
        expect(lang==='ur'?box!.x>width/2:box!.x<width/2).toBe(true);
        if(name==='orders') await expect(page.getByTestId('parchi-preview')).toBeVisible();
        if(name==='customers') {
          await page.getByTestId('table-row-customer-A').click();
          await expect(page.getByTestId('customer-detail-pane')).toContainText('Customer A');
        }
      }
      if(name==='more') {
        const grid=page.getByTestId('settings-tile-grid');
        await expect(grid).toBeVisible();
        expect(await grid.locator(':scope > *').count()).toBe(12);
        expect(await grid.evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length)).toBe(width>=1024?3:width>=768?2:1);
      }
      await page.screenshot({path:`${screenshots}/${lang}-${width}-${name}.png`,fullPage:true});
      for (const boundary of [320,360,767,1023,1024]) {
        await page.setViewportSize({width:boundary,height:812});
        await noOverflow(page);
      }
      await page.setViewportSize({width,height:width===375?812:900});
      if(name==='more' && width>=1024){
        await page.getByTestId('tile-payment').click();
        await expect(page.getByTestId('settings-side-panel')).toBeVisible();
        await noOverflow(page);
        await page.screenshot({path:`${screenshots}/${lang}-${width}-settings-panel.png`});
      }
    }
    await page.goto('/app');
    await page.getByTestId(width>=1024?'sidebar-new':'nav-new').click();
    await page.getByTestId('btn-new-full').click();
    await page.getByTestId('input-name').fill('Responsive customer');
    await page.getByTestId('input-phone').fill('03001234567');
    await page.getByTestId('input-fabric').fill('Cotton');
    await noOverflow(page);
    await page.screenshot({path:`${screenshots}/${lang}-${width}-new-order.png`,fullPage:true});
    await page.getByTestId('btn-step-next').click();
    await expect(page.getByTestId('measurement-grid').first()).toBeVisible();
    await page.getByTestId('measurement-grid').first().scrollIntoViewIfNeeded();
    await noOverflow(page);
    await page.screenshot({path:`${screenshots}/${lang}-${width}-measurements.png`,fullPage:true});
    for (const size of [320,360,767,1023,1024]) {
      await page.setViewportSize({width:size,height:812});
      await noOverflow(page);
    }
  });
}

for(const lang of ['en','ur'] as const) for(const width of [375,1366]) {
  test(`isolated receipt print and PDF ${lang} ${width}`,async({page,context})=>{
    test.setTimeout(90_000);
    await mkdir(evidence,{recursive:true});
    await page.setViewportSize({width,height:width===375?812:768});
    await seed(page,lang);
    await page.getByTestId('btn-receipt-A').click();
    await expect(page.locator('#receipt-print-area img')).toBeVisible();
    await page.evaluate(()=>{
      window.print=()=>{throw Error('The live page must never be printed');};
      const getter=Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype,'contentWindow')!.get!;
      Object.defineProperty(HTMLIFrameElement.prototype,'contentWindow',{configurable:true,get(){
        const win=getter.call(this) as Window;
        if(win) win.print=()=>{win.document.documentElement.dataset.printInvoked='true';};
        return win;
      }});
    });
    await page.getByTestId('btn-print-receipt').click();
    const frame=page.frameLocator('[data-testid="print-frame"]');
    await expect(page.getByTestId('print-frame')).toHaveAttribute('data-ready','true');
    await expect(frame.locator('html')).toHaveAttribute('data-print-invoked','true');
    await expect(frame.locator('body')).toContainText('DK-001');
    await expect(frame.locator('body')).toContainText('Customer A');
    await expect(frame.locator('body')).toContainText('1,500');
    await expect(frame.locator('img[src^="data:image/png"]')).toBeVisible();
    await expect(frame.locator('[role=dialog], nav, aside, button, [data-app-header]')).toHaveCount(0);
    await expect(frame.locator('body')).not.toContainText(/Settings|Log out|New order|ترتیبات/);
    const html=await frame.locator('html').evaluate(el=>el.outerHTML);
    const capture=await context.newPage();
    await capture.setViewportSize({width:794,height:1123});
    await capture.setContent('<!doctype html>'+html);
    await capture.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(img=>img.decode()));});
    const prefix=`${evidence}/parchi-${lang}-${width}`;
    await writeFile(`${prefix}.html`,html);
    const pdf=await capture.pdf({path:`${prefix}.pdf`,preferCSSPageSize:true,printBackground:true});
    expect(pdf.toString('latin1').match(/\/Type\s*\/Page\b/g)).toHaveLength(1);
    const info=execFileSync('pdfinfo',[`${prefix}.pdf`],{encoding:'utf8'});
    expect(info).toContain('(A4)');
    const text=execFileSync('pdftotext',[`${prefix}.pdf`,'-'],{encoding:'utf8'});
    expect(text).toContain('DK-001');
    expect(text).toContain('Customer A');
    expect(text).not.toMatch(/Settings|Log out|New order/);
    execFileSync('pdftoppm',['-singlefile','-scale-to','1200','-png',`${prefix}.pdf`,`${prefix}-pdf`]);
    await capture.close();
    const [download]=await Promise.all([page.waitForEvent('download'),page.getByTestId('btn-download-receipt').click()]);
    expect(download.suggestedFilename()).toBe('DK-001.pdf');
    await download.saveAs(`${prefix}-download.pdf`);
    expect(execFileSync('pdfinfo',[`${prefix}-download.pdf`],{encoding:'utf8'})).toMatch(/Pages:\s+1/);
  });
}
