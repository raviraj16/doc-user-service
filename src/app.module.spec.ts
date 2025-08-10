import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AuthModule } from './modules/auth/auth.module';
import { DocumentModule } from './modules/document/document.module';
import { HealthModule } from './modules/health/health.module';
import { UserModule } from './modules/user/user.module';
import { IngestionModule } from './modules/ingestion/ingestion.module';

describe('AppModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    // Mock external dependencies to avoid actual database connections
    jest.mock('./config/database.config', () => ({
      databaseConfig: {
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'test',
        password: 'test',
        database: 'test',
        entities: [],
        synchronize: false,
      },
    }));

    module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideModule(TypeOrmModule.forRoot())
      .useModule(
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [],
          synchronize: true,
        })
      )
      .compile();
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should have AuthModule imported', () => {
    const authModule = module.get(AuthModule);
    expect(authModule).toBeDefined();
  });

  it('should have DocumentModule imported', () => {
    const documentModule = module.get(DocumentModule);
    expect(documentModule).toBeDefined();
  });

  it('should have HealthModule imported', () => {
    const healthModule = module.get(HealthModule);
    expect(healthModule).toBeDefined();
  });

  it('should have UserModule imported', () => {
    const userModule = module.get(UserModule);
    expect(userModule).toBeDefined();
  });

  it('should have IngestionModule imported', () => {
    const ingestionModule = module.get(IngestionModule);
    expect(ingestionModule).toBeDefined();
  });
});
