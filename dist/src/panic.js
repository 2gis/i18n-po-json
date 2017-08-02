"use strict";
exports.__esModule = true;
var __reset = "\x1b[0m";
var __fgRed = "\x1b[31m";
var __fgYellow = "\x1b[33m";
var ERROR_PREP = __fgRed + "[i18n po->json convert ERROR] " + __reset;
var WARN_PREP = __fgYellow + "[i18n po->json convert WARNING] " + __reset;
var _panicImpl = function (message, invalidStrings) {
    console.error(ERROR_PREP + message);
    console.error('Problematic strings: ', invalidStrings);
};
var _warningImpl = function (message, invalidStrings) {
    console.warn(WARN_PREP + message);
    console.warn('Problematic strings: ', invalidStrings);
};
// Panic & warning overriding for some testing abilities
var panicImpl = _panicImpl;
var warningImpl = _warningImpl;
exports.panic = function (s, invalidStrings) { return panicImpl(s, invalidStrings); };
exports.warning = function (s, invalidStrings) { return warningImpl(s, invalidStrings); };
function overridePanic(cb) {
    if (cb === void 0) { cb = _panicImpl; }
    panicImpl = cb;
}
exports.overridePanic = overridePanic;
function overrideWarning(cb) {
    if (cb === void 0) { cb = _warningImpl; }
    warningImpl = cb;
}
exports.overrideWarning = overrideWarning;
