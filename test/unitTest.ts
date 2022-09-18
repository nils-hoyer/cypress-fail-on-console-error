import * as chai from 'chai';
import { AssertionError } from 'chai';
import * as sinon from 'sinon';
import sinonChai from 'sinon-chai';
import failOnConsoleError, {
    callToString,
    createConfig,
    createSpies,
    findIncludedCall,
    getIncludedCall,
    isConsoleMessageExcluded,
    resetSpies,
    validateConfig,
} from '../dist/index';
import { Config } from '../dist/types/Config';
import { ConsoleType } from '../dist/types/ConsoleType';

chai.should();
chai.use(sinonChai);

import * as indexMock from '../dist/index';
sinon.stub(indexMock, 'cypressLogger');
//@ts-ignore
global['Cypress'] = { on: (f, s) => true };

describe('failOnConsoleError()', () => {
    it('WHEN failOnConsoleError is created with Config THEN expect no error', () => {
        const config: Config = {
            consoleMessages: ['foo'],
            consoleTypes: [ConsoleType.WARN],
            debug: true,
        };
        failOnConsoleError(config);
    });
    it('WHEN failOnConsoleError is created with no Config THEN expect no error', () => {
        failOnConsoleError();
    });
});

describe('setConfig()', () => {
    it('WHEN setConfig is called with valid data THEN expect config to be set', () => {
        const config: Config = {
            consoleMessages: ['foo'],
            consoleTypes: [ConsoleType.WARN],
            debug: true,
        };
        const { getConfig, setConfig } = failOnConsoleError(config);

        setConfig({ ...config, consoleMessages: ['bar'] });

        const givenConfig = getConfig();
        chai.expect(givenConfig?.consoleMessages).to.deep.equal(['bar']);
        chai.expect(givenConfig?.consoleTypes).to.deep.equal([
            ConsoleType.WARN,
        ]);
        chai.expect(givenConfig?.debug).to.deep.equal(true);
    });
});

describe('createConfig()', () => {
    it('WHEN config properties are not set THEN use default', () => {
        const config: Config = {};

        const given = createConfig(config);

        chai.expect(given.consoleTypes).to.deep.equal([ConsoleType.ERROR]);
        chai.expect(given.consoleMessages).to.deep.equal([]);
        chai.expect(given.debug).to.equal(false);
    });

    it('WHEN config properties are set THEN overwrite default', () => {
        const config: Config = {
            consoleTypes: [
                ConsoleType.WARN,
                ConsoleType.INFO,
                ConsoleType.ERROR,
            ],
            consoleMessages: ['foo', 'bar'],
            debug: true,
        };

        const given = createConfig(config);

        chai.expect(given.consoleTypes).to.deep.equal([
            ConsoleType.WARN,
            ConsoleType.INFO,
            ConsoleType.ERROR,
        ]);
        chai.expect(given.consoleMessages).to.deep.equal(['foo', 'bar']);
        chai.expect(given.debug).to.deep.equal(true);
    });
});

describe('validateConfig()', () => {
    it('WHEN consoleMessages, consoleTypes and debug is valid THEN no assertion error is thrown', () => {
        const config: Config = {
            consoleMessages: ['foo', /bar/],
            consoleTypes: [ConsoleType.ERROR, ConsoleType.WARN],
            debug: true,
        };

        chai.expect(() => validateConfig(config)).not.to.throw(AssertionError);
    });

    const consoleTypes = [[], [''], [3], ['NotAValidConsoleType']];
    consoleTypes.forEach((consoleType: any) => {
        it('WHEN consoleTypes is not valid THEN throw AssertionError', () => {
            const config: Config = {
                consoleTypes: consoleType,
            };

            chai.expect(() => validateConfig(config)).to.throw(AssertionError);
        });
    });
});

describe('createSpies()', () => {
    it('WHEN consoleTypes THEN create createSpies map', () => {
        const config: Required<Config> = createConfig({
            consoleTypes: [
                ConsoleType.INFO,
                ConsoleType.WARN,
                ConsoleType.ERROR,
            ],
        });
        const console: any = {
            info: () => true,
            warn: () => true,
            error: () => true,
        };

        const spies: Map<ConsoleType, sinon.SinonSpy> = createSpies(
            config,
            console
        );

        const spiesIterator = spies.keys();
        chai.expect(spies.size).to.equals(3);
        chai.expect(spiesIterator.next().value).to.equals(
            config.consoleTypes[0]
        );
        chai.expect(spiesIterator.next().value).to.equals(
            config.consoleTypes[1]
        );
        chai.expect(spiesIterator.next().value).to.equals(
            config.consoleTypes[2]
        );
    });
});

