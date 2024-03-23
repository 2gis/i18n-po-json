import assert from 'assert';
import { PluralI18NEntry, SingleI18NEntry, TranslationMeta } from 'i18n-proto';
import { PoOptions } from '../src/types';
import { overridePanic, overrideWarning } from '../src/panic';
import { splitInTwo, parseEntry, parseHeader, _parse } from '../src/convert';

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
    const spacedString = 'Very long string with spaces';
    const underscoredString = 'very_long_underscored_identifier';
    const stringWithNoSeparator = 'stringwithoutseparator';
    const splittedSpaced = splitInTwo(spacedString);
    const splittedUnderscored = splitInTwo(underscoredString, '_');
    const splittedWithoutSeparator = splitInTwo(stringWithNoSeparator);
    assert.strictEqual(splittedSpaced[0], 'Very');
    assert.strictEqual(splittedSpaced[1], 'long string with spaces');
    assert.strictEqual(splittedUnderscored[0], 'very');
    assert.strictEqual(splittedUnderscored[1], 'long_underscored_identifier');
    assert.strictEqual(splittedWithoutSeparator[0], 'stringwithoutseparator');
    assert.strictEqual(splittedWithoutSeparator[1], '');
    assert.strictEqual(panics.length, 0);
    assert.strictEqual(warnings.length, 0);
  });

  it('Parses generic simple single i18n entry', () => {
    const entry = `
      msgid "Some test \\"quoted\\" entry"
      msgstr "Nekiy \\"quoted\\" perevod"
    `;

    const expected = {
      msgid: 'Some test "quoted" entry',
      msgStr: 'Nekiy "quoted" perevod',
      comments: [],
      occurences: [],
      context: undefined,
      msgidPlural: undefined,
      msgStrPlural: [],
    };

    const actual = _parse(entry.split("\n"), false, false);
    assert.deepStrictEqual(actual, expected);
    assert.strictEqual(panics.length, 0);
    assert.strictEqual(warnings.length, 0);
  });

  it('Parses generic multiline single i18n entry', () => {
    const entry = `
      msgid "Some "
        "test \\"quoted\\" entry "
        "multiline"
      msgstr "I esche "
        "Nekiy \\"quoted\\" perevod"
    `;

    const expected = {
      msgid: 'Some test "quoted" entry multiline',
      msgStr: 'I esche Nekiy "quoted" perevod',
      comments: [],
      occurences: [],
      context: undefined,
      msgidPlural: undefined,
      msgStrPlural: [],
    };

    const actual = _parse(entry.split("\n"), false, false);
    assert.deepStrictEqual(actual, expected);
    assert.strictEqual(panics.length, 0);
    assert.strictEqual(warnings.length, 0);
  });

  it('Parses generic full single i18n entry', () => {
    const entry = `
      #. Comment 1
      #. Comment 2
      #: occurence 1
      #: occurence 2
      msgctxt "Some \\"quoted\\" context"
      msgid "Some test \\"quoted\\" entry"
      msgstr "Nekiy \\"quoted\\" perevod"
    `;

    const expected = {
      msgid: 'Some test "quoted" entry',
      msgStr: 'Nekiy "quoted" perevod',
      comments: ['Comment 1', 'Comment 2'],
      occurences: ['occurence 1', 'occurence 2'],
      context: 'Some "quoted" context',
      msgidPlural: undefined,
      msgStrPlural: [],
    };

    const actual = _parse(entry.split("\n"), true, true);
    assert.deepStrictEqual(actual, expected);
    assert.strictEqual(panics.length, 0);
    assert.strictEqual(warnings.length, 0);
  });

  it('Parses generic simple plural i18n entry', () => {
    const entry = `
      msgid "Some test \\"quoted\\" entry"
      msgid_plural "Some plural test \\"quoted\\" entry"
      msgstr[0] "Nekiy \\"quoted\\" perevod"
      msgstr[1] "Nekiy pluralniy \\"quoted\\" perevod"
    `;

    const expected = {
      msgid: 'Some test "quoted" entry',
      msgStr: undefined,
      comments: [],
      occurences: [],
      context: undefined,
      msgidPlural: 'Some plural test "quoted" entry',
      msgStrPlural: ['Nekiy "quoted" perevod', 'Nekiy pluralniy "quoted" perevod'],
    };

    const actual = _parse(entry.split("\n"), false, false);
    assert.deepStrictEqual(actual, expected);
    assert.strictEqual(panics.length, 0);
    assert.strictEqual(warnings.length, 0);
  });

  it('Parses generic multiline plural i18n entry', () => {
    const entry = `
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

    const expected = {
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

    const actual = _parse(entry.split("\n"), false, false);
    assert.deepStrictEqual(actual, expected);
    assert.strictEqual(panics.length, 0);
    assert.strictEqual(warnings.length, 0);
  });

  it('Parses generic full plural i18n entry', () => {
    const entry = `
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

    const expected = {
      msgid: 'Some test "quoted" entry',
      msgStr: undefined,
      comments: ['Comment 1', 'Comment 2'],
      occurences: ['occurence 1', 'occurence 2'],
      context: 'Some "quoted" context',
      msgidPlural: 'Some plural test "quoted" entry',
      msgStrPlural: ['Nekiy "quoted" perevod', 'Nekiy pluralniy "quoted" perevod'],
    };

    const actual = _parse(entry.split("\n"), true, true);
    assert.deepStrictEqual(actual, expected);
    assert.strictEqual(panics.length, 0);
    assert.strictEqual(warnings.length, 0);
  });

  it('Parses full PO header', () => {
    const header = `
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

    const expected: TranslationMeta = {
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

    const opts = { withMeta: 'full' } as PoOptions;
    const actual = parseHeader(header, opts);
    assert.deepStrictEqual(actual, expected);
    assert.strictEqual(panics.length, 0);
    assert.strictEqual(warnings.length, 0);
  });

  it('Parses plurals PO header', () => {
    const header = `
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

    const expected = {
      pluralForms: 'nplurals=3; plural=(n==1) ? 0 : (n>=2 && n<=4) ? 1 : 2'
    };

    const opts = { withMeta: 'plural' } as PoOptions;
    const actual = parseHeader(header, opts);
    assert.deepStrictEqual(actual, expected);
    assert.strictEqual(panics.length, 0);
    assert.strictEqual(warnings.length, 0);
  });

  it('Creates valid I18NEntry from full single entry', () => {
    const entry = `
      #. Comment 1
      #. Comment 2
      #: occurence 1
      #: occurence 2
      msgctxt "Some \\"quoted\\" context"
      msgid "Some test \\"quoted\\" entry"
      msgstr "Nekiy \\"quoted\\" perevod"
    `;

    const expected: SingleI18NEntry = {
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

    const actual = parseEntry(entry, true, true);
    assert.deepStrictEqual(actual, expected);
    assert.strictEqual(panics.length, 0);
    assert.strictEqual(warnings.length, 0);
  });

  it('Creates valid I18NEntry from full plural entry', () => {
    const entry = `
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

    const expected: PluralI18NEntry = {
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

    const actual = parseEntry(entry, true, true);
    assert.deepStrictEqual(actual, expected);
    assert.strictEqual(panics.length, 0);
    assert.strictEqual(warnings.length, 0);
  });
});

describe('PO to JSON converter: negative tests', () => {
  beforeEach(() => preparePanic());

  it('Fails to parse invalid entry msgid + msgstr[N]', () => {
    const entry = `
    msgid "Some test \\"quoted\\" entry"
    msgstr[0] "Nekiy \\"quoted\\" perevod"
    `;
    const result = parseEntry(entry, false, false);
    assert.strictEqual(result, undefined);
    assert.strictEqual(panics.length, 1);
    assert.strictEqual(warnings.length, 0);
  });

  it('Fails to parse invalid entry msgid + msgid_plural + msgstr', () => {
    const entry = `
    msgid "Some test \\"quoted\\" entry"
    msgid_plural "Some plural test \\"quoted\\" entry"
    msgstr "Nekiy \\"quoted\\" perevod"
    `;
    const result = parseEntry(entry, false, false);
    assert.strictEqual(result, undefined);
    assert.strictEqual(panics.length, 1);
    assert.strictEqual(warnings.length, 0);
  });

  it('Fails to parse invalid entry with non-existing msgid', () => {
    const entry = `
    msgid_plural "Some plural test \\"quoted\\" entry"
    msgstr "Nekiy \\"quoted\\" perevod"
    `;
    const result = parseEntry(entry, false, false);
    assert.strictEqual(result, undefined);
    assert.strictEqual(panics.length, 1);
    assert.strictEqual(warnings.length, 0);
  });

  it('Fails to parse invalid entry with existing but empty msgid', () => {
    const entry = `
    msgid
    msgstr "Nekiy \\"quoted\\" perevod"
    `;
    const result = parseEntry(entry, false, false);
    assert.strictEqual(result, undefined);
    assert.strictEqual(panics.length, 1);
    assert.strictEqual(warnings.length, 0);
  });

  it('Fails to parse invalid entry with existing but empty msgctxt', () => {
    const entry = `
    msgid "Some test \\"quoted\\" entry"
    msgctxt
    msgstr "Nekiy \\"quoted\\" perevod"
    `;
    const result = parseEntry(entry, false, false);
    assert.strictEqual(result, undefined);
    assert.strictEqual(panics.length, 1);
    assert.strictEqual(warnings.length, 0);
  });

  it('Fails to parse invalid entry with existing but empty msgstr', () => {
    const entry = `
    msgid "Some test \\"quoted\\" entry"
    msgstr
    `;
    const result = parseEntry(entry, false, false);
    assert.strictEqual(result, undefined);
    assert.strictEqual(panics.length, 1);
    assert.strictEqual(warnings.length, 0);
  });

  it('Fails to parse invalid entry with existing but empty msgid_plural', () => {
    const entry = `
    msgid "Some test \\"quoted\\" entry"
    msgid_plural
    msgstr[0] "Nekiy \\"quoted\\" perevod"
    `;
    const result = parseEntry(entry, false, false);
    assert.strictEqual(result, undefined);
    assert.strictEqual(panics.length, 1);
    assert.strictEqual(warnings.length, 0);
  });

  it('Fails to parse invalid entry with existing but empty msgstr[N]', () => {
    const entry = `
    msgid "Some test \\"quoted\\" entry"
    msgid_plural "Some plural test \\"quoted\\" entry"
    msgstr[0]
    `;
    const result = parseEntry(entry, false, false);
    assert.strictEqual(result, undefined);
    assert.strictEqual(panics.length, 1);
    assert.strictEqual(warnings.length, 0);
  });

  it('Echoes warning for untranslated single entry', () => {
    const entry = `
    msgid "Some test \\"quoted\\" entry"
    msgstr ""
    `;
    const result = parseEntry(entry, false, false);
    assert.notStrictEqual(result, undefined);
    assert.strictEqual(panics.length, 0);
    assert.strictEqual(warnings.length, 1);
  });

  it('Echoes warning for untranslated plural entry', () => {
    const entry = `
    msgid "Some test \\"quoted\\" entry"
    msgid_plural "Some plural test \\"quoted\\" entry"
    msgstr[0] ""
    msgstr[1] ""
    `;
    const result = parseEntry(entry, false, false);
    assert.notStrictEqual(result, undefined);
    assert.strictEqual(panics.length, 0);
    assert.strictEqual(warnings.length, 1);
  });

  it('Echoes warning for unknown header entry', () => {
    const entry = `
    msgid ""
    msgstr ""
      "Unknown-Entry: value\\n"
      "MIME-Version: 1.0\\n"
    `;

    const opts = { withMeta: 'full' } as PoOptions;
    const result = parseHeader(entry, opts);
    assert.notStrictEqual(result, undefined);
    assert.strictEqual(panics.length, 0);
    assert.strictEqual(warnings.length, 1);
  });
});
