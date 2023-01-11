const fs = require('fs');
const readline = require('readline');
const lineByLine = require('n-readlines');
const makePageScreenshot = require('./makePageScreenshot');

const baseURL = 'https://stryber.com';
const sourceURLs = './urls.txt';
const destDir = './screenshots';


const logger = new Logger();

(async () => {
    fs.rmSync(destDir, { recursive: true, force: true });
    fs.mkdirSync(destDir);

    const liner = new lineByLine(sourceURLs);
    let line;
    let lineIndex = 0;
    while (line = liner.next()) {
        const url = baseURL + line.toString();
        logger.logWithLoader(`[${lineIndex}] ${url} => `);

        let screenshotFileName;
        try {
            screenshotFileName = await makePageScreenshot(url, {
                destDir,
                onPageSetup: async ({ page }) => {
                    await page.addStyleTag({ path: './styles.css' });
                    const [button] = await page.$x("//button[contains(., 'Sounds good')]");
                    await button.click();
                }
            });
            logger.log(`\x1b[32m${screenshotFileName}\x1b[0m`);
        } catch (e) {
            logger.log('\x1b[31mfailed \x1b[0m');
            logger.log(`    ${e.message}`);
        }

        lineIndex++;
    }
})();

function Logger() {
    let currentLineLength = 0;
    let loader;
    const loggerObj = {
        log: (line, breakLine = true) => {
            if (loader) {
                loader.stop();
                loader = null;
                currentLineLength += line.length;
            } else {
                currentLineLength = line.length;
            }
            const printLine = line + (breakLine ? '\n' : '');
            process.stdout.write(printLine);
        },
        logWithLoader: (line) => {
            loggerObj.log(line, false);
            loader = new Loader(currentLineLength);
            loader.start();
        },
        clearLoader: () => {
          loader.stop();
          loggerObj.log('');
        },
    };

    return loggerObj;
}

function Loader(lineLength) {
    let count = 0;
    const maxCount = 9;
    let intervalHandler;

    const showDots = () => {
        if (count < maxCount) {
            count++;
            process.stdout.write('.');
        } else {
            readline.cursorTo(process.stdout, lineLength, null);
            readline.clearLine(process.stdout, 1);
            count = 0;
        }
    }
    const clearDots = () => {
        readline.cursorTo(process.stdout, lineLength, null);
        readline.clearLine(process.stdout, 1);
        count = 0;
    };

    return {
        start: () => {
            intervalHandler = setInterval(showDots, 100);
        },
        stop: () => {
            clearInterval(intervalHandler);
            clearDots();
        }
    }
}
