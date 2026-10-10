import * as sinon from 'sinon';
import failOnConsoleError, {
    addIgnoredConsoleMessagesCommands,
    callToString,
    checkConsoleCalls,
    compileConsoleMessages,
    consoleCallsToString,
    consoleMessageToString,
    createConfig,
    createSpies,
    escapeMarkdown,
    findIgnoringConsoleMessage,
    getConsoleCalls,
    isConsoleMessageExcluded,
    isSameConsoleMessage,
    logConsoleCall,
    logIgnoredConsoleCall,
    resetSpies,
    updateSpies,
    validateConfig,
    Config,
    ConsoleType,
} from '../dist/index';

import { describe, expect, it, afterEach, vi, chai } from 'vitest';

//@ts-ignore
global['Cypress'] = { on: (f, s) => true };

describe('failOnConsoleError()', () => {
    it('WHEN failOnConsoleError is created with Config THEN expect no error', () => {
        const config: Config = {
            ignoreConsoleMessages: ['foo'],
            consoleTypes: ['warn'],
            debug: true,
        };
        failOnConsoleError(config);
    });

    it('WHEN failOnConsoleError is created with no Config THEN expect no error', () => {
        failOnConsoleError();
    });

    describe('detection of testingType', () => {
        afterEach(() => {
            delete (Cypress as any).testingType;
            vi.unstubAllGlobals();
            sinon.restore();
        });

        it('WHEN running e2e tests THEN spies set on window:before:load', () => {
            Cypress.testingType = 'e2e';
            sinon.spy(Cypress);

            failOnConsoleError();
            expect(Cypress.on).calledWith('window:before:load');
        });

        it('WHEN running component tests THEN spies set in before hook', () => {
            Cypress.testingType = 'component';
            vi.stubGlobal('before', vi.fn());
            sinon.spy(Cypress);

            failOnConsoleError();
            expect(Cypress.on).not.calledWith('window:before:load');
        });
    });
});

describe('setConfig()', () => {
    it('WHEN setConfig is called with valid data THEN expect config to be set', () => {
        const config: Config = {
            ignoreConsoleMessages: ['foo'],
            consoleTypes: ['warn'],
            debug: true,
        };
        const { getConfig, setConfig } = failOnConsoleError(config);

        setConfig({ ...config, ignoreConsoleMessages: ['bar'] });

        const givenConfig = getConfig();
        expect(givenConfig.ignoreConsoleMessages).to.deep.equal(['bar']);
        expect(givenConfig.consoleTypes).to.deep.equal(['warn']);
        expect(givenConfig.debug).to.deep.equal(true);
    });

    it('WHEN getConfig().ignoreConsoleMessages is changed in a test THEN restore the config after the test', () => {
        const on = sinon.spy(Cypress, 'on');
        const config: Config = { ignoreConsoleMessages: ['foo'] };
        const { getConfig } = failOnConsoleError(config);
        const testAfterRun = on
            .getCalls()
            .find((call) => call.args[0] === 'test:after:run')
            ?.args[1] as () => void;
        on.restore();

        getConfig().ignoreConsoleMessages.push('bar');
        testAfterRun();

        expect(getConfig().ignoreConsoleMessages).to.deep.equal(['foo']);
        expect(config.ignoreConsoleMessages).to.deep.equal(['foo']);
    });

    it('WHEN code written before the rename uses consoleMessages THEN it reads and replaces ignoreConsoleMessages', () => {
        const { getConfig, setConfig } = failOnConsoleError({
            consoleMessages: ['foo'],
        });
        expect(getConfig().ignoreConsoleMessages).to.deep.equal(['foo']);
        expect(getConfig().consoleMessages).to.deep.equal(['foo']);

        setConfig({
            ...getConfig(),
            consoleMessages: [...getConfig().consoleMessages, 'bar'],
        });
        expect(getConfig().ignoreConsoleMessages).to.deep.equal(['foo', 'bar']);

        setConfig({ ...getConfig(), ignoreConsoleMessages: ['baz'] });
        expect(getConfig().ignoreConsoleMessages).to.deep.equal(['baz']);
        expect(getConfig().consoleMessages).to.deep.equal(['baz']);
    });
});

