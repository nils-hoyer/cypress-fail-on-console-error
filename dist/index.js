import * as chai from 'chai';
import { AssertionError } from 'chai';
import * as sinon from 'sinon';
import sinonChai from 'sinon-chai';
const consoleTypes = [
    'error',
    'warn',
    'info',
    'debug',
    'trace',
    'table',
    'log',
    'assert',
];
chai.should();
chai.use(sinonChai);
export default function failOnConsoleError(_config = {}) {
    let originConfig;
    let config;
    // config with the patterns compiled to RegExps
    let compiledConfig;
    let spies;
    // the console that the spies were last created on
    let autConsole;
    const getConfig = () => config;
    const setConfig = (_config) => {
        validateConfig(_config);
        config = createConfig(_config);
        compiledConfig = compileConfig(config);
        // a separate copy, so changes to getConfig() don't outlive the test
        originConfig = originConfig !== null && originConfig !== void 0 ? originConfig : createConfig(config);
        if (spies && autConsole) {
            spies = updateSpies(spies, config, autConsole);
        }
    };
    setConfig(_config);
    const setSpies = (window) => {
        autConsole = window.console;
        spies = createSpies(config, window.console);
    };
    if (Cypress.testingType === 'component') {
        before(() => cy.window().then(setSpies));
    }
    else {
        Cypress.on('window:before:load', setSpies);
    }
    Cypress.on('command:end', () => {
        if (!spies)
            return;
        const consoleCalls = getConsoleCallsIncluded(spies, compiledConfig);
        spies = resetSpies(spies);
        if (consoleCalls.length === 0)
            return;
        consoleCalls.forEach(logConsoleCall);
        throw new AssertionError(`cypress-fail-on-console-error:\n${consoleCallsToString(consoleCalls)}`);
    });
    Cypress.on('test:after:run', () => {
        if (spies) {
            spies = resetSpies(spies);
        }
        setConfig(originConfig);
    });
    return {
        getConfig,
        setConfig,
    };
}
/**
 * Registers the commands getConsoleMessages, setConsoleMessages, addConsoleMessages
 * and deleteConsoleMessages, which read and change consoleMessages for the current test.
 */
export const addConsoleMessagesCommands = ({ getConfig, setConfig, }) => {
    const setConsoleMessages = (consoleMessages) => setConfig(Object.assign(Object.assign({}, getConfig()), { consoleMessages }));
    Cypress.Commands.addAll({
        getConsoleMessages: () => cy.wrap(getConfig().consoleMessages, { log: false }),
        setConsoleMessages,
        addConsoleMessages: (consoleMessages) => setConsoleMessages([
            ...getConfig().consoleMessages,
            ...consoleMessages,
        ]),
        deleteConsoleMessages: (consoleMessages) => setConsoleMessages(getConfig().consoleMessages.filter((consoleMessage) => !consoleMessages.some((deleted) => isSameConsoleMessage(consoleMessage, deleted)))),
    });
};
// a string and a RegExp with the same text are different patterns
const consoleMessageKey = (consoleMessage) => {
    if (isTypedConsoleMessage(consoleMessage)) {
        return `${consoleMessage.type}:${consoleMessageKey(consoleMessage.message)}`;
    }
    return consoleMessage instanceof RegExp
        ? `RegExp:${consoleMessage}`
        : `string:${consoleMessage}`;
};
export const isSameConsoleMessage = (a, b) => consoleMessageKey(a) === consoleMessageKey(b);
const typeName = (value) => {
    if (value === null)
        return 'null';
    if (Array.isArray(value))
        return 'array';
    if (value instanceof RegExp)
        return 'RegExp';
    return typeof value;
};
const invalidConfig = (message) => {
    throw new AssertionError(`cypress-fail-on-console-error: ${message}`);
};
const isPattern = (value) => typeof value === 'string' || value instanceof RegExp;
const isTypedConsoleMessage = (consoleMessage) => typeof consoleMessage === 'object' &&
    consoleMessage !== null &&
    !Array.isArray(consoleMessage) &&
    !(consoleMessage instanceof RegExp);
