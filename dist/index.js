"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var fs_1 = require("fs");
var yargs_1 = tslib_1.__importStar(require("yargs"));
var helpers_1 = require("yargs/helpers");
var convert_1 = require("./src/convert");
var get_stdin_1 = tslib_1.__importDefault(require("get-stdin"));
(0, yargs_1.default)((0, helpers_1.hideBin)(process.argv)).command('pojson', 'i18n PO -> JSON converter', function (args) {
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
}, function (_a) {
    var help = _a.help, src = _a.src, output = _a.output, withOccurences = _a.withOccurences, withComments = _a.withComments, withMeta = _a.withMeta, prettify = _a.prettify;
    if (help) {
        (0, yargs_1.showHelp)();
        process.exit(0);
    }
    console.warn('Running conversion for file: ', src);
    var parsedOptions = {
        withOccurences: withOccurences,
        withComments: withComments,
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
        (0, get_stdin_1.default)().then(function (data) {
            try {
                makeOutput((0, convert_1.convert)(data, parsedOptions), output, prettify);
            }
            catch (e) {
                console.error(e);
                process.exit(1);
            }
        });
    }
    else {
        (0, fs_1.readFile)(src, { encoding: 'utf-8' }, function (err, data) {
            if (err) {
                console.error(err);
                process.exit(1);
            }
            try {
                makeOutput((0, convert_1.convert)(data, parsedOptions), output, prettify);
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
        (0, fs_1.writeFile)(output, JSON.stringify(data, undefined, prettify ? '  ' : undefined), function (e) {
            if (e) {
                console.error(e);
                process.exit(1);
            }
            process.exit(0); // success
        });
    }
}
//# sourceMappingURL=index.js.map