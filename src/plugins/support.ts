import fp from 'fastify-plugin';

// the use of fastify-plugin is required to be able
// to export the decorators to the outer scope

export default fp(async function(fastify: any, opts: any): Promise<void> {
  fastify.decorate('someSupport', function(): string {
    return 'hugs';
  });
});
