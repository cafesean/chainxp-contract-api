"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const contract_1 = require("../../schema/contract");
async function contractController(fastify) {
    fastify.get("/", async (request, reply) => {
        var message = await fastify.service.contract.version();
        return { result: message };
    });
    fastify.get("/network", async (request, reply) => {
        var message = await fastify.service.contract.network();
        return { result: message };
    });
    fastify.put("/create", async (request, resp) => {
        const { version, isDefault } = request.body;
        console.log("Adding delegate contract");
        await fastify.service.contract.addContractAbi(JSON.stringify(fastify.config.artifacts.delegateAbi), fastify.config.artifacts.delegateBytecode, fastify.config.artifacts.delegateContractName, fastify.config.artifacts.delegateSourceName, version, isDefault);
        console.log("Adding token contract");
        await fastify.service.contract.addContractAbi(JSON.stringify(fastify.config.artifacts.tokenAbi), fastify.config.artifacts.tokenBytecode, fastify.config.artifacts.tokenContractName, fastify.config.artifacts.tokenSourceName, version, isDefault);
        console.log("Adding factory contract");
        await fastify.service.contract.addContractAbi(JSON.stringify(fastify.config.artifacts.factoryAbi), fastify.config.artifacts.factoryBytecode, fastify.config.artifacts.factoryContractName, fastify.config.artifacts.factorySourceName, version, isDefault);
        console.log("Adding template contract");
        await fastify.service.contract.addContractAbi(JSON.stringify(fastify.config.artifacts.templateAbi), fastify.config.artifacts.templateBytecode, fastify.config.artifacts.templateContractName, fastify.config.artifacts.templateSourceName, version, isDefault);
        return "done";
    });
    fastify.post("/deploy", (0, contract_1.deployContractSchema)(fastify), async (request, resp) => {
        const contract = await fastify.service.contract.deployAll(request.body);
        return {
            contract_id: contract,
        };
    });
    fastify.post("/clone", async (request, resp) => {
        const contract = await fastify.service.contract.cloneProxy(request.body);
        return {
            contract_id: contract,
        };
    });
    fastify.post("/deployFactory", (0, contract_1.deployContractSchema)(fastify), async (request, resp) => {
        const contract = await fastify.service.contract.deployFactory(request.body);
        return {
            contract_id: contract,
        };
    });
    fastify.post("/:contract_id/class", (0, contract_1.addContractClassSchema)(fastify), async (request, resp) => {
        const { contract_id } = request.params;
        console.log("In addClass route");
        const contractClass = await fastify.service.contract.addClass(contract_id, request.body);
        return {
            class_id: contractClass,
        };
    });
    fastify.post("/:contract_id/mint/:class_id", (0, contract_1.mintContractNFTSchema)(fastify), async (request, resp) => {
        const { contract_id, class_id } = request.params;
        const { address } = request.query;
        const response = await fastify.service.contract.mintNFT(contract_id, class_id, address);
        const txn = response[0];
        console.log("fastify.put txn: ", txn);
        return txn;
    });
}
exports.default = contractController;
