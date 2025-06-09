---
id: TDD-000
title: "Bootstrap test environment (Jest, RTL, MSW, Playwright)"
dependsOn: []
status: "open"
owner: ""
estimate: "6h"
---

## 목적
프로젝트 전체에 **TDD**를 적용하기 위한 기반 테스트 환경을 구축한다.  
이 작업은 모든 다른 테스트 태스크의 **선행 조건**이며, 완료 후 이후 태스크들이 병렬로 진행될 수 있다.

## 범위
- Jest + ts-jest 설정 (jsdom 환경)
- React Testing Library 및 jest-dom 확장 설치
- MSW(Mock Service Worker) 기본 핸들러/서버 스캐폴딩
- Playwright 기본 설정 및 첫 빈 테스트 추가
- `package.json` 테스트 스크립트 (`dev:mock`, `test`, `e2e`) 추가
- GitHub Actions CI 워크플로(`.github/workflows/test.yml`) 작성
- Codecov 업로드 토큰 변수 위치 정의(값은 추가 PR에서 secrets 설정)
- README 테스트 실행 섹션 갱신

## 수용 기준 (Given / When / Then)
| Given | When | Then |
|-------|------|------|
| 새로 클론한 환경 | `pnpm install && pnpm test` 실행 | 모든 테스트 통과, 커버리지 리포트 생성 |
| 새로 클론한 환경 | `pnpm e2e` 실행 | Playwright 기본 테스트 통과 |
| GitHub PR | CI 파이프라인 실행 | Unit & E2E job 녹색, 커버리지 리포트 업로드 성공 |

## 작업 세부 목록
- [ ] Install dev deps: `jest ts-jest @types/jest @testing-library/react @testing-library/jest-dom msw @mswjs/data @playwright/test cross-env`
- [ ] Create `jest.config.ts` with ts-jest preset & setupFilesAfterEnv
- [ ] Add `jest.setup.ts` importing jest-dom & MSW server lifecycle
- [ ] Scaffold MSW: `__mocks__/handlers`, `browser.ts`, `server.ts`
- [ ] Create example handler in `handlers/shopifyHandlers.ts` returning mock data
- [ ] Add placeholder sample unit test (`__tests__/sample.test.ts`)
- [ ] `playwright.config.ts` with basic headless config
- [ ] Add placeholder Playwright test (`__tests__/sample.e2e.spec.ts`)
- [ ] Update `package.json` scripts (dev:mock, test, e2e)
- [ ] Add `.github/workflows/test.yml` with unit and e2e jobs (USE_MOCKS=true)
- [ ] Update root README with “Running tests” section
- [ ] Verify local run & CI pass

## 산출물
- Jest/RTL/ts-jest 설정 파일
- MSW mock 시스템 기본 파일
- Playwright 설정 및 샘플 테스트
- CI workflow 파일
- Updated `package.json` scripts
- README 테스트 가이드

## 참고 문서
- `doc/tdd-master-plan.md`
- MSW 공식 문서: https://mswjs.io
- Jest + RTL Best Practices
- Playwright Docs: https://playwright.dev
