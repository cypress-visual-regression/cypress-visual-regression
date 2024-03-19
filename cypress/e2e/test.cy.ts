describe("Visual Regression Example", () => {
    it("should display the home page correctly", () => {
        cy.visit("/index.html");
        cy.toMatchScreenshot();
    });

    it("should capture only given element", () => {
        cy.visit("/index.html");
        cy.get("#testImage").toMatchScreenshot();
    });
});
