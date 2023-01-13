const fs = require('fs');
const readline = require('readline');
const makePageScreenshot = require('./makePageScreenshot');
const customPageSetup = require('./customPageSetup');

const DEFAULT_SOURCE_URLS = './urls.txt';
const DEFAULT_DESTINATION_DIR = './screenshots';

const getProcessParams = () => {
    const args = process.argv.slice(2);

    let urls = [];
    let params = {};
    let i = 0;
    while (i < args.length) {
        if (args[i].match(/^--/)) {
            const param = args[i].replace('--', '');
            if (!args[i + 1]) {
                throw new Error(`Absent value of ${param}`);
            }
            params[param] = args[i + 1];
            i += 2;
            continue;
        }
        urls.push(args[i]);
        i++;
    }

    return {
        ...params,
        urls: urls.length > 0 ? urls : null,
    }
};


const logger = new Logger();

(async () => {
    const args = getProcessParams();
    const destDir = args['dest'] || DEFAULT_DESTINATION_DIR;
    const sourceURLs = args['source'] || DEFAULT_SOURCE_URLS;

    let urls = args.urls;
    if (!urls) {
        const urlsFileContent = fs.readFileSync(sourceURLs, 'utf-8');
        urls = urlsFileContent.replace(/\n$/, '').split(/\r?\n/);
    }

    // Cleanup destination directory
    fs.rmSync(destDir, { recursive: true, force: true });
    fs.mkdirSync(destDir);

    let urlIndex = 0;
    for (const url of urls) {
        logger.logWithLoader(`[${urlIndex + 1}/${urls.length}] ${url} => `);

        let screenshotFileName;
        try {
            screenshotFileName = await makePageScreenshot(url, {
                destDir,
                onPageSetup: customPageSetup,
            });
            logger.log(`\x1b[32m${screenshotFileName}\x1b[0m`);
        } catch (e) {
            logger.log('\x1b[31mfailed \x1b[0m');
            logger.log(`    ${e.message}`);
        }
        urlIndex++;
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
