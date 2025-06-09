# 🧪 Test-Driven Development (TDD) Implementation Plan  
> Next.js + Shopify 통합 e-commerce 프로젝트

---

## 1. 도입 목적
| 목표 | 세부 설명 |
|------|-----------|
| 품질 향상 | 기능 개발 단계에서 결함 조기 발견 → 리팩터링 비용 최소화 |
| 변경 용이성 | 제품/가격 정책·UI 개편 시 회귀 위험 감소 |
| 문서화 대체 | 테스트 케이스가 실행 가능한 사양(spec)이 되어 개발자·AI 모두 이해도 상승 |
| 배포 안정성 | CI 파이프라인에서 테스트가 모든 커밋을 게이트 처리 → 실패 시 자동 차단 |

---

## 2. 범위 및 우선순위
| 단계 | 범위 | 우선순위 | 비고 |
|------|------|----------|------|
| 1 | 핵심 React 컴포넌트 (Header, Cart, ProductGallery, VariantSelector) | High | UX·매출 직접 영향 |
| 2 | Shopify GraphQL 쿼리/뮤테이션 래퍼 (lib/shopify/*) | High | 재고·가격 정확도 필수 |
| 3 | Next.js API Routes (`/api/checkout`, `/api/revalidate`) | Medium | 서드파티 Webhook 연동 |
| 4 | 전 페이지 E2E Happy Path (홈→PDP→Cart→Checkout) | Medium | Playwright/Cypress |
| 5 | 장애·오류 플로우 (결제 실패, Rate-limit 429) | Low | Chaos/negative test |

---

## 3. 테스트 전략
### 3.1 계층 구조
| 레이어 | 목적 | 도구 | 예시 |
|--------|------|------|------|
| Unit | 함수·훅·컴포넌트 단위 검증 | Jest + React Testing Library | `useCart()` 훅 동작 |
| Integration | 컴포넌트 ↔ API 통합 | Jest + MSW(Mock Service Worker) | `AddToCart` 버튼 → Shopify cartCreate |
| Contract | 외부 API 스키마 합의 유지 | Pact (consumer-driven) | Cart, Checkout 쿼리 |
| E2E | 사용자 여정 검증 | Playwright | Desktop/Mobile 결제 완료 |
| Visual (옵션) | UI 회귀 방지 | Storybook + Chromatic | PDP 갤러리 스냅샷 |

### 3.2 Given-When-Then 패턴
모든 테스트 케이스는 PRD의 수용기준과 동일 서술 방식 사용하여 문서-코드 추적성 확보.

---

## 4. 기술 스택 & 초기 셋업
| 영역 | 선택 도구 | 설치 명령 |
|------|----------|-----------|
| Test Runner | Jest (vitest 고려 가능) | `pnpm add -D jest @types/jest ts-jest` |
| React Testing | React Testing Library | `pnpm add -D @testing-library/react` |
| Mocking | MSW (Service Worker) | `pnpm add -D msw` |
| Contract Test | Pact JS | `pnpm add -D @pact-foundation/pact` |
| E2E | Playwright | `pnpm add -D @playwright/test` |
| Coverage | Istanbul (jest-coverage) | 내장 |
| CI | GitHub Actions / Vercel CI | `.github/workflows/test.yml` |

---

## 5. 구현 로드맵
| Sprint | 작업 | 산출물 | 완료 기준 |
|--------|------|--------|-----------|
| 0 | 테스트 프레임워크 부트스트랩 | jest.config.ts, playwright.config.ts | 모든 스크립트 `pnpm test` 통과 |
| 1 | `useCart` 훅 Red → Green | `useCart.test.tsx` | 커버리지 90 %+ |
| 2 | Shopify Cart API consumer pact | `cart.pact.json` | CI Pact broker 검증 |
| 3 | PDP → Cart 통합 테스트 | `pdp-cart.integration.test.tsx` | MSW로 Shopify mock |
| 4 | 첫 E2E 시나리오 (데스크탑) | `checkout.e2e.spec.ts` | Playwright cloud pass |
| 5 | Mobile viewport & 실패 플로우 | `payment-fail.e2e.spec.ts` | 실패 케이스 재현 100 % |

---

## 6. 코드 커버리지 목표
- **Unit+Integration**: > 90 %
- **E2E**: 핵심 흐름 100 %
- `pnpm test:coverage` 보고서를 Codecov 업로드 → PR 코멘트로 가시화

---

## 7. 테스트 작성 가이드라인
1. **단일 행위 검증**: 한 테스트는 하나의 행동/결과만 단언  
2. **AAA 패턴**: Arrange, Act, Assert  
3. **테스트 식별자**: DOM `data-testid`, 접근성 role 우선  
4. **비동기 처리**: `await screen.findBy…`, `waitFor` 사용  
5. **Snapshot 최소화**: UI 스냅샷은 Storybook으로 대체  
6. **Shopify Mock**:  
   ```ts
   rest.post('https://shopify.com/api/2023-10/graphql.json', handler)
   ```

---

## 8. CI/CD 통합
```yaml
# .github/workflows/test.yml
name: test
on: [push, pull_request]
jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install
      - run: pnpm test --coverage
  e2e:
    uses: microsoft/playwright-github-action@v1
```
- 실패 시 상태 배지 및 슬랙 알림  
- Vercel Preview 배포 이전에 모든 Job 통과 필수

---

## 9. Shopify API 통합 테스트 패턴
| 패턴 | 설명 | 적용 예 |
|------|------|---------|
| Consumer Pact | GraphQL Mutation 스키마 변경 감지 | cartLinesUpdate |
| MSW Runtime Mock | 개발 서버에서 실제 호출 차단 | `next dev` 시 dev worker |
| Rate-limit Simulation | 429 응답 후 재시도 로직 | `mockGraphQL(429)` + `retry` |

---

## 10. 리스크 & 대응
| 위험 | 영향 | 완화책 |
|------|------|--------|
| 외부 Shopify API 변경 → 계약 불일치 | 구매 플로우 중단 | Nightly Pact 검증 + 버전 고정 |
| 테스트 느려짐 → 개발 속도 저하 | 배포 지연 | 캐시·병렬화, E2E 선택 실행 |
| flaky E2E | 신뢰도 저하 | 자동 재시도, 네트워크 모킹 강화 |

---

## 11. 유지보수 정책
- 새로운 기능 = 반드시 테스트 선행(Red)  
- 코드 리뷰 체크리스트에 “테스트 포함 여부” 항목 추가  
- 실패 테스트 24 h 내 수정 SLA  
- 매 분기 커버리지·플레이북 검토

---

## 12. 참고 링크
- Shopify Storefront API Docs  
- Jest & React Testing Library Best Practices  
- Pact JS Consumer-Driven Contract Testing  
- Playwright Trace Viewer  

---

> **다음 단계**  
> 1) Sprint 0 setup 태스크 이슈 생성  
> 2) GitHub Actions 테스트 워크플로 추가  
> 3) 첫 컴포넌트(`useCart`) Red 테스트 작성 후 Green 구현  
