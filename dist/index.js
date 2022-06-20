"use strict";
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
exports.consoleType = exports.cypressLogger = exports.callToString = exports.isErrorMessageExcluded = exports.findIncludedCall = exports.getIncludedCall = exports.createSpies = exports.createConfig = exports.validateConfig = void 0;
var chai = __importStar(require("chai"));
var sinon = __importStar(require("sinon"));
var sinon_chai_1 = __importDefault(require("sinon-chai"));
var ConsoleType_1 = require("./types/ConsoleType");
chai.should();
chai.use(sinon_chai_1.default);
function failOnConsoleError(config) {
    if (config === void 0) { config = {}; }
    var _spies;
    (0, exports.validateConfig)(config);
    var _config = (0, exports.createConfig)(config);
    Cypress.on('window:before:load', function (window) {
        if (!_spies) {
        }
        _spies = (0, exports.createSpies)(_config, window.console);
    });
    Cypress.on('command:end', function () {
        if (!_spies)
            return;
        var errorMessage = (0, exports.getIncludedCall)(_spies, _config);
        if (errorMessage) {
            chai.expect(errorMessage, 'console match found').to.be.undefined;
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
            chai.expect((0, ConsoleType_1.someConsoleType)(_includeConsoleType), "includeConsoleTypes '".concat(_includeConsoleType, "' is an unknown ConsoleType")).to.be.true;
        });
    }
};
exports.validateConfig = validateConfig;
var createConfig = function (config) {
    var _a, _b, _c;
    return ({
        excludeMessages: (_a = config.excludeMessages) !== null && _a !== void 0 ? _a : [],
        includeConsoleTypes: ((_b = config.includeConsoleTypes) === null || _b === void 0 ? void 0 : _b.length)
            ? config.includeConsoleTypes
            : [ConsoleType_1.ConsoleType.ERROR],
        cypressLog: (_c = config.cypressLog) !== null && _c !== void 0 ? _c : false,
    });
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
var getIncludedCall = function (spies, config) {
    var errorMessage;
    Array.from(spies.values()).forEach(function (spy) {
        if (!spy.called)
            return;
        var includedCall = (0, exports.findIncludedCall)(spy, config);
        if (includedCall !== undefined) {
            errorMessage = includedCall;
        }
    });
    return errorMessage;
};
exports.getIncludedCall = getIncludedCall;
var findIncludedCall = function (spy, config) {
    var errorMessages = spy.args.map(function (call) { return (0, exports.callToString)(call); });
    if (config.excludeMessages === undefined) {
        return errorMessages[0];
    }
    return errorMessages.find(function (_errorMessage) {
        var _isErrorMessageExcluded = config.excludeMessages.some(function (_excludeMessage) {
            return (0, exports.isErrorMessageExcluded)(_errorMessage, _excludeMessage, config.cypressLog);
        });
        if (config.cypressLog === true) {
            (0, exports.cypressLogger)('errorMessage_excluded', {
                _errorMessage: _errorMessage,
                _isErrorMessageExcluded: _isErrorMessageExcluded,
            });
        }
        return !_isErrorMessageExcluded;
    });
};
exports.findIncludedCall = findIncludedCall;
var isErrorMessageExcluded = function (errorMessage, excludeMessage, cypressLog) {
    var _a;
    var match = (((_a = errorMessage.match(excludeMessage)) === null || _a === void 0 ? void 0 : _a.length) || 0) > 0;
    if (cypressLog) {
        (0, exports.cypressLogger)('errorMessage_excludeMessage_match', {
            errorMessage: errorMessage,
            excludeMessage: excludeMessage,
            match: match,
        });
    }
    return match;
};
exports.isErrorMessageExcluded = isErrorMessageExcluded;
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
exports.consoleType = ConsoleType_1.ConsoleType;
