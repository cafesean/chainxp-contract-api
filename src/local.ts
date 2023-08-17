import dotenv from "dotenv";
import Fastify from "fastify";
import appModule from "./app";

// Read the .env file.
dotenv.config();

const fastifyOptions = {
	logger: true,
};

function init() {
	const app = Fastify(fastifyOptions);
	app.register(appModule);
	return app;
}

if (require.main === module) {
	// called directly i.e. "node app"

	var port = 3000;
	init().listen({ port: port, host: '0.0.0.0'  }, (err) => {
		if (err) console.error(err);
		console.log("server listening on " + port);
	});
} else {
	// required as a module => executed on aws lambda
	module.exports = init;
}