describe('resetSpies()', () => {
    it('when resetHistory is called then spies should be resetted', () => {
        const objectToSpy: any = { error: () => true, warn: () => true };
        const spies: Map<ConsoleType, sinon.SinonSpy> = new Map();
        spies.set(ConsoleType.ERROR, sinon.spy(objectToSpy, 'error'));
        spies.set(ConsoleType.WARN, sinon.spy(objectToSpy, 'warn'));
        objectToSpy.error();
        chai.expect(spies.get(ConsoleType.ERROR)).be.called;
        chai.expect(spies.get(ConsoleType.WARN)).not.be.called;

        const expectedSpies: Map<ConsoleType, sinon.SinonSpy> =
            resetSpies(spies);

        chai.expect(expectedSpies.get(ConsoleType.ERROR)).not.be.called;
        chai.expect(expectedSpies.get(ConsoleType.WARN)).not.be.called;
    });
});

describe('getIncludedCall()', () => {
    it('WHEN no spy is called THEN return undefined', () => {
        const spies: Map<ConsoleType, sinon.SinonSpy> = new Map();
        spies.set(ConsoleType.ERROR, { called: false } as sinon.SinonSpy);
        spies.set(ConsoleType.WARN, { called: false } as sinon.SinonSpy);

        const includedCall = getIncludedCall(spies, createConfig({}));

        chai.expect(includedCall).to.be.undefined;
    });

    it('WHEN call is excluded THEN return undefined', () => {
        const config = createConfig({ consoleMessages: ['foo'] });
        const spies: Map<ConsoleType, sinon.SinonSpy> = new Map();
        spies.set(ConsoleType.ERROR, {
            called: true,
            args: [['foo']],
        } as sinon.SinonSpy);

        const includedCall = getIncludedCall(spies, config);

        chai.expect(includedCall).to.be.undefined;
    });

    it('WHEN call is included THEN return call', () => {
        const config = createConfig({ consoleMessages: ['foo'] });
        const spies: Map<ConsoleType, sinon.SinonSpy> = new Map();
        spies.set(ConsoleType.ERROR, {
            called: true,
            args: [['bar']],
        } as sinon.SinonSpy);

        const includedCall = getIncludedCall(spies, config);

        chai.expect(includedCall).to.equal('bar');
    });
});

describe('findIncludedCall()', () => {
    it('WHEN config.consoleMessages is undefined THEN return first call', () => {
        const spy: sinon.SinonSpy = {
            args: [
                ['foo', 'foo1'],
                ['foo3', 'foo4'],
            ],
        } as sinon.SinonSpy;

        const includedCall = findIncludedCall(spy, createConfig({}));

        chai.expect(includedCall).to.equal('foo foo1');
    });

    it('WHEN some call for consoleMessage is excluded by config.consoleMessages THEN return first call some is not excluded', () => {
        const config = createConfig({ consoleMessages: ['foo1'] });
        const spy: sinon.SinonSpy = {
            args: [
                ['foo', 'foo1'],
                ['foo3', 'foo4'],
            ],
        } as sinon.SinonSpy;

        const includedCall = findIncludedCall(spy, config);

        chai.expect(includedCall).to.equal('foo3 foo4');
    });

    it('WHEN some call for all errorMessages are excluded by config.consoleMessages THEN return undefined', () => {
        const config = createConfig({
            consoleMessages: ['foo', 'foo3'],
        });
        const spy: sinon.SinonSpy = {
            args: [
                ['foo', 'foo1'],
                ['foo3', 'foo4'],
            ],
        } as sinon.SinonSpy;

        const includedCall = findIncludedCall(spy, config);

        chai.expect(includedCall).to.be.undefined;
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

        chai.expect(consoleMessageExcluded).to.be.true;
    });

    it('WHEN configConsoleMessage not matching consoleMessage THEN return true', () => {
        const consoleMessage: string = 'foo';
        const configConsoleMessage: string = 'bar';

        const consoleMessageExcluded = isConsoleMessageExcluded(
            consoleMessage,
            configConsoleMessage,
            false
        );

        chai.expect(consoleMessageExcluded).to.be.false;
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

        chai.expect(consoleMessageExcluded).to.be.true;
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

        chai.expect(expected).to.contains(
            'string 1 {"foo":"bar"} ["a",1] undefined null -[]{}()*+?.,\\^$|#s Error: new Error()'
        );
        chai.expect(expected).to.contains('unitTest.ts');
    });
});
