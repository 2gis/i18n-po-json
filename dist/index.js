import { readFile, writeFile } from 'fs';
import yargs, { showHelp } from 'yargs';
import { hideBin } from 'yargs/helpers';
import { convert } from './src/convert';
import getStdin from 'get-stdin';
yargs(hideBin(process.argv)).command('pojson', 'i18n PO -> JSON converter', (args) => {
    args
        .option('src', {
        alias: 's',
        description: 'Define input JSON file name. Defaults to stdin.',
        type: 'string',
        default: '__stdin'
    })
        .option('output', {
        alias: 'o',
        description: 'Define output POT file name. If a file already ' +
            'exists, it s contents will be overwritten. Defaults to stdout.',
        type: 'string',
        default: '__stdout'
    }).option('withOccurences', {
        alias: 'n',
        description: 'Include occurences info into JSON file, '
            + 'parsed from "#: ..." comments.',
        type: 'boolean',
        default: false
    }).option('withComments', {
        alias: 'c',
        description: 'Include comments into JSON file, parsed '
            + 'from "#. ..." comments.',
        type: 'boolean',
        default: false
    }).option('withMeta', {
        alias: 'm',
        description: 'Include parsed PO header or plural form '
            + 'into JSON file. Add all header values'
            + 'without any params provided. Possable values "" | "full" | "plural"',
        type: 'string',
        default: undefined
    }).option('prettify', {
        alias: 'p',
        description: 'Pretty-print JSON output.',
        type: 'boolean',
        default: false
    }).option('help', {
        alias: 'h',
        description: 'Show this help',
        type: 'boolean',
        default: false
    });
}, ({ help, src, output, withOccurences, withComments, withMeta, prettify }) => {
    if (help) {
        showHelp();
        process.exit(0);
    }
    console.warn('Running conversion for file: ', src);
    const parsedOptions = {
        withOccurences,
        withComments,
        withMeta: false
    };
    if (withMeta === '' || withMeta === 'full') {
        parsedOptions.withMeta = 'full';
    }
    else {
        if (withMeta === 'plural') {
            parsedOptions.withMeta = 'plural';
        }
    }
    if (src === '__stdin') {
        getStdin().then((data) => {
            try {
                makeOutput(convert(data, parsedOptions), output, prettify);
            }
            catch (e) {
                console.error(e);
                process.exit(1);
            }
        });
    }
    else {
        readFile(src, { encoding: 'utf-8' }, (err, data) => {
            if (err) {
                console.error(err);
                process.exit(1);
            }
            try {
                makeOutput(convert(data, parsedOptions), output, prettify);
            }
            catch (e) {
                console.error(e);
                process.exit(1);
            }
        });
    }
}).demandCommand().parse();
function makeOutput(data, output, prettify) {
    if (output === '__stdout') {
        console.log(JSON.stringify(data, undefined, prettify ? '  ' : undefined));
    }
    else {
        writeFile(output, JSON.stringify(data, undefined, prettify ? '  ' : undefined), (e) => {
            if (e) {
                console.error(e);
                process.exit(1);
            }
            process.exit(0); // success
        });
    }
}
//# sourceMappingURL=index.js.map