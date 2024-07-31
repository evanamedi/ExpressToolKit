const express = require("express");
const request = require("supertest");
const { rateLimit, InMemoryStore } = require("../../src/middlewares/rateLimit");

describe("Rate Limiting Middleware", () => {
	let app;
	let inMemoryStore;

	beforeEach(() => {
		app = express();
		inMemoryStore = new InMemoryStore();

		const rateLimitOptions = {
			windowMs: 1000,
			maxRequests: 2,
			burstRequests: 1,
			maxStrikes: 2,
			blacklistDuration: 3000,
			store: "memory",
			storageOptions: {
				requestCounts: inMemoryStore,
				strikeCounts: inMemoryStore,
				tempBlacklist: inMemoryStore,
			},
			customMessage: "Too many requests, please try again later",
			tempBlacklistMessage:
				"Too many requests. You are temporarily blacklisted.",
			whitelist: [],
			blacklist: [],
			keyGenerator: (req) => req.ip,
			logFunction: jest.fn(),
		};

		app.use(rateLimit(rateLimitOptions));

		app.get("/", (req, res) => {
			res.send("Hello, Dan");
		});
	});

	it("should allow requests under the rate limit", async () => {
		const res1 = await request(app).get("/");
		expect(res1.status).toBe(200);
		expect(res1.text).toBe("Hello, Dan");

		const res2 = await request(app).get("/");
		expect(res2.status).toBe(200);
		expect(res2.text).toBe("Hello, Dan");
	});

	it("should rate limit requests exceeding the limit", async () => {
		await request(app).get("/");
		await request(app).get("/");

		const res = await request(app).get("/");
		expect(res.status).toBe(429);
		expect(res.text).toBe("Too many requests, please try again later");
	});

	it("should increment strikes when rate limit is exceeded", async () => {
		await request(app).get("/");
		await request(app).get("/");
		await request(app).get("/"); // first

		const strikes = await inMemoryStore.get("::ffff:127.0.0.1");
		expect(strikes.count).toBe(1);

		await new Promise((resolve) => setTimeout(resolve, 1000));
		await request(app).get("/");
		await request(app).get("/");
		await request(app).get("/"); // second

		const updatedStrikes = await inMemoryStore.get("::ffff:127.0.0.1");
		expect(updatedStrikes.count).toBe(2);
	});

	it("should temporarily blacklist after max strikes are exceeded", async () => {
		await request(app).get("/");
		await request(app).get("/");
		await request(app).get("/"); // first
		await new Promise((resolve) => setTimeout(resolve, 1000));
		await request(app).get("/");
		await request(app).get("/");
		await request(app).get("/"); // second

		const res = await request(app).get("/");
		expect(res.status).toBe(429);
		expect(res.text).toBe(
			"Too many requests. You are temporarily blacklisted."
		);
	});

	it("should allow requests after blacklist duration expires", async () => {
		await request(app).get("/");
		await request(app).get("/");
		await request(app).get("/"); // first
		await new Promise((resolve) => setTimeout(resolve, 1000));
		await request(app).get("/");
		await request(app).get("/");
		await request(app).get("/"); // second

		await new Promise((resolve) => setTimeout(resolve, 3000)); // let blacklist expire

		const res = await request(app).get("/");
		expect(res.status).toBe(200);
		expect(res.text).toBe("Hello, Dan");
	});

	it("should whitelist specified IPs", async () => {
		const rateLimitOptions = {
			windowMs: 1000,
			maxRequests: 2,
			burstRequests: 1,
			maxStrikes: 2,
			blacklistDuration: 3000,
			store: "memory",
			storageOptions: {
				requestCounts: inMemoryStore,
				strikeCounts: inMemoryStore,
				tempBlacklist: inMemoryStore,
			},
			customMessage: "Too many requests, please try again later",
			tempBlacklistMessage:
				"Too many requests. You are temporarily blacklisted.",
			whitelist: ["::ffff:127.0.0.1"],
			blacklist: [],
			keyGenerator: (req) => req.ip,
			logFunction: jest.fn(),
		};

		app = express();
		app.use(rateLimit(rateLimitOptions));
		app.get("/", (req, res) => {
			res.send("Hello, Dan");
		});

		await request(app).get("/");
		await request(app).get("/");
		await request(app).get("/");
		await request(app).get("/");
		await request(app).get("/");

		const res = await request(app).get("/");
		expect(res.status).toBe(200);
		expect(res.text).toBe("Hello, Dan");
	});

	it("should permanently blacklist specified IPs", async () => {
		const rateLimitOptions = {
			windowMs: 1000,
			maxRequests: 2,
			burstRequests: 1,
			maxStrikes: 2,
			blacklistDuration: 3000,
			store: "memory",
			storageOptions: {
				requestCounts: inMemoryStore,
				strikeCounts: inMemoryStore,
				tempBlacklist: inMemoryStore,
			},
			customMessage: "Too many requests, please try again later.",
			tempBlacklistMessage:
				"Too many requests. You are temporarily blacklisted.",
			whitelist: [],
			blacklist: ["::ffff:127.0.0.1"],
			keyGenerator: (req) => req.ip,
			logFunction: jest.fn(),
		};
		app = express();
		app.use(rateLimit(rateLimitOptions));
		app.get("/", (req, res) => {
			res.send("Hello, world!");
		});

		const res = await request(app).get("/");
		expect(res.status).toBe(429);
		expect(res.text).toBe("Access denied.");
	});
});
