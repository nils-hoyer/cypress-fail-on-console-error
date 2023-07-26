import { defineConfig } from 'cypress';

export default defineConfig({
    screenshotOnRunFailure: false,
    video: false,
    e2e: {},
    component: {
        specPattern: './**/*.cy.ts',
        devServer: {
            bundler: 'vite',
            viteConfig: {},
        } as Cypress.DevServerConfigOptions,
    },
});
