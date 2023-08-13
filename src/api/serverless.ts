import dotenv from "dotenv";
import Fastify from "fastify";
import appModule from "../app";

// Read the .env file.
dotenv.config();

// Instantiate Fastify with some config
const app = Fastify({
  logger: true
});

// Register your application as a normal plugin.
app.register(appModule);

export default async (req: any, res: any): Promise<void> => {
  await app.ready();
  app.server.emit("request", req, res);
};
