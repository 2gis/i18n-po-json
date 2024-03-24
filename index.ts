import * as cli from 'cli';
import { readFile, writeFile } from 'fs';
import { convert } from './src/convert';
import { TranslationJson } from 'i18n-proto';
import { PoOptions } from './src/types';
import getStdin from 'get-stdin'

const options = cli.parse({
  src: ['s', 'A source PO file to process', 'string', '__stdin'],
  output: ['o', 'Output JSON file', 'string', '__stdout'],
  withOccurences: ['n', 'Include occurences in JSON', 'bool', false],
  withComments: ['c', 'Inclide comments in JSON', 'bool', false],
  withMeta: ['m', 'Include parsed PO header into JSON', 'bool', false],
  prettify: ['p', 'Prettify ouput JSON', 'bool', false],
  help: ['h', 'Show some help', 'bool', false]
});

if (options.help) {
  console.log(`i18n PO -> JSON converter

Options:
   -h / --help                   Show this help
   -s / --src FILE               Define input PO file name. Defaults 
                                 to stdin.
   -o / --output FILE            Define output JSON file name. If a file 
                                 already exists, it's contents will be
                                 overwritten. Defaults to stdout.
   -n / --withOccurences         Include occurences info into JSON file,
                                 parsed from "#: ..." comments.
   -c / --withComments           Include comments into JSON file, parsed
                                 from "#. ..." comments.
   -m / --withMeta               Include parsed PO header or plural form
                                 into JSON file. Add all header values
                                 without any params provided. Possible values: "" | "full" | "plural".
   -p / --prettify               Pretty-print JSON output.
`);
  process.exit(0);
}

console.warn('Running conversion for file: ', options.src);

const parsedOptions: PoOptions = {
  withOccurences: options.withOccurences,
  withComments: options.withComments,
  withMeta: false
}

if (options.withMeta || options.withMeta === 'full') {
  parsedOptions.withMeta = 'full';
} else {
  if (options.withMeta === 'plural') {
    parsedOptions.withMeta = 'plural';
  }
}

if (options.src === '__stdin') {
  getStdin().then((data) => {
    try {
      makeOutput(convert(data, parsedOptions), options.output, options.prettify);
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  });
} else {
  readFile(options.src, { encoding: 'utf-8' }, (err, data) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    try {
      makeOutput(convert(data, parsedOptions), options.output, options.prettify);
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  });
}

function makeOutput(data: TranslationJson, output: string, prettify: boolean) {
  if (output === '__stdout') {
    console.log(JSON.stringify(data, undefined, prettify ? '  ' : undefined));
  } else {
    writeFile(output, JSON.stringify(data, undefined, prettify ? '  ' : undefined), (e) => {
      if (e) {
        console.error(e);
        process.exit(1);
      }
      process.exit(0); // success
    });
  }
}
