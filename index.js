const fs = require('fs');
const path = require('path');
const readline = require('readline');
const makePageScreenshot = require('./makePageScreenshot');

const DEFAULT_SOURCE_URLS = './urls.txt';
const DEFAULT_DESTINATION_DIR = './';

const getProcessParams = () => {
    const args = process.argv.slice(2);

    let urls = [];
    let params = {};
    let i = 0;
    while (i < args.length) {
        if (args[i].match(/^--/)) {
            const param = args[i].replace('--', '');

            if (param === 'help') {
                params[param] = true;
                i++;
                break;
            }

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
const showHelpMessage = () => {
    console.log(
`Pagescreenshot is an utility which helps to make web-page screenshots.

Basic usage:
----------------------------------------------------------------------
    Specify urls in urls.txt file:
        > pagescreenshot
        
    Specify urls through command line parameters:
        > pagescreenshot url1 url2 url3 ...
----------------------------------------------------------------------    

Custom params:
----------------------------------------------------------------------   
    --help          Show help message
    --dest          Set destination directory [./]
    --source        Set path for source file with urls [urls.txt]
    --page-setup    Set path for script with custom page setup
----------------------------------------------------------------------`);
}


const logger = new Logger();

(async () => {
    const args = getProcessParams();

    if (args.help) {
        showHelpMessage();
        return;
    }

    const destDir = path.resolve(args['dest'] || DEFAULT_DESTINATION_DIR);
    const sourceURLs = path.resolve(args['source'] || DEFAULT_SOURCE_URLS);
    const pageSetupPath = args['page-setup'] || null;
    let pageSetup;
    if (pageSetupPath) {
        pageSetup = require(pageSetupPath);
    }

    let urls = args.urls;
    if (!urls) {
        const urlsFileContent = fs.readFileSync(sourceURLs, 'utf-8');
        urls = urlsFileContent.replace(/\n$/, '').split(/\r?\n/);
    }

    // Create destination directory if needed
    if (destDir !== path.resolve('./') &&
        !fs.existsSync(destDir)
    ) {
        fs.mkdirSync(destDir);
    }

    let urlIndex = 0;
    for (const url of urls) {
        logger.logWithLoader(`[${urlIndex + 1}/${urls.length}] ${url} => `);

        let screenshotFileName;
        try {
            screenshotFileName = await makePageScreenshot(url, {
                destDir,
                onPageSetup: pageSetup,
            });
            logger.log(`\x1b[32m${destDir}/${screenshotFileName}\x1b[0m`);
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
