const express = require("express");
const errorHandler = require("./src/middlewares/errorHandler");
const {
	ValidationError,
	NotFoundError,
	UnauthorizedError,
	ForbiddenError,
} = require("./src/errors");
const authorization = require("./src/middlewares/authorization");
const config = require("./src/config");

const app = express();

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

app.get("/validation-error", (req, res, next) => {
	try {
		throw new ValidationError("This is a validation error");
	} catch (error) {
		next(error);
	}
});

app.get("/not-found-error", (req, res, next) => {
	try {
		throw new NotFoundError("This resource was not found");
	} catch (error) {
		next(error);
	}
});

app.get("/unauthorized-error", (req, res, next) => {
	try {
		throw new UnauthorizedError(
			"You need to be logged in to access this resource"
		);
	} catch (error) {
		next(error);
	}
});

app.get("/forbidden-error", (req, res, next) => {
	try {
		throw new ForbiddenError("Access to this resource is forbidden");
	} catch (error) {
		next(error);
	}
});

app.get("/generic-error", (req, res, next) => {
	try {
		throw new Error("This is a generic error");
	} catch (error) {
		next(error);
	}
});

app.use(errorHandler);

app.listen(3000, () => {
	console.log(`Server is running on port 3000 in ${config.env} mode`);
});
