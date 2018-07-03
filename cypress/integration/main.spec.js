const baseURL = 'http://mherman.org/testcafe-visual-regression';


describe('Visual Regression Example', () => {

  it('should display the home page correctly', () => {
    cy.visit(`${baseURL}/01.html`);
    cy.get('H1').contains('Hello, World');
    cy.compareSnapshot('home');
  });

  it('should display the register page correctly', () => {
    cy.visit(`${baseURL}/02.html`);
    cy.get('H1').contains('Register');
    cy.compareSnapshot('register');
  });

  it('should display the login page correctly', () => {
    cy.visit(`${baseURL}/03.html`);
    cy.get('H1').contains('Login');
    cy.compareSnapshot('login');
  });

});
