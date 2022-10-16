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
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
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
exports.cypressLogger = exports.callToString = exports.isConsoleMessageExcluded = exports.findConsoleMessageIncluded = exports.getConsoleMessageIncluded = exports.resetSpies = exports.createSpies = exports.createConfig = exports.validateConfig = void 0;
var chai = __importStar(require("chai"));
var chai_1 = require("chai");
var os_1 = require("os");
var sinon = __importStar(require("sinon"));
var sinon_chai_1 = __importDefault(require("sinon-chai"));
var type_detect_1 = __importDefault(require("type-detect"));
chai.should();
chai.use(sinon_chai_1.default);
function failOnConsoleError(_config) {
    if (_config === void 0) { _config = {}; }
    var originConfig;
    var config;
    var spies;
    var getConfig = function () { return config; };
    var setConfig = function (_config) {
        (0, exports.validateConfig)(_config);
        config = (0, exports.createConfig)(_config);
        originConfig = originConfig !== null && originConfig !== void 0 ? originConfig : __assign({}, config);
    };
    setConfig(_config);
    Cypress.on('window:before:load', function (window) {
        spies = (0, exports.createSpies)(config, window.console);
    });
    Cypress.on('command:end', function () {
        if (!spies)
            return;
        var consoleMessage = (0, exports.getConsoleMessageIncluded)(spies, config);
        spies = (0, exports.resetSpies)(spies);
        if (!consoleMessage)
            return;
        throw new chai_1.AssertionError("cypress-fail-on-console-error: ".concat(os_1.EOL, " ").concat(consoleMessage));
    });
    Cypress.on('test:after:run', function () {
        if (spies) {
            spies = (0, exports.resetSpies)(spies);
        }
        setConfig(originConfig);
    });
    return {
        getConfig: getConfig,
        setConfig: setConfig,
    };
}
exports.default = failOnConsoleError;
var validateConfig = function (config) {
    if (config.consoleMessages) {
        config.consoleMessages.forEach(function (consoleMessage) {
            chai.expect((0, type_detect_1.default)(consoleMessage)).to.be.oneOf([
                'string',
                'RegExp',
            ]);
            chai.expect(consoleMessage.toString()).to.have.length.above(0);
        });
    }
    if (config.consoleTypes) {
        chai.expect(config.consoleTypes).not.to.be.empty;
        config.consoleTypes.forEach(function (consoleType) {
            chai.expect(['error', 'warn', 'info']).contains(consoleType);
        });
    }
};
exports.validateConfig = validateConfig;
var createConfig = function (config) {
    var _a, _b, _c;
    return ({
        consoleMessages: (_a = config.consoleMessages) !== null && _a !== void 0 ? _a : [],
        consoleTypes: ((_b = config.consoleTypes) === null || _b === void 0 ? void 0 : _b.length) ? config.consoleTypes : ['error'],
        debug: (_c = config.debug) !== null && _c !== void 0 ? _c : false,
    });
};
exports.createConfig = createConfig;
var createSpies = function (config, console) {
    var _a;
    var spies = new Map();
    (_a = config.consoleTypes) === null || _a === void 0 ? void 0 : _a.forEach(function (consoleType) {
        spies.set(consoleType, sinon.spy(console, consoleType));
    });
    return spies;
};
exports.createSpies = createSpies;
var resetSpies = function (spies) {
    spies.forEach(function (spy) { return spy.resetHistory(); });
    return spies;
};
exports.resetSpies = resetSpies;
var getConsoleMessageIncluded = function (spies, config) {
    var includedConsoleMessage;
    Array.from(spies.values()).find(function (spy) {
        if (!spy.called)
            return false;
        includedConsoleMessage = (0, exports.findConsoleMessageIncluded)(spy, config);
        return includedConsoleMessage !== undefined;
    });
    return includedConsoleMessage;
};
exports.getConsoleMessageIncluded = getConsoleMessageIncluded;
var findConsoleMessageIncluded = function (spy, config) {
    var consoleMessages = spy.args.map(function (call) { return (0, exports.callToString)(call); });
    if (config.consoleMessages.length === 0) {
        return consoleMessages[0];
    }
    return consoleMessages.find(function (consoleMessage) {
        var someConsoleMessagesExcluded = config.consoleMessages.some(function (configConsoleMessage) {
            return (0, exports.isConsoleMessageExcluded)(consoleMessage, configConsoleMessage, config.debug);
        });
        if (config.debug) {
            (0, exports.cypressLogger)('consoleMessage_excluded', {
                consoleMessage: consoleMessage,
                someConsoleMessagesExcluded: someConsoleMessagesExcluded,
            });
        }
        return !someConsoleMessagesExcluded;
    });
};
exports.findConsoleMessageIncluded = findConsoleMessageIncluded;
var isConsoleMessageExcluded = function (consoleMessage, configConsoleMessage, debug) {
    var configConsoleMessageRegExp = configConsoleMessage instanceof RegExp
        ? configConsoleMessage
        : new RegExp(configConsoleMessage);
    var consoleMessageExcluded = configConsoleMessageRegExp.test(consoleMessage);
    if (debug) {
        (0, exports.cypressLogger)('consoleMessage_configConsoleMessage_match', {
            consoleMessage: consoleMessage,
            configConsoleMessage: configConsoleMessage,
            consoleMessageExcluded: consoleMessageExcluded,
        });
    }
    return consoleMessageExcluded;
};
exports.isConsoleMessageExcluded = isConsoleMessageExcluded;
var callToString = function (calls) {
    return calls
        .reduce(function (previousValue, currentValue) {
        var _a;
        var _value = (_a = currentValue === null || currentValue === void 0 ? void 0 : currentValue.stack) !== null && _a !== void 0 ? _a : currentValue;
        var _currentValue = typeof _value !== 'string' ? JSON.stringify(_value) : _value;
        return "".concat(previousValue, " ").concat(_currentValue);
    }, '')
        .trim();
};
exports.callToString = callToString;
var cypressLogger = function (name, message) {
    Cypress.log({
        name: name,
        displayName: name,
        message: JSON.stringify(message),
        consoleProps: function () { return message; },
    });
};
exports.cypressLogger = cypressLogger;
