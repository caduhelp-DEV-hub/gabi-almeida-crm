const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  const errors = [];
  page.on('pageerror', err => {
    errors.push('Page error: ' + err.toString());
  });
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push('Console error: ' + msg.text());
    }
  });

  try {
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle0' });
    
    // Take a screenshot of the home page
    await page.screenshot({ path: 'home.png' });
    
    // Click on Clientes tab
    const tabs = await page.$$('button, a');
    let clicked = false;
    for (const tab of tabs) {
      const text = await page.evaluate(el => el.innerText, tab);
      if (text && text.includes('Clientes')) {
        await tab.click();
        clicked = true;
        break;
      }
    }
    
    if (!clicked) {
      console.log("Could not find Clientes tab!");
    } else {
      console.log("Clicked Clientes tab.");
    }
    
    await new Promise(r => setTimeout(r, 2000));
    
    await page.screenshot({ path: 'clientes.png' });
    
    console.log("Captured errors:");
    console.log(errors.join('\n'));
    
  } catch (err) {
    console.error("Script error:", err);
  } finally {
    await browser.close();
  }
})();