describe('setConfig() with consoleTypes', () => {
    afterEach(() => {
        delete (Cypress as any).testingType;
        sinon.restore();
    });

    it('WHEN consoleTypes change after the page loaded THEN spy on the new console types immediately', () => {
        Cypress.testingType = 'e2e';
        const on = sinon.spy(Cypress, 'on');
        const { setConfig } = failOnConsoleError({ consoleTypes: ['error'] });
        const windowBeforeLoad = on
            .getCalls()
            .find((call) => call.args[0] === 'window:before:load')?.args[1] as (
            window: any
        ) => void;
        on.restore();
        const original = { error: () => {}, warn: () => {} };
        const console = { ...original };
        windowBeforeLoad({ console });

        setConfig({ consoleTypes: ['warn'] });

        expect(console.error).to.equal(original.error);
        expect(console.warn).not.to.equal(original.warn);
        expect((console.warn as sinon.SinonSpy).called).to.be.false;
    });
});

describe('addIgnoredConsoleMessagesCommands()', () => {
    afterEach(() => {
        delete (Cypress as any).Commands;
        vi.unstubAllGlobals();
    });

    const addCommands = (config: Config) => {
        const addAll = vi.fn();
        (Cypress as any).Commands = { addAll };
        vi.stubGlobal('cy', { wrap: (value: any) => value });
        const failOnConsole = failOnConsoleError(config);
        addIgnoredConsoleMessagesCommands(failOnConsole);
        return { commands: addAll.mock.calls[0][0], ...failOnConsole };
    };

    it('WHEN the commands are called THEN read and change ignoreConsoleMessages only', () => {
        const { commands, getConfig } = addCommands({
            ignoreConsoleMessages: ['foo'],
            consoleTypes: ['warn'],
        });

        expect(commands.getIgnoredConsoleMessages()).to.deep.equal(['foo']);
        commands.addIgnoredConsoleMessages([/bar/]);
        expect(getConfig().ignoreConsoleMessages).to.deep.equal(['foo', /bar/]);
        commands.setIgnoredConsoleMessages(['baz']);
        expect(getConfig().ignoreConsoleMessages).to.deep.equal(['baz']);
        expect(getConfig().consoleTypes).to.deep.equal(['warn']);
    });

    it('WHEN deleteIgnoredConsoleMessages is called THEN delete equal strings, RegExps and { type, message } patterns', () => {
        const { commands, getConfig } = addCommands({
            ignoreConsoleMessages: [
                'foo',
                /foo/,
                /bar/g,
                { type: 'warn', message: /baz/ },
                { type: 'error', message: /baz/ },
            ],
        });

        commands.deleteIgnoredConsoleMessages([
            /foo/,
            /bar/g,
            { type: 'warn', message: /baz/ },
        ]);

        expect(getConfig().ignoreConsoleMessages).to.deep.equal([
            'foo',
            { type: 'error', message: /baz/ },
        ]);
    });
});

describe('isSameConsoleMessage()', () => {
    it('WHEN patterns have the same kind and text THEN they are the same', () => {
        expect(isSameConsoleMessage('foo', 'foo')).to.be.true;
        expect(isSameConsoleMessage(/foo/i, /foo/i)).to.be.true;
        expect(
            isSameConsoleMessage(
                { type: 'warn', message: 'foo' },
                { type: 'warn', message: 'foo' }
            )
        ).to.be.true;
    });

    it('WHEN patterns differ in kind, text, flags or console method THEN they are not the same', () => {
        expect(isSameConsoleMessage('foo', /foo/)).to.be.false;
        expect(isSameConsoleMessage(/foo/, /foo/i)).to.be.false;
        expect(isSameConsoleMessage('foo', 'bar')).to.be.false;
        expect(
            isSameConsoleMessage(
                { type: 'warn', message: 'foo' },
                { type: 'error', message: 'foo' }
            )
        ).to.be.false;
        expect(isSameConsoleMessage({ type: 'warn', message: 'foo' }, 'foo')).to
            .be.false;
    });
});

