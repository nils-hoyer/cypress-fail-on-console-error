// The helpers behind the plugin. They aren't public API: the exports field in
// package.json only lists dist/index.js, and the unit tests import this file from dist/.
export const consoleTypes = [
    'error',
    'warn',
    'info',
    'debug',
    'trace',
    'table',
    'log',
    'assert',
];
const options = [
    'ignoreConsoleMessages',
    'consoleTypes',
    'debug',
];
// options that were renamed, with their new name
const renamedOptions = new Map([
    ['consoleMessages', 'ignoreConsoleMessages'],
]);
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
// a mistake in the config, not a failed check of the app, so a plain Error
const invalidConfig = (message) => {
    throw new Error(`cypress-fail-on-console-error: ${message}`);
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
    // new RegExp('') and /(?:)/ match every message
    if (pattern instanceof RegExp && pattern.source === '(?:)') {
        invalidConfig(`${name} must not be an empty RegExp`);
    }
    try {
        toRegExp(pattern);
    }
    catch (error) {
        invalidConfig(`${name} is not a valid regular expression. ${error.message}. Escape special characters to match them literally.`);
    }
};
const validateIgnoreConsoleMessages = (ignoreConsoleMessages) => {
    if (ignoreConsoleMessages == null)
        return;
    if (!Array.isArray(ignoreConsoleMessages)) {
        invalidConfig(`ignoreConsoleMessages must be an array, got ${typeName(ignoreConsoleMessages)}`);
    }
    ignoreConsoleMessages.forEach((consoleMessage, index) => {
        const name = `ignoreConsoleMessages[${index}]`;
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
// a typo in an option name would otherwise be ignored without notice
const validateOptionNames = (config) => {
    Object.keys(config).forEach((key) => {
        const renamedTo = renamedOptions.get(key);
        if (renamedTo) {
            invalidConfig(`${key} was renamed to ${renamedTo}`);
        }
        if (!options.includes(key)) {
            invalidConfig(`unknown option ${JSON.stringify(key)}, must be one of ${options.join(', ')}`);
        }
    });
};
export const validateConfig = (config) => {
    if (typeof config !== 'object' ||
        config === null ||
        Array.isArray(config)) {
        invalidConfig(`config must be an object, got ${typeName(config)}`);
    }
    validateOptionNames(config);
    validateIgnoreConsoleMessages(config.ignoreConsoleMessages);
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
export const createConfig = (config) => { var _a; var _b, _c; return ({
    ignoreConsoleMessages: ((_b = config.ignoreConsoleMessages) !== null && _b !== void 0 ? _b : []).map(copyConsoleMessage),
    consoleTypes: ((_a = config.consoleTypes) === null || _a === void 0 ? void 0 : _a.length)
        ? [...new Set(config.consoleTypes)]
        : ['error'],
    debug: (_c = config.debug) !== null && _c !== void 0 ? _c : false,
}); };
// compiles string patterns once, instead of on every check
export const compileConsoleMessages = (consoleMessages) => consoleMessages.map((consoleMessage) => isTypedConsoleMessage(consoleMessage)
    ? {
        consoleMessage,
        type: consoleMessage.type,
        regExp: toRegExp(consoleMessage.message),
    }
    : { consoleMessage, regExp: toRegExp(consoleMessage) });
export const createSpies = (config, console) => {
    var _a;
    let spies = new Map();
    (_a = config.consoleTypes) === null || _a === void 0 ? void 0 : _a.forEach((consoleType) => {
        //TODO: function table does not exists on node.Console
        spies.set(consoleType, Cypress.sinon.spy(console, consoleType));
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
        (_a = spies.get(consoleType)) !== null && _a !== void 0 ? _a : Cypress.sinon.spy(console, consoleType),
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
// the first pattern that matches the call; a { type, message } pattern only matches calls of its console method
export const findIgnoringConsoleMessage = (consoleCall, compiledConsoleMessages) => compiledConsoleMessages.find(({ type, regExp }) => (type === undefined || type === consoleCall.type) &&
    isConsoleMessageExcluded(consoleCall.message, regExp));
// logs each call to the command log and returns the calls that aren't ignored
export const checkConsoleCalls = (consoleCalls, compiledConsoleMessages, debug) => consoleCalls.filter((consoleCall) => {
    const ignoredBy = findIgnoringConsoleMessage(consoleCall, compiledConsoleMessages);
    if (ignoredBy === undefined) {
        logConsoleCall(consoleCall, compiledConsoleMessages);
        return true;
    }
    if (debug)
        logIgnoredConsoleCall(consoleCall, ignoredBy);
    return false;
});
export const consoleCallsToString = (consoleCalls) => consoleCalls
    .map((consoleCall) => `console.${consoleCall.type}: ${consoleCall.message}`)
    .join('\n');
const toRegExp = (consoleMessage) => consoleMessage instanceof RegExp
    ? consoleMessage
    : new RegExp(consoleMessage);
export const isConsoleMessageExcluded = (consoleMessage, configConsoleMessage) => {
    const configConsoleMessageRegExp = toRegExp(configConsoleMessage);
    // test() starts at lastIndex for /g and /y patterns and moves it on a match
    configConsoleMessageRegExp.lastIndex = 0;
    return configConsoleMessageRegExp.test(consoleMessage);
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
const formatSpecifierToString = (specifier, argument) => {
    switch (specifier) {
        case '%d':
        case '%i':
            return typeof argument === 'symbol'
                ? 'NaN'
                : String(parseInt(argument, 10));
        case '%f':
            return typeof argument === 'symbol'
                ? 'NaN'
                : String(parseFloat(argument));
        // CSS for the browser console, not part of the message
        case '%c':
            return '';
        default:
            return argumentToString(argument);
    }
};
// fills in format specifiers as the browser does, so console.error('Warning: %s is deprecated', 'componentWillMount')
// becomes "Warning: componentWillMount is deprecated". Arguments left over are appended.
const formatArguments = (args) => {
    const [format, ...rest] = args;
    if (typeof format !== 'string' || rest.length === 0)
        return args;
    const formatted = format.replace(/%[sdifoOc]/g, (specifier) => rest.length === 0
        ? specifier
        : formatSpecifierToString(specifier, rest.shift()));
    return [formatted, ...rest];
};
export const callToString = (calls) => formatArguments(calls).map(argumentToString).join(' ').trim();
// the reporter renders Cypress.log messages as Markdown, which would format characters like * and _
export const escapeMarkdown = (text) => text.replace(/[\\`*_~[\]()<>&]/g, '\\$&');
// a pattern as it is written in the config
export const consoleMessageToString = (consoleMessage) => {
    if (isTypedConsoleMessage(consoleMessage)) {
        return `{ type: '${consoleMessage.type}', message: ${consoleMessageToString(consoleMessage.message)} }`;
    }
    return consoleMessage instanceof RegExp
        ? String(consoleMessage)
        : `'${consoleMessage.replace(/[\\']/g, '\\$&')}'`;
};
// a pattern as it is matched: strings become RegExps
const compiledConsoleMessageToPattern = ({ type, regExp, }) => type === undefined ? regExp : { type, message: regExp };
// clicking the entry prints the original arguments, the matched text and the patterns
// that didn't match to the browser console, where they can be inspected
export const logConsoleCall = (consoleCall, compiledConsoleMessages) => {
    const name = `console.${consoleCall.type}`;
    Cypress.log({
        name,
        displayName: name,
        message: escapeMarkdown(consoleCall.message),
        consoleProps: () => ({
            'Console method': name,
            Arguments: consoleCall.args,
            'Matched against': consoleCall.message,
            'Patterns tried': compiledConsoleMessages.map(compiledConsoleMessageToPattern),
        }),
    });
};
// with debug: true, shows which pattern ignored a console call
export const logIgnoredConsoleCall = (consoleCall, ignoredBy) => {
    const name = `console.${consoleCall.type}`;
    Cypress.log({
        name: 'ignored',
        displayName: 'ignored',
        message: `**${escapeMarkdown(consoleMessageToString(ignoredBy.consoleMessage))}** matched ${name}: ${escapeMarkdown(consoleCall.message)}`,
        consoleProps: () => ({
            'Console method': name,
            Arguments: consoleCall.args,
            'Ignored by': ignoredBy.consoleMessage,
            'As RegExp': ignoredBy.regExp,
            'Matched against': consoleCall.message,
        }),
    });
};
