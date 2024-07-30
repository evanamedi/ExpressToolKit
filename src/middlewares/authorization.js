function authorization(requiredRoles) {
	return (req, res, next) => {
		const user = req.user;

		if (!user) {
			return res.status(401).json({ error: { message: "Unauthorized" } });
		}

		const hasRole = requiredRoles.some((role) => user.roles.includes(role));

		if (!hasRole) {
			return res.status(403).json({ error: { message: "Forbidden" } });
		}

		next();
	};
}

module.exports = authorization;
