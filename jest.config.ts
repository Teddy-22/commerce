import type { Config } from 'jest';
import nextJest from 'next/jest';

// next/jest를 사용하여 Next.js의 설정을 가져옵니다
const createJestConfig = nextJest({
  // Next.js 애플리케이션의 경로를 제공합니다
  dir: './',
});

// Jest에 전달할 커스텀 설정
const customJestConfig: Config = {
  // 테스트 환경 설정
  testEnvironment: 'jsdom',
  
  // 각 테스트 전에 실행할 설정 파일
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  
  // 테스트 파일 경로 패턴
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],
  
  // 모듈 경로 매핑
  moduleNameMapper: {
    // 경로 별칭 매핑
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/app/(.*)$': '<rootDir>/app/$1',
    
    // 정적 파일 모킹
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/__mocks__/fileMock.js',
    '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',
  },
  
  // 모듈 디렉토리
  moduleDirectories: ['node_modules', '<rootDir>'],
  
  // 코드 커버리지 설정
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'app/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
  
  // 테스트 커버리지 임계값
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  
  // 테스트 환경 타임아웃 설정
  testTimeout: 10000,
};

// createJestConfig는 Next.js의 설정을 적용한 Jest 설정을 반환합니다
export default createJestConfig(customJestConfig);
