import * as assert from 'assert';
import { PluralI18NEntry, SingleI18NEntry } from 'i18n-proto';
import { PoData, PoOptions } from '../src/types';
import { overridePanic, overrideWarning } from '../src/panic';

import { splitInTwo, convert, parseEntry, parseHeader, _parse } from '../src/convert';
const xor = require('array-xor');

let panics = [];
let warnings = [];
function preparePanic() {
  panics = [];
  warnings = [];
  overridePanic((message: string, invalid: string[]) => {
    panics.push({ message, invalid });
  });
  overrideWarning((message: string, invalid: string[]) => {
    warnings.push({ message, invalid });
  });
}

describe('PO to JSON converter: positive tests', () => {
  beforeEach(() => preparePanic());

  it('Splits string in two parts', () => {
    let spacedString = 'Very long string with spaces';
    let underscoredString = 'very_long_underscored_identifier';
    let stringWithNoSeparator = 'stringwithoutseparator';
    let splittedSpaced = splitInTwo(spacedString);
    let splittedUnderscored = splitInTwo(underscoredString, '_');
    let splittedWithoutSeparator = splitInTwo(stringWithNoSeparator);
    assert.equal(splittedSpaced[0], 'Very');
    assert.equal(splittedSpaced[1], 'long string with spaces');
    assert.equal(splittedUnderscored[0], 'very');
    assert.equal(splittedUnderscored[1], 'long_underscored_identifier');
    assert.equal(splittedWithoutSeparator[0], 'stringwithoutseparator');
    assert.equal(splittedWithoutSeparator[1], '');
    assert.equal(panics.length, 0);
    assert.equal(warnings.length, 0);
  });

  it('Parses generic simple single i18n entry', () => {
    let entry = `
      msgid "Some test \\"quoted\\" entry"
      msgstr "Nekiy \\"quoted\\" perevod"
    `;

    let expected = {
      msgid: 'Some test "quoted" entry',
      msgStr: 'Nekiy "quoted" perevod',
      comments: [],
      occurences: [],
      context: undefined,
      msgidPlural: undefined,
      msgStrPlural: [],
    };

    let actual = _parse(entry.split("\n"), false, false);
    assert.deepEqual(actual, expected);
    assert.equal(panics.length, 0);
    assert.equal(warnings.length, 0);
  });

  it('Parses generic multiline single i18n entry', () => {
    let entry = `
      msgid "Some "
        "test \\"quoted\\" entry "
        "multiline"
      msgstr "I esche "
        "Nekiy \\"quoted\\" perevod"
    `;

    let expected = {
      msgid: 'Some test "quoted" entry multiline',
      msgStr: 'I esche Nekiy "quoted" perevod',
      comments: [],
      occurences: [],
      context: undefined,
      msgidPlural: undefined,
      msgStrPlural: [],
    };

    let actual = _parse(entry.split("\n"), false, false);
    assert.deepEqual(actual, expected);
    assert.equal(panics.length, 0);
    assert.equal(warnings.length, 0);
  });

  it('Parses generic full single i18n entry', () => {
    let entry = `
      #. Comment 1
      #. Comment 2
      #: occurence 1
      #: occurence 2
      msgctxt "Some \\"quoted\\" context"
      msgid "Some test \\"quoted\\" entry"
      msgstr "Nekiy \\"quoted\\" perevod"
    `;

    let expected = {
      msgid: 'Some test "quoted" entry',
      msgStr: 'Nekiy "quoted" perevod',
      comments: ['Comment 1', 'Comment 2'],
      occurences: ['occurence 1', 'occurence 2'],
      context: 'Some "quoted" context',
      msgidPlural: undefined,
      msgStrPlural: [],
    };

    let actual = _parse(entry.split("\n"), true, true);
    assert.deepEqual(actual, expected);
    assert.equal(panics.length, 0);
    assert.equal(warnings.length, 0);
  });

  it('Parses generic simple plural i18n entry', () => {
    let entry = `
      msgid "Some test \\"quoted\\" entry"
      msgid_plural "Some plural test \\"quoted\\" entry"
      msgstr[0] "Nekiy \\"quoted\\" perevod"
      msgstr[1] "Nekiy pluralniy \\"quoted\\" perevod"
    `;

    let expected = {
      msgid: 'Some test "quoted" entry',
      msgStr: undefined,
      comments: [],
      occurences: [],
      context: undefined,
      msgidPlural: 'Some plural test "quoted" entry',
      msgStrPlural: ['Nekiy "quoted" perevod', 'Nekiy pluralniy "quoted" perevod'],
    };

    let actual = _parse(entry.split("\n"), false, false);
    assert.deepEqual(actual, expected);
    assert.equal(panics.length, 0);
    assert.equal(warnings.length, 0);
  });

  it('Parses generic multiline plural i18n entry', () => {
    let entry = `
      msgid "Some "
        "test \\"quoted\\" entry "
        "multiline"
      msgid_plural "Some "
        "plural "
        "test \\"quoted\\" entry"
      msgstr[0] "I esche "
        "Nekiy \\"quoted\\" perevod "
        "multiline"
      msgstr[1] "Nekiy "
        "pluralniy \\"quoted\\" perevod"
    `;

    let expected = {
      msgid: 'Some test "quoted" entry multiline',
      msgStr: undefined,
      comments: [],
      occurences: [],
      context: undefined,
      msgidPlural: 'Some plural test "quoted" entry',
      msgStrPlural: [
        'I esche Nekiy "quoted" perevod multiline',
        'Nekiy pluralniy "quoted" perevod'
      ],
    };

    let actual = _parse(entry.split("\n"), false, false);
    assert.deepEqual(actual, expected);
    assert.equal(panics.length, 0);
    assert.equal(warnings.length, 0);
  });

  it('Parses generic full plural i18n entry', () => {
    let entry = `
      #. Comment 1
      #. Comment 2
      #: occurence 1
      #: occurence 2
      msgctxt "Some \\"quoted\\" context"
      msgid "Some test \\"quoted\\" entry"
      msgid_plural "Some plural test \\"quoted\\" entry"
      msgstr[0] "Nekiy \\"quoted\\" perevod"
      msgstr[1] "Nekiy pluralniy \\"quoted\\" perevod"
    `;

    let expected = {
      msgid: 'Some test "quoted" entry',
      msgStr: undefined,
      comments: ['Comment 1', 'Comment 2'],
      occurences: ['occurence 1', 'occurence 2'],
      context: 'Some "quoted" context',
      msgidPlural: 'Some plural test "quoted" entry',
      msgStrPlural: ['Nekiy "quoted" perevod', 'Nekiy pluralniy "quoted" perevod'],
    };

    let actual = _parse(entry.split("\n"), true, true);
    assert.deepEqual(actual, expected);
    assert.equal(panics.length, 0);
    assert.equal(warnings.length, 0);
  });

  it('Parses full PO header', () => {
    let header = `
    msgid ""
    msgstr ""
    "Project-Id-Version:  2gis-online\\n"
    "Report-Msgid-Bugs-To: online4@2gis.ru\\n"
    "POT-Creation-Date: 2017-07-14 11:29+0700\\n"
    "PO-Revision-Date: 2017-06-30 15:30+0700\\n"
    "Last-Translator: 2GIS <crowdin@2gis.ru>\\n"
    "Language: cs_CZ\\n"
    "Language-Team: Czech\\n"
    "Plural-Forms: nplurals=3; plural=(n==1) ? 0 : (n>=2 && n<=4) ? 1 : 2\\n"
    "MIME-Version: 1.0\\n"
    "Content-Type: text/plain; charset=utf-8\\n"
    "Content-Transfer-Encoding: 8bit\\n"
    "Generated-By: Babel 2.1.1\\n"
    `;

    let expected: PoData['meta'] = {
      projectIdVersion: '2gis-online',
      reportMsgidBugsTo: 'online4@2gis.ru',
      potCreationDate: '2017-07-14 11:29+0700',
      poRevisionDate: '2017-06-30 15:30+0700',
      lastTranslator: {
        name: '2GIS',
        email: 'crowdin@2gis.ru'
      },
      language: 'cs_CZ',
      languageTeam: 'Czech',
      pluralForms: 'nplurals=3; plural=(n==1) ? 0 : (n>=2 && n<=4) ? 1 : 2',
      mimeVersion: '1.0',
      contentType: 'text/plain; charset=utf-8',
      contentTransferEncoding: '8bit',
      generatedBy: 'Babel 2.1.1'
    };

    let actual = parseHeader(header);
    assert.deepEqual(actual, expected);
    assert.equal(panics.length, 0);
    assert.equal(warnings.length, 0);
  });

  it('Creates valid I18NEntry from full single entry', () => {
    let entry = `
      #. Comment 1
      #. Comment 2
      #: occurence 1
      #: occurence 2
      msgctxt "Some \\"quoted\\" context"
      msgid "Some test \\"quoted\\" entry"
      msgstr "Nekiy \\"quoted\\" perevod"
    `;

    let expected: SingleI18NEntry = {
      type: 'single',
      entry: 'Some test "quoted" entry',
      context: 'Some "quoted" context',
      translation: 'Nekiy "quoted" perevod',
      comments: [
        'Comment 1',
        'Comment 2'
      ],
      occurences: [
        'occurence 1',
        'occurence 2'
      ]
    };

    let actual = parseEntry(entry, true, true);
    assert.deepEqual(actual, expected);
    assert.equal(panics.length, 0);
    assert.equal(warnings.length, 0);
  });

  it('Creates valid I18NEntry from full plural entry', () => {
    let entry = `
      #. Comment 1
      #. Comment 2
      #: occurence 1
      #: occurence 2
      msgctxt "Some \\"quoted\\" context"
      msgid "Some test \\"quoted\\" entry"
      msgid_plural "Some plural test \\"quoted\\" entry"
      msgstr[0] "Nekiy \\"quoted\\" perevod"
      msgstr[1] "Nekiy pluralniy \\"quoted\\" perevod"
    `;

    let expected: PluralI18NEntry = {
      type: 'plural',
      entry: [
        'Some test "quoted" entry',
        'Some plural test "quoted" entry'
      ],
      context: 'Some "quoted" context',
      translations: [
        'Nekiy "quoted" perevod',
        'Nekiy pluralniy "quoted" perevod'
      ],
      comments: [
        'Comment 1',
        'Comment 2'
      ],
      occurences: [
        'occurence 1',
        'occurence 2'
      ]
    };

    let actual = parseEntry(entry, true, true);
    assert.deepEqual(actual, expected);
    assert.equal(panics.length, 0);
    assert.equal(warnings.length, 0);
  });
});

