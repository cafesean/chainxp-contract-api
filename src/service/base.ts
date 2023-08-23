import { PrismaClient } from '@prisma/client'
import FastifyBaseLogger from 'fastify';
// import Redis from 'ioredis';

import Polygon from '../../src/providers/polygon';
// import Alchemy from '@providers/alchemy';
import Config from '../config.interface';
import Artifacts from '../artifacts.interface';
import Alchemy from '../providers/alchemy';

export class BaseService {
  config!: Config;
  log!: typeof FastifyBaseLogger;
  prisma!: PrismaClient;
  // redis!: Redis;
  polygon!: Polygon;
  artifacts!: Artifacts
  alchemy!: Alchemy;
}
