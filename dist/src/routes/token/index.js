"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
async function default_1(fastify, opts) {
    fastify.get('/', async function (request, reply) {
        return 'token route';
    });
}
exports.default = default_1;
