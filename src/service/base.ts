import { PrismaClient } from '@prisma/client'
import FastifyBaseLogger from 'fastify';
// import Redis from 'ioredis';

import Polygon from '@providers/polygon';
import Alchemy from '@providers/alchemy';
import Config from '../config.interface';
import Artifacts from '@root/artifacts.interface';

export class BaseService {
  config!: Config;
  log!: typeof FastifyBaseLogger;
  prisma!: PrismaClient;
  // redis!: Redis;
  polygon!: Polygon;
  alchemy!: Alchemy;
  artifacts!: Artifacts
}
