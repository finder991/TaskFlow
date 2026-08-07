import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { ACCESS_COOKIE } from './auth/auth-cookie.service';

export function buildOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('TaskFlow')
    .setDescription(
      'Task Management system. Автентифікація — httpOnly-cookie, які встановлює /auth/login. ' +
        'Для ручних запитів (curl/Postman) також підтримується заголовок Bearer.',
    )
    .setVersion('0.1.0')
    .addCookieAuth(ACCESS_COOKIE)
    .addBearerAuth()
    .build();
  return SwaggerModule.createDocument(app, config);
}

export function setupSwagger(app: INestApplication): void {
  const document = buildOpenApiDocument(app);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true, withCredentials: true },
  });
}
