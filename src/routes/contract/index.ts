export default async function(fastify: any, opts: any): Promise<void> {
  fastify.get('/', async function(request: any, reply: any): Promise<string> {
    return 'contract route';
  });
}