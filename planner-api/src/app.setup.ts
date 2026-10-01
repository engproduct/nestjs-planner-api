import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Env } from './config/env.js';

// Configuração global compartilhada por main.ts e pelos testes e2e, para que
// os testes exercitem a mesma aplicação que sobe em produção.
export function configureApp(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = app.get<ConfigService<Env, true>>(ConfigService);
  if (config.get('SWAGGER_ENABLED', { infer: true })) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('Planner API')
        .setDescription(
          'Prontuário eletrônico: pacientes, agendamentos e observações',
        )
        .setVersion('0.0.1')
        .build(),
    );
    SwaggerModule.setup('docs', app, document);
  }
}
