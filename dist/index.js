"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.consoleType = exports.isExcludedMessage = exports.someIncludedCall = exports.getIncludedSpy = exports.someSpyCalled = exports.resetSpies = exports.createSpies = exports.createConfig = exports.validateConfig = void 0;
var chai = __importStar(require("chai"));
var sinon = __importStar(require("sinon"));
var sinon_chai_1 = __importDefault(require("sinon-chai"));
var ConsoleType_1 = require("./types/ConsoleType");
chai.should();
chai.use(sinon_chai_1.default);
function failOnConsoleError(config) {
    if (config === void 0) { config = {}; }
    var spies;
    exports.validateConfig(config);
    config = exports.createConfig(config);
    Cypress.on('window:before:load', function (win) {
        spies = exports.createSpies(config, win.console);
    });
    Cypress.on('command:enqueued', function () {
        if (spies) {
            spies = exports.resetSpies(spies);
        }
    });
    Cypress.on('command:end', function () {
        if (!spies || !exports.someSpyCalled(spies)) {
            return;
        }
        var spy = exports.getIncludedSpy(spies, config);
        if (spy) {
            chai.expect(spy).to.have.callCount(0);
        }
    });
}
exports.default = failOnConsoleError;
var validateConfig = function (config) {
    if (config.excludeMessages) {
        chai.expect(config.excludeMessages).not.to.be.empty;
        config.excludeMessages.forEach(function (_excludeMessage) {
            chai.expect(_excludeMessage).to.be.a('string');
            chai.expect(_excludeMessage).to.have.length.above(0);
        });
    }
    if (config.includeConsoleTypes) {
        chai.expect(config.includeConsoleTypes).not.to.be.empty;
        config.includeConsoleTypes.forEach(function (_includeConsoleType) {
            chai.expect(ConsoleType_1.someConsoleType(_includeConsoleType), "includeConsoleTypes '" + _includeConsoleType + "' is an unknown ConsoleType").to.be.true;
        });
    }
};
exports.validateConfig = validateConfig;
var createConfig = function (config) {
    var _a;
    return {
        excludeMessages: config.excludeMessages,
        includeConsoleTypes: ((_a = config.includeConsoleTypes) === null || _a === void 0 ? void 0 : _a.length) ? config.includeConsoleTypes
            : [ConsoleType_1.ConsoleType.ERROR],
    };
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
var resetSpies = function (spies) {
    spies.forEach(function (_spy) { return _spy.resetHistory(); });
    return spies;
};
exports.resetSpies = resetSpies;
var someSpyCalled = function (spies) {
    return Array.from(spies.values()).some(function (value) { return value.called; });
};
exports.someSpyCalled = someSpyCalled;
var getIncludedSpy = function (spies, config) {
    return Array.from(spies.values()).find(function (spy) { return spy.called && exports.someIncludedCall(spy, config); });
};
exports.getIncludedSpy = getIncludedSpy;
var someIncludedCall = function (spy, config) {
    if (!config.excludeMessages) {
        return true;
    }
    return spy.args.some(function (call) {
        return !exports.isExcludedMessage(config.excludeMessages, "" + call[0]);
    });
};
exports.someIncludedCall = someIncludedCall;
var isExcludedMessage = function (excludeMessages, message) {
    return excludeMessages.some(function (_excludeMessage) {
        var _a;
        var hasMatch = ((_a = message.match(_excludeMessage)) === null || _a === void 0 ? void 0 : _a.length) || 0;
        return hasMatch > 0;
    });
};
exports.isExcludedMessage = isExcludedMessage;
exports.consoleType = ConsoleType_1.ConsoleType;