describe('createConfig()', () => {
    it('WHEN config properties are not set THEN use default', () => {
        const config: Config = {};

        const given = createConfig(config);

        expect(given.consoleTypes).to.deep.equal(['error']);
        expect(given.ignoreConsoleMessages).to.deep.equal([]);
        expect(given.debug).to.equal(false);
    });

    it('WHEN config properties are set THEN overwrite default', () => {
        const config: Config = {
            consoleTypes: ['warn', 'info', 'error', 'debug', 'trace', 'table'],
            ignoreConsoleMessages: ['foo', 'bar'],
            debug: true,
        };

        const given = createConfig(config);

        expect(given.consoleTypes).to.deep.equal([
            'warn',
            'info',
            'error',
            'debug',
            'trace',
            'table',
        ]);
        expect(given.ignoreConsoleMessages).to.deep.equal(['foo', 'bar']);
        expect(given.debug).to.deep.equal(true);
    });

    it('WHEN the deprecated consoleMessages is set THEN use it for ignoreConsoleMessages, also over ignoreConsoleMessages', () => {
        expect(
            createConfig({ consoleMessages: ['foo'] }).ignoreConsoleMessages
        ).to.deep.equal(['foo']);
        expect(
            createConfig({
                consoleMessages: ['foo'],
                ignoreConsoleMessages: ['bar'],
            }).ignoreConsoleMessages
        ).to.deep.equal(['foo']);
    });

    it('WHEN config is created THEN consoleMessages is a getter for ignoreConsoleMessages that spreading does not copy', () => {
        const given = createConfig({ ignoreConsoleMessages: ['foo'] });

        expect(given.consoleMessages).to.equal(given.ignoreConsoleMessages);
        expect(Object.keys(given)).to.deep.equal([
            'ignoreConsoleMessages',
            'consoleTypes',
            'debug',
        ]);
        expect({ ...given }).not.to.have.property('consoleMessages');
    });

    it('WHEN consoleTypes contains duplicates THEN keep each type once', () => {
        const given = createConfig({
            consoleTypes: ['error', 'warn', 'error'],
        });

        expect(given.consoleTypes).to.deep.equal(['error', 'warn']);
    });

    it('WHEN config is created THEN do not share arrays or objects with the given config', () => {
        const config: Config = {
            ignoreConsoleMessages: ['foo', { type: 'warn', message: 'bar' }],
            consoleTypes: ['error'],
        };

        const given = createConfig(config);

        expect(given.ignoreConsoleMessages).to.deep.equal(
            config.ignoreConsoleMessages
        );
        expect(given.ignoreConsoleMessages).not.to.equal(
            config.ignoreConsoleMessages
        );
        expect(given.ignoreConsoleMessages[1]).not.to.equal(
            config.ignoreConsoleMessages?.[1]
        );
        expect(given.consoleTypes).not.to.equal(config.consoleTypes);
    });
});

