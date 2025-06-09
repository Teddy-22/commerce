import { PactOptions } from '@pact-foundation/pact';

// 환경 변수에서 설정을 가져오거나 기본값 사용
const PACT_PORT = process.env.PACT_PORT ? parseInt(process.env.PACT_PORT, 10) : 4001;
const CONSUMER_NAME = process.env.PACT_CONSUMER || 'frontend';
const PROVIDER_NAME = process.env.PACT_PROVIDER || 'shopifyCart';
const PACT_DIR = process.env.PACT_DIR || './pacts';
const LOG_LEVEL = process.env.PACT_LOG_LEVEL || 'warn';

// Pact 설정 옵션
export const pactOptions: PactOptions = {
  consumer: CONSUMER_NAME,
  provider: PROVIDER_NAME,
  port: PACT_PORT,
  log: process.env.PACT_LOG_PATH || './logs/pact.log',
  dir: PACT_DIR,
  logLevel: LOG_LEVEL as any,
  spec: 2,
  cors: true,
  pactfileWriteMode: 'overwrite'
};

// 테스트 환경 설정
export const testConfig = {
  // Mock 서버 URL
  mockServerUrl: `http://localhost:${PACT_PORT}`,
  // Shopify API 경로
  shopifyApiPath: '/api/2023-01/graphql.json',
  // 테스트 타임아웃 설정
  timeout: 30000
};
