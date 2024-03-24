"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._parse = exports.parseEntry = exports.parseHeader = exports.convert = exports.splitInTwo = void 0;
var panic_1 = require("./panic");
var commentRegex = /^\s*#\s?\.\s?(.*)$/i;
var occurenceRegex = /^\s*#\s?:\s?(.*)$/i;
function splitInTwo(src, separator) {
    if (separator === void 0) { separator = ' '; }
    var i = src.indexOf(separator);
    if (i === -1) { // no separator
        return [src, ''];
    }
    return [src.slice(0, i), src.slice(i + 1)];
}
exports.splitInTwo = splitInTwo;
function convert(data, opts) {
    // entries should be separated with double CRLF
    var entries = data.split("\n\n").filter(function (e) { return !!e; });
    // first entry should be header
    var header = entries.shift();
    return {
        meta: parseHeader(header, opts),
        items: entries.map(function (entry) { return parseEntry(entry, opts.withComments, opts.withOccurences); })
            .filter(function (e) {
            return !!e;
        })
    };
}
exports.convert = convert;
function parseHeader(header, opts) {
    var _a, _b;
    if (!opts.withMeta) {
        return;
    }
    var entries = header.split("\n");
    var result;
    try {
        result = _parse(entries, false, false);
    }
    catch (e) {
        (0, panic_1.panic)("Malformed string: can't parse: ", [e.message]);
        return;
    }
    var headers = (_b = (_a = result.msgStr) === null || _a === void 0 ? void 0 : _a.split("\n")) !== null && _b !== void 0 ? _b : [];
    if (opts.withMeta === 'plural') {
        var pluralHeader = headers.filter(function (headerItem) {
            return headerItem.startsWith("Plural-Forms");
        })[0];
        if (!pluralHeader.length) {
            return;
        }
        var value = splitInTwo(pluralHeader, ':').map(function (v) { return v.trim(); })[1];
        return {
            pluralForms: value
        };
    }
    return headers.reduce(function (acc, hdr) {
        var _a = splitInTwo(hdr, ':').map(function (v) { return v.trim(); }), name = _a[0], value = _a[1];
        switch (name) {
            case "Project-Id-Version":
                acc.projectIdVersion = value;
                break;
            case "Report-Msgid-Bugs-To":
                acc.reportMsgidBugsTo = value;
                break;
            case "POT-Creation-Date":
                acc.potCreationDate = value;
                break;
            case "PO-Revision-Date":
                acc.poRevisionDate = value;
                break;
            case "Last-Translator":
                var matches = value.match(/(.*)\s*<(.+?)>/);
                if (matches) {
                    acc.lastTranslator = {
                        name: (matches[1] || '').trim(),
                        email: matches[2].trim()
                    };
                }
                else {
                    (0, panic_1.warning)('Last-Translator header malformed', [value]);
                }
                break;
            case "Language":
                acc.language = value;
                break;
            case "Language-Team":
                acc.languageTeam = value;
                break;
            case "Plural-Forms":
                acc.pluralForms = value;
                break;
            case "MIME-Version":
                acc.mimeVersion = value;
                break;
            case "Content-Type":
                acc.contentType = value;
                break;
            case "Content-Transfer-Encoding":
                acc.contentTransferEncoding = value;
                break;
            case "Generated-By":
                acc.generatedBy = value;
                break;
            default:
                if (name) {
                    (0, panic_1.warning)('PO header: unknown clause', [name, value]);
                }
        }
        return acc;
    }, {});
}
exports.parseHeader = parseHeader;
function parseEntry(entry, withComments, withOccurences) {
    var entries = entry.split("\n");
    var result;
    try {
        result = _parse(entries, withComments, withOccurences);
    }
    catch (e) {
        (0, panic_1.panic)("Malformed string: can't parse: ", [e.message]);
        return;
    }
    var comments = result.comments, occurences = result.occurences, context = result.context, msgid = result.msgid, msgidPlural = result.msgidPlural, msgStr = result.msgStr, msgStrPlural = result.msgStrPlural;
    if (msgidPlural && !(msgStrPlural === null || msgStrPlural === void 0 ? void 0 : msgStrPlural.length)) {
        (0, panic_1.panic)('Invalid entry: msgid_plural should have corresponding msgstr_plural entries', [msgid !== null && msgid !== void 0 ? msgid : '', msgidPlural !== null && msgidPlural !== void 0 ? msgidPlural : '']);
        return;
    }
    if (msgStrPlural.length > 0) {
        if (!msgidPlural || msgStrPlural.length == 0) {
            (0, panic_1.panic)('Invalid plural entry: absent msgid_plural or msgstr[N] strings', [msgid !== null && msgid !== void 0 ? msgid : '', msgidPlural !== null && msgidPlural !== void 0 ? msgidPlural : '']);
            return;
        }
        if (msgStrPlural.length !== msgStrPlural.filter(function (v) { return !!v; }).length) {
            (0, panic_1.warning)('Some of plural strings are untranslated', msgStrPlural);
        }
        // valid plural form
        return {
            type: 'plural',
            entry: [msgid !== null && msgid !== void 0 ? msgid : '', msgidPlural],
            context: context,
            translations: msgStrPlural,
            occurences: occurences.length > 0 ? occurences : undefined,
            comments: comments.length > 0 ? comments : undefined
        };
    }
    if (!msgid) {
        (0, panic_1.panic)('Invalid single entry: empty msgid string', [msgid !== null && msgid !== void 0 ? msgid : '']);
        return;
    }
    if (!msgStr) {
        (0, panic_1.warning)('String is untranslated', [msgid]);
    }
    return {
        type: 'single',
        entry: msgid,
        context: context,
        translation: msgStr !== null && msgStr !== void 0 ? msgStr : undefined,
        occurences: occurences.length > 0 ? occurences : undefined,
        comments: comments.length > 0 ? comments : undefined
    };
}
exports.parseEntry = parseEntry;
// Exported for testing only!
function _parse(entries, withComments, withOccurences) {
    // prepare entries, trim spaces, etc
    entries = entries.filter(function (e) { return !!e; }).map(function (e) { return e.trim(); });
    var lastMode = null;
    var comments = [];
    var occurences = [];
    var context = undefined;
    var msgid = undefined;
    var msgidPlural = undefined;
    var msgStr = undefined;
    var msgStrPlural = [];
    for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
        var entry = entries_1[_i];
        // string continuations
        if (lastMode && entry.startsWith('"')) {
            switch (lastMode) {
                case 'msgid':
                    msgid = (msgid !== null && msgid !== void 0 ? msgid : '') + JSON.parse(entry);
                    break;
                case 'msgid_plural':
                    msgidPlural = (msgidPlural !== null && msgidPlural !== void 0 ? msgidPlural : '') + JSON.parse(entry);
                    break;
                case 'msgctxt':
                    context = (context !== null && context !== void 0 ? context : '') + JSON.parse(entry);
                    break;
                case 'msgstr':
                    msgStr = (msgStr !== null && msgStr !== void 0 ? msgStr : '') + JSON.parse(entry);
                    break;
                default:
                    // msgstr[N] instruction explicit handler
                    var pluralMatch = lastMode.match(/msgstr\[(\d+)\]/i);
                    if (pluralMatch) {
                        msgStrPlural[parseInt(pluralMatch[1], 10)] += JSON.parse(entry);
                    }
                    break;
            }
            continue;
        }
        else {
            lastMode = null;
        }
        // comment
        if (withComments) {
            var commentMatch = entry.match(commentRegex);
            if (commentMatch) {
                comments.push(commentMatch[1]);
                continue;
            }
        }
        // occurence
        if (withOccurences) {
            var occurenceMatch = entry.match(occurenceRegex);
            if (occurenceMatch) {
                occurences.push(occurenceMatch[1]);
                continue;
            }
        }
        // common instructions
        var _a = splitInTwo(entry), instruction = _a[0], body = _a[1];
        switch (instruction) {
            case 'msgid':
                msgid = JSON.parse(body);
                break;
            case 'msgid_plural':
                msgidPlural = JSON.parse(body);
                break;
            case 'msgctxt':
                context = JSON.parse(body);
                break;
            case 'msgstr':
                msgStr = JSON.parse(body);
                break;
            default:
                // msgstr[N] instruction explicit handler
                var pluralMatch = instruction.match(/msgstr\[(\d+)\]/i);
                if (pluralMatch) {
                    msgStrPlural[parseInt(pluralMatch[1], 10)] = JSON.parse(body);
                }
                break;
        }
        lastMode = instruction;
    }
    return {
        comments: comments,
        occurences: occurences,
        context: context,
        msgid: msgid,
        msgidPlural: msgidPlural,
        msgStr: msgStr,
        msgStrPlural: msgStrPlural,
    };
}
exports._parse = _parse;
//# sourceMappingURL=convert.js.map