export * from "./dist/commands";

import { type toMatchScreenshot } from "./dist/commands";

declare global {
    namespace Cypress {
        interface Chainable {
            toMatchScreenshot: typeof toMatchScreenshot;
        }
    }
}
