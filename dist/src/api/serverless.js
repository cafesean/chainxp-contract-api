"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const fastify_1 = __importDefault(require("fastify"));
const app_1 = __importDefault(require("../app"));
dotenv_1.default.config();
const app = (0, fastify_1.default)({
    logger: true
});
app.register(app_1.default);
exports.default = async (req, res) => {
    await app.ready();
    app.server.emit("request", req, res);
};
