import { FullConfig } from '@playwright/test';
import { server } from '../__mocks__/server';
import fs from 'fs';
import path from 'path';

/**
 * Playwright 테스트를 위한 글로벌 셋업 함수
 * 모든 테스트 실행 전에 공통 설정을 수행합니다.
 * 
 * @param config Playwright 설정 객체
 */
async function globalSetup(config: FullConfig): Promise<void> {
  console.log('🔧 E2E 테스트 환경 설정 시작...');
  
  // 환경 변수 설정
  process.env.NEXT_PUBLIC_USE_MOCKS = 'true';
  process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN = 'dummy';
  process.env.SHOPIFY_STORE_DOMAIN = 'mock.myshopify.com';
  process.env.SHOPIFY_REVALIDATION_SECRET = 'mock-revalidation-secret';
  
  // MSW 서버 시작
  // 주의: Playwright는 별도의 프로세스에서 실행되므로,
  // 브라우저에서 MSW를 사용하려면 추가 설정이 필요합니다.
  server.listen({ onUnhandledRequest: 'warn' });
  console.log('✅ MSW 서버가 시작되었습니다.');
  
  // E2E 테스트 디렉토리가 없으면 생성
  const e2eDir = path.join(process.cwd(), 'e2e');
  if (!fs.existsSync(e2eDir)) {
    fs.mkdirSync(e2eDir, { recursive: true });
    console.log('📁 E2E 테스트 디렉토리를 생성했습니다.');
  }
  
  // 테스트 결과 디렉토리 생성
  const testResultsDir = path.join(process.cwd(), 'test-results');
  if (!fs.existsSync(testResultsDir)) {
    fs.mkdirSync(testResultsDir, { recursive: true });
    console.log('📁 테스트 결과 디렉토리를 생성했습니다.');
  }
  
  console.log('✅ E2E 테스트 환경 설정 완료');
}

export default globalSetup;
