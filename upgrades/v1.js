process.env.noworkers = true;
require('../src/bootstrap');
const sleep = (timer = 1) => {
	return new Promise((resolve, reject) => {
		setTimeout(resolve, timer * 1000);
	});
};
(async () => {
	let cursor = false;
	await global.redisClient.connect().catch(() => {});

	while (cursor !== 0) {
		const users = await global.redisClient.scan(cursor !== false ? cursor : 0, 'match', 'xla:Users:*', 'count', 100);
		for (const user of users[1]) {
			if (!user) continue;
			const wallet = await global.redisClient.hget(user,'wallet');
			if(!wallet) continue;
			await global.redisClient.pipeline([
				['hset',user,'xla', wallet],
				['hdel',user,'wallet']
			]).exec(() => {
				console.log("User migrated", user);
			});
		}
		cursor = parseInt(users[0]);
		await sleep(0.1);
	}
	process.exit();
})();