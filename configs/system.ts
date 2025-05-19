// Redis configuration for BullMQ
import { RedisOptions } from 'ioredis';

export interface SystemConfig {
  redis: RedisOptions;
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    ssl: boolean;
  };
  smpp: {
    port: number;
    host: string;
    maxConnections: number;
    sessionTimeout: number;
    requireTLS: boolean;
    bindTimeout: number;
    enquireLinkInterval: number;
  };
  api: {
    port: number;
    host: string;
    cors: {
      origin: string[];
      methods: string[];
      allowedHeaders: string[];
    };
    rateLimit: {
      windowMs: number;
      max: number;
    };
  };
  logging: {
    level: 'error' | 'warn' | 'info' | 'debug';
    format: 'json' | 'text';
    directory: string;
    maxSize: string;
    maxFiles: string;
  };
  monitoring: {
    enabled: boolean;
    metrics: {
      enabled: boolean;
      port: number;
    };
    healthCheck: {
      enabled: boolean;
      interval: number;
    };
  };
}

export const systemConfig: SystemConfig = {
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB, 10) : 0,
    retryStrategy: (times: number) => Math.min(times * 50, 2000)
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'smpp',
    ssl: process.env.DB_SSL === 'true'
  },
  smpp: {
    port: process.env.SMPP_PORT ? parseInt(process.env.SMPP_PORT, 10) : 2775,
    host: process.env.SMPP_HOST || '0.0.0.0',
    maxConnections: process.env.SMPP_MAX_CONNECTIONS ? parseInt(process.env.SMPP_MAX_CONNECTIONS, 10) : 100,
    sessionTimeout: process.env.SMPP_SESSION_TIMEOUT ? parseInt(process.env.SMPP_SESSION_TIMEOUT, 10) : 30,
    requireTLS: process.env.SMPP_REQUIRE_TLS === 'true',
    bindTimeout: process.env.SMPP_BIND_TIMEOUT ? parseInt(process.env.SMPP_BIND_TIMEOUT, 10) : 30,
    enquireLinkInterval: process.env.SMPP_ENQUIRE_LINK_INTERVAL ? parseInt(process.env.SMPP_ENQUIRE_LINK_INTERVAL, 10) : 30
  },
  api: {
    port: process.env.API_PORT ? parseInt(process.env.API_PORT, 10) : 3000,
    host: process.env.API_HOST || '0.0.0.0',
    cors: {
      origin: (process.env.CORS_ORIGIN || '*').split(','),
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    },
    rateLimit: {
      windowMs: process.env.RATE_LIMIT_WINDOW_MS ? parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) : 15 * 60 * 1000,
      max: process.env.RATE_LIMIT_MAX ? parseInt(process.env.RATE_LIMIT_MAX, 10) : 100
    }
  },
  logging: {
    level: (process.env.LOG_LEVEL || 'info') as SystemConfig['logging']['level'],
    format: (process.env.LOG_FORMAT || 'json') as SystemConfig['logging']['format'],
    directory: process.env.LOG_DIR || 'logs',
    maxSize: process.env.LOG_MAX_SIZE || '20m',
    maxFiles: process.env.LOG_MAX_FILES || '14d'
  },
  monitoring: {
    enabled: process.env.MONITORING_ENABLED === 'true',
    metrics: {
      enabled: process.env.METRICS_ENABLED === 'true',
      port: process.env.METRICS_PORT ? parseInt(process.env.METRICS_PORT, 10) : 9090
    },
    healthCheck: {
      enabled: process.env.HEALTH_CHECK_ENABLED === 'true',
      interval: process.env.HEALTH_CHECK_INTERVAL ? parseInt(process.env.HEALTH_CHECK_INTERVAL, 10) : 30000
    }
  }
};

// Export Redis configuration for BullMQ
export const redisConfig = systemConfig.redis;

// Helper function to get environment-specific configuration
export function getEnvConfig(): Partial<SystemConfig> {
  const env = process.env.NODE_ENV || 'development';
  const config: Partial<SystemConfig> = {};

  switch (env) {
    case 'production':
      config.logging = {
        ...systemConfig.logging,
        level: 'warn'
      };
      config.monitoring = {
        ...systemConfig.monitoring,
        enabled: true
      };
      break;
    case 'staging':
      config.logging = {
        ...systemConfig.logging,
        level: 'info'
      };
      break;
    case 'development':
      config.logging = {
        ...systemConfig.logging,
        level: 'debug',
        format: 'text'
      };
      break;
  }

  return config;
}

// Helper function to validate configuration
export function validateConfig(config: SystemConfig): string[] {
  const errors: string[] = [];

  // Validate required fields
  if (!config.database.host) errors.push('Database host is required');
  if (!config.database.port) errors.push('Database port is required');
  if (!config.database.username) errors.push('Database username is required');
  if (!config.database.password) errors.push('Database password is required');
  if (!config.database.database) errors.push('Database name is required');

  // Validate numeric fields
  if (config.smpp.port < 1 || config.smpp.port > 65535) {
    errors.push('Invalid SMPP port number');
  }
  if (config.api.port < 1 || config.api.port > 65535) {
    errors.push('Invalid API port number');
  }

  // Validate timeouts
  if (config.smpp.sessionTimeout < 1) {
    errors.push('SMPP session timeout must be positive');
  }
  if (config.smpp.bindTimeout < 1) {
    errors.push('SMPP bind timeout must be positive');
  }
  if (config.smpp.enquireLinkInterval < 1) {
    errors.push('SMPP enquire link interval must be positive');
  }

  return errors;
} 