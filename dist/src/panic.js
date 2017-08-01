"use strict";
exports.__esModule = true;
var __reset = "\x1b[0m";
var __fgRed = "\x1b[31m";
var __fgYellow = "\x1b[33m";
var ERROR_PREP = __fgRed + "[i18n po->json convert ERROR] " + __reset;
var WARN_PREP = __fgYellow + "[i18n po->json convert WARNING] " + __reset;
function panic(message, invalidStrings) {
    console.error(ERROR_PREP + message);
    console.error('Problematic strings: ', invalidStrings);
}
exports.panic = panic;
function warning(message, invalidStrings) {
    console.warn(WARN_PREP + message);
    console.warn('Problematic strings: ', invalidStrings);
}
exports.warning = warning;
