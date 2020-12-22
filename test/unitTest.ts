import { isSpyExluded } from '../dist/index';
import * as chai from 'chai';

describe('isSpyExluded()', () => {
    it('with config.exlude matching spy error message should return true', () => {
        const spy: any = { args: [['foo']] };
        const config: any = { exclude: ['foo'] };

        const expected = isSpyExluded(spy, config);

        chai.expect(expected).to.be.true;
    });

    it('without config.exclude should return false', () => {
        const spy: any = { args: [['foo']] };
        const config: any = {};

        const expected = isSpyExluded(spy, config);

        chai.expect(expected).to.be.false;
    });

    it('without config.exlude matching spy error message should return false', () => {
        const spy: any = { args: [['foo']] };
        const config: any = { exclude: ['bar'] };

        const expected = isSpyExluded(spy, config);

        chai.expect(expected).to.be.false;
    });

    it('with config.exlude empty string should return false', () => {
        const spy: any = { args: [['foo']] };
        const config: any = { exclude: [' '] };

        const expected = isSpyExluded(spy, config);

        chai.expect(expected).to.be.false;
    });
});
