describe('Visual Regression Example', () => {
  it('should display the home page correctly', () => {
    cy.visit('/01.html');
    cy.get('H1').contains('Hello, World');
    cy.compareSnapshot('home');
  });

  it("handle missing base snapshot file as a failed spec", () => {
    cy.visit("/01.html");
    if (Cypress.env("type") === "actual") {
      try {
        cy.compareSnapshotTest("missing").should("be.false");
      } catch (e) {
        throw new Error("Missing snapshot file not handled correctly");
      }
    };
  });

  it('should display the register page correctly', () => {
    cy.visit('/02.html');
    cy.get('H1').contains('Register');
    cy.compareSnapshot('register');
  });

  it('should display the login page correctly', () => {
    cy.visit('/03.html');
    cy.get('H1').contains('Login');
    cy.compareSnapshot('login', 0.0);
    cy.compareSnapshot('login', 0.1);
  });

  it('should display the component correctly', () => {
    if (Cypress.env('type') === 'base') {
      cy.visit('/03.html');
      cy.get('H1').contains('Login');
      cy.get('form').compareSnapshot('login-form');
    } else {
      cy.visit('/03.html');
      cy.get('H1').contains('Login');
      cy.get('form').compareSnapshotTest('login-form').should('be.true');
      cy.get('form').compareSnapshotTest('login-form', 0.02).should('be.true');
    }
  });

  it('should display the foo page incorrectly', () => {
    if (Cypress.env('type') === 'base') {
      cy.visit('/04.html');
      cy.get('H1').contains('bar');
      cy.compareSnapshot('bar');
    } else {
      cy.visit('/05.html');
      cy.get('H1').contains('none');
      cy.compareSnapshotTest('bar').should('be.false');
    }
  });

  it('should handle custom error thresholds correctly', () => {
    if (Cypress.env('type') === 'base') {
      cy.visit('/04.html');
      cy.get('H1').contains('bar');
      cy.compareSnapshot('foo');
      cy.get('H1').compareSnapshot('h1');
    } else {
      cy.visit('/05.html');
      cy.get('H1').contains('none');
      cy.compareSnapshot('foo', 0.02);
      cy.compareSnapshotTest('foo', 0.02).should('be.true');
      cy.compareSnapshotTest('foo', 0.017).should('be.false');
      cy.get('H1').compareSnapshotTest('h1', 0.08).should('be.true');
      cy.get('H1').compareSnapshotTest('h1', 0.07).should('be.false');
    }
  });

  it('should handle custom error thresholds correctly - take 2', () => {
    if (Cypress.env('type') === 'base') {
      cy.visit('/06.html');
      cy.get('H1').contains('Color');
      cy.compareSnapshot('baz');
    } else {
      cy.visit('/07.html');
      cy.get('H1').contains('Color');
      cy.compareSnapshot('baz', 0.023);
      cy.compareSnapshotTest('baz', 0.023).should('be.true');
      cy.compareSnapshotTest('baz', 0.020).should('be.false');
      cy.compareSnapshotTest('baz').should('be.false');
    }
  });

  it('should compare images of different sizes', () => {
    if (Cypress.env('type') === 'base') {
      cy.visit('/07.html');
      cy.get('H1').contains('Color');
      cy.compareSnapshot('bar-07');
    } else {
      cy.visit('/08.html');
      cy.get('H1').contains('Color');
      cy.compareSnapshotTest('bar-07').should('be.false');
    }
  });

  it("should pass parameters to cy.screenshot", () => {
    cy.visit("/08.html");
    cy.compareSnapshot("screenshot-params-full", {
      capture: "fullPage"
    });
  });
});
