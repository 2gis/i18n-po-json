"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var assert_1 = tslib_1.__importDefault(require("assert"));
var panic_1 = require("../src/panic");
var convert_1 = require("../src/convert");
var panics = [];
var warnings = [];
function preparePanic() {
    panics = [];
    warnings = [];
    (0, panic_1.overridePanic)(function (message, invalid) {
        panics.push({ message: message, invalid: invalid });
    });
    (0, panic_1.overrideWarning)(function (message, invalid) {
        warnings.push({ message: message, invalid: invalid });
    });
}
describe('PO to JSON converter: positive tests', function () {
    beforeEach(function () { return preparePanic(); });
    it('Splits string in two parts', function () {
        var spacedString = 'Very long string with spaces';
        var underscoredString = 'very_long_underscored_identifier';
        var stringWithNoSeparator = 'stringwithoutseparator';
        var splittedSpaced = (0, convert_1.splitInTwo)(spacedString);
        var splittedUnderscored = (0, convert_1.splitInTwo)(underscoredString, '_');
        var splittedWithoutSeparator = (0, convert_1.splitInTwo)(stringWithNoSeparator);
        assert_1.default.strictEqual(splittedSpaced[0], 'Very');
        assert_1.default.strictEqual(splittedSpaced[1], 'long string with spaces');
        assert_1.default.strictEqual(splittedUnderscored[0], 'very');
        assert_1.default.strictEqual(splittedUnderscored[1], 'long_underscored_identifier');
        assert_1.default.strictEqual(splittedWithoutSeparator[0], 'stringwithoutseparator');
        assert_1.default.strictEqual(splittedWithoutSeparator[1], '');
        assert_1.default.strictEqual(panics.length, 0);
        assert_1.default.strictEqual(warnings.length, 0);
    });
    it('Parses generic simple single i18n entry', function () {
        var entry = "\n      msgid \"Some test \\\"quoted\\\" entry\"\n      msgstr \"Nekiy \\\"quoted\\\" perevod\"\n    ";
        var expected = {
            msgid: 'Some test "quoted" entry',
            msgStr: 'Nekiy "quoted" perevod',
            comments: [],
            occurences: [],
            context: undefined,
            msgidPlural: undefined,
            msgStrPlural: [],
        };
        var actual = (0, convert_1._parse)(entry.split("\n"), false, false);
        assert_1.default.deepStrictEqual(actual, expected);
        assert_1.default.strictEqual(panics.length, 0);
        assert_1.default.strictEqual(warnings.length, 0);
    });
    it('Parses generic multiline single i18n entry', function () {
        var entry = "\n      msgid \"Some \"\n        \"test \\\"quoted\\\" entry \"\n        \"multiline\"\n      msgstr \"I esche \"\n        \"Nekiy \\\"quoted\\\" perevod\"\n    ";
        var expected = {
            msgid: 'Some test "quoted" entry multiline',
            msgStr: 'I esche Nekiy "quoted" perevod',
            comments: [],
            occurences: [],
            context: undefined,
            msgidPlural: undefined,
            msgStrPlural: [],
        };
        var actual = (0, convert_1._parse)(entry.split("\n"), false, false);
        assert_1.default.deepStrictEqual(actual, expected);
        assert_1.default.strictEqual(panics.length, 0);
        assert_1.default.strictEqual(warnings.length, 0);
    });
    it('Parses generic full single i18n entry', function () {
        var entry = "\n      #. Comment 1\n      #. Comment 2\n      #: occurence 1\n      #: occurence 2\n      msgctxt \"Some \\\"quoted\\\" context\"\n      msgid \"Some test \\\"quoted\\\" entry\"\n      msgstr \"Nekiy \\\"quoted\\\" perevod\"\n    ";
        var expected = {
            msgid: 'Some test "quoted" entry',
            msgStr: 'Nekiy "quoted" perevod',
            comments: ['Comment 1', 'Comment 2'],
            occurences: ['occurence 1', 'occurence 2'],
            context: 'Some "quoted" context',
            msgidPlural: undefined,
            msgStrPlural: [],
        };
        var actual = (0, convert_1._parse)(entry.split("\n"), true, true);
        assert_1.default.deepStrictEqual(actual, expected);
        assert_1.default.strictEqual(panics.length, 0);
        assert_1.default.strictEqual(warnings.length, 0);
    });
    it('Parses generic simple plural i18n entry', function () {
        var entry = "\n      msgid \"Some test \\\"quoted\\\" entry\"\n      msgid_plural \"Some plural test \\\"quoted\\\" entry\"\n      msgstr[0] \"Nekiy \\\"quoted\\\" perevod\"\n      msgstr[1] \"Nekiy pluralniy \\\"quoted\\\" perevod\"\n    ";
        var expected = {
            msgid: 'Some test "quoted" entry',
            msgStr: undefined,
            comments: [],
            occurences: [],
            context: undefined,
            msgidPlural: 'Some plural test "quoted" entry',
            msgStrPlural: ['Nekiy "quoted" perevod', 'Nekiy pluralniy "quoted" perevod'],
        };
        var actual = (0, convert_1._parse)(entry.split("\n"), false, false);
        assert_1.default.deepStrictEqual(actual, expected);
        assert_1.default.strictEqual(panics.length, 0);
        assert_1.default.strictEqual(warnings.length, 0);
    });
    it('Parses generic multiline plural i18n entry', function () {
        var entry = "\n      msgid \"Some \"\n        \"test \\\"quoted\\\" entry \"\n        \"multiline\"\n      msgid_plural \"Some \"\n        \"plural \"\n        \"test \\\"quoted\\\" entry\"\n      msgstr[0] \"I esche \"\n        \"Nekiy \\\"quoted\\\" perevod \"\n        \"multiline\"\n      msgstr[1] \"Nekiy \"\n        \"pluralniy \\\"quoted\\\" perevod\"\n    ";
        var expected = {
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
        var actual = (0, convert_1._parse)(entry.split("\n"), false, false);
        assert_1.default.deepStrictEqual(actual, expected);
        assert_1.default.strictEqual(panics.length, 0);
        assert_1.default.strictEqual(warnings.length, 0);
    });
    it('Parses generic full plural i18n entry', function () {
        var entry = "\n      #. Comment 1\n      #. Comment 2\n      #: occurence 1\n      #: occurence 2\n      msgctxt \"Some \\\"quoted\\\" context\"\n      msgid \"Some test \\\"quoted\\\" entry\"\n      msgid_plural \"Some plural test \\\"quoted\\\" entry\"\n      msgstr[0] \"Nekiy \\\"quoted\\\" perevod\"\n      msgstr[1] \"Nekiy pluralniy \\\"quoted\\\" perevod\"\n    ";
        var expected = {
            msgid: 'Some test "quoted" entry',
            msgStr: undefined,
            comments: ['Comment 1', 'Comment 2'],
            occurences: ['occurence 1', 'occurence 2'],
            context: 'Some "quoted" context',
            msgidPlural: 'Some plural test "quoted" entry',
            msgStrPlural: ['Nekiy "quoted" perevod', 'Nekiy pluralniy "quoted" perevod'],
        };
        var actual = (0, convert_1._parse)(entry.split("\n"), true, true);
        assert_1.default.deepStrictEqual(actual, expected);
        assert_1.default.strictEqual(panics.length, 0);
        assert_1.default.strictEqual(warnings.length, 0);
    });
    it('Parses full PO header', function () {
        var header = "\n    msgid \"\"\n    msgstr \"\"\n    \"Project-Id-Version:  2gis-online\\n\"\n    \"Report-Msgid-Bugs-To: online4@2gis.ru\\n\"\n    \"POT-Creation-Date: 2017-07-14 11:29+0700\\n\"\n    \"PO-Revision-Date: 2017-06-30 15:30+0700\\n\"\n    \"Last-Translator: 2GIS <crowdin@2gis.ru>\\n\"\n    \"Language: cs_CZ\\n\"\n    \"Language-Team: Czech\\n\"\n    \"Plural-Forms: nplurals=3; plural=(n==1) ? 0 : (n>=2 && n<=4) ? 1 : 2\\n\"\n    \"MIME-Version: 1.0\\n\"\n    \"Content-Type: text/plain; charset=utf-8\\n\"\n    \"Content-Transfer-Encoding: 8bit\\n\"\n    \"Generated-By: Babel 2.1.1\\n\"\n    ";
        var expected = {
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
        var opts = { withMeta: 'full' };
        var actual = (0, convert_1.parseHeader)(header, opts);
        assert_1.default.deepStrictEqual(actual, expected);
        assert_1.default.strictEqual(panics.length, 0);
        assert_1.default.strictEqual(warnings.length, 0);
    });
    it('Parses plurals PO header', function () {
        var header = "\n    msgid \"\"\n    msgstr \"\"\n    \"Project-Id-Version:  2gis-online\\n\"\n    \"Report-Msgid-Bugs-To: online4@2gis.ru\\n\"\n    \"POT-Creation-Date: 2017-07-14 11:29+0700\\n\"\n    \"PO-Revision-Date: 2017-06-30 15:30+0700\\n\"\n    \"Last-Translator: 2GIS <crowdin@2gis.ru>\\n\"\n    \"Language: cs_CZ\\n\"\n    \"Language-Team: Czech\\n\"\n    \"Plural-Forms: nplurals=3; plural=(n==1) ? 0 : (n>=2 && n<=4) ? 1 : 2\\n\"\n    \"MIME-Version: 1.0\\n\"\n    \"Content-Type: text/plain; charset=utf-8\\n\"\n    \"Content-Transfer-Encoding: 8bit\\n\"\n    \"Generated-By: Babel 2.1.1\\n\"\n    ";
        var expected = {
            pluralForms: 'nplurals=3; plural=(n==1) ? 0 : (n>=2 && n<=4) ? 1 : 2'
        };
        var opts = { withMeta: 'plural' };
        var actual = (0, convert_1.parseHeader)(header, opts);
        assert_1.default.deepStrictEqual(actual, expected);
        assert_1.default.strictEqual(panics.length, 0);
        assert_1.default.strictEqual(warnings.length, 0);
    });
    it('Creates valid I18NEntry from full single entry', function () {
        var entry = "\n      #. Comment 1\n      #. Comment 2\n      #: occurence 1\n      #: occurence 2\n      msgctxt \"Some \\\"quoted\\\" context\"\n      msgid \"Some test \\\"quoted\\\" entry\"\n      msgstr \"Nekiy \\\"quoted\\\" perevod\"\n    ";
        var expected = {
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
        var actual = (0, convert_1.parseEntry)(entry, true, true);
        assert_1.default.deepStrictEqual(actual, expected);
        assert_1.default.strictEqual(panics.length, 0);
        assert_1.default.strictEqual(warnings.length, 0);
    });
    it('Creates valid I18NEntry from full plural entry', function () {
        var entry = "\n      #. Comment 1\n      #. Comment 2\n      #: occurence 1\n      #: occurence 2\n      msgctxt \"Some \\\"quoted\\\" context\"\n      msgid \"Some test \\\"quoted\\\" entry\"\n      msgid_plural \"Some plural test \\\"quoted\\\" entry\"\n      msgstr[0] \"Nekiy \\\"quoted\\\" perevod\"\n      msgstr[1] \"Nekiy pluralniy \\\"quoted\\\" perevod\"\n    ";
        var expected = {
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
        var actual = (0, convert_1.parseEntry)(entry, true, true);
        assert_1.default.deepStrictEqual(actual, expected);
        assert_1.default.strictEqual(panics.length, 0);
        assert_1.default.strictEqual(warnings.length, 0);
    });
});
describe('PO to JSON converter: negative tests', function () {
    beforeEach(function () { return preparePanic(); });
    it('Fails to parse invalid entry msgid + msgstr[N]', function () {
        var entry = "\n    msgid \"Some test \\\"quoted\\\" entry\"\n    msgstr[0] \"Nekiy \\\"quoted\\\" perevod\"\n    ";
        var result = (0, convert_1.parseEntry)(entry, false, false);
        assert_1.default.strictEqual(result, undefined);
        assert_1.default.strictEqual(panics.length, 1);
        assert_1.default.strictEqual(warnings.length, 0);
    });
    it('Fails to parse invalid entry msgid + msgid_plural + msgstr', function () {
        var entry = "\n    msgid \"Some test \\\"quoted\\\" entry\"\n    msgid_plural \"Some plural test \\\"quoted\\\" entry\"\n    msgstr \"Nekiy \\\"quoted\\\" perevod\"\n    ";
        var result = (0, convert_1.parseEntry)(entry, false, false);
        assert_1.default.strictEqual(result, undefined);
        assert_1.default.strictEqual(panics.length, 1);
        assert_1.default.strictEqual(warnings.length, 0);
    });
    it('Fails to parse invalid entry with non-existing msgid', function () {
        var entry = "\n    msgid_plural \"Some plural test \\\"quoted\\\" entry\"\n    msgstr \"Nekiy \\\"quoted\\\" perevod\"\n    ";
        var result = (0, convert_1.parseEntry)(entry, false, false);
        assert_1.default.strictEqual(result, undefined);
        assert_1.default.strictEqual(panics.length, 1);
        assert_1.default.strictEqual(warnings.length, 0);
    });
    it('Fails to parse invalid entry with existing but empty msgid', function () {
        var entry = "\n    msgid\n    msgstr \"Nekiy \\\"quoted\\\" perevod\"\n    ";
        var result = (0, convert_1.parseEntry)(entry, false, false);
        assert_1.default.strictEqual(result, undefined);
        assert_1.default.strictEqual(panics.length, 1);
        assert_1.default.strictEqual(warnings.length, 0);
    });
    it('Fails to parse invalid entry with existing but empty msgctxt', function () {
        var entry = "\n    msgid \"Some test \\\"quoted\\\" entry\"\n    msgctxt\n    msgstr \"Nekiy \\\"quoted\\\" perevod\"\n    ";
        var result = (0, convert_1.parseEntry)(entry, false, false);
        assert_1.default.strictEqual(result, undefined);
        assert_1.default.strictEqual(panics.length, 1);
        assert_1.default.strictEqual(warnings.length, 0);
    });
    it('Fails to parse invalid entry with existing but empty msgstr', function () {
        var entry = "\n    msgid \"Some test \\\"quoted\\\" entry\"\n    msgstr\n    ";
        var result = (0, convert_1.parseEntry)(entry, false, false);
        assert_1.default.strictEqual(result, undefined);
        assert_1.default.strictEqual(panics.length, 1);
        assert_1.default.strictEqual(warnings.length, 0);
    });
    it('Fails to parse invalid entry with existing but empty msgid_plural', function () {
        var entry = "\n    msgid \"Some test \\\"quoted\\\" entry\"\n    msgid_plural\n    msgstr[0] \"Nekiy \\\"quoted\\\" perevod\"\n    ";
        var result = (0, convert_1.parseEntry)(entry, false, false);
        assert_1.default.strictEqual(result, undefined);
        assert_1.default.strictEqual(panics.length, 1);
        assert_1.default.strictEqual(warnings.length, 0);
    });
    it('Fails to parse invalid entry with existing but empty msgstr[N]', function () {
        var entry = "\n    msgid \"Some test \\\"quoted\\\" entry\"\n    msgid_plural \"Some plural test \\\"quoted\\\" entry\"\n    msgstr[0]\n    ";
        var result = (0, convert_1.parseEntry)(entry, false, false);
        assert_1.default.strictEqual(result, undefined);
        assert_1.default.strictEqual(panics.length, 1);
        assert_1.default.strictEqual(warnings.length, 0);
    });
    it('Echoes warning for untranslated single entry', function () {
        var entry = "\n    msgid \"Some test \\\"quoted\\\" entry\"\n    msgstr \"\"\n    ";
        var result = (0, convert_1.parseEntry)(entry, false, false);
        assert_1.default.notStrictEqual(result, undefined);
        assert_1.default.strictEqual(panics.length, 0);
        assert_1.default.strictEqual(warnings.length, 1);
    });
    it('Echoes warning for untranslated plural entry', function () {
        var entry = "\n    msgid \"Some test \\\"quoted\\\" entry\"\n    msgid_plural \"Some plural test \\\"quoted\\\" entry\"\n    msgstr[0] \"\"\n    msgstr[1] \"\"\n    ";
        var result = (0, convert_1.parseEntry)(entry, false, false);
        assert_1.default.notStrictEqual(result, undefined);
        assert_1.default.strictEqual(panics.length, 0);
        assert_1.default.strictEqual(warnings.length, 1);
    });
    it('Echoes warning for unknown header entry', function () {
        var entry = "\n    msgid \"\"\n    msgstr \"\"\n      \"Unknown-Entry: value\\n\"\n      \"MIME-Version: 1.0\\n\"\n    ";
        var opts = { withMeta: 'full' };
        var result = (0, convert_1.parseHeader)(entry, opts);
        assert_1.default.notStrictEqual(result, undefined);
        assert_1.default.strictEqual(panics.length, 0);
        assert_1.default.strictEqual(warnings.length, 1);
    });
});
//# sourceMappingURL=convert.spec.js.map