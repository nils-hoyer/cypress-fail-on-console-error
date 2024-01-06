import * as sinon from 'sinon';
import failOnConsoleError, {
    callToString,
    createConfig,
    createSpies,
    findConsoleMessageIncluded,
    getConsoleMessageIncluded,
    isConsoleMessageExcluded,
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

    const consoleTypes = [[], [''], [3], ['NotAValidConsoleType']];
    consoleTypes.forEach((consoleType: any) => {
        it(`WHEN consoleTypes is not valid (${JSON.stringify(
            consoleType
        )}) THEN throw AssertionError`, () => {
            const config: Config = {
                consoleTypes: consoleType,
            };

            expect(() => validateConfig(config)).to.throw(chai.AssertionError);
        });
    });
});

describe('createSpies()', () => {
    it('WHEN consoleTypes THEN create createSpies map', () => {
        const config: Required<Config> = createConfig({
            consoleTypes: ['info', 'warn', 'error', 'debug', 'trace', 'table'],
        });
        const console: any = {
            info: () => true,
            warn: () => true,
            error: () => true,
            debug: () => true,
            trace: () => true,
            table: () => true,
        };

        const spies: Map<ConsoleType, sinon.SinonSpy> = createSpies(
            config,
            console
        );

        const spiesIterator = spies.keys();
        expect(spies.size).to.equals(6);
        expect(spiesIterator.next().value).to.equals(config.consoleTypes[0]);
        expect(spiesIterator.next().value).to.equals(config.consoleTypes[1]);
        expect(spiesIterator.next().value).to.equals(config.consoleTypes[2]);
        expect(spiesIterator.next().value).to.equals(config.consoleTypes[3]);
        expect(spiesIterator.next().value).to.equals(config.consoleTypes[4]);
        expect(spiesIterator.next().value).to.equals(config.consoleTypes[5]);
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

describe('getConsoleMessageIncluded()', () => {
    it('WHEN no spy is called THEN return undefined', () => {
        const spies: Map<ConsoleType, sinon.SinonSpy> = new Map();
        spies.set('error', { called: false } as sinon.SinonSpy);
        spies.set('warn', { called: false } as sinon.SinonSpy);

        const consoleMessage = getConsoleMessageIncluded(
            spies,
            createConfig({})
        );

        expect(consoleMessage).to.be.undefined;
    });

    it('WHEN console message is excluded THEN return undefined', () => {
        const config = createConfig({ consoleMessages: ['foo'] });
        const spies: Map<ConsoleType, sinon.SinonSpy> = new Map();
        spies.set('error', {
            called: true,
            args: [['foo']],
        } as sinon.SinonSpy);

        const consoleMessage = getConsoleMessageIncluded(spies, config);

        expect(consoleMessage).to.be.undefined;
    });

    it('WHEN console message is included THEN return call', () => {
        const config = createConfig({ consoleMessages: ['foo'] });
        const spies: Map<ConsoleType, sinon.SinonSpy> = new Map();
        spies.set('error', {
            called: true,
            args: [['bar']],
        } as sinon.SinonSpy);

        const consoleMessage = getConsoleMessageIncluded(spies, config);

        expect(consoleMessage).to.equal('bar');
    });
});

describe('findConsoleMessageIncluded()', () => {
    it('WHEN config.consoleMessages is undefined THEN return first call', () => {
        const spy: sinon.SinonSpy = {
            args: [
                ['foo', 'foo1'],
                ['foo3', 'foo4'],
            ],
        } as sinon.SinonSpy;

        const consoleMessage = findConsoleMessageIncluded(
            spy,
            createConfig({})
        );

        expect(consoleMessage).to.equal('foo foo1');
    });

    it('WHEN console message is excluded by config.consoleMessages THEN return first call some is not excluded', () => {
        const config = createConfig({ consoleMessages: ['foo1'] });
        const spy: sinon.SinonSpy = {
            args: [
                ['foo', 'foo1'],
                ['foo3', 'foo4'],
            ],
        } as sinon.SinonSpy;

        const consoleMessage = findConsoleMessageIncluded(spy, config);

        expect(consoleMessage).to.equal('foo3 foo4');
    });

    it('WHEN all console messages are excluded by config.consoleMessages THEN return undefined', () => {
        const config = createConfig({
            consoleMessages: ['foo', 'foo3'],
        });
        const spy: sinon.SinonSpy = {
            args: [
                ['foo', 'foo1'],
                ['foo3', 'foo4'],
            ],
        } as sinon.SinonSpy;

        const consoleMessage = findConsoleMessageIncluded(spy, config);

        expect(consoleMessage).to.be.undefined;
    });
});

describe('isConsoleMessageExcluded()', () => {
    it('WHEN configConsoleMessage matching consoleMessage THEN return false', () => {
        const consoleMessage: string = 'foo';
        const configConsoleMessage: string = 'foo';

        const consoleMessageExcluded = isConsoleMessageExcluded(
            consoleMessage,
            configConsoleMessage,
            false
        );

        expect(consoleMessageExcluded).to.be.true;
    });

    it('WHEN configConsoleMessage not matching consoleMessage THEN return true', () => {
        const consoleMessage: string = 'foo';
        const configConsoleMessage: string = 'bar';

        const consoleMessageExcluded = isConsoleMessageExcluded(
            consoleMessage,
            configConsoleMessage,
            false
        );

        expect(consoleMessageExcluded).to.be.false;
    });

    it('WHEN configConsoleMessage not matching consoleMessage THEN return true', () => {
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
});
