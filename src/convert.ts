import {
  I18NEntry,
  SingleI18NEntry,
  PluralI18NEntry,
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

  return {
    meta: opts.withMeta ? parseHeader(header) : undefined,
    items: entries.map((entry) => parseEntry(entry, opts.withComments, opts.withOccurences))
  };
}

export function parseHeader(header: string): TranslationMeta | undefined {
  let entries = header.split("\n");
  let result: _ParseRetval;

  try {
    result = _parse(entries, false, false)
  } catch (e) {
    panic("Malformed string: can't parse: ", [e.message]);
    return;
  }

  let headers = result.msgStr.split("\n");
  return headers.reduce<TranslationMeta>((acc, header) => {
    let [name, value] = splitInTwo(header, ':').map((v) => v.replace(/^\s+|\s+$/g, ''));
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
            name: (matches[1] || '').replace(/^\s+|\s+$/g, ''),
            email: matches[2].replace(/^\s+|\s+$/g, '')
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
        if (name) {
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

  if (msgidPlural || msgStrPlural.length > 0) {
    if (!msgidPlural || msgStrPlural.length == 0) {
      panic('Invalid plural entry: absent msgid_plural or msgstr[N] strings', [msgid, msgidPlural]);
      return;
    }

    if (msgStrPlural.length !== msgStrPlural.filter((v) => !!v).length) {
      warning('Some of plural strings are untranslated', msgStrPlural);
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

  if (!msgid) {
    panic('Invalid single entry: empty msgid string', [msgid]);
    return;
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
  entries = entries.filter((e) => !!e).map((e) => e.replace(/^\s+|\s+$/g, ''));

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
            msgStrPlural[pluralMatch[1]] += JSON.parse(entry);
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
          msgStrPlural[pluralMatch[1]] = JSON.parse(body);
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
