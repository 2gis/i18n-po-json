"use strict";
exports.__esModule = true;
var fs_1 = require("fs");
var yargs_1 = require("yargs");
var convert_1 = require("./src/convert");
var getStdin = require("get-stdin");
var yargOpts = yargs_1.usage('i18n PO -> JSON converter', {
    src: {
        alias: 's',
        description: 'Define input JSON file name. Defaults to stdin.',
        type: 'string',
        "default": '__stdin'
    },
    output: {
        alias: 'o',
        description: 'Define output POT file name. If a file already ' +
            'exists, it s contents will be overwritten. Defaults to stdout.',
        type: 'string',
        "default": '__stdout'
    },
    withOccurences: {
        alias: 'n',
        description: 'Include occurences info into JSON file, '
            + 'parsed from "#: ..." comments.',
        type: 'boolean',
        "default": false
    },
    withComments: {
        alias: 'c',
        description: 'Include comments into JSON file, parsed '
            + 'from "#. ..." comments.',
        type: 'boolean',
        "default": false
    },
    withMeta: {
        alias: 'm',
        description: 'Include parsed PO header or plural form '
            + 'into JSON file. Add all header values'
            + 'without any params provided. Possable values "" | "full" | "plural"',
        type: 'string',
        "default": undefined
    },
    prettify: {
        alias: 'p',
        description: 'Pretty-print JSON output.',
        type: 'boolean',
        "default": false
    },
    help: {
        alias: 'h',
        description: 'Show this help',
        type: 'boolean',
        "default": false
    }
}).argv;
if (yargOpts.help) {
    yargs_1.showHelp();
    process.exit(0);
}
console.warn('Running conversion for file: ', yargOpts.src);
var parsedOptions = {
    withOccurences: yargOpts.withOccurences,
    withComments: yargOpts.withComments,
    withMeta: false
};
if (yargOpts.withMeta === '' || yargOpts.withMeta === 'full') {
    parsedOptions.withMeta = 'full';
}
else {
    if (yargOpts.withMeta === 'plural') {
        parsedOptions.withMeta = 'plural';
    }
}
if (yargOpts.src === '__stdin') {
    getStdin().then(function (data) {
        try {
            makeOutput(convert_1.convert(data, parsedOptions), yargOpts.output, yargOpts.prettify);
        }
        catch (e) {
            console.error(e);
            process.exit(1);
        }
    });
}
else {
    fs_1.readFile(yargOpts.src, { encoding: 'utf-8' }, function (err, data) {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        try {
            makeOutput(convert_1.convert(data, parsedOptions), yargOpts.output, yargOpts.prettify);
        }
        catch (e) {
            console.error(e);
            process.exit(1);
        }
    });
}
function makeOutput(data, output, prettify) {
    if (output === '__stdout') {
        console.log(JSON.stringify(data, undefined, prettify ? '  ' : undefined));
    }
    else {
        fs_1.writeFile(output, JSON.stringify(data, undefined, prettify ? '  ' : undefined), function (e) {
            if (e) {
                console.error(e);
                process.exit(1);
            }
            process.exit(0); // success
        });
    }
}
