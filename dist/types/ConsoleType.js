"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.someConsoleType = exports.ConsoleType = void 0;
var ConsoleType;
(function (ConsoleType) {
    ConsoleType[ConsoleType["INFO"] = 0] = "INFO";
    ConsoleType[ConsoleType["WARN"] = 1] = "WARN";
    ConsoleType[ConsoleType["ERROR"] = 2] = "ERROR";
})(ConsoleType = exports.ConsoleType || (exports.ConsoleType = {}));
var someConsoleType = function (consoleType) {
    return consoleType === ConsoleType.INFO ||
        consoleType === ConsoleType.WARN ||
        consoleType === ConsoleType.ERROR;
};
exports.someConsoleType = someConsoleType;
