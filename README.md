# @forsakringskassan/cypress-visual-regression

Module for adding visual regression testing to [Cypress](https://www.cypress.io/).

This is a fork of [cypress-visual-regression](https://github.com/mjhea0/cypress-visual-regression) v1.7.0.
The most notable changes are:

- Support both headed and headless.
- Support both E2E and Component Tests with screenshots stored next to test-cases in a `__screenshots__` folder.
- Retryability: tries multiple times to match the screenshot against the base images.
- Delayed screenshots: optional delay before taking base screenshots.
- Forced software rendering, antialiasing detection: to prevent flaky tests due to different hardware rendering slightly different pixels.

## Getting Started

Install:

```sh
$ npm install --save-dev @forsakringskassan/cypress-visual-regression
```

Add the following config to your _cypress.config.ts._ file:

the default for screenshotsfolder is `cypress/screenshots`. Your screenshotfolder is where the failing tests will be transfered to.

```json
{
    "screenshotsFolder": "WHERE_YOU_WANT_FAILING_TEST_IMAGES_TO_END_UP/",
    "trashAssetsBeforeRuns": true
}
```

`cypress/support/commands.ts`:

```ts
import "@forsakringskassan/cypress-visual-regression/commands";
```

`cypress.config.ts`:

```ts
import getToMatchScreenshotsPlugin from "@forsakringskassan/cypress-visual-regression/plugin";
import { defineConfig } from "cypress";

export default defineConfig({
    e2e: {
        setupNodeEvents(on, config) {
            config = getToMatchScreenshotsPlugin(on, config);
        },
    },
});
```

This plug uses the `before:browser:launch` event, due to [Cypress#5240][#5240] if you have another plugin or you use it yourself in `cypress.config.ts` you need a workaround.
See the section below on an example of such workaround.

For more info on how to use TypeScript with Cypress, please refer to [this document](https://docs.cypress.io/guides/tooling/typescript-support#Set-up-your-dev-environment).

[#5240]: https://github.com/cypress-io/cypress/issues/5240

### Options

`failSilently` is enabled by default. Add the following config to your _cypress.json_ file to see the errors:

```json
{
    "env": {
        "failSilently": false
    }
}
```

## To Use

The plugin has two modes, `base` and `actual`.

`base` captures a new screenshot to set as the reference image, or updates the existing one if the difference exceeds the threshold. `actual` captures the current screenshot and compares it against the reference image.

Default is `actual`.

To run in `base-mode` locally, add `type=base` as a environment variable

```sh
$ cypress run -- --env type=base
```

### Implementation in test files

Add `cy.toMatchScreenshot();` in your tests specs whenever you want to test for visual regressions. You can also add an optional error threshold: Value can range from 0.00 (no difference) to 1.00 (every pixel is different). So, if you enter an error threshold of 0.51, the test would fail only if > 51% of pixels are different.

Default value of threshold is 0.01, you can not go lower than that.

More examples:

| Threshold | Fails when |
| --------- | ---------- |
| .25       | > 25%      |
| .30       | > 30%      |
| .50       | > 50%      |
| .75       | > 75%      |

Sample:

```js
it("should display the login page correctly", () => {
    cy.visit("/03.html");
    cy.get("H1").contains("Login");
    cy.toMatchScreenshot(0.1);
});
```

You can target a single HTML element as well:

```js
cy.get("#my-header").toMatchScreenshot();
```

You can pass arguments as an object to `cy.screenshot()`, rather than just an error threshold, as well:

```js
it("should display the login page correctly", () => {
    cy.visit("/03.html");
    cy.toMatchScreenshot({
        capture: "fullPage",
        errorThreshold: 0.1,
    });
});
```

### Waiting for components to load and retry function

Sometimes things don't load for the screenshot. In order to solve this, you can use the argument `baseDelay` which will `cy.wait(x)` before taking base screenshots.

```js
cy.toMatchScreenshot({ baseDelay: 500 });
```

When not running the test as `base`, it will retake screenshots after 200ms delay each until match or the default of 3 tries. If it doesn't find match and no more retires, test will fail.
You can also configure how many retries it will make.

```js
cy.toMatchScreenshot({ retries: 6 });
```

### Saved base images and failing tests

Base-images will be stored inside same directory in which the test is, in a sub-folder called `__screenshots__`. For example

```
root
├─┬ cypress
│ └─┬ e2e
│   ├── test.cy.ts
│   └─┬ __screenshots__
│     └── test -- should match screenshot.png
└─┬ src
  └─┬ component
    ├── component.vue
    ├── component.cy.ts
    └─┬ __screenshots__
      └── component -- should match screenshot.png
```

When a test fails, a sub-directory will be created under your configured `screenshotsFolder`, inside there will be a copy of the base image and the actual image.

### Using multiple event listeners

Cypress does not support multiple listeners on the same event.
This plugin uses `before:browser:launch` and if this collides with another plugin you can apply the following workaround:

`cypress.config.ts`:

```ts
/**
 * Workaround for https://github.com/cypress-io/cypress/issues/5240
 *
 * Cypress `on` cannot accept multiple listeners, since we have multiple plugins
 * trying to hook into the same eents only one of them gets called. This
 * workaround creates a wrapped `on` supporting multiple listeners.
 */
class EventForwarder {
    private emitter: EventEmitter;
    private task: Cypress.Tasks;
    public on: Cypress.PluginEvents;

    public constructor() {
        this.emitter = new EventEmitter();
        this.task = {};
        this.on = (action, arg) => {
            if (action === "task") {
                Object.assign(this.task, arg);
            } else {
                this.emitter.on(action, arg as () => void);
            }
        };
    }

    public forward(on: Cypress.PluginEvents): void {
        for (const event of this.emitter.eventNames()) {
            /* eslint-disable-next-line @typescript-eslint/no-explicit-any -- because we cannot extract the action names as a union of strings */
            on(event as any, async (...args: unknown[]) => {
                if (event === "before:browser:launch") {
                    const browser = args[0];
                    let launchOptions = args[1];
                    for (const listener of this.emitter.listeners(event)) {
                        launchOptions = await listener(browser, launchOptions);
                    }
                } else {
                    for (const listener of this.emitter.listeners(event)) {
                        await listener(...args);
                    }
                }
            });
        }
        on("task", this.task);
    }
}

export default defineConfig({
    component: {
        setupNodeEvents(cypressOn, config) {
            const eventForwarder = new EventForwarder();
            const on = eventForwarder.on;

            try {
                /* [..] */

                getToMatchScreenshotsPlugin(on, config);

                /* [..] */
            } finally {
                eventForwarder.forward(cypressOn);
            }
        },
    },
});
```
