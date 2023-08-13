"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const autoload_1 = __importDefault(require("@fastify/autoload"));
async function default_1(fastify, opts) {
    fastify.register(autoload_1.default, {
        dir: path_1.default.join(__dirname, 'plugins'),
        options: { ...opts }
    });
    fastify.register(autoload_1.default, {
        dir: path_1.default.join(__dirname, 'routes'),
        options: { ...opts }
    });
}
exports.default = default_1;
