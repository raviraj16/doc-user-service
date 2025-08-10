import { getDatabaseConfig } from './database.config';
import { ConfigService } from '@nestjs/config';

describe('Database Config', () => {
  let configService: ConfigService;

  beforeEach(() => {
    configService = new ConfigService();
  });

  it('should return database configuration with all options', () => {
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      switch (key) {
        case 'DB_HOST':
          return 'localhost';
        case 'DB_PORT':
          return 5432;
        case 'DB_USERNAME':
          return 'postgres';
        case 'DB_PASSWORD':
          return 'password';
        case 'DB_DATABASE':
          return 'document_db';
        case 'NODE_ENV':
          return 'development';
        default:
          return undefined;
      }
    });

    const config = getDatabaseConfig(configService);

    expect(config).toEqual({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'password',
      database: 'document_db',
      entities: expect.any(Array),
      synchronize: true,
      logging: true,
      ssl: false,
    });
  });

  it('should enable SSL for production environment', () => {
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'NODE_ENV') {
        return 'production';
      }
      return undefined;
    });

    const config = getDatabaseConfig(configService) as any;

    expect(config.ssl).toEqual({
      rejectUnauthorized: false,
    });
    expect(config.synchronize).toBe(false);
    expect(config.logging).toBe(false);
  });

  it('should include entity files pattern', () => {
    const config = getDatabaseConfig(configService);

    expect(config.entities).toBeDefined();
    expect((config.entities as string[])[0]).toContain('**/*.entity{.ts,.js}');
  });
});
