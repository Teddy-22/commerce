import { defineConfig, devices } from '@playwright/test';
import path from 'path';

// 환경 변수 설정
process.env.NEXT_PUBLIC_USE_MOCKS = 'true';
process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN = 'dummy';
process.env.SHOPIFY_STORE_DOMAIN = 'mock.myshopify.com';

/**
 * Playwright 설정
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // 테스트 파일 위치 설정
  testDir: './e2e',
  testMatch: '**/*.e2e.spec.ts',
  
  // 테스트 실행 설정
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  
  // 리포터 설정
  reporter: [
    ['html', { open: 'never' }],
    ['list']
  ],
  
  // 글로벌 타임아웃 설정
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  
  // 글로벌 셋업 파일 설정 (MSW 모킹을 위한 설정)
  globalSetup: path.join(__dirname, './e2e/global-setup.ts'),
  
  // 각 테스트 파일 실행 전 설정
  use: {
    // 기본 브라우저 설정
    baseURL: 'http://localhost:3000',
    
    // 트레이스 설정
    trace: 'on-first-retry',
    
    // 스크린샷 설정
    screenshot: 'only-on-failure',
    
    // 비디오 설정
    video: 'on-first-retry',
    
    // 기타 설정
    actionTimeout: 10000,
    navigationTimeout: 15000,
    
    // Headless 모드 설정 (CI에서는 항상 headless, 로컬에서는 환경 변수로 제어)
    headless: process.env.CI ? true : (process.env.HEADLESS !== 'false')
  },
  
  // 프로젝트별 설정 (브라우저별)
  projects: [
    // 기본 설정으로 실행
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    },
    
    // 모바일 테스트 설정
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] }
    },
    
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] }
    }
  ],
  
  // 웹 서버 설정
  webServer: {
    command: 'pnpm dev:mock',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe'
  }
});
