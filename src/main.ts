import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);


  // Enable CORS for frontend demo
  app.enableCors();

  // Enable global validation (returns 400 for invalid DTOs)
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // strip properties not in DTO
    transform: true, // auto-transform types
  }));

  // Enable global error handling (returns JSON for all errors)
  app.useGlobalFilters(new AllExceptionsFilter());

  const config = new DocumentBuilder()
    .setTitle('Prediction Engine API')
    .setDescription('Headless prediction market engine with autonomous agents and Web3 settlement')
    .setVersion('1.0')
    .addTag('markets')
    .addTag('trading')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
