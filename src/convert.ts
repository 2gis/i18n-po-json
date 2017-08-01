import { I18NEntry, SingleI18NEntry, PluralI18NEntry } from 'i18n-proto';
import { PoData, PoOptions } from './types';
import { panic, warning } from './panic';

const commentRegex = /^\s*#\s?\.\s?(.*)$/i;
const occurenceRegex = /^\s*#\s?:\s?(.*)$/i;

export function convert(data: string, opts: PoOptions): PoData {
  // entries should be separated with double CRLF
  let entries = data.split("\n\n").filter((e) => !!e);
  // first entry should be header
  let header = entries.shift();

  return {
    meta: opts.withMeta ? parseHeader(header) : undefined,
    items: entries.map((entry) => parseEntry(entry, opts.withComments, opts.withOccurences))
  };
}

export function parseHeader(header: string): PoData['meta'] {
  let entries = header.split("\n").filter((e) => !!e);
  let { msgStr } = parse(entries, false, false);
  let headers = msgStr.split("\n");
  return headers.reduce<PoData['meta']>((acc, header) => {
    let [name, value] = header.split(/\s*:\s*/, 2);
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
          acc.lastTranslator = { name: matches[1], email: matches[2] };
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
    }
    return acc;
  }, {} as PoData['meta']);
}

export function parseEntry(entry: string, withComments: boolean, withOccurences: boolean): I18NEntry | undefined {
  let entries = entry.split("\n").filter((e) => !!e);
  let {
    comments, occurences,
    context, msgid, msgidPlural,
    msgStr, msgStrPlural,
  } = parse(entries, withComments, withOccurences);

  if (msgidPlural || msgStrPlural.length > 0) {
    if (!msgidPlural || msgStrPlural.length == 0) {
      panic('Invalid plural entry: absent msgid_plural or msgstr[N] strings', [msgid, msgidPlural]);
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
    translation: msgStr || '',
    occurences: occurences.length > 0 ? occurences : undefined,
    comments: comments.length > 0 ? comments : undefined
  }
}

function parse(entries: string[], withComments: boolean, withOccurences: boolean) {
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
          let pluralMatch = lastMode.match(/msgid\[(\d+)\]/i);
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
    let [instruction, body] = entry.split(' ', 2);
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
        let pluralMatch = instruction.match(/msgid\[(\d+)\]/i);
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
