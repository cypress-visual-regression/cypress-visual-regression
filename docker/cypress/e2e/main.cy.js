describe("Visual Regression Example", () => {
  it("should display the home page correctly", () => {
    cy.visit("../../web/01.html");
    cy.get("H1").contains("Hello, World");
    cy.compareSnapshot("home");
  });

  it("handle missing base snapshot file as a failed spec", () => {
    cy.visit("../../web/01.html");
    if (Cypress.env("type") === "actual") {
      cy.compareSnapshotTest("missing").should(($error) => {
        expect($error).to.be.a("string");
        const json = JSON.parse($error);
        expect(json).to.be.a("object");
        expect(json.message).to.eq(
          "Snapshot /usr/src/app/cypress/snapshots/base/main.cy.js/missing.png does not exist."
        );
        expect(json.stack).to.include(
          "Error: Snapshot /usr/src/app/cypress/snapshots/base/main.cy.js/missing.png does not exist.\n    at /usr/src/app/dist/utils.js"
        );
      });
    }
  });

  it("should display the register page correctly", () => {
    cy.visit("../../web/02.html");
    cy.get("H1").contains("Register");
    cy.compareSnapshot("register");
  });

  it("should display the login page correctly", () => {
    cy.visit("../../web/03.html");
    cy.get("H1").contains("Login");
    cy.compareSnapshot("login", 0.0);
    cy.compareSnapshot("login", 0.1);
  });

  it("should display the component correctly", () => {
    if (Cypress.env("type") === "base") {
      cy.visit("../../web/03.html");
      cy.get("H1").contains("Login");
      cy.get("form").compareSnapshot("login-form");
    } else {
      cy.visit("../../web/03.html");
      cy.get("H1").contains("Login");
      cy.get("form").compareSnapshotTest("login-form").should("be.true");
      cy.get("form").compareSnapshotTest("login-form", 0.02).should("be.true");
    }
  });

  it("should display the foo page incorrectly", () => {
    if (Cypress.env("type") === "base") {
      cy.visit("../../web/04.html");
      cy.get("H1").contains("bar");
      cy.compareSnapshot("bar");
    } else {
      cy.visit("../../web/05.html");
      cy.get("H1").contains("none");
      cy.compareSnapshotTest("bar").should("be.false");
    }
  });

  it("should handle custom error thresholds correctly", () => {
    if (Cypress.env("type") === "base") {
      cy.visit("../../web/04.html");
      cy.get("H1").contains("bar");
      cy.compareSnapshot("foo");
      cy.get("H1").compareSnapshot("h1");
    } else {
      cy.visit("../../web/05.html");
      cy.get("H1").contains("none");
      cy.compareSnapshot("foo", 0.02);
      cy.compareSnapshotTest("foo", 0.02).should("be.true");
      cy.compareSnapshotTest("foo", 0.017).should("be.false");
      cy.get("H1").compareSnapshotTest("h1", 0.08).should("be.true");
      cy.get("H1").compareSnapshotTest("h1", 0.07).should("be.false");
    }
  });

  it("should handle custom error thresholds correctly - take 2", () => {
    if (Cypress.env("type") === "base") {
      cy.visit("../../web/06.html");
      cy.get("H1").contains("Color");
      cy.compareSnapshot("baz");
    } else {
      cy.visit("../../web/07.html");
      cy.get("H1").contains("Color");
      cy.compareSnapshot("baz", 0.025);
      cy.compareSnapshotTest("baz", 0.025).should("be.true");
      cy.compareSnapshotTest("baz", 0.02).should("be.false");
      cy.compareSnapshotTest("baz").should("be.false");
    }
  });

  it("should compare images of different sizes", () => {
    if (Cypress.env("type") === "base") {
      cy.visit("../../web/07.html");
      cy.get("H1").contains("Color");
      cy.compareSnapshot("bar-07");
    } else {
      cy.visit("../../web/08.html");
      cy.get("H1").contains("Color");
      cy.compareSnapshotTest("bar-07").should("be.false");
    }
  });

  it("should pass parameters to cy.screenshot", () => {
    cy.visit("../../web/08.html");
    cy.compareSnapshot("screenshot-params-full", {
      capture: "fullPage",
    });
  });

  it(
    "should not fail if ALLOW_VISUAL_REGRESSION_TO_FAIL is set",
    {
      env: { ALLOW_VISUAL_REGRESSION_TO_FAIL: true },
    },
    () => {
      if (Cypress.env("type") === "base") {
        cy.visit("../../web/04.html");
        cy.get("H1").contains("bar");
        cy.compareSnapshot("foo");
        cy.get("H1").compareSnapshot("h1");
      } else {
        cy.visit("../../web/05.html");
        cy.get("H1").contains("none");
        cy.compareSnapshot("foo", 0.02);
        cy.compareSnapshotTest("foo", 0.02).should("be.true");
        cy.compareSnapshot("foo", 0.017);
        cy.get("H1").compareSnapshotTest("h1", 0.08).should("be.true");
        cy.get("H1").compareSnapshot("h1", 0.07);
      }
    }
  );

  it(
    "should not fail if ALLOW_VISUAL_REGRESSION_TO_FAIL is not set",
    {
      env: { ALLOW_VISUAL_REGRESSION_TO_FAIL: false },
    },
    () => {
      // this test equals 'should handle custom error thresholds correctly'
      if (Cypress.env("type") === "base") {
        cy.visit("../../web/04.html");
        cy.get("H1").contains("bar");
        cy.compareSnapshot("foo");
        cy.get("H1").compareSnapshot("h1");
      } else {
        cy.visit("../../web/05.html");
        cy.get("H1").contains("none");
        cy.compareSnapshot("foo", 0.02);
        cy.compareSnapshotTest("foo", 0.02).should("be.true");
        cy.compareSnapshotTest("foo", 0.017).should("be.false");
        cy.get("H1").compareSnapshotTest("h1", 0.08).should("be.true");
        cy.get("H1").compareSnapshotTest("h1", 0.07).should("be.false");
      }
    }
  );
});