const validateConsoleType = (name, consoleType) => {
    if (!consoleTypes.includes(consoleType)) {
        invalidConfig(`${name} must be one of ${consoleTypes.join(', ')}, got ${JSON.stringify(consoleType)}`);
    }
};
const validatePattern = (name, pattern) => {
    if (!isPattern(pattern)) {
        invalidConfig(`${name} must be a string or RegExp, got ${typeName(pattern)}`);
    }
    if (pattern === '') {
        invalidConfig(`${name} must not be an empty string`);
    }
    try {
        toRegExp(pattern);
    }
    catch (error) {
        invalidConfig(`${name} is not a valid regular expression. ${error.message}. Escape special characters to match them literally.`);
    }
};
const validateConsoleMessages = (option, consoleMessages) => {
    if (consoleMessages == null)
        return;
    if (!Array.isArray(consoleMessages)) {
        invalidConfig(`${option} must be an array, got ${typeName(consoleMessages)}`);
    }
    consoleMessages.forEach((consoleMessage, index) => {
        const name = `${option}[${index}]`;
        if (isTypedConsoleMessage(consoleMessage)) {
            validateConsoleType(`${name}.type`, consoleMessage.type);
            validatePattern(`${name}.message`, consoleMessage.message);
        }
        else if (isPattern(consoleMessage)) {
            validatePattern(name, consoleMessage);
        }
        else {
            invalidConfig(`${name} must be a string, RegExp or { type, message } object, got ${typeName(consoleMessage)}`);
        }
    });
};
export const validateConfig = (config) => {
    validateConsoleMessages('consoleMessages', config.consoleMessages);
    validateConsoleMessages('includeConsoleMessages', config.includeConsoleMessages);
    if (config.consoleTypes != null) {
        if (!Array.isArray(config.consoleTypes)) {
            invalidConfig(`consoleTypes must be an array, got ${typeName(config.consoleTypes)}`);
        }
        if (config.consoleTypes.length === 0) {
            invalidConfig('consoleTypes must not be empty');
        }
        config.consoleTypes.forEach((consoleType, index) => validateConsoleType(`consoleTypes[${index}]`, consoleType));
    }
};
const copyConsoleMessage = (consoleMessage) => isTypedConsoleMessage(consoleMessage)
    ? Object.assign({}, consoleMessage) : consoleMessage;
// copies the arrays and objects, so the config doesn't share them with the caller
export const createConfig = (config) => { var _a; var _b, _c, _d; return ({
    consoleMessages: ((_b = config.consoleMessages) !== null && _b !== void 0 ? _b : []).map(copyConsoleMessage),
    includeConsoleMessages: ((_c = config.includeConsoleMessages) !== null && _c !== void 0 ? _c : []).map(copyConsoleMessage),
    consoleTypes: ((_a = config.consoleTypes) === null || _a === void 0 ? void 0 : _a.length)
        ? [...new Set(config.consoleTypes)]
        : ['error'],
    debug: (_d = config.debug) !== null && _d !== void 0 ? _d : false,
}); };
const compileConsoleMessage = (consoleMessage) => isTypedConsoleMessage(consoleMessage)
    ? {
        type: consoleMessage.type,
        message: toRegExp(consoleMessage.message),
    }
    : toRegExp(consoleMessage);
// compiles string patterns once, instead of on every check
export const compileConfig = (config) => (Object.assign(Object.assign({}, config), { consoleMessages: config.consoleMessages.map(compileConsoleMessage), includeConsoleMessages: config.includeConsoleMessages.map(compileConsoleMessage) }));
export const createSpies = (config, console) => {
    var _a;
    let spies = new Map();
    (_a = config.consoleTypes) === null || _a === void 0 ? void 0 : _a.forEach((consoleType) => {
        //TODO: function table does not exists on node.Console
        spies.set(consoleType, sinon.spy(console, consoleType));
    });
    return spies;
};
// keeps the spies, and their calls, of the console types that are still watched
export const updateSpies = (spies, config, console) => {
    spies.forEach((spy, consoleType) => {
        if (!config.consoleTypes.includes(consoleType))
            spy.restore();
    });
    return new Map(config.consoleTypes.map((consoleType) => { var _a; return [
        consoleType,
        (_a = spies.get(consoleType)) !== null && _a !== void 0 ? _a : sinon.spy(console, consoleType),
    ]; }));
};
export const resetSpies = (spies) => {
    spies.forEach((spy) => spy.resetHistory());
    return spies;
};
// every call since the spies were last reset, in the order the app made them
export const getConsoleCalls = (spies) => Array.from(spies.entries())
    .flatMap(([type, spy]) => spy.getCalls().map((spyCall) => ({ type, spyCall })))
    .sort((a, b) => (a.spyCall.calledBefore(b.spyCall) ? -1 : 1))
    .map(({ type, spyCall }) => toConsoleCall(type, spyCall.args))
    .filter((consoleCall) => consoleCall !== undefined);
