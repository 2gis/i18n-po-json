"use strict";
exports.__esModule = true;
var cli = require("cli");
var fs_1 = require("fs");
var convert_1 = require("./src/convert");
var options = cli.parse({
    src: ['s', 'A source PO file to process', 'string', '__stdin'],
    output: ['o', 'Output JSON file', 'string', '__stdout'],
    withOccurences: ['n', 'Include occurences info into JSON file', 'bool', false],
    withComments: ['c', 'Include comments into JSON file', 'bool', false],
    withMeta: ['m', 'Include meta info into JSON file', 'bool', false],
    help: ['h', 'Show some help', 'bool', false]
});
if (options.help) {
    console.log("i18n PO -> JSON converter\n\nOptions:\n   -h / --help                   Show this help\n   -s / --src FILE               Define input JSON file name. Defaults \n                                 to stdin.\n   -o / --output FILE            Define output POT file name. If a file \n                                 already exists, it's contents will be\n                                 overwritten. Defaults to stdout.\n   -n / --withOccurences         Include occurences info into JSON file, \n                                 parsed from \"#: ...\" comments.\n   -c / --withComments           Include comments into JSON file, parsed\n                                 from \"#. ...\" comments.\n   -m / --withMeta               Include parsed PO header into JSON file.\n");
    process.exit(0);
}
console.warn('Running conversion for file: ', options.src);
var convertOpts = {
    withOccurences: !!options.withOccurences,
    withComments: !!options.withComments,
    withMeta: !!options.withMeta
};
if (options.src === '__stdin') {
    cli.withStdin(function (data) {
        try {
            makeOutput(convert_1.convert(data, options), options.output);
        }
        catch (e) {
            console.error(e);
            process.exit(1);
        }
    });
}
else {
    fs_1.readFile(options.src, { encoding: 'utf-8' }, function (err, data) {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        try {
            makeOutput(convert_1.convert(data, options), options.output);
        }
        catch (e) {
            console.error(e);
            process.exit(1);
        }
    });
}
function makeOutput(data, output) {
    if (output === '__stdout') {
        console.log(JSON.stringify(data));
    }
    else {
        fs_1.writeFile(output, JSON.stringify(data), function (e) {
            if (e) {
                console.error(e);
                process.exit(1);
            }
            process.exit(0); // success
        });
    }
}
