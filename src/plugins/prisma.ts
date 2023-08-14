import { Prisma, PrismaClient } from '@prisma/client';
import fp from 'fastify-plugin';

export type FastifyPrismaClientOptions = Omit<
  Prisma.PrismaClientOptions,
  '__internal'
>;

export default fp(async (fastify: any, opts: any) => {
  if (fastify.prisma) {
    throw (new Error('fastify-prisma-client has been defined before'));
  }

  const prisma = new PrismaClient({
    // rejectOnNotFound: opts.rejectOnNotFound,
    // datasources: opts.datasources,
    // errorFormat: opts.errorFormat,
    // log: opts.log
  });

  await prisma.$connect();

  fastify
    .decorate('prisma', prisma)
    .decorateRequest('prisma', { getter: () => fastify.prisma })
    .addHook('onClose', async (fastify: any, done: any) => {
      await fastify.prisma.$disconnect();
      done();
    });
}, {
  fastify: '4.x',
  name: 'fastify-prisma-client',
  dependencies: [
    // 'crowdserve-config'
  ]
});

declare module 'fastify' {
  interface FastifyRequest {
    prisma: PrismaClient;
  }
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}