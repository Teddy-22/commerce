---
id: TDD-003
title: "Set up Playwright for E2E testing (desktop & mobile)"
dependsOn:
  - TDD-001      # Jest/RTL ready
  - TDD-002      # MSW mocking ready
status: "open"
owner: ""
estimate: "3h"
---

## 목적
브라우저 기반 **E2E 테스트**를 실행하기 위한 **Playwright** 환경을 구성한다.  
후속 태스크(040, 045, 050 등)에서 재사용될 **단일 소스**의 Playwright 설정, 스크립트, CI 실행 기반을 마련한다.

## 범위
- Playwright 패키지 설치 및 기본 프로젝트 초기화
- `playwright.config.ts` 작성
  - 데스크탑/모바일 **멀티 프로젝트** 설정
  - `trace`, `video`, `screenshot` 옵션 기본값 지정
  - 테스트 디렉터리 `__tests__/` 매핑
- 첫 번째 **샘플 테스트**(`__tests__/playwright-sanity.e2e.spec.ts`)
  - `/` 페이지 200 응답 및 `"Next.js Commerce"` 텍스트 확인
- **MSW 연동**: `globalSetup` 에서 Node 서버(mock) 구동
- `package.json` 스크립트 추가
  ```json
  "scripts": {
    "e2e": "cross-env NEXT_PUBLIC_USE_MOCKS=true playwright test",
    "e2e:headed": "cross-env NEXT_PUBLIC_USE_MOCKS=true playwright test --headed",
    "e2e:debug": "cross-env NEXT_PUBLIC_USE_MOCKS=true playwright test --debug"
  }
  ```
- Playwright **VSCode** extension 권장 설정(Optional)
- GitHub Actions 워크플로(job `e2e`)에 Playwright 캐시 사용

## 수용 기준 (Given / When / Then)

| Given | When | Then |
|-------|------|------|
| 로컬 환경 | `pnpm e2e` 실행 | 테스트 1개 통과, report 출력 |
| 로컬 환경 | `pnpm e2e:headed` 실행 | UI 브라우저 표시, 테스트 통과 |
| CI | `e2e` job 실행 | Playwright 설치 캐시 적용, job 녹색 |
| 실패 테스트 | 자동 trace & video 파일 생성 | `playwright-report/` 폴더 존재 |

## 작업 체크리스트
- [ ] **Dev Dependency** 설치  
  ```bash
  pnpx playwright install --with-deps
  pnpm add -D @playwright/test cross-env
  ```
- [ ] `playwright.config.ts` 생성  
  ```ts
  import { defineConfig } from '@playwright/test';
  export default defineConfig({
    testDir: '__tests__',
    timeout: 30_000,
    expect: { timeout: 5_000 },
    retries: 0,
    use: {
      baseURL: 'http://localhost:3000',
      trace: 'retain-on-failure',
      video: 'retain-on-failure',
      screenshot: 'only-on-failure'
    },
    projects: [
      { name: 'desktop', use: { viewport: { width:1280, height:800 } } },
      { name: 'mobile',  use: { viewport: { width:375, height:812 } } }
    ],
    webServer: {
      command: 'pnpm dev:mock',
      port: 3000,
      timeout: 120_000,
      reuseExistingServer: !process.env.CI
    }
  });
  ```
- [ ] **globalSetup** (옵션) – MSW 서버 시작  
  ```ts
  import { server } from './__mocks__/server';
  export default async () => { server.listen(); };
  ```
- [ ] **샘플 테스트** 작성  
  ```ts
  import { test, expect } from '@playwright/test';
  test('homepage loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Next.js/);
  });
  ```
- [ ] **CI 워크플로** 업데이트  
  ```yaml
  e2e:
    runs-on: ubuntu-latest
    env: { NEXT_PUBLIC_USE_MOCKS: true }
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install
      - run: pnpm e2e
  ```
- [ ] README 또는 `doc/tdd-master-plan.md` → “Running E2E tests” 섹션 추가

## 병렬성 & 의존성
- **TDD-001, 002** 완료 후 즉시 착수 가능
- 완료 시 **TDD-020**(Pact) 및 **TDD-010**(Unit) 과 **병렬**로 후속 E2E 태스크(040, 045)에 기반 제공
- Playwright config는 추후 태스크에서 **변경 없이** 사용하도록 유지

## 산출물
- `playwright.config.ts`
- `__tests__/playwright-sanity.e2e.spec.ts`
- npm 스크립트 3종
- CI job 추가
- 문서 업데이트

## 참고
- Playwright Docs: https://playwright.dev
- `task/tdd/README.md` – 전체 워크플로 및 의존성
- `doc/tdd-master-plan.md` §8 CI/CD 통합
