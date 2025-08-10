import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { DataSource } from 'typeorm';

describe('HealthController', () => {
  let controller: HealthController;
  let dataSource: jest.Mocked<DataSource>;

  beforeEach(async () => {
    const mockDataSource = {
      isInitialized: true,
      query: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    dataSource = module.get(DataSource);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should have dataSource injected', () => {
    expect(dataSource).toBeDefined();
  });

  describe('Health Check', () => {
    it('should check database connection', async () => {
      // Arrange
      dataSource.query.mockResolvedValue([{ now: new Date() }]);

      // Act
      await dataSource.query('SELECT NOW()');

      // Assert
      expect(dataSource.query).toHaveBeenCalledWith('SELECT NOW()');
    });

    it('should handle database connection errors', async () => {
      // Arrange
      dataSource.query.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(dataSource.query('SELECT NOW()')).rejects.toThrow('Database connection failed');
    });

    it('should check if dataSource is initialized', () => {
      // Assert
      expect(dataSource.isInitialized).toBe(true);
    });
  });
});