describe('validateConfig()', () => {
    it('WHEN config is valid THEN no assertion error is thrown', () => {
        const config: Config = {
            ignoreConsoleMessages: [
                'foo',
                /bar/,
                { type: 'warn', message: /baz/ },
            ],
            consoleMessages: ['qux', { type: 'error', message: 'quux' }],
            consoleTypes: ['error', 'warn'],
            debug: true,
        };

        expect(() => validateConfig(config)).not.to.throw(chai.AssertionError);
    });

    const invalidConfigs: [string, any, string][] = [
        [
            'consoleTypes',
            { consoleTypes: [] },
            'consoleTypes must not be empty',
        ],
        [
            'consoleTypes',
            { consoleTypes: 'error' },
            'consoleTypes must be an array, got string',
        ],
        [
            'consoleTypes',
            { consoleTypes: ['error', ''] },
            'consoleTypes[1] must be one of error, warn, info, debug, trace, table, log, assert, got ""',
        ],
        [
            'consoleTypes',
            { consoleTypes: [3] },
            'consoleTypes[0] must be one of error, warn, info, debug, trace, table, log, assert, got 3',
        ],
        [
            'consoleTypes',
            { consoleTypes: ['NotAValidConsoleType'] },
            'consoleTypes[0] must be one of error, warn, info, debug, trace, table, log, assert, got "NotAValidConsoleType"',
        ],
        [
            'ignoreConsoleMessages',
            { ignoreConsoleMessages: 'foo' },
            'ignoreConsoleMessages must be an array, got string',
        ],
        [
            'ignoreConsoleMessages',
            { ignoreConsoleMessages: [42] },
            'ignoreConsoleMessages[0] must be a string, RegExp or { type, message } object, got number',
        ],
        [
            'ignoreConsoleMessages',
            { ignoreConsoleMessages: ['foo', ''] },
            'ignoreConsoleMessages[1] must not be an empty string',
        ],
        [
            'ignoreConsoleMessages',
            { ignoreConsoleMessages: [{}] },
            'ignoreConsoleMessages[0].type must be one of error, warn, info, debug, trace, table, log, assert, got undefined',
        ],
        [
            'ignoreConsoleMessages',
            { ignoreConsoleMessages: [{ type: 'warning', message: 'foo' }] },
            'ignoreConsoleMessages[0].type must be one of error, warn, info, debug, trace, table, log, assert, got "warning"',
        ],
        [
            'ignoreConsoleMessages',
            { ignoreConsoleMessages: [{ type: 'warn', message: 42 }] },
            'ignoreConsoleMessages[0].message must be a string or RegExp, got number',
        ],
        [
            'ignoreConsoleMessages',
            { ignoreConsoleMessages: [{ type: 'warn', message: '' }] },
            'ignoreConsoleMessages[0].message must not be an empty string',
        ],
        [
            'ignoreConsoleMessages',
            {
                ignoreConsoleMessages: [
                    { type: 'warn', message: 'Failed (404' },
                ],
            },
            'ignoreConsoleMessages[0].message is not a valid regular expression.',
        ],
        [
            'consoleMessages',
            { consoleMessages: /foo/ },
            'consoleMessages must be an array, got RegExp',
        ],
        [
            'consoleMessages',
            { consoleMessages: ['foo', 42] },
            'consoleMessages[1] must be a string, RegExp or { type, message } object, got number',
        ],
        [
            'consoleMessages',
            { consoleMessages: ['Failed (404'] },
            'consoleMessages[0] is not a valid regular expression.',
        ],
        [
            'ignoreConsoleMessages',
            { ignoreConsoleMessages: [null] },
            'ignoreConsoleMessages[0] must be a string, RegExp or { type, message } object, got null',
        ],
        [
            'ignoreConsoleMessages',
            { ignoreConsoleMessages: [['foo']] },
            'ignoreConsoleMessages[0] must be a string, RegExp or { type, message } object, got array',
        ],
    ];
    invalidConfigs.forEach(([option, config, message]) => {
        it(`WHEN ${option} is not valid (${JSON.stringify(
            config[option]
        )}) THEN throw AssertionError naming the option`, () => {
            expect(() => validateConfig(config)).to.throw(
                chai.AssertionError,
                `cypress-fail-on-console-error: ${message}`
            );
        });
    });

    it('WHEN an ignoreConsoleMessages string is not a valid RegExp THEN throw AssertionError naming it', () => {
        const config: Config = {
            ignoreConsoleMessages: ['foo', 'Failed (404'],
        };

        expect(() => validateConfig(config)).to.throw(
            chai.AssertionError,
            /ignoreConsoleMessages\[1\] is not a valid regular expression.*Failed \(404/
        );
    });

    it('WHEN failOnConsoleError is created with an invalid RegExp string THEN throw AssertionError', () => {
        expect(() =>
            failOnConsoleError({ ignoreConsoleMessages: ['Failed (404'] })
        ).to.throw(chai.AssertionError);
    });
});

describe('createSpies()', () => {
    it('WHEN consoleTypes THEN create createSpies map', () => {
        const config = createConfig({
            consoleTypes: [
                'info',
                'warn',
                'error',
                'debug',
                'trace',
                'table',
                'log',
                'assert',
            ],
        });
        const console: any = {
            info: () => true,
            warn: () => true,
            error: () => true,
            debug: () => true,
            trace: () => true,
            table: () => true,
            log: () => true,
            assert: () => true,
        };

        const spies: Map<ConsoleType, sinon.SinonSpy> = createSpies(
            config,
            console
        );

        const spiesIterator = spies.keys();
        expect(Array.from(spiesIterator)).to.deep.equal(config.consoleTypes);
    });

    it('WHEN consoleTypes contains duplicates THEN create one spy per type', () => {
        const console: any = { error: () => true };

        const spies = createSpies(
            createConfig({ consoleTypes: ['error', 'error'] }),
            console
        );

        expect(spies.size).to.equal(1);
    });
});

describe('updateSpies()', () => {
    it('WHEN consoleTypes change THEN keep the remaining spies with their calls, restore removed ones and add new ones', () => {
        const original = {
            error: () => true,
            warn: () => true,
            info: () => true,
        };
        const console: any = { ...original };
        const spies = createSpies(
            createConfig({ consoleTypes: ['error', 'warn'] }),
            console
        );
        const errorSpy = spies.get('error');
        console.error('foo');

        const updated = updateSpies(
            spies,
            createConfig({ consoleTypes: ['error', 'info'] }),
            console
        );

        expect(Array.from(updated.keys())).to.deep.equal(['error', 'info']);
        expect(updated.get('error')).to.equal(errorSpy);
        expect(updated.get('error')).to.have.been.calledWith('foo');
        expect(console.warn).to.equal(original.warn);
        expect(console.info).to.equal(updated.get('info'));
    });

    it('WHEN consoleTypes do not change THEN keep all spies', () => {
        const console: any = { error: () => true };
        const spies = createSpies(createConfig({}), console);

        const updated = updateSpies(spies, createConfig({}), console);

        expect(updated.get('error')).to.equal(spies.get('error'));
        expect(console.error).to.equal(spies.get('error'));
    });
});

describe('resetSpies()', () => {
    it('when resetHistory is called then spies should be resetted', () => {
        const objectToSpy: any = { error: () => true, warn: () => true };
        const spies: Map<ConsoleType, sinon.SinonSpy> = new Map();
        spies.set('error', sinon.spy(objectToSpy, 'error'));
        spies.set('warn', sinon.spy(objectToSpy, 'warn'));
        objectToSpy.error();
        expect(spies.get('error')).be.called;
        expect(spies.get('warn')).not.be.called;

        const expectedSpies: Map<ConsoleType, sinon.SinonSpy> =
            resetSpies(spies);

        expect(expectedSpies.get('error')).not.be.called;
        expect(expectedSpies.get('warn')).not.be.called;
    });
});

const spyOnConsole = (consoleTypes: ConsoleType[]) => {
    const console: any = {};
    consoleTypes.forEach((consoleType) => (console[consoleType] = () => {}));
    const spies = createSpies(createConfig({ consoleTypes }), console);
    return { console, spies };
};

describe('getConsoleCalls()', () => {
    it('WHEN no spy is called THEN return no calls', () => {
        const { spies } = spyOnConsole(['error', 'warn']);

        expect(getConsoleCalls(spies)).to.deep.equal([]);
    });

    it('WHEN several console methods are called THEN return all calls in the order they were made', () => {
        const { console, spies } = spyOnConsole(['error', 'warn']);

        console.warn('first', 1);
        console.error('second');
        console.warn('third');

        expect(getConsoleCalls(spies)).to.deep.equal([
            { type: 'warn', args: ['first', 1], message: 'first 1' },
            { type: 'error', args: ['second'], message: 'second' },
            { type: 'warn', args: ['third'], message: 'third' },
        ]);
    });

    it('WHEN console.log is called THEN return its call', () => {
        const { console, spies } = spyOnConsole(['log']);

        console.log('foo');

        expect(getConsoleCalls(spies)).to.deep.equal([
            { type: 'log', args: ['foo'], message: 'foo' },
        ]);
    });

    it('WHEN console.assert is called THEN return only failed assertions, with the remaining arguments as message', () => {
        const { console, spies } = spyOnConsole(['assert']);

        console.assert(true, 'passed');
        console.assert(1, 'passed');
        console.assert(false, 'failed', { foo: 1 });
        console.assert(0);

        expect(getConsoleCalls(spies)).to.deep.equal([
            {
                type: 'assert',
                args: [false, 'failed', { foo: 1 }],
                message: 'Assertion failed: failed {"foo":1}',
            },
            { type: 'assert', args: [0], message: 'Assertion failed' },
        ]);
    });
});

describe('compileConsoleMessages()', () => {
    it('WHEN patterns are given THEN compile each to a RegExp, keeping the configured pattern and the type of typed patterns', () => {
        const typed = { type: 'warn' as const, message: 'baz' };

        const given = compileConsoleMessages(['foo', /bar/g, typed]);

        expect(given).to.deep.equal([
            { consoleMessage: 'foo', regExp: /foo/ },
            { consoleMessage: /bar/g, regExp: /bar/g },
            { consoleMessage: typed, type: 'warn', regExp: /baz/ },
        ]);
        expect(given[2].consoleMessage).to.equal(typed);
    });
});

describe('findIgnoringConsoleMessage()', () => {
    const warn = { type: 'warn' as const, args: [], message: 'same text' };
    const error = { type: 'error' as const, args: [], message: 'same text' };

    it('WHEN no pattern matches THEN return undefined', () => {
        expect(findIgnoringConsoleMessage(warn, compileConsoleMessages([]))).to
            .be.undefined;
        expect(
            findIgnoringConsoleMessage(
                warn,
                compileConsoleMessages(['other', /^text/])
            )
        ).to.be.undefined;
    });

    it('WHEN patterns match THEN return the first matching pattern as configured', () => {
        expect(
            findIgnoringConsoleMessage(
                warn,
                compileConsoleMessages(['other', 'text', /same/])
            )
        ).to.equal('text');
    });

    it('WHEN a { type, message } pattern matches the text THEN only match calls of that console method', () => {
        const typed = { type: 'warn' as const, message: 'same' };
        const compiled = compileConsoleMessages([typed]);

        expect(findIgnoringConsoleMessage(warn, compiled)).to.equal(typed);
        expect(findIgnoringConsoleMessage(error, compiled)).to.be.undefined;
    });
});

describe('checkConsoleCalls()', () => {
    afterEach(() => {
        delete (Cypress as any).log;
    });

    const calls = [
        { type: 'error' as const, args: ['foo'], message: 'foo' },
        { type: 'warn' as const, args: ['bar'], message: 'bar' },
        { type: 'error' as const, args: ['baz'], message: 'baz' },
    ];
    const names = (log: ReturnType<typeof vi.fn>) =>
        log.mock.calls.map(([options]) => options.name);

    it('WHEN calls are checked THEN return the calls that are not ignored and log each of them', () => {
        const log = vi.fn();
        (Cypress as any).log = log;

        const given = checkConsoleCalls(
            calls,
            compileConsoleMessages(['bar']),
            false
        );

        expect(given).to.deep.equal([calls[0], calls[2]]);
        expect(names(log)).to.deep.equal(['console.error', 'console.error']);
    });

    it('WHEN debug is true THEN also log each ignored call, in the order the calls were made', () => {
        const log = vi.fn();
        (Cypress as any).log = log;

        const given = checkConsoleCalls(
            calls,
            compileConsoleMessages(['bar']),
            true
        );

        expect(given).to.deep.equal([calls[0], calls[2]]);
        expect(names(log)).to.deep.equal([
            'console.error',
            'ignored',
            'console.error',
        ]);
    });
});

describe('consoleCallsToString()', () => {
    it('WHEN calls are given THEN put each on its own line, named after its console method', () => {
        expect(
            consoleCallsToString([
                { type: 'error', args: ['foo'], message: 'foo' },
                { type: 'warn', args: ['bar', 1], message: 'bar 1' },
            ])
        ).to.equal('console.error: foo\nconsole.warn: bar 1');
    });
});

describe('isConsoleMessageExcluded()', () => {
    it('WHEN configConsoleMessage matches consoleMessage THEN return true', () => {
        expect(isConsoleMessageExcluded('foo', 'foo')).to.be.true;
    });

    it('WHEN configConsoleMessage does not match consoleMessage THEN return false', () => {
        expect(isConsoleMessageExcluded('foo', 'bar')).to.be.false;
    });

    it('WHEN configConsoleMessage is a pattern that matches consoleMessage THEN return true', () => {
        expect(
            isConsoleMessageExcluded(
                "TypeError: Cannot read properties of undefined (reading 'map')",
                '.*properties.*map.*'
            )
        ).to.be.true;
    });

    [/foo/g, /foo/y].forEach((configConsoleMessage) => {
        it(`WHEN configConsoleMessage ${configConsoleMessage} is checked repeatedly THEN return true every time`, () => {
            const consoleMessagesExcluded = [1, 2, 3, 4].map(() =>
                isConsoleMessageExcluded('foo', configConsoleMessage)
            );

            expect(consoleMessagesExcluded).to.deep.equal([
                true,
                true,
                true,
                true,
            ]);
        });
    });
});

describe('callToString()', () => {
    it('WHEN parse different args from console.log, callToString should return concated string', () => {
        const call: any[] = [
            'string',
            1,
            { foo: 'bar' },
            ['a', 1],
            undefined,
            null,
            '-[]{}()*+?.,\\^$|#s',
            new Error('new Error()'),
        ];

        const expected = callToString(call);

        expect(expected).to.contains(
            'string 1 {"foo":"bar"} ["a",1] undefined null -[]{}()*+?.,\\^$|#s Error: new Error()'
        );
        expect(expected).to.contains('unit.test.ts');
    });

    it('WHEN an Error stack starts with name and message THEN do not repeat them', () => {
        const expected = callToString([new Error('boom')]);

        expect(expected.match(/Error: boom/g)).to.have.length(1);
    });

    it('WHEN an Error stack has no name and message (Firefox, WebKit) THEN prepend them', () => {
        const error = new Error('boom');
        error.stack = 'render@http://localhost/app.js:1:1';
        const errorWithoutMessage = new TypeError();
        errorWithoutMessage.stack = 'render@http://localhost/app.js:2:1';

        expect(callToString([error])).to.equal(
            'Error: boom\nrender@http://localhost/app.js:1:1'
        );
        expect(callToString([errorWithoutMessage])).to.equal(
            'TypeError\nrender@http://localhost/app.js:2:1'
        );
    });

    it('WHEN an argument has circular references THEN replace them with [Circular]', () => {
        const state: any = { a: 1 };
        state.self = state;
        const shared = { x: 1 };

        expect(callToString(['state', state])).to.equal(
            'state {"a":1,"self":"[Circular]"}'
        );
        expect(callToString([{ a: shared, b: shared }])).to.equal(
            '{"a":{"x":1},"b":{"x":1}}'
        );
    });

    it('WHEN an argument contains a BigInt THEN print it with the n suffix', () => {
        expect(callToString(['count', { count: BigInt(10) }])).to.equal(
            'count {"count":"10n"}'
        );
    });

    it('WHEN an argument cannot be stringified THEN fall back to its type', () => {
        const throwingGetter = {
            get boom() {
                throw new Error('getter');
            },
        };

        expect(callToString(['state', throwingGetter])).to.equal(
            'state [object Object]'
        );
    });
});

describe('logConsoleCall()', () => {
    afterEach(() => {
        delete (Cypress as any).log;
    });

    it('WHEN a console call is logged THEN log its message, with its arguments in consoleProps', () => {
        const log = vi.fn();
        (Cypress as any).log = log;
        const args = ['foo', { bar: 1 }];

        logConsoleCall({ type: 'warn', args, message: 'foo {"bar":1}' });

        const { name, message, consoleProps } = log.mock.calls[0][0];
        expect(name).to.equal('console.warn');
        expect(message).to.equal('foo {"bar":1}');
        expect(consoleProps()).to.deep.equal({
            'Console method': 'console.warn',
            Arguments: args,
        });
        expect(consoleProps().Arguments[1]).to.equal(args[1]);
    });

    it('WHEN the message contains Markdown characters THEN escape them', () => {
        const log = vi.fn();
        (Cypress as any).log = log;

        logConsoleCall({ type: 'error', args: [], message: 'a_b *c*' });

        expect(log.mock.calls[0][0].message).to.equal('a\\_b \\*c\\*');
    });
});

describe('logIgnoredConsoleCall()', () => {
    afterEach(() => {
        delete (Cypress as any).log;
    });

    it('WHEN an ignored call is logged THEN log the pattern as configured and the message, with both in consoleProps', () => {
        const log = vi.fn();
        (Cypress as any).log = log;
        const args = ['foo is deprecated'];
        const ignoredBy = { type: 'warn' as const, message: /is deprecated/ };

        logIgnoredConsoleCall(
            { type: 'warn', args, message: 'foo is deprecated' },
            ignoredBy
        );

        const { name, message, consoleProps } = log.mock.calls[0][0];
        expect(name).to.equal('ignored');
        expect(message).to.equal(
            "**{ type: 'warn', message: /is deprecated/ }** matched console.warn: foo is deprecated"
        );
        expect(consoleProps()).to.deep.equal({
            'Console method': 'console.warn',
            Arguments: args,
            'Ignored by': ignoredBy,
        });
    });

    it('WHEN the pattern or message contains Markdown characters THEN escape them', () => {
        const log = vi.fn();
        (Cypress as any).log = log;

        logIgnoredConsoleCall(
            { type: 'error', args: [], message: 'a_b *c*' },
            'a.*c'
        );

        expect(log.mock.calls[0][0].message).to.equal(
            "**'a.\\*c'** matched console.error: a\\_b \\*c\\*"
        );
    });
});

describe('consoleMessageToString()', () => {
    it('WHEN patterns are given THEN show them as written in the config', () => {
        expect(consoleMessageToString('foo')).to.equal("'foo'");
        expect(consoleMessageToString("it's \\d")).to.equal("'it\\'s \\\\d'");
        expect(consoleMessageToString(/foo/gi)).to.equal('/foo/gi');
        expect(
            consoleMessageToString({ type: 'warn', message: 'foo' })
        ).to.equal("{ type: 'warn', message: 'foo' }");
    });
});

describe('escapeMarkdown()', () => {
    it('WHEN text contains characters that Markdown formats THEN escape them with a backslash', () => {
        expect(
            escapeMarkdown('a_b *c* `d` ~~e~~ [f](g) <h> &amp; \\')
        ).to.equal(
            'a\\_b \\*c\\* \\`d\\` \\~\\~e\\~\\~ \\[f\\]\\(g\\) \\<h\\> \\&amp; \\\\'
        );
        expect(escapeMarkdown('plain text 1.')).to.equal('plain text 1.');
    });
});
