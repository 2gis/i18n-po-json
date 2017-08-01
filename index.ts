import * as cli from 'cli';
import { readFile, writeFile } from 'fs';
import { convert } from './src/convert';
import { PoOptions } from './src/types';

const options = cli.parse({
  src: ['s', 'A source PO file to process', 'string', '__stdin'],
  output: ['o', 'Output JSON file', 'string', '__stdout'],
  withOccurences: ['n', 'Include occurences info into JSON file', 'bool', false],
  withComments: ['c', 'Include comments into JSON file', 'bool', false],
  withMeta: ['m', 'Include meta info into JSON file', 'bool', false],
  help: ['h', 'Show some help', 'bool', false]
});

if (options.help) {
  console.log(`i18n PO -> JSON converter

Options:
   -h / --help                   Show this help
   -s / --src FILE               Define input JSON file name. Defaults 
                                 to stdin.
   -o / --output FILE            Define output POT file name. If a file 
                                 already exists, it's contents will be
                                 overwritten. Defaults to stdout.
   -n / --withOccurences         Include occurences info into JSON file, 
                                 parsed from "#: ..." comments.
   -c / --withComments           Include comments into JSON file, parsed
                                 from "#. ..." comments.
   -m / --withMeta               Include parsed PO header into JSON file.
`);
  process.exit(0);
}

console.warn('Running conversion for file: ', options.src);

const convertOpts: PoOptions = {
  withOccurences: !!options.withOccurences,
  withComments: !!options.withComments,
  withMeta: !!options.withMeta
};

if (options.src === '__stdin') {
  cli.withStdin((data) => {
    try {
      makeOutput(convert(data, options), options.output);
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
      makeOutput(convert(data, options), options.output);
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  });
}

function makeOutput(data: string, output: string) {
  if (output === '__stdout') {
    console.log(data);
  } else {
    writeFile(output, data, (e) => {
      if (e) {
        console.error(e);
        process.exit(1);
      }
      process.exit(0); // success
    });
  }
}
