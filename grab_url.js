const puppeteer = require('puppeteer');
const args = process.argv.slice(2);
var index = args[0];
const url = 'https://stryber.com' + args[1];
let slugCrumbs = args[1].split('/').slice(1);
const slug = slugCrumbs[0] === '' ? 'index' : slugCrumbs.join('__');
const viewportWidth = 1024;
const viewportHeight = 768;

function waitFor (ms) {
  return new Promise(resolve => setTimeout(() => resolve(), ms));
}

module.exports = async() => {
  const browser = await puppeteer.launch({
  headless:true,
  args:[
  '--headless',
  '--disable-gpu'
  //'--executablePath /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome'
  ]
  });

  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(0);

  await page.setViewport({width: viewportWidth, height: viewportHeight}); //, deviceScaleFactor: 2});

  await page.goto(url, { waitUntil: 'networkidle0' });

  await page.addStyleTag({ path: './styles.css' });
  const [button] = await page.$x("//button[contains(., 'Sounds good')]");
  await button.click();

  await page.evaluate(() => { window.scrollBy(0, window.innerHeight); })
  await waitFor(1000);
  var innerHeight = 0;
  innerHeight = await page.evaluate(() => { return Math.max( document.body.scrollHeight, document.body.offsetHeight, document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight ); } ); //return window.innerHeight; } );
  var times = innerHeight / viewportHeight;
  console.log(index + ': url='+url+' height='+innerHeight+" times="+times);
  var x = 0;
  for(x=0;x<times;x++) {
     await page.evaluate((x, viewportHeight) => { window.scrollBy(0, viewportHeight*x); },x, viewportHeight)
     await waitFor(1000);
  }
  await page.evaluate(_ => {
      window.scrollTo(0, 0);
    });
  //const result = await page.pdf({ format: 'A4' });
  var title = await page.title();
  // var filename = title.replace(/[^a-z0-9]/gmi, "_").replace(/\s+/g, "_");
  var filename = slug + '.png';
  //var filename = title.split(' ').join('_').split('.').join('_').split(':').join('_').split(',').join('_').split('/').join('_');
      // while(index.length < 3) { index="0"+index; }
  console.log("filename="+filename+"\n");

  await page.screenshot({
          path: 'screenshots/' + filename,
          fullPage: true
      });
  browser.close();
};
