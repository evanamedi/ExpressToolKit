class InMemoryStore {
	constructor() {
		this.store = {};
	}

	async get(key) {
		return this.store[key];
	}

	async set(key, value) {
		this.store[key] = value;
	}
}

const rateLimit = (options) => {
	const {
		windowMs = 60000,
		maxRequests = 10,
		burstRequests = 5,
		maxStrikes = 3,
		blacklistDuration = 300000, // 5 min
		store = "memory",
		storageOptions = {},
		customMessage = "Too many requests, please try again later",
		tempBlacklistMessage = "Too many requests. You are temporarily blacklisted.",
		whitelist = [],
		blacklist = [],
		keyGenerator = (req) => req.ip,
		logFunction = console.log,
	} = options;

	let requestCounts = {};
	let strikeCounts = {};
	let tempBlacklist = {};

	if (
		store === "external" &&
		typeof storageOptions.get === "function" &&
		typeof storageOptions.set === "function"
	) {
		requestCounts = storageOptions.requestCounts;
		strikeCounts = storageOptions.strikeCounts;
		tempBlacklist = storageOptions.tempBlacklist;
	} else {
		requestCounts = new InMemoryStore();
		strikeCounts = new InMemoryStore();
		tempBlacklist = new InMemoryStore();
	}

	return async (req, res, next) => {
		const key = keyGenerator(req);

		if (whitelist.includes(key)) {
			return next();
		}

		const currentTime = Date.now();

		// check if client is in temp blacklist
		const blacklistedUntil = await tempBlacklist.get(key);
		if (blacklistedUntil && currentTime < blacklistedUntil) {
			return res.status(429).send(tempBlacklistMessage);
		}

		// check if client is in perm blacklist
		if (blacklist.includes(key)) {
			return res.status(429).send("Access denied.");
		}

		const record = (await requestCounts.get(key)) || {
			count: 0,
			startTime: currentTime,
		};

		if (currentTime - record.startTime > windowMs) {
			record.count = 1;
			record.startTime = currentTime;
		} else {
			record.count += 1;
		}

		await requestCounts.set(key, record);

		if (record.count > maxRequests + burstRequests) {
			// increment strike count
			const strikes = ((await strikeCounts.get(key)) || 0) + 1;
			await strikeCounts.set(key, strikes);

			if (strikes >= maxStrikes) {
				await tempBlacklist.set(key, currentTime + blacklistDuration);
				logFunction(
					`Client ${key} temporarily blacklisted until ${new Date(
						currentTime + blacklistDuration
					)}`
				);
				res.set("Retry-after", Math.ceil(blacklistDuration / 1000));
				return res.status(429).send(tempBlacklistMessage);
			}

			res.set(
				"Retry-After",
				Math.ceil((record.startTime + windowMs - currentTime) / 1000)
			);
			res.status(429).send(customMessage);
			logFunction(
				`Rate limit exceeded for ${key}. Strike ${strikes}/${maxStrikes}`
			);
		} else {
			next();
		}
	};
};

module.exports = { rateLimit, InMemoryStore };

// ---------- EXAMPLE IN USE ----------

/*


const inMemoryStore = new InMemoryStore();
const rateLimitOptions = {
    window: 60000,
    maxRequests: 10,
    burstRequests: 5,
    maxStrikes: 3,
    blacklistDuration: 300000,
    store: "memory",
    storageOptions: {
        requestCounts: inMemoryStore,
        strikeCounts: inMemoryStore,
        tempBlacklist: inMemoryStore,
    },
    customMessage: "Too many requests, please try again later",
    whitelist: ["127.0.0.1"],
    blacklist: [],
    keyGenerator: (req) => req.ip,
    logFunction: (msg) => console.log(msg),
}

app.use(rateLimit(rateLimitOptions));


*/
