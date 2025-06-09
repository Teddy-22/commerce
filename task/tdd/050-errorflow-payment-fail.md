---
id: TDD-050
title: "E2E Error-Flow Tests – Payment failure, network error, API rate-limit"
dependsOn:
  - TDD-040      # Desktop happy path
  - TDD-045      # Mobile happy path
status: "open"
owner: ""
estimate: "6h"
---

## 목적
Happy Path 시나리오가 통과한 후 **실패 케이스**를 자동화하여 회귀 방어선을 강화한다.  
주요 오류 상황:  
1. **결제 실패**(카드 거절)  
2. **네트워크 오류**(fetch timeout)  
3. **Shopify API 속도 제한**(HTTP 429 + `Retry-After`)  

## 범위
- Playwright E2E 테스트 3개 (`@errorflow` 태그):  
  - **payment-fail** – `/checkout` 단계에서 거절 메시지 노출  
  - **network-offline** – Add To Cart 시 네트워크 offline 시뮬레이션  
  - **rate-limit** – Cart API 429 응답 후 재시도 로직 검증  
- MSW 핸들러 확장: `cartLinesAdd` → 429 시퀀스, `/checkout` → payment error 페이지 모킹  
- UI 피드백 검증: 에러 toast, 재시도 버튼, 적절한 상태 복귀

## 수용 기준 (Given / When / Then)

| 시나리오 | Given | When | Then |
|----------|-------|------|------|
| Payment Fail | 장바구니 존재 | Checkout 클릭 | URL `/checkout-error`, “Payment failed” 메시지 / 재시도 버튼 |
| Network Offline | 홈 → PDP | Add To Cart 클릭 직전 `page.route('**', () => abort())` | Toast “Network error” 노출 & 장바구니 수량 유지 0 |
| Rate-Limit 429 | MSW 첫 `cartLinesAdd` 429 응답* | Add To Cart | 코드가 2회 재시도 후 200 → 장바구니 수량 1 |

\* `Retry-After: 0.1` 헤더 포함, 테스트에서 3회 이하 재시도 확인

## 작업 체크리스트
- [ ] MSW `handlers/errorHandlers.ts` 작성:  
  - [ ] `cartLinesAdd` → 첫 요청 429, 이후 200  
  - [ ] `/checkout` → 402 Payment Required or 커스텀 error JSON
- [ ] Playwright test `checkout-errorflow.e2e.spec.ts`  
  - [ ] `@errorflow @desktop` tag (viewport 1280×800)  
  - [ ] 각 시나리오별 `test.step()` 구분  
  - [ ] `expect` 로 특정 에러 UI 텍스트 검증  
  - [ ] 재시도 로직: `expect(requestRetryCount).toBe(<=3)`  
- [ ] 동일 스크립트 안에 iPhone viewport case 또는 별도 mobile file(`checkout-errorflow-mobile.e2e.spec.ts`)  
- [ ] Playwright config `projects.errorflow` (trace, screenshot on failure)  
- [ ] CI workflow: add job `e2e-errorflow` runs in parallel after happy path jobs  
- [ ] Update coverage badge/README with new tag instructions  

## 병렬성 & 의존성
- **TDD-040** 및 **TDD-045** 완료 후 착수  
- 본 태스크 자체는 하나의 PR이 이상적 (MSW+테스트+CI)  
- 다른 오류 케이스 추가 시 동일 패턴으로 파일 확장 가능

## 구현 가이드
```ts
test('@errorflow payment-fail', async ({ page }) => {
  await page.goto('/cart');           // 가정: 장바구니 준비 helper
  await page.route('**/checkout**', route =>
    route.fulfill({ status: 402, body: JSON.stringify({ error:'payment_failed' }) })
  );
  await page.getByRole('button', { name: /checkout/i }).click();
  await expect(page).toHaveURL(/checkout-error/);
  await expect(page.getByText(/payment failed/i)).toBeVisible();
});
```

### MSW Rate-Limit Handler (pseudo)
```ts
let called = false;
graphql.mutation('cartLinesAdd', (req,res,ctx) => {
  if (!called) {
    called = true;
    return res(ctx.status(429), ctx.set('Retry-After','0.1'));
  }
  return res(ctx.data({ cartLinesAdd: { cart: mockCart } }));
});
```

## 산출물
- Playwright error-flow 테스트 스위트(데스크탑+모바일)
- 확장된 MSW 핸들러
- CI job 성공 로그
- PR: `test: add error-flow E2E scenarios (TDD-050)` + `Closes #TDD-050`

## 참고
- `task/tdd/040-e2e-checkout-desktop.md`
- `task/tdd/045-e2e-checkout-mobile.md`
- MSW + Playwright 네트워크 오류 모킹 예: https://playwright.dev/docs/network#handle-requests
