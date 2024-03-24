import { panic, warning } from './panic';
const commentRegex = /^\s*#\s?\.\s?(.*)$/i;
const occurenceRegex = /^\s*#\s?:\s?(.*)$/i;
export function splitInTwo(src, separator = ' ') {
    const i = src.indexOf(separator);
    if (i === -1) { // no separator
        return [src, ''];
    }
    return [src.slice(0, i), src.slice(i + 1)];
}
export function convert(data, opts) {
    // entries should be separated with double CRLF
    const entries = data.split("\n\n").filter((e) => !!e);
    // first entry should be header
    const header = entries.shift();
    return {
        meta: parseHeader(header, opts),
        items: entries.map((entry) => parseEntry(entry, opts.withComments, opts.withOccurences))
            .filter(function (e) {
            return !!e;
        })
    };
}
export function parseHeader(header, opts) {
    if (!opts.withMeta) {
        return;
    }
    const entries = header.split("\n");
    let result;
    try {
        result = _parse(entries, false, false);
    }
    catch (e) {
        panic("Malformed string: can't parse: ", [e.message]);
        return;
    }
    const headers = result.msgStr?.split("\n") ?? [];
    if (opts.withMeta === 'plural') {
        const pluralHeader = headers.filter((headerItem) => {
            return headerItem.startsWith("Plural-Forms");
        })[0];
        if (!pluralHeader.length) {
            return;
        }
        const value = splitInTwo(pluralHeader, ':').map((v) => v.trim())[1];
        return {
            pluralForms: value
        };
    }
    return headers.reduce((acc, hdr) => {
        const [name, value] = splitInTwo(hdr, ':').map((v) => v.trim());
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
                const matches = value.match(/(.*)\s*<(.+?)>/);
                if (matches) {
                    acc.lastTranslator = {
                        name: (matches[1] || '').trim(),
                        email: matches[2].trim()
                    };
                }
                else {
                    warning('Last-Translator header malformed', [value]);
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
                    warning('PO header: unknown clause', [name, value]);
                }
        }
        return acc;
    }, {});
}
export function parseEntry(entry, withComments, withOccurences) {
    const entries = entry.split("\n");
    let result;
    try {
        result = _parse(entries, withComments, withOccurences);
    }
    catch (e) {
        panic("Malformed string: can't parse: ", [e.message]);
        return;
    }
    const { comments, occurences, context, msgid, msgidPlural, msgStr, msgStrPlural, } = result;
    if (msgidPlural && !msgStrPlural?.length) {
        panic('Invalid entry: msgid_plural should have corresponding msgstr_plural entries', [msgid ?? '', msgidPlural ?? '']);
        return;
    }
    if (msgStrPlural.length > 0) {
        if (!msgidPlural || msgStrPlural.length == 0) {
            panic('Invalid plural entry: absent msgid_plural or msgstr[N] strings', [msgid ?? '', msgidPlural ?? '']);
            return;
        }
        if (msgStrPlural.length !== msgStrPlural.filter((v) => !!v).length) {
            warning('Some of plural strings are untranslated', msgStrPlural);
        }
        // valid plural form
        return {
            type: 'plural',
            entry: [msgid ?? '', msgidPlural],
            context: context,
            translations: msgStrPlural,
            occurences: occurences.length > 0 ? occurences : undefined,
            comments: comments.length > 0 ? comments : undefined
        };
    }
    if (!msgid) {
        panic('Invalid single entry: empty msgid string', [msgid ?? '']);
        return;
    }
    if (!msgStr) {
        warning('String is untranslated', [msgid]);
    }
    return {
        type: 'single',
        entry: msgid,
        context: context,
        translation: msgStr ?? undefined,
        occurences: occurences.length > 0 ? occurences : undefined,
        comments: comments.length > 0 ? comments : undefined
    };
}
// Exported for testing only!
export function _parse(entries, withComments, withOccurences) {
    // prepare entries, trim spaces, etc
    entries = entries.filter((e) => !!e).map((e) => e.trim());
    let lastMode = null;
    const comments = [];
    const occurences = [];
    let context = undefined;
    let msgid = undefined;
    let msgidPlural = undefined;
    let msgStr = undefined;
    const msgStrPlural = [];
    for (const entry of entries) {
        // string continuations
        if (lastMode && entry.startsWith('"')) {
            switch (lastMode) {
                case 'msgid':
                    msgid = (msgid ?? '') + JSON.parse(entry);
                    break;
                case 'msgid_plural':
                    msgidPlural = (msgidPlural ?? '') + JSON.parse(entry);
                    break;
                case 'msgctxt':
                    context = (context ?? '') + JSON.parse(entry);
                    break;
                case 'msgstr':
                    msgStr = (msgStr ?? '') + JSON.parse(entry);
                    break;
                default:
                    // msgstr[N] instruction explicit handler
                    const pluralMatch = lastMode.match(/msgstr\[(\d+)\]/i);
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
            const commentMatch = entry.match(commentRegex);
            if (commentMatch) {
                comments.push(commentMatch[1]);
                continue;
            }
        }
        // occurence
        if (withOccurences) {
            const occurenceMatch = entry.match(occurenceRegex);
            if (occurenceMatch) {
                occurences.push(occurenceMatch[1]);
                continue;
            }
        }
        // common instructions
        const [instruction, body] = splitInTwo(entry);
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
                const pluralMatch = instruction.match(/msgstr\[(\d+)\]/i);
                if (pluralMatch) {
                    msgStrPlural[parseInt(pluralMatch[1], 10)] = JSON.parse(body);
                }
                break;
        }
        lastMode = instruction;
    }
    return {
        comments,
        occurences,
        context,
        msgid,
        msgidPlural,
        msgStr,
        msgStrPlural,
    };
}
//# sourceMappingURL=convert.js.map