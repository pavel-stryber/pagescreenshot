const puppeteer = require('puppeteer');

const viewportWidth = 1024;
const viewportHeight = 768;


function waitFor (ms) {
  return new Promise(resolve => setTimeout(() => resolve(), ms));
}

module.exports = async(
  url,
  {
    destDir,
    onPageSetup
  }
) => {
  const urlObj = new URL(url);
  const slugCrumbs = urlObj.pathname.split('/').slice(1);
  const slug = slugCrumbs[0] === '' ? 'index' : slugCrumbs.join('__');
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--headless',
      '--disable-gpu'
    ]
  });

  const page = await browser.newPage();

  try {
    await page.setDefaultNavigationTimeout(0);
    await page.setViewport({width: viewportWidth, height: viewportHeight}); //, deviceScaleFactor: 2});
    await page.goto(url, { waitUntil: 'networkidle0' });

    if (onPageSetup) {
      await onPageSetup({ page });
    }

    await page.evaluate(() => { window.scrollBy(0, window.innerHeight); })
    await waitFor(1000);
    let innerHeight = 0;
    innerHeight = await page.evaluate(() => { return Math.max( document.body.scrollHeight, document.body.offsetHeight, document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight ); } ); //return window.innerHeight; } );
    const times = innerHeight / viewportHeight;
    for(let x=0; x < times; x++) {
      await page.evaluate((x, viewportHeight) => { window.scrollBy(0, viewportHeight*x); },x, viewportHeight)
      await waitFor(1000);
    }
    await page.evaluate(_ => {
      window.scrollTo(0, 0);
    });

    const filename = slug + '.png';
    await page.screenshot({
      path: destDir + '/' + filename,
      fullPage: true
    });
    browser.close();

    return filename;
  } catch (e) {
    browser.close();
    throw new Error(e);
  }
};
