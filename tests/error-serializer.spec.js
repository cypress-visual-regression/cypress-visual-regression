const { errorSerialize } = require("../src/utils");
const { deserializeError } = require("../src/utils-browser");

describe("errorSerialize", () => {
  it("should be serialize", () => {
    const serialize = errorSerialize(new Error("MATCHED"));
    expect(serialize).toMatch('"message":"MATCHED"');
    expect(serialize).toMatch('"stack":"Error: MATCHED');
  });
  it("should be deserialize", () => {
    const deserialize = deserializeError(errorSerialize(new Error("MATCHED")));
    expect(deserialize).toMatchObject({ message: "MATCHED" });
    expect(deserialize.stack).toMatch("Error: MATCHED");
  });
});
