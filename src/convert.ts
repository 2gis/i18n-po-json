import {
  I18NEntry,
  TranslationJson,
  TranslationMeta
} from 'i18n-proto';
import { PoOptions } from './types';
import { panic, warning } from './panic';

const commentRegex = /^\s*#\s?\.\s?(.*)$/i;
const occurenceRegex = /^\s*#\s?:\s?(.*)$/i;

export function splitInTwo(src: string, separator: string = ' '): [string, string] {
  let i = src.indexOf(separator);
  if (i === -1) { // no separator
    return [src, ''];
  }
  return [src.slice(0, i), src.slice(i + 1)];
}

export function convert(data: string, opts: PoOptions): TranslationJson {
  // entries should be separated with double CRLF
  let entries = data.split("\n\n").filter((e) => !!e);
  // first entry should be header
  let header = entries.shift();
  let items = entries.reduce((acc, entry) => {
    const e = parseEntry(entry, opts.withComments, opts.withOccurences);
    return e ? acc.concat(e) : acc;
   }, [] as Array<I18NEntry>);

  return {
    meta: header ? parseHeader(header, opts) : undefined,
    items
  };
}

export function parseHeader(header: string, opts: PoOptions): TranslationMeta | undefined {
  if (!opts.withMeta) {
    return;
  }

  let entries = header.split("\n");
  let result: _ParseRetval;

  try {
    result = _parse(entries, false, false)
  } catch (e) {
    panic("Malformed string: can't parse: ", [e.message]);
    return;
  }

  let headers = result.msgStr ? result.msgStr.split("\n") : [];

  if (opts.withMeta === 'plural') {
    const pluralHeader = headers.filter((headerItem) => {
      return headerItem.indexOf("Plural-Forms") === 0;
    })[0];

    if (!pluralHeader.length) {
      return;
    }

    const value = splitInTwo(pluralHeader, ':').map((v) => v.trim())[1];

    return {
      pluralForms: value
    } as TranslationMeta;

  }

  return headers.reduce<TranslationMeta>((acc, header) => {
    if (header === '') {
      return acc;
    }
    let [name, value] = splitInTwo(header, ':').map((v) => v.trim());
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
        let matches = value.match(/(.*)\s*<(.+?)>/)
        if (matches) {
          acc.lastTranslator = {
            name: (matches[1] || '').trim(),
            email: matches[2].trim()
          };
        } else {
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
        // allow X- header
        if (!/^X-/.test(name)) {
          warning('PO header: unknown clause', [name, value]);
        }
    }
    return acc;
  }, {} as TranslationMeta);
}

export function parseEntry(entry: string, withComments: boolean, withOccurences: boolean): I18NEntry | undefined {
  let entries = entry.split("\n");
  let result: _ParseRetval;

  try {
    result = _parse(entries, withComments, withOccurences)
  } catch (e) {
    panic("Malformed string: can't parse: ", [e.message]);
    return;
  }

  let {
    comments, occurences,
    context, msgid, msgidPlural,
    msgStr, msgStrPlural,
  } = result;

  if (!msgid) {
    panic('Invalid single entry: empty msgid string', entries);
    return;
  }

  if (msgidPlural || msgStrPlural.length > 0) {
    if (!msgidPlural || msgStrPlural.length == 0) {
      panic('Invalid plural entry: absent msgid_plural or msgstr[N] strings', [msgid, ...entries]);
      return;
    }

    if (msgStrPlural.length !== msgStrPlural.filter((v) => !!v).length) {
      warning('Some of plural strings are untranslated', [msgid, ...msgStrPlural]);
    }

    // valid plural form
    return {
      type: 'plural',
      entry: [msgid, msgidPlural],
      context: context,
      translations: msgStrPlural,
      occurences: occurences.length > 0 ? occurences : undefined,
      comments: comments.length > 0 ? comments : undefined
    }
  }

  if (!msgStr) {
    warning('String is untranslated', [msgid]);
  }

  return {
    type: 'single',
    entry: msgid,
    context: context,
    translation: msgStr || undefined,
    occurences: occurences.length > 0 ? occurences : undefined,
    comments: comments.length > 0 ? comments : undefined
  }
}

type _ParseRetval = {
  comments: string[],
  occurences: string[],
  context?: string,
  msgid?: string,
  msgidPlural?: string,
  msgStr?: string,
  msgStrPlural: string[]
};

// Exported for testing only!
export function _parse(entries: string[], withComments: boolean, withOccurences: boolean): _ParseRetval {
  // prepare entries, trim spaces, etc
  entries = entries.filter((e) => !!e).map((e) => e.trim());

  let lastMode = null;

  let comments: string[] = [];
  let occurences: string[] = [];
  let context: string | undefined;
  let msgid: string | undefined;
  let msgidPlural: string | undefined;
  let msgStr: string | undefined;
  let msgStrPlural: string[] = [];

  for (let entry of entries) {
    // string continuations
    if (lastMode && entry[0] === '"') {
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
          let pluralMatch = lastMode.match(/msgstr\[(\d+)\]/i);
          if (pluralMatch) {
            const idx = parseInt(pluralMatch[1], 10);
            msgStrPlural[idx] += JSON.parse(entry);
          }
          break;
      }
      continue;
    } else {
      lastMode = null;
    }

    // comment
    if (withComments) {
      let commentMatch = entry.match(commentRegex);
      if (commentMatch) {
        comments.push(commentMatch[1]);
        continue;
      }
    }

    // occurence
    if (withOccurences) {
      let occurenceMatch = entry.match(occurenceRegex);
      if (occurenceMatch) {
        occurences.push(occurenceMatch[1]);
        continue;
      }
    }

    // common instructions
    let [instruction, body] = splitInTwo(entry);
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
        let pluralMatch = instruction.match(/msgstr\[(\d+)\]/i);
        if (pluralMatch) {
          const idx = parseInt(pluralMatch[1], 10);
          msgStrPlural[idx] = JSON.parse(body);
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
