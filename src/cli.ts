import { readFile, writeFile } from 'fs';
import yargs from 'yargs';
import { TranslationJson } from 'i18n-proto';
import * as getStdin from 'get-stdin';
import { convert } from './convert';
import { PoOptions } from './types';

const yargsInstance = yargs(process.argv.slice(2))
  .usage('i18n PO -> JSON converter')
  .help()
  .options({
    src: {
      alias: 's',
      description: 'Define input JSON file name. Defaults to stdin.',
      type: 'string',
      default: '__stdin',
    },
    output: {
      alias: 'o',
      description:
        'Define output POT file name. If a file already ' +
        'exists, it s contents will be overwritten. Defaults to stdout.',
      type: 'string',
      default: '__stdout',
    },
    withOccurences: {
      alias: 'n',
      description: 'Include occurences info into JSON file, ' + 'parsed from "#: ..." comments.',
      type: 'boolean',
      default: false,
    },
    withComments: {
      alias: 'c',
      description: 'Include comments into JSON file, parsed ' + 'from "#. ..." comments.',
      type: 'boolean',
      default: false,
    },
    withMeta: {
      alias: 'm',
      description:
        'Include parsed PO header or plural form ' +
        'into JSON file. Add all header values' +
        'without any params provided. Possable values "" | "full" | "plural"',
      type: 'string',
      default: undefined,
    },
    prettify: {
      alias: 'p',
      description: 'Pretty-print JSON output.',
      type: 'boolean',
      default: false,
    },
  });

const yargOpts = yargsInstance.parseSync();

if (yargOpts.help) {
  yargsInstance.showHelp();
  process.exit(0);
}

console.warn('Running conversion for file: ', yargOpts.src);

const parsedOptions: PoOptions = {
  withOccurences: yargOpts.withOccurences,
  withComments: yargOpts.withComments,
  withMeta: false,
};

if (yargOpts.withMeta === '' || yargOpts.withMeta === 'full') {
  parsedOptions.withMeta = 'full';
} else {
  if (yargOpts.withMeta === 'plural') {
    parsedOptions.withMeta = 'plural';
  }
}

if (yargOpts.src === '__stdin') {
  getStdin().then((data) => {
    try {
      makeOutput(convert(data, parsedOptions), yargOpts.output, yargOpts.prettify);
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  });
} else {
  readFile(yargOpts.src, { encoding: 'utf-8' }, (err, data) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    try {
      makeOutput(convert(data, parsedOptions), yargOpts.output, yargOpts.prettify);
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
