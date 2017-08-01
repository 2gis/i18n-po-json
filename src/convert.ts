import { I18NEntry, SingleI18NEntry, PluralI18NEntry } from 'i18n-proto';
import { PoData, PoOptions } from './types';

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

}

export function parseEntry(entry: string, withComments: boolean, withOccurences: boolean): I18NEntry {
  let entries = entry.split("\n").filter((e) => !!e);
  let lastMode = null;

  let comments: string[] = [];
  let occurences: string[] = [];
  let context: string;
  let msgid: string;
  let msgidPlural: string;
  let msgStr: string;
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

  if (msgidPlural || msgStrPlural.length > 0) {
    if (msgidPlural && msgStrPlural.length > 0) {
      // valid plural form
      return {
        type: 'plural',
        entry: [msgid, msgidPlural],

      }
    }
  }
}

