import fp from 'fastify-plugin';
import Alchemy from '../providers/alchemy';
// import { POLYGON_NETWORK, POLYGON_PRIVATE_KEY } from '@root/constants/env.constants';
// import dotenv from 'dotenv';

export default fp((fastify:any, _:any, done:any) => {
  const alchemyClient = new Alchemy(
    // fastify.config.alchemy.apiKey,
    // fastify.config.alchemy.network,
  );
  fastify.decorate('alchemy', alchemyClient);
  done();
}, {
  fastify: '4.x',
  name: 'fastify-alchemy-client',
  dependencies: [
    'chainxp-config',
  ]
});

declare module 'fastify' {
  interface FastifyInstance {
    alchemy: Alchemy;
  }
}
