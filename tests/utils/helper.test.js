const helperFunction = require("../../src/utils/helper");

test("should return helper function result", () => {
	expect(helperFunction()).toBe("Helper function result");
});
