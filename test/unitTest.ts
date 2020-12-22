import { isSpyExluded } from '../dist/index';
import * as chai from 'chai';

describe('isSpyExluded()', () => {
    it('with config.excludeMessages matching spy error message should return true', () => {
        const spy: any = { args: [['foo']] };
        const config: any = { excludeMessages: ['foo'] };

        const expected = isSpyExluded(spy, config);

        chai.expect(expected).to.be.true;
    });

    it('without config.excludeMessages should return false', () => {
        const spy: any = { args: [['foo']] };
        const config: any = {};

        const expected = isSpyExluded(spy, config);

        chai.expect(expected).to.be.false;
    });

    it('without config.excludeMessages matching spy error message should return false', () => {
        const spy: any = { args: [['foo']] };
        const config: any = { excludeMessages: ['bar'] };

        const expected = isSpyExluded(spy, config);

        chai.expect(expected).to.be.false;
    });

    it('with config.excludeMessages empty string should return false', () => {
        const spy: any = { args: [['foo']] };
        const config: any = { excludeMessages: [' '] };

        const expected = isSpyExluded(spy, config);

        chai.expect(expected).to.be.false;
    });
});
