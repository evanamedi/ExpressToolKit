class CustomError extends Error {
	constructor(message, name) {
		super(message);
		this.name = name;
	}
}

class ValidationError extends CustomError {
	constructor(message = "Validation Error") {
		super(message, "ValidationError");
	}
}

class NotFoundError extends CustomError {
	constructor(message = "Resource Not Found") {
		super(message, "NotFoundError");
	}
}

class UnauthorizedError extends CustomError {
	constructor(message = "Unauthorized") {
		super(message, "UnauthorizedError");
	}
}

class ForbiddenError extends CustomError {
	constructor(message = "Forbidden") {
		super(message, "ForbiddenError");
	}
}

module.exports = {
	ValidationError,
	NotFoundError,
	UnauthorizedError,
	ForbiddenError,
};
