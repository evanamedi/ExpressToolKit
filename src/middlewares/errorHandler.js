const config = require("../config");

function errorHandler(err, req, res, next) {
	const isDevelopment = config.env === "development";

	// standard error response format
	const response = {
		error: {
			message: "Internal Server Error",
			...(isDevelopment && { details: err.message, stack: err.stack }),
		},
	};

	if (isDevelopment) {
		console.error(err);
	} else {
		// optionally log to a file
		// fs.appendFileSync('error.log', `${new Date().toISOString()} - ${err.message}\n`);
	}

	// determine the status code and message based on the error type
	if (err.name === "ValidationError") {
		res.status(400).json({
			error: {
				message: "Validation Error",
				...(isDevelopment && { details: err.message }),
			},
		});
	} else if (err.name === "NotFoundError") {
		res.status(404).json({ error: { message: "Resource Not Found" } });
	} else if (err.name === "UnauthorizedError") {
		res.status(401).json({ error: { message: "Unauthorized" } });
	} else if (err.name === "ForbiddenError") {
		res.status(403).json({ error: { message: "Forbidden" } });
	} else {
		res.status(500).json(response);
	}
}

module.exports = errorHandler;
