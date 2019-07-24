import { I18NEntry, TranslationJson, TranslationMeta } from 'i18n-proto';
import { PoOptions } from './types';
export declare function splitInTwo(src: string, separator?: string): [string, string];
export declare function convert(data: string, opts: PoOptions): TranslationJson;
export declare function parseHeader(headerString: string, opts: PoOptions): TranslationMeta | undefined;
export declare function parseEntry(entry: string, withComments: boolean, withOccurences: boolean): I18NEntry | undefined;
declare type _ParseRetval = {
    comments: string[];
    occurences: string[];
    context?: string;
    msgid?: string;
    msgidPlural?: string;
    msgStr?: string;
    msgStrPlural: string[];
};
export declare function _parse(entries: string[], withComments: boolean, withOccurences: boolean): _ParseRetval;
export {};
