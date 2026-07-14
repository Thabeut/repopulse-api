import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: (process.env.CORS_ORIGINS ?? 'http://localhost:5173').split(','),
    credentials: true,
  });

  const swagger = new DocumentBuilder()
    .setTitle('RepoPulse API')
    .setDescription('GitHub analytics backend — owns normalized data in Firestore')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api', app, SwaggerModule.createDocument(app, swagger));

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(`RepoPulse API listening on http://localhost:${port}`);
  console.log(`Swagger: http://localhost:${port}/api`);
  console.log(`Health:  http://localhost:${port}/api/v1/health`);
}

void bootstrap();
