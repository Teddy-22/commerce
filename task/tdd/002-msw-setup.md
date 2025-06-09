---
id: TDD-002
title: "Set up MSW (Mock Service Worker) for Shopify API mocking"
dependsOn:
  - TDD-001        # Jest & RTL environment must be ready
status: "open"
owner: ""
estimate: "3h"
---

## 목적
Shopify API 및 내부 백엔드 호출을 **완전히 모킹**하여 로컬 개발·테스트·CI 환경에서 **외부 네트워크 의존성을 제거**한다.  
MSW(Mock Service Worker)는 브라우저·Node(Jest/Playwright) 모두 지원하므로, 이후 태스크(Contract, Integration, E2E)에서 **일관된 모킹 계층**을 제공한다.

## 범위
- `__mocks__/handlers/` 디렉터리 및 기본 핸들러 파일 생성  
  - `shopifyHandlers.ts` : GraphQL `getProductsQuery`, `getProductQuery`, `cartCreate`, `cartLinesAdd` 등
  - (Placeholder) `backendHandlers.ts` : 내부 API용
- 브라우저용 `__mocks__/browser.ts` → `setupWorker`
- Node(Jest/Playwright)용 `__mocks__/server.ts` → `setupServer`
- 전역 타입 선언(`global.d.ts`) : `process.env.NEXT_PUBLIC_USE_MOCKS`
- 앱 진입점(App Router `app/layout.tsx` 또는 `pages/_app.tsx`)에서 **개발 모드** 모킹 워커 자동 로드
- Jest 라이프사이클(hooks)에서 MSW 서버 `listen/resetHandlers/close`
- 샘플 핸들러 & 테스트(네트워크 차단 없이 성공) 작성

## 수용 기준 (Given / When / Then)

| Given | When | Then |
|-------|------|------|
| 브라우저 dev 서버 | 홈(`/`) 최초 로드 | 콘솔 `MSW worker started` 로그 출력 |
| Jest 환경 | `render(<Hello />)` 테스트 실행 | 테스트 통과, 실제 네트워크 요청 0건 |
| Playwright E2E | `page.goto('/')` | HTML 200 / 핸들러에서 mock 데이터 응답 |
| 환경 변수 `NEXT_PUBLIC_USE_MOCKS=false` | dev 서버 기동 | MSW worker **불러오지 않음** |

## 작업 체크리스트
- [ ] **Dev Dependency** 설치  
  ```bash
  pnpm add -D msw @mswjs/data
  ```
- [ ] **폴더 구조** 생성  
  ```
  __mocks__/
    handlers/
    browser.ts
    server.ts
  ```
- [ ] **shopifyHandlers.ts** – 기본 GraphQL operation 핸들러 구현  
  ```ts
  import { graphql } from 'msw';
  export const shopifyHandlers = [
    graphql.operation((req, res, ctx) => {
      const { query } = req.body as { query: string };
      if (query.includes('getProductQuery')) {
        return res(ctx.data({ product: { id:'1', title:'Mock', tags:[], images:{edges:[]}, variants:{edges:[]} } }));
      }
      return res(ctx.data({}));
    })
  ];
  ```
- [ ] **handlers/index.ts** : `export const handlers = [...shopifyHandlers];`
- [ ] **browser.ts**  
  ```ts
  import { setupWorker } from 'msw/browser';
  import { handlers } from './handlers';
  export const worker = setupWorker(...handlers);
  ```
- [ ] **server.ts**  
  ```ts
  import { setupServer } from 'msw/node';
  import { handlers } from './handlers';
  export const server = setupServer(...handlers);
  ```
- [ ] **global MSW import**  
  ```tsx
  // app/layout.tsx
  if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true' && typeof window !== 'undefined') {
    import('../__mocks__/browser').then(({ worker }) => worker.start({ onUnhandledRequest:'bypass' }));
  }
  ```
- [ ] **jest.setup.ts** 에 서버 라이프사이클 추가  
  ```ts
  import { server } from './__mocks__/server';
  beforeAll(() => server.listen({ onUnhandledRequest:'bypass' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
  ```
- [ ] **샘플 테스트** `__tests__/msw-connectivity.test.ts` → fetch 호출이 핸들러로 캡처되는지 검증
- [ ] **README / tdd-master-plan** 에 모킹 사용법 업데이트

## 병렬성 & 의존성
- **TDD-001**(Jest 설정) 완료 후 즉시 진행 가능
- 완료되면 **TDD-010**(Cart unit) 및 **TDD-020**(Contract)와 **완전히 병렬**로 진행 가능
- 워커/서버 설정이 공유되므로 **후속 태스크는 변경 없이 재사용**해야 함

## 산출물
- MSW 핸들러 및 초기화 파일 3종
- Jest MSW 통합 설정
- App Router 모킹 로더
- 샘플 테스트 통과 로그
- README 갱신

## 참고
- MSW 공식 문서: https://mswjs.io
- `doc/tdd-master-plan.md` §7 로컬 개발 & 모킹 환경
- Shopify GraphQL Storefront API Docs
