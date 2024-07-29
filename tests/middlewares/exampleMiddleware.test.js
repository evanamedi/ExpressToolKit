const exampleMiddleware = require("../../src/middlewares/exampleMiddleware");

test("should log request URL", () => {
	const req = { url: "/test" };
	const res = {};
	const next = jest.fn();

	console.log = jest.fn();

	exampleMiddleware(req, res, next);

	expect(console.log).toHaveBeenCalledWith("Request URL: /test");
	expect(next).toHaveBeenCalled();
});
