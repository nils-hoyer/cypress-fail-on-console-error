import { exec as execCallback } from 'child_process';
import { promisify } from 'util';

const exec = promisify(execCallback);

// VS Code sets ELECTRON_RUN_AS_NODE in its terminals, which stops the Cypress binary from starting
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

export async function runCypress(
    testingType: 'e2e' | 'component',
    spec: string
): Promise<string> {
    const command = [
        'cypress run',
        '--browser chrome',
        '--headless',
        testingType === 'component' ? '--component' : '',
        '--config-file ./cypress/cypress.config.ts',
        `--spec "${spec}"`,
    ].join(' ');

    // cypress run exits with the number of failed tests, so failing specs reject too
    const { stdout, stderr } = await exec(command, { env }).catch(
        (error) => error
    );

    if (!stdout?.includes('(Run Finished)')) {
        throw new Error(`Cypress did not finish the run:\n${stderr}${stdout}`);
    }

    return stdout;
}
