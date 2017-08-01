"use strict";
exports.__esModule = true;
var panic_1 = require("./panic");
var commentRegex = /^\s*#\s?\.\s?(.*)$/i;
var occurenceRegex = /^\s*#\s?:\s?(.*)$/i;
function splitInTwo(src, separator) {
    if (separator === void 0) { separator = ' '; }
    var i = src.indexOf(separator);
    return [src.slice(0, i), src.slice(i + 1)];
}
exports.splitInTwo = splitInTwo;
function convert(data, opts) {
    // entries should be separated with double CRLF
    var entries = data.split("\n\n").filter(function (e) { return !!e; });
    // first entry should be header
    var header = entries.shift();
    return {
        meta: opts.withMeta ? parseHeader(header) : undefined,
        items: entries.map(function (entry) { return parseEntry(entry, opts.withComments, opts.withOccurences); })
    };
}
exports.convert = convert;
function parseHeader(header) {
    var entries = header.split("\n").filter(function (e) { return !!e; });
    var msgStr = parse(entries, false, false).msgStr;
    var headers = msgStr.split("\n");
    return headers.reduce(function (acc, header) {
        var _a = splitInTwo(header, ':').map(function (v) { return v.replace(/^\s+|\s+$/g, ''); }), name = _a[0], value = _a[1];
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
                    acc.lastTranslator = { name: matches[1], email: matches[2] };
                }
                else {
                    panic_1.warning('Last-Translator header malformed', [value]);
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
        }
        return acc;
    }, {});
}
exports.parseHeader = parseHeader;
function parseEntry(entry, withComments, withOccurences) {
    var entries = entry.split("\n").filter(function (e) { return !!e; });
    var _a = parse(entries, withComments, withOccurences), comments = _a.comments, occurences = _a.occurences, context = _a.context, msgid = _a.msgid, msgidPlural = _a.msgidPlural, msgStr = _a.msgStr, msgStrPlural = _a.msgStrPlural;
    if (msgidPlural || msgStrPlural.length > 0) {
        if (!msgidPlural || msgStrPlural.length == 0) {
            panic_1.panic('Invalid plural entry: absent msgid_plural or msgstr[N] strings', [msgid, msgidPlural]);
            return;
        }
        // valid plural form
        return {
            type: 'plural',
            entry: [msgid, msgidPlural],
            context: context,
            translations: msgStrPlural,
            occurences: occurences.length > 0 ? occurences : undefined,
            comments: comments.length > 0 ? comments : undefined
        };
    }
    if (!msgid) {
        panic_1.panic('Invalid single entry: empty msgid string', [msgid]);
        return;
    }
    if (!msgStr) {
        panic_1.warning('String is untranslated', [msgid]);
    }
    return {
        type: 'single',
        entry: msgid,
        context: context,
        translation: msgStr || undefined,
        occurences: occurences.length > 0 ? occurences : undefined,
        comments: comments.length > 0 ? comments : undefined
    };
}
exports.parseEntry = parseEntry;
function parse(entries, withComments, withOccurences) {
    var lastMode = null;
    var comments = [];
    var occurences = [];
    var context;
    var msgid;
    var msgidPlural;
    var msgStr;
    var msgStrPlural = [];
    for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
        var entry = entries_1[_i];
        // string continuations
        if (lastMode && entry.replace(/^\s+/g, '')[0] === '"') {
            switch (lastMode) {
                case 'msgid':
                    msgid += JSON.parse(entry);
                    break;
                case 'msgid_plural':
                    msgidPlural += JSON.parse(entry);
                    break;
                case 'msgctxt':
                    context += JSON.parse(entry);
                    break;
                case 'msgstr':
                    msgStr += JSON.parse(entry);
                    break;
                default:
                    // msgstr[N] instruction explicit handler
                    var pluralMatch = lastMode.match(/msgid\[(\d+)\]/i);
                    if (pluralMatch) {
                        msgStrPlural[pluralMatch[1]] += JSON.parse(entry);
                    }
                    break;
            }
            lastMode = null;
            continue;
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
                var pluralMatch = instruction.match(/msgid\[(\d+)\]/i);
                if (pluralMatch) {
                    msgStrPlural[pluralMatch[1]] = JSON.parse(body);
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
        msgStrPlural: msgStrPlural
    };
}
