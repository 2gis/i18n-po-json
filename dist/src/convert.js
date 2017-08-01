"use strict";
exports.__esModule = true;
var panic_1 = require("./panic");
var commentRegex = /^\s*#\s?\.\s?(.*)$/i;
var occurenceRegex = /^\s*#\s?:\s?(.*)$/i;
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
}
exports.parseHeader = parseHeader;
function parseEntry(entry, withComments, withOccurences) {
    var entries = entry.split("\n").filter(function (e) { return !!e; });
    var lastMode = null;
    var comments = [];
    var occurences = [];
    var context;
    var msgid;
    var msgidPlural;
    var msgStr;
    var msgStrPlural = [];
    for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
        var entry_1 = entries_1[_i];
        // string continuations
        if (lastMode && entry_1.replace(/^\s+/g, '')[0] === '"') {
            switch (lastMode) {
                case 'msgid':
                    msgid += JSON.parse(entry_1);
                    break;
                case 'msgid_plural':
                    msgidPlural += JSON.parse(entry_1);
                    break;
                case 'msgctxt':
                    context += JSON.parse(entry_1);
                    break;
                case 'msgstr':
                    msgStr += JSON.parse(entry_1);
                    break;
                default:
                    // msgstr[N] instruction explicit handler
                    var pluralMatch = lastMode.match(/msgid\[(\d+)\]/i);
                    if (pluralMatch) {
                        msgStrPlural[pluralMatch[1]] += JSON.parse(entry_1);
                    }
                    break;
            }
            lastMode = null;
            continue;
        }
        // comment
        if (withComments) {
            var commentMatch = entry_1.match(commentRegex);
            if (commentMatch) {
                comments.push(commentMatch[1]);
                continue;
            }
        }
        // occurence
        if (withOccurences) {
            var occurenceMatch = entry_1.match(occurenceRegex);
            if (occurenceMatch) {
                occurences.push(occurenceMatch[1]);
                continue;
            }
        }
        // common instructions
        var _a = entry_1.split(' ', 2), instruction = _a[0], body = _a[1];
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
        translation: msgStr || '',
        occurences: occurences.length > 0 ? occurences : undefined,
        comments: comments.length > 0 ? comments : undefined
    };
}
exports.parseEntry = parseEntry;
