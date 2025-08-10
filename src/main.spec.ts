import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

// Mock the dependencies
jest.mock('@nestjs/core');
jest.mock('@nestjs/swagger');
jest.mock('cookie-parser');

describe('Main Bootstrap', () => {
  let mockApp: any;
  let mockDocument: any;

  beforeEach(() => {
    mockApp = {
      useGlobalPipes: jest.fn(),
      use: jest.fn(),
      listen: jest.fn(),
    };

    mockDocument = {
      build: jest.fn(),
    };

    (NestFactory.create as jest.Mock).mockResolvedValue(mockApp);
    (DocumentBuilder as jest.Mock).mockImplementation(() => ({
      setTitle: jest.fn().mockReturnThis(),
      setDescription: jest.fn().mockReturnThis(),
      setVersion: jest.fn().mockReturnThis(),
      addBearerAuth: jest.fn().mockReturnThis(),
      build: jest.fn().mockReturnValue(mockDocument),
    }));
    (SwaggerModule.createDocument as jest.Mock).mockReturnValue(mockDocument);
    (SwaggerModule.setup as jest.Mock).mockImplementation(() => {});
    (cookieParser as jest.Mock).mockReturnValue(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create NestJS application', async () => {
    // Import the main module to trigger bootstrap
    const bootstrap = require('./main');
    
    expect(NestFactory.create).toHaveBeenCalledWith(AppModule);
  });

  it('should configure global validation pipe', async () => {
    const bootstrap = require('./main');
    
    expect(mockApp.useGlobalPipes).toHaveBeenCalledWith(
      expect.any(ValidationPipe)
    );
  });

  it('should setup cookie parser middleware', async () => {
    const bootstrap = require('./main');
    
    expect(cookieParser).toHaveBeenCalled();
    expect(mockApp.use).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should setup Swagger documentation', async () => {
    const bootstrap = require('./main');
    
    expect(DocumentBuilder).toHaveBeenCalled();
    expect(SwaggerModule.createDocument).toHaveBeenCalledWith(mockApp, mockDocument);
    expect(SwaggerModule.setup).toHaveBeenCalledWith('api', mockApp, mockDocument);
  });

  it('should start listening on port 3000', async () => {
    const bootstrap = require('./main');
    
    expect(mockApp.listen).toHaveBeenCalledWith(3000);
  });
});
