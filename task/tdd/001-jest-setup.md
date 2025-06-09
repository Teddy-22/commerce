---
id: TDD-001
title: "Set up Jest + React Testing Library environment"
dependsOn: []
status: "open"
owner: ""
estimate: "3h"
---

## 목적
프로젝트 전반의 **단위(Unit)·통합(Integration) 테스트**를 위해 필수적인 **Jest + React Testing Library(RTL)** 환경을 구성한다.  
CI 파이프라인과 후속 테스트 태스크(010, 030 등)의 기반이 되는 작업이다.

## 범위
- Jest 실행 환경(jsdom) 구성
- TypeScript 지원(ts-jest) 설정
- React Testing Library 및 `@testing-library/jest-dom` 확장 설치
- 글로벌 설정 파일(`jest.setup.ts`) 생성
- 예시 테스트 작성(샘플 컴포넌트 또는 `sample.test.tsx`)
- `package.json` 테스트 스크립트(`test`, `test:watch`) 추가
- VSCode/Jest 확장 인식용 설정(Optional)

## 수용 기준 (Given / When / Then)

| Given | When | Then |
|-------|------|------|
| 새로 클론한 레포지토리 | `pnpm test` 실행 | Jest가 0개의 테스트를 통과하며 종료 코드 0 |
| 새 로컬 환경 | `pnpm test:watch` 실행 | 파일 변경 시 테스트 자동 재실행 |
| 예시 테스트 | 샘플 컴포넌트 렌더 후 텍스트 단언 | 테스트 녹색 통과 |
| CI(추가 예정) | `pnpm test` 실행 | job 성공, 커버리지 보고서 생성 (이 단계에서는 threshold 미설정) |

## 작업 체크리스트
- [ ] **Dev Dependency** 설치  
  ```bash
  pnpm add -D jest ts-jest @types/jest \
           @testing-library/react @testing-library/jest-dom
  ```
- [ ] **Jest 초기화**  
  ```bash
  npx ts-jest config:init  # jest.config.ts 생성
  ```
  - `testEnvironment: 'jsdom'` 확인
  - `setupFilesAfterEnv: ['<rootDir>/jest.setup.ts']` 추가
- [ ] **jest.setup.ts** 작성  
  ```ts
  import '@testing-library/jest-dom/extend-expect';
  ```
- [ ] **예시 테스트** `__tests__/sample.test.tsx`  
  ```tsx
  import { render, screen } from '@testing-library/react';

  function Hello() { return <h1>Hello Test</h1>; }

  test('renders greeting', () => {
    render(<Hello />);
    expect(screen.getByRole('heading', { name: /hello test/i })).toBeInTheDocument();
  });
  ```
- [ ] **`package.json` 스크립트** 추가  
  ```json
  "scripts": {
    "test": "jest --runInBand",
    "test:watch": "jest --watch"
  }
  ```
- [ ] **VSCode**: `.vscode/settings.json` (선택)  
  ```json
  { "jest.autoRun": "watch" }
  ```
- [ ] 로컬에서 `pnpm test`/`test:watch` 실행으로 수용 기준 확인
- [ ] README(또는 `doc/tdd-master-plan.md`)에 “Running unit tests” 섹션 업데이트

## 산출물
- `jest.config.ts` (ts-jest preset, jsdom)
- `jest.setup.ts`
- 샘플 테스트 파일
- 업데이트된 `package.json` 스크립트
- (선택) VSCode 설정
- 문서 업데이트

## 참고 문서
- Jest 공식: https://jestjs.io/docs/getting-started
- React Testing Library: https://testing-library.com/docs/react-testing-library/intro
- `doc/tdd-master-plan.md` §4 기술 스택
