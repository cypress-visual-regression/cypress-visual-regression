const { getSubfolderName } = require("./get-subfolder-name");

it("should handle when parent folder is first folder", () => {
    expect.assertions(1);
    const subfolderName = getSubfolderName("src/foo/bar/baz/test.cy.ts", "src");
    expect(subfolderName).toBe("foo/bar/baz");
});

it("should handle when parent folder is last folder", () => {
    expect.assertions(1);
    const subfolderName = getSubfolderName("foo/bar/baz/src/test.cy.ts", "src");
    expect(subfolderName).toBe("");
});

it("should handle when parent folder is between first and last folder", () => {
    expect.assertions(1);
    const subfolderName = getSubfolderName("foo/bar/src/baz/test.cy.ts", "src");
    expect(subfolderName).toBe("baz");
});

it("should throw when parent folder is not found", () => {
    expect.assertions(1);
    expect(() => getSubfolderName("foo/bar/baz/test.cy.ts", "src")).toThrow();
});
