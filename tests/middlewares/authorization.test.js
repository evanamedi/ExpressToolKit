const express = require("express");
const request = require("supertest");
const authorization = require("../../src/middlewares/authorization");
const errorHandler = require("../../src/middlewares/errorHandler");
const config = require("../../src/config");

config.env = "test";

describe("Authorization Middleware", () => {
	let app;

	beforeEach(() => {
		app = express();

		app.use((req, res, next) => {
			req.user = { roles: ["user"] };
			next();
		});

		app.get("/admin", authorization(["admin"]), (req, res) => {
			res.send("Welcome, Admin!");
		});

		app.get("/user", authorization(["user"]), (req, res) => {
			res.send("Welcome, User!");
		});

		app.get("/any", authorization(["admin", "user"]), (req, res) => {
			res.send("Welcome, Admin or User!");
		});

		app.use(errorHandler);
	});

	test("should respond with 401 if user is not authenticated", async () => {
		const testApp = express();

		testApp.use((req, res, next) => {
			req.user = null;
			next();
		});

		testApp.get("/admin", authorization(["admin"]), (req, res) => {
			res.send("Welcome, Admin!");
		});

		testApp.use(errorHandler);

		const response = await request(testApp).get("/admin");
		expect(response.status).toBe(401);
		expect(response.body).toEqual({
			error: {
				message: "Unauthorized",
			},
		});
	});

	test("should respond with 403 if user does not have required role", async () => {
		const response = await request(app).get("/admin");
		expect(response.status).toBe(403);
		expect(response.body).toEqual({
			error: {
				message: "Forbidden",
			},
		});
	});

	test("should allow access if user has required role", async () => {
		const response = await request(app).get("/user");
		expect(response.status).toBe(200);
		expect(response.text).toBe("Welcome, User!");
	});

	test("should allow access if user has one of the required roles", async () => {
		const response = await request(app).get("/any");
		expect(response.status).toBe(200);
		expect(response.text).toBe("Welcome, Admin or User!");
	});
});
