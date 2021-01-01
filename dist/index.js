"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isExludeMessage = exports.someSpyCalled = exports.createSpies = exports.createConfig = exports.validateConfig = void 0;
var chai = __importStar(require("chai"));
var sinon = __importStar(require("sinon"));
var ConsoleType_1 = require("./types/ConsoleType");
//TODO: how to use es6 import in sinon-chai
// import * as sinonChai from 'sinon-chai';
var sinonChai = require('sinon-chai');
chai.should();
chai.use(sinonChai);
//TODO
//1. extend isExlcudeMessage for spiesMap
//2. delete spies and set undefined? add tests for deleteSpies
function failOnConsoleError(config) {
    if (config === void 0) { config = {}; }
    //TODO: should be type Spies - get() set() not available
    var spies; // Map<number, sinon.SinonSpy>
    exports.validateConfig(config);
    config = exports.createConfig(config);
    Cypress.on('window:before:load', function (win) {
        spies = exports.createSpies(config, win.console);
    });
    // needs to be cleaned to ensure multiple tests are failing
    // create 1 cypress integration test to run with multiple tests, ensuring its contine executing tests
    Cypress.on('command:enqueued', function () {
        spies = undefined;
    });
    Cypress.on('command:end', function () {
        if (!spies.get(ConsoleType_1.ConsoleType.ERROR) || !exports.someSpyCalled(spies)) {
            return;
        }
        if (!exports.isExludeMessage(spies.get(ConsoleType_1.ConsoleType.ERROR), config)) {
            chai.expect(spies.get(ConsoleType_1.ConsoleType.ERROR)).to.have.callCount(0);
        }
    });
}
exports.default = failOnConsoleError;
var validateConfig = function (config) {
    var _a, _b;
    (_a = config.excludeMessages) === null || _a === void 0 ? void 0 : _a.forEach(function (_excludeMessage) {
        chai.expect(_excludeMessage.trim().length === 0, 'excludeMessages contains empty string').not.to.be.true;
    });
    (_b = config.includeConsoleTypes) === null || _b === void 0 ? void 0 : _b.forEach(function (_includeConsoleType) {
        chai.expect(!ConsoleType_1.containsConsoleType(_includeConsoleType), 'includeConsoleTypes contains unknown ConsoleType').not.to.be.true;
    });
};
exports.validateConfig = validateConfig;
var createConfig = function (config) {
    var _a;
    var includeConsoleTypes = ((_a = config.includeConsoleTypes) === null || _a === void 0 ? void 0 : _a.length) ? config.includeConsoleTypes
        : [ConsoleType_1.ConsoleType.ERROR];
    return __assign(__assign({}, config), { includeConsoleTypes: includeConsoleTypes });
};
exports.createConfig = createConfig;
var createSpies = function (config, console) {
    var _a;
    var spies = new Map();
    (_a = config.includeConsoleTypes) === null || _a === void 0 ? void 0 : _a.forEach(function (_consoleType) {
        var functionName = ConsoleType_1.ConsoleType[_consoleType].toLowerCase();
        spies.set(_consoleType, sinon.spy(console, functionName));
    });
    return spies;
};
exports.createSpies = createSpies;
var someSpyCalled = function (spies) {
    return Array.from(spies).some(function (_a) {
        var key = _a[0], value = _a[1];
        return value.called;
    });
};
exports.someSpyCalled = someSpyCalled;
var isExludeMessage = function (spy, config) {
    if (!config.excludeMessages) {
        return false;
    }
    var errorMessage = spy.args[0][0];
    chai.expect(errorMessage).not.to.be.undefined;
    return config.excludeMessages.some(function (_excludeMessage) {
        var _a;
        var hasMatch = ((_a = errorMessage.match(_excludeMessage)) === null || _a === void 0 ? void 0 : _a.length) || 0;
        return hasMatch > 0;
    });
};
exports.isExludeMessage = isExludeMessage;