// console.assert only logs when its first argument is falsy, and logs the remaining arguments
const toConsoleCall = (type, args) => {
    if (type !== 'assert')
        return { type, args, message: callToString(args) };
    if (args[0])
        return undefined;
    const message = callToString(args.slice(1));
    return {
        type,
        args,
        message: message ? `Assertion failed: ${message}` : 'Assertion failed',
    };
};
export const getConsoleCallsIncluded = (spies, config) => getConsoleCalls(spies).filter((consoleCall) => isConsoleCallIncluded(consoleCall, config));
export const isConsoleCallIncluded = (consoleCall, config) => {
    const consoleMessage = consoleCall.message;
    if (config.includeConsoleMessages.length > 0) {
        const consoleMessageIncluded = config.includeConsoleMessages.some((configConsoleMessage) => isConsoleCallMatched(consoleCall, configConsoleMessage, config.debug));
        if (config.debug) {
            cypressLogger('consoleMessage_included', {
                consoleMessage,
                consoleMessageIncluded,
            });
        }
        if (!consoleMessageIncluded)
            return false;
    }
    if (config.consoleMessages.length === 0)
        return true;
    const someConsoleMessagesExcluded = config.consoleMessages.some((configConsoleMessage) => isConsoleCallMatched(consoleCall, configConsoleMessage, config.debug));
    if (config.debug) {
        cypressLogger('consoleMessage_excluded', {
            consoleMessage,
            someConsoleMessagesExcluded,
        });
    }
    return !someConsoleMessagesExcluded;
};
// a { type, message } pattern only matches calls of its console method
export const isConsoleCallMatched = (consoleCall, configConsoleMessage, debug) => isTypedConsoleMessage(configConsoleMessage)
    ? configConsoleMessage.type === consoleCall.type &&
        isConsoleMessageExcluded(consoleCall.message, configConsoleMessage.message, debug)
    : isConsoleMessageExcluded(consoleCall.message, configConsoleMessage, debug);
export const consoleCallsToString = (consoleCalls) => consoleCalls
    .map((consoleCall) => `console.${consoleCall.type}: ${consoleCall.message}`)
    .join('\n');
const toRegExp = (consoleMessage) => consoleMessage instanceof RegExp
    ? consoleMessage
    : new RegExp(consoleMessage);
export const isConsoleMessageExcluded = (consoleMessage, configConsoleMessage, debug) => {
    const configConsoleMessageRegExp = toRegExp(configConsoleMessage);
    // test() starts at lastIndex for /g and /y patterns and moves it on a match
    configConsoleMessageRegExp.lastIndex = 0;
    const consoleMessageExcluded = configConsoleMessageRegExp.test(consoleMessage);
    if (debug) {
        cypressLogger('consoleMessage_configConsoleMessage_match', {
            consoleMessage,
            configConsoleMessage,
            consoleMessageExcluded,
        });
    }
    return consoleMessageExcluded;
};
// JSON.stringify throws on circular references and BigInts, which apps can pass to console methods
const stringify = (value) => {
    const ancestors = [];
    try {
        return String(JSON.stringify(value, function (_key, _value) {
            if (typeof _value === 'bigint')
                return `${_value}n`;
            if (typeof _value !== 'object' || _value === null) {
                return _value;
            }
            // `this` is the object holding _value: drop ancestors that aren't on its path
            while (ancestors.length > 0 &&
                ancestors[ancestors.length - 1] !== this) {
                ancestors.pop();
            }
            if (ancestors.indexOf(_value) !== -1)
                return '[Circular]';
            ancestors.push(_value);
            return _value;
        }));
    }
    catch (_a) {
        return Object.prototype.toString.call(value);
    }
};
// Firefox and WebKit stacks only list the frames, without the "Name: message" line V8 puts first
const errorToString = (error) => {
    const header = error.message
        ? `${error.name}: ${error.message}`
        : error.name;
    return !error.name || error.stack.startsWith(header)
        ? error.stack
        : `${header}\n${error.stack}`;
};
const argumentToString = (argument) => {
    var _a;
    if (typeof argument === 'string')
        return argument;
    if (typeof (argument === null || argument === void 0 ? void 0 : argument.stack) === 'string')
        return errorToString(argument);
    return stringify((_a = argument === null || argument === void 0 ? void 0 : argument.stack) !== null && _a !== void 0 ? _a : argument);
};
export const callToString = (calls) => calls.map(argumentToString).join(' ').trim();
// clicking the entry prints the original arguments to the browser console, where they can be inspected
export const logConsoleCall = (consoleCall) => {
    const name = `console.${consoleCall.type}`;
    Cypress.log({
        name,
        displayName: name,
        message: consoleCall.message,
        consoleProps: () => ({
            'Console method': name,
            Arguments: consoleCall.args,
        }),
    });
};
export const cypressLogger = (name, message) => {
    Cypress.log({
        name: name,
        displayName: name,
        // JSON.stringify turns a RegExp into {}
        message: JSON.stringify(message, (_key, value) => value instanceof RegExp ? String(value) : value),
        consoleProps: () => message,
    });
};
