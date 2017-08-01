import { I18NEntry } from 'i18n-proto';

export type PoOptions = {
  withOccurences: boolean,
  withComments: boolean,
  withMeta: boolean,
};

export type Meta = {
  projectIdVersion: string,
  reportMsgidBugsTo: string, // email
  potCreationDate: string,
  poRevisionDate: string,
  lastTranslator: {
    name: string,
    email: string
  },
  language: string,
  languageTeam: string,
  pluralForms: string, // (n: number) => number
  mimeVersion: string,
  contentType: string,
  contentTransferEncoding: string,
  generatedBy: string
};

export type PoData = {
  meta?: Meta,
  items: I18NEntry[]
};
