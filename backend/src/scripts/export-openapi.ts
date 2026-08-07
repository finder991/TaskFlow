import { NestFactory } from '@nestjs/core';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { AppModule } from '../app.module';
import { buildOpenApiDocument } from '../swagger';

async function run(): Promise<void> {
  process.env.SKIP_DB_CONNECT = 'true';
  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api');
  await app.init();

  const document = buildOpenApiDocument(app);
  const outPath = join(process.cwd(), 'openapi.json');
  writeFileSync(outPath, JSON.stringify(document, null, 2));

  console.log(`OpenAPI-схему збережено: ${outPath}`);

  process.exit(0);
}

void run();
