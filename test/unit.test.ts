import * as sinon from 'sinon';
import failOnConsoleError, {
    callToString,
    createConfig,
    consoleCallsToString,
    createSpies,
    getConsoleCalls,
    getConsoleCallsIncluded,
    isConsoleMessageExcluded,
    logConsoleCall,
    resetSpies,
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
            consoleMessages: ['foo'],
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
            consoleMessages: ['foo'],
            consoleTypes: ['warn'],
            debug: true,
        };
        const { getConfig, setConfig } = failOnConsoleError(config);

        setConfig({ ...config, consoleMessages: ['bar'] });

        const givenConfig = getConfig();
        expect(givenConfig?.consoleMessages).to.deep.equal(['bar']);
        expect(givenConfig?.consoleTypes).to.deep.equal(['warn']);
        expect(givenConfig?.debug).to.deep.equal(true);
    });

    it('WHEN getConfig().consoleMessages is changed in a test THEN restore the config after the test', () => {
        const on = sinon.spy(Cypress, 'on');
        const config: Config = { consoleMessages: ['foo'] };
        const { getConfig } = failOnConsoleError(config);
        const testAfterRun = on
            .getCalls()
            .find((call) => call.args[0] === 'test:after:run')
            ?.args[1] as () => void;
        on.restore();

        getConfig().consoleMessages.push('bar');
        testAfterRun();

        expect(getConfig().consoleMessages).to.deep.equal(['foo']);
        expect(config.consoleMessages).to.deep.equal(['foo']);
    });
});

