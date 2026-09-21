import {chromium} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {writeFile,mkdir} from 'node:fs/promises';
await mkdir('.impeccable/review',{recursive:true});const browser=await chromium.launch();const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>localStorage.setItem('echofoil-consent',JSON.stringify({analytics:false,marketing:false})));
const findings=[];
for(const width of [360,768,1024,1440]){await page.setViewportSize({width,height:1000});await page.goto('http://127.0.0.1:3000/en');await page.waitForLoadState('networkidle');await page.screenshot({path:`.impeccable/review/${width===1440?'desktop':width===360?'mobile':`width-${width}`}.png`,fullPage:true});findings.push({width,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)});}
for(const path of ['/en','/sq','/en/shop','/en/product/everyday-foil-10m','/en/contact','/en/login']){await page.setViewportSize({width:1440,height:1000});await page.goto(`http://127.0.0.1:3000${path}`);const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();findings.push({path,violations:axe.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))});}
await writeFile('.impeccable/review/browser-checks.json',JSON.stringify({findings,errors},null,2));console.log(JSON.stringify({findings,errors},null,2));await browser.close();
