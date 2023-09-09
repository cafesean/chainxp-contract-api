import { FastifyInstance } from "fastify";
// import * as abi from "../../constants/abi.constants";

// import { genericSchema } from "../../schema/index";

export default async function contractRoute(fastify: FastifyInstance) {
	fastify.get("/", async function (request: any, resp: any): Promise<any> {
		resp
			.code(200)
			.header("Content-Type", "application/json; charset=utf-8")
			.send({ result: "Deploy API"});
	});


	fastify.get("/getSigner", async (request: any, resp: any) => {
		const response = await fastify.service.deploy.getSigner();

		resp.code(200).header("Content-Type", "application/json; charset=utf-8").send(response);
	});


	fastify.put("/create", async (request: any, resp: any) => {
		const { token, delegate, factory, version, isDefault, tierId } = request.body;
		// append response to the responseJSON object
		const response = await fastify.service.deploy.createContracts(token, delegate, factory, version, isDefault, tierId);

		resp.code(200).header("Content-Type", "application/json; charset=utf-8").send(response);
	});

	fastify.post("/deploySingle", async (request: any, resp: any) => {
		const { contract_name, name, baseUri, description, symbol } = request.body;
		const options = [name, baseUri, description, symbol];

		console.log("contract_name: ", contract_name);
		console.log("options: ", options);
		const contract = (await fastify.service.deploy.deploySingle(contract_name, options)) as any;

		resp.code(200).header("Content-Type", "application/json; charset=utf-8").send({ result: contract.address });
	});

	fastify.post("/deployAll", async (request: any, resp: any) => {
		const { name, baseUri, description, symbol } = request.body;
		const contract = (await fastify.service.deploy.deployAll(name, baseUri, description, symbol)) as any;

		resp.code(200).header("Content-Type", "application/json; charset=utf-8").send({ result: contract });
	});

	fastify.post("/configure", async (request: any, resp: any) => {
		const { proxyAddress, delegateAddress } = request.body;
		const contract = (await fastify.service.deploy.configureProxy(proxyAddress, delegateAddress)) as any;

		resp.code(200).header("Content-Type", "application/json; charset=utf-8").send({ result: contract });
	});

	fastify.post("/clone", async (request: any, resp: any) => {
		// const { name,  } = request.body;

		const contract = await fastify.service.deploy.cloneProxy(request.body);

		resp.code(200).header("Content-Type", "application/json; charset=utf-8").send({ result: contract });
	});

	fastify.post("/deployFactory", async (request: any, resp: any) => {
		// const { name,  } = request.body;

		const contract = await fastify.service.deploy.deployFactory(request.body);

		resp.code(200).header("Content-Type", "application/json; charset=utf-8").send({ result: contract });
	});
}