describe('createConfig()', () => {
    it('WHEN config properties are not set THEN use default', () => {
        const config: Config = {};

        const given = createConfig(config);

        expect(given.consoleTypes).to.deep.equal(['error']);
        expect(given.consoleMessages).to.deep.equal([]);
        expect(given.debug).to.equal(false);
    });

    it('WHEN config properties are set THEN overwrite default', () => {
        const config: Config = {
            consoleTypes: ['warn', 'info', 'error', 'debug', 'trace', 'table'],
            consoleMessages: ['foo', 'bar'],
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
        expect(given.consoleMessages).to.deep.equal(['foo', 'bar']);
        expect(given.debug).to.deep.equal(true);
    });

    it('WHEN consoleTypes contains duplicates THEN keep each type once', () => {
        const given = createConfig({
            consoleTypes: ['error', 'warn', 'error'],
        });

        expect(given.consoleTypes).to.deep.equal(['error', 'warn']);
    });

    it('WHEN config is created THEN do not share arrays with the given config', () => {
        const config: Config = {
            consoleMessages: ['foo'],
            consoleTypes: ['error'],
        };

        const given = createConfig(config);

        expect(given.consoleMessages).not.to.equal(config.consoleMessages);
        expect(given.consoleTypes).not.to.equal(config.consoleTypes);
    });
});

describe('validateConfig()', () => {
    it('WHEN config is valid THEN no assertion error is thrown', () => {
        const config: Config = {
            consoleMessages: ['foo', /bar/],
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
            'consoleMessages',
            { consoleMessages: 'foo' },
            'consoleMessages must be an array, got string',
        ],
        [
            'consoleMessages',
            { consoleMessages: [42] },
            'consoleMessages[0] must be a string or RegExp, got number',
        ],
        [
            'consoleMessages',
            { consoleMessages: ['foo', ''] },
            'consoleMessages[1] must not be an empty string',
        ],
        [
            'consoleMessages',
            { consoleMessages: [{}] },
            'consoleMessages[0] must be a string or RegExp, got object',
        ],
        [
            'consoleMessages',
            { consoleMessages: [null] },
            'consoleMessages[0] must be a string or RegExp, got null',
        ],
        [
            'consoleMessages',
            { consoleMessages: [['foo']] },
            'consoleMessages[0] must be a string or RegExp, got array',
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

    it('WHEN a consoleMessages string is not a valid RegExp THEN throw AssertionError naming it', () => {
        const config: Config = {
            consoleMessages: ['foo', 'Failed (404'],
        };

        expect(() => validateConfig(config)).to.throw(
            chai.AssertionError,
            /consoleMessages\[1\] is not a valid regular expression.*Failed \(404/
        );
    });

    it('WHEN failOnConsoleError is created with an invalid RegExp string THEN throw AssertionError', () => {
        expect(() =>
            failOnConsoleError({ consoleMessages: ['Failed (404'] })
        ).to.throw(chai.AssertionError);
    });
});

describe('createSpies()', () => {
    it('WHEN consoleTypes THEN create createSpies map', () => {
        const config: Required<Config> = createConfig({
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

describe('getConsoleCallsIncluded()', () => {
    it('WHEN config.consoleMessages is empty THEN return every call', () => {
        const { console, spies } = spyOnConsole(['error']);
        console.error('foo', 'foo1');
        console.error('foo3', 'foo4');

        const consoleCalls = getConsoleCallsIncluded(spies, createConfig({}));

        expect(consoleCalls.map((call) => call.message)).to.deep.equal([
            'foo foo1',
            'foo3 foo4',
        ]);
    });

    it('WHEN some console messages are excluded by config.consoleMessages THEN return the others', () => {
        const { console, spies } = spyOnConsole(['error', 'warn']);
        console.error('foo', 'foo1');
        console.warn('foo3', 'foo4');
        console.error('bar');

        const consoleCalls = getConsoleCallsIncluded(
            spies,
            createConfig({ consoleMessages: ['foo1'] })
        );

        expect(consoleCalls.map((call) => call.message)).to.deep.equal([
            'foo3 foo4',
            'bar',
        ]);
    });

    it('WHEN all console messages are excluded by config.consoleMessages THEN return no calls', () => {
        const { console, spies } = spyOnConsole(['error']);
        console.error('foo', 'foo1');
        console.error('foo3', 'foo4');

        const consoleCalls = getConsoleCallsIncluded(
            spies,
            createConfig({ consoleMessages: ['foo', 'foo3'] })
        );

        expect(consoleCalls).to.deep.equal([]);
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
        const consoleMessage: string = 'foo';
        const configConsoleMessage: string = 'foo';

        const consoleMessageExcluded = isConsoleMessageExcluded(
            consoleMessage,
            configConsoleMessage,
            false
        );

        expect(consoleMessageExcluded).to.be.true;
    });

    it('WHEN configConsoleMessage does not match consoleMessage THEN return false', () => {
        const consoleMessage: string = 'foo';
        const configConsoleMessage: string = 'bar';

        const consoleMessageExcluded = isConsoleMessageExcluded(
            consoleMessage,
            configConsoleMessage,
            false
        );

        expect(consoleMessageExcluded).to.be.false;
    });

    it('WHEN configConsoleMessage is a pattern that matches consoleMessage THEN return true', () => {
        const consoleMessage: string =
            "TypeError: Cannot read properties of undefined (reading 'map')";
        const configConsoleMessage: string = '.*properties.*map.*';

        const consoleMessageExcluded = isConsoleMessageExcluded(
            consoleMessage,
            configConsoleMessage,
            false
        );

        expect(consoleMessageExcluded).to.be.true;
    });

    [/foo/g, /foo/y].forEach((configConsoleMessage) => {
        it(`WHEN configConsoleMessage ${configConsoleMessage} is checked repeatedly THEN return true every time`, () => {
            const consoleMessagesExcluded = [1, 2, 3, 4].map(() =>
                isConsoleMessageExcluded('foo', configConsoleMessage, false)
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
});

describe('cypressLogger()', () => {
    afterEach(() => {
        delete (Cypress as any).log;
    });

    it('WHEN the logged message contains a RegExp THEN log it as a string', () => {
        const log = vi.fn();
        (Cypress as any).log = log;

        isConsoleMessageExcluded('foo', /fo+/, true);

        const { message, consoleProps } = log.mock.calls[0][0];
        expect(message).to.equal(
            '{"consoleMessage":"foo","configConsoleMessage":"/fo+/","consoleMessageExcluded":true}'
        );
        expect(consoleProps().configConsoleMessage).to.deep.equal(/fo+/);
    });
});
