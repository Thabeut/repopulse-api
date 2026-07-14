import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './common/configure-app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(`RepoPulse API listening on http://localhost:${port}`);
  console.log(`Swagger: http://localhost:${port}/api`);
  console.log(`Health:  http://localhost:${port}/api/v1/health`);
}

void bootstrap();
