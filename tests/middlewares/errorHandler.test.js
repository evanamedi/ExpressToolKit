const errorHandler = require("../../src/middlewares/errorHandler");
const {
	ValidationError,
	NotFoundError,
	UnauthorizedError,
	ForbiddenError,
} = require("../../src/errors");
const config = require("../../src/config");

function mockResponse() {
	const res = {};
	res.status = jest.fn().mockReturnValue(res);
	res.json = jest.fn().mockReturnValue(res);
	return res;
}

beforeAll(() => {
	config.env = "test";
});

test("should respond with 500 for general errors", () => {
	const err = new Error("Something went wrong");
	const req = {};
	const res = mockResponse();
	const next = jest.fn();

	errorHandler(err, req, res, next);

	expect(res.status).toHaveBeenCalledWith(500);
	expect(res.json).toHaveBeenCalledWith({
		error: {
			message: "Internal Server Error",
		},
	});
});

test("should respond with 400 for validation errors", () => {
	const err = new ValidationError("Validation failed");
	err.name = "ValidationError";
	const req = {};
	const res = mockResponse();
	const next = jest.fn();

	errorHandler(err, req, res, next);

	expect(res.status).toHaveBeenCalledWith(400);
	expect(res.json).toHaveBeenCalledWith({
		error: {
			message: "Validation Error",
		},
	});
});

test("should respond with 404 for not found errors", () => {
	const err = new NotFoundError("Not found");
	err.name = "NotFoundError";
	const req = {};
	const res = mockResponse();
	const next = jest.fn();

	errorHandler(err, req, res, next);

	expect(res.status).toHaveBeenCalledWith(404);
	expect(res.json).toHaveBeenCalledWith({
		error: {
			message: "Resource Not Found",
		},
	});
});

test("should respond with 401 for unauthorized error", () => {
	const err = new UnauthorizedError("Unauthorized");
	err.name = "UnauthorizedError";
	const req = {};
	const res = mockResponse();
	const next = jest.fn();

	errorHandler(err, req, res, next);

	expect(res.status).toHaveBeenCalledWith(401);
	expect(res.json).toHaveBeenCalledWith({
		error: {
			message: "Unauthorized",
		},
	});
});

test("should respond with 403 for forbidden errors", () => {
	const err = new ForbiddenError("Forbidden");
	err.name = "ForbiddenError";
	const req = {};
	const res = mockResponse();
	const next = jest.fn();

	errorHandler(err, req, res, next);

	expect(res.status).toHaveBeenCalledWith(403);
	expect(res.json).toHaveBeenCalledWith({
		error: {
			message: "Forbidden",
		},
	});
});

test("should include details in development mode", () => {
	config.env = "development";

	const err = new Error("Detailed error");
	const req = {};
	const res = mockResponse();
	const next = jest.fn();

	errorHandler(err, req, res, next);

	expect(res.status).toHaveBeenCalledWith(500);
	expect(res.json).toHaveBeenCalledWith({
		error: {
			message: "Internal Server Error",
			details: "Detailed error",
			stack: expect.any(String),
		},
	});

	config.env = "test";
});
