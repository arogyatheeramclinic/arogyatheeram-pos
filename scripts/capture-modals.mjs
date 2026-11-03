import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = 'C:\\Users\\rishi\\.gemini\\antigravity\\brain\\827ddff6-d17e-4242-929f-5b64eb4d504b\\screenshots';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,960'],
    defaultViewport: { width: 1440, height: 960, deviceScaleFactor: 2 },
  });

  const page = await browser.newPage();
  console.log('Navigating to http://localhost:3000 ...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await sleep(1500);

  // 0. Capture AuthModal
  console.log('Capturing: 00-auth-modal.png');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '00-auth-modal.png') });

  // Log in as Doctor (PIN 1234)
  console.log('Logging in as Doctor (PIN 1234)...');
  const pinInput = await page.$('input[type="password"]');
  if (pinInput) {
    await pinInput.type('1234');
    await page.keyboard.press('Enter');
    await sleep(1500);
  }

  // Helper to click visible button from top of z-index/end of DOM
  async function clickButtonWithText(text) {
    const clicked = await page.evaluate((btnText) => {
      const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
      for (let i = buttons.length - 1; i >= 0; i--) {
        const b = buttons[i];
        const label = (b.innerText || '') + ' ' + (b.getAttribute('aria-label') || '');
        if (b.offsetParent !== null && label.toLowerCase().includes(btnText.toLowerCase())) {
          b.click();
          return true;
        }
      }
      return false;
    }, text);
    await sleep(600);
    return clicked;
  }

  // Helper to click sidebar tab
  async function switchTab(tabLabel) {
    await page.evaluate((label) => {
      const items = Array.from(document.querySelectorAll('aside button, nav button'));
      for (const item of items) {
        if (item.innerText && item.innerText.trim().toLowerCase().includes(label.toLowerCase())) {
          item.click();
          return true;
        }
      }
      return false;
    }, tabLabel);
    await sleep(800);
  }

  // 1. Reception -> Register New Patient Modal
  console.log('Capturing: 01-register-patient-modal.png');
  await switchTab('Reception');
  await clickButtonWithText('Register New Patient');
  await sleep(600);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-register-patient-modal.png') });
  await clickButtonWithText('Cancel');
  await sleep(600);

  // 2. Reception -> Walk-in Direct Sale / Billing Modal
  console.log('Capturing: 02-billing-modal.png');
  await clickButtonWithText('Walk-in Direct Sale');
  await sleep(800);
  // Add item into bill
  const billSearch = await page.$('input[placeholder*="Search catalogue"]');
  if (billSearch) {
    await billSearch.type('Ashwagandha');
    await sleep(600);
    await page.keyboard.press('Enter');
    await sleep(400);
    await billSearch.type('Triphala');
    await sleep(600);
    await page.keyboard.press('Enter');
    await sleep(400);
    await page.click('h3');
    await sleep(300);
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-billing-modal.png') });
  await clickButtonWithText('Cancel');
  await sleep(600);

  // 3. Reception -> Appointments -> Book New Modal
  console.log('Capturing: 03-appointment-modal.png');
  await clickButtonWithText('+ Book New');
  await sleep(600);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-appointment-modal.png') });
  await clickButtonWithText('Cancel');
  await sleep(600);

  // 4. Reception -> Settle Balance Modal
  console.log('Capturing: 04-settle-balance-modal.png');
  await clickButtonWithText('Unpaid Balances');
  await sleep(600);
  const foundSettle = await clickButtonWithText('Settle');
  if (foundSettle) {
    await sleep(600);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-settle-balance-modal.png') });
    await clickButtonWithText('Cancel');
    await sleep(600);
  }

  // 5. Consultations -> Consultation Modal
  console.log('Capturing: 05-consultation-modal.png');
  await switchTab('Consultations');
  await sleep(800);
  const foundStart = await clickButtonWithText('Start Consultation');
  if (foundStart) {
    await sleep(800);
    // Add 3 items to demonstrate clean dosage strip & steppers
    const rxSearch = await page.$('input[placeholder*="Search catalogue to prescribe"]');
    if (rxSearch) {
      await rxSearch.type('Shirodhara');
      await sleep(500);
      await page.keyboard.press('Enter');
      await sleep(400);
      await rxSearch.type('Brahmi');
      await sleep(500);
      await page.keyboard.press('Enter');
      await sleep(400);
      await rxSearch.type('Ashwagandha');
      await sleep(500);
      await page.keyboard.press('Enter');
      await sleep(400);
      await page.click('h2, [role="dialog"]');
      await sleep(300);
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-consultation-modal.png') });

    // 5b. Save Protocol Template Modal (PromptModal)
    console.log('Capturing: 06-template-prompt-modal.png');
    const foundProto = await clickButtonWithText('Save Protocol');
    if (foundProto) {
      await sleep(600);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06-template-prompt-modal.png') });
      await clickButtonWithText('Cancel');
      await sleep(500);
    }

    // Close Consultation Modal
    await clickButtonWithText('Close (Esc)');
    await sleep(600);
  }

  // 6. Inventory -> Receive Stock Modal
  console.log('Capturing Inventory modals...');
  await switchTab('Medicines & Stock');
  await sleep(800);

  console.log('Capturing: 07-receive-stock-modal.png');
  await clickButtonWithText('Receive Stock');
  await sleep(600);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07-receive-stock-modal.png') });
  await clickButtonWithText('Cancel');
  await sleep(600);

  // 7. Inventory -> Add New Item Modal
  console.log('Capturing: 08-item-modal.png');
  await clickButtonWithText('Add Item');
  await sleep(600);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08-item-modal.png') });
  await clickButtonWithText('Cancel');
  await sleep(600);

  // 8. Inventory -> Adjust Stock Modal
  console.log('Capturing: 09-stock-adjust-modal.png');
  const foundAdjust = await clickButtonWithText('Adjust');
  if (foundAdjust) {
    await sleep(600);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09-stock-adjust-modal.png') });
    await clickButtonWithText('Cancel');
    await sleep(600);
  }

  // 9. Inventory -> Edit Item Modal
  console.log('Capturing: 10-item-edit-modal.png');
  const foundEdit = await clickButtonWithText('Edit');
  if (foundEdit) {
    await sleep(600);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10-item-edit-modal.png') });
    await clickButtonWithText('Cancel');
    await sleep(600);
  }

  console.log('All modals captured successfully!');
  await browser.close();
}

run().catch((err) => {
  console.error('Error running modal capture:', err);
  process.exit(1);
});
