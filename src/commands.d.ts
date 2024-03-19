import Cypress from "cypress";

export interface ToMatchScreenshotOptions {
    errorThreshold: number;
    baseDelay: number;
    retries: number;
}

export function toMatchScreenshot(): void;
export function toMatchScreenshot(errorThreshold: number): void;
export function toMatchScreenshot(
    options?: Partial<Cypress.ScreenshotOptions | ToMatchScreenshotOptions>,
): void;
