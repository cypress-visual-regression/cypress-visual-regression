describe('Visual Regression Example', () => {

  it('should display the home page correctly', () => {
    cy.visit(`/01.html`);
    cy.get('H1').contains('Hello, World');
    cy.compareSnapshot('home');
  });

  it('should display the register page correctly', () => {
    cy.visit(`/02.html`);
    cy.get('H1').contains('Register');
    cy.compareSnapshot('register');
  });

  it('should display the login page correctly', () => {
    cy.visit(`/03.html`);
    cy.get('H1').contains('Login');
    cy.compareSnapshot('login');
  });

  it('should display the JSON correctly', () => {
    cy.visit(`/04.html`);
    cy.get('H1').contains('bar');
    cy.compareSnapshot('bar');
  });

});
