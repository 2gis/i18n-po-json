"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var cli = tslib_1.__importStar(require("cli"));
var fs_1 = require("fs");
var convert_1 = require("./src/convert");
var get_stdin_1 = tslib_1.__importDefault(require("get-stdin"));
var options = cli.parse({
    src: ['s', 'A source PO file to process', 'string', '__stdin'],
    output: ['o', 'Output JSON file', 'string', '__stdout'],
    withOccurences: ['n', 'Include occurences in JSON', 'bool', false],
    withComments: ['c', 'Inclide comments in JSON', 'bool', false],
    withMeta: ['m', 'Include parsed PO header into JSON', 'bool', false],
    prettify: ['p', 'Prettify ouput JSON', 'bool', false],
    help: ['h', 'Show some help', 'bool', false]
});
if (options.help) {
    console.log("i18n PO -> JSON converter\n\nOptions:\n   -h / --help                   Show this help\n   -s / --src FILE               Define input PO file name. Defaults \n                                 to stdin.\n   -o / --output FILE            Define output JSON file name. If a file \n                                 already exists, it's contents will be\n                                 overwritten. Defaults to stdout.\n   -n / --withOccurences         Include occurences info into JSON file,\n                                 parsed from \"#: ...\" comments.\n   -c / --withComments           Include comments into JSON file, parsed\n                                 from \"#. ...\" comments.\n   -m / --withMeta               Include parsed PO header or plural form\n                                 into JSON file. Add all header values\n                                 without any params provided. Possible values: \"\" | \"full\" | \"plural\".\n   -p / --prettify               Pretty-print JSON output.\n");
    process.exit(0);
}
console.warn('Running conversion for file: ', options.src);
var parsedOptions = {
    withOccurences: options.withOccurences,
    withComments: options.withComments,
    withMeta: false
};
if (options.withMeta === '' || options.withMeta === 'full') {
    parsedOptions.withMeta = 'full';
}
else {
    if (options.withMeta === 'plural') {
        parsedOptions.withMeta = 'plural';
    }
}
if (options.src === '__stdin') {
    (0, get_stdin_1.default)().then(function (data) {
        try {
            makeOutput((0, convert_1.convert)(data, parsedOptions), options.output, options.prettify);
        }
        catch (e) {
            console.error(e);
            process.exit(1);
        }
    });
}
else {
    (0, fs_1.readFile)(options.src, { encoding: 'utf-8' }, function (err, data) {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        try {
            makeOutput((0, convert_1.convert)(data, parsedOptions), options.output, options.prettify);
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