describe('PO to JSON converter: negative tests', () => {
  beforeEach(() => preparePanic());

  it('Fails to parse invalid entry msgid + msgstr[N]', () => {
    let entry = `
    msgid "Some test \\"quoted\\" entry"
    msgstr[0] "Nekiy \\"quoted\\" perevod"
    `;
    let result = parseEntry(entry, false, false);
    assert.equal(result, undefined);
    assert.equal(panics.length, 1);
    assert.equal(warnings.length, 0);
  });

  it('Fails to parse invalid entry msgid + msgid_plural + msgstr', () => {
    let entry = `
    msgid "Some test \\"quoted\\" entry"
    msgid_plural "Some plural test \\"quoted\\" entry"
    msgstr "Nekiy \\"quoted\\" perevod"
    `;
    let result = parseEntry(entry, false, false);
    assert.equal(result, undefined);
    assert.equal(panics.length, 1);
    assert.equal(warnings.length, 0);
  });

  it('Fails to parse invalid entry with non-existing msgid', () => {
    let entry = `
    msgid_plural "Some plural test \\"quoted\\" entry"
    msgstr "Nekiy \\"quoted\\" perevod"
    `;
    let result = parseEntry(entry, false, false);
    assert.equal(result, undefined);
    assert.equal(panics.length, 1);
    assert.equal(warnings.length, 0);
  });

  it('Fails to parse invalid entry with existing but empty msgid', () => {
    let entry = `
    msgid
    msgstr "Nekiy \\"quoted\\" perevod"
    `;
    let result = parseEntry(entry, false, false);
    assert.equal(result, undefined);
    assert.equal(panics.length, 1);
    assert.equal(warnings.length, 0);
  });

  it('Fails to parse invalid entry with existing but empty msgctxt', () => {
    let entry = `
    msgid "Some test \\"quoted\\" entry"
    msgctxt
    msgstr "Nekiy \\"quoted\\" perevod"
    `;
    let result = parseEntry(entry, false, false);
    assert.equal(result, undefined);
    assert.equal(panics.length, 1);
    assert.equal(warnings.length, 0);
  });

  it('Fails to parse invalid entry with existing but empty msgstr', () => {
    let entry = `
    msgid "Some test \\"quoted\\" entry"
    msgstr
    `;
    let result = parseEntry(entry, false, false);
    assert.equal(result, undefined);
    assert.equal(panics.length, 1);
    assert.equal(warnings.length, 0);
  });

  it('Fails to parse invalid entry with existing but empty msgid_plural', () => {
    let entry = `
    msgid "Some test \\"quoted\\" entry"
    msgid_plural
    msgstr[0] "Nekiy \\"quoted\\" perevod"
    `;
    let result = parseEntry(entry, false, false);
    assert.equal(result, undefined);
    assert.equal(panics.length, 1);
    assert.equal(warnings.length, 0);
  });

  it('Fails to parse invalid entry with existing but empty msgstr[N]', () => {
    let entry = `
    msgid "Some test \\"quoted\\" entry"
    msgid_plural "Some plural test \\"quoted\\" entry"
    msgstr[0]
    `;
    let result = parseEntry(entry, false, false);
    assert.equal(result, undefined);
    assert.equal(panics.length, 1);
    assert.equal(warnings.length, 0);
  });

  it('Echoes warning for untranslated single entry', () => {
    let entry = `
    msgid "Some test \\"quoted\\" entry"
    msgstr ""
    `;
    let result = parseEntry(entry, false, false);
    assert.notEqual(result, undefined);
    assert.equal(panics.length, 0);
    assert.equal(warnings.length, 1);
  });

  it('Echoes warning for untranslated plural entry', () => {
    let entry = `
    msgid "Some test \\"quoted\\" entry"
    msgid_plural "Some plural test \\"quoted\\" entry"
    msgstr[0] ""
    msgstr[1] ""
    `;
    let result = parseEntry(entry, false, false);
    assert.notEqual(result, undefined);
    assert.equal(panics.length, 0);
    assert.equal(warnings.length, 1);
  });

  it('Echoes warning for unknown header entry', () => {
    let entry = `
    msgid ""
    msgstr ""
      "Unknown-Entry: value\\n"
      "MIME-Version: 1.0\\n"
    `;
    let result = parseHeader(entry);
    assert.notEqual(result, undefined);
    assert.equal(panics.length, 0);
    assert.equal(warnings.length, 1);
  });
});
