function exampleMiddleware(req, res, next) {
	console.log(`Request URL: ${req.url}`);
	// logic

	next();
}

module.exports = exampleMiddleware;
