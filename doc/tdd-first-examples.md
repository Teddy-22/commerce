# 🧪 TDD First Examples – Commerce Project

> 목적  
> ‑ `commerce` 코드베이스에 **TDD** 문화를 정착하기 위해 “Red → Green → Refactor” 사이클의 실제 예시를 제공한다.  
> ‑ 첫 단계로 **장바구니 상태 훅(`useCart`)** 과 **E2E 구매 플로우** 의 최소 테스트를 작성·구현한다.  

---

## 1. 사전 준비

```bash
pnpm add -D jest @types/jest ts-jest \
           @testing-library/react @testing-library/jest-dom \
           msw @testing-library/user-event
pnpm jest --init            # ts-jest preset 선택
```

`jest.config.ts`

```ts
export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['@testing-library/jest-dom/extend-expect'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  }
};
```

---

## 2. 예제 1: `useCart` 훅 – 아이템 추가

### 2.1 Red – 실패하는 테스트 작성

`components/cart/__tests__/useCart.test.tsx`

```tsx
import { renderHook, act } from '@testing-library/react';
import { CartProvider, useCart } from '../cart-context';

function wrapper({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}

describe('useCart', () => {
  it('adds an item and increases total quantity', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem({ id: 'prod1', quantity: 1 });
    });

    expect(result.current.totalQuantity).toBe(1);           // 💥 RED
  });
});
```

`pnpm test`  
```
● useCart › adds an item and increases total quantity
  Expected: 1
  Received: 0
```

### 2.2 Green – 최소 구현

`components/cart/cart-context.tsx` (발췌)

```tsx
type CartState = { lines: { id: string; quantity: number }[] };
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CartState>({ lines: [] });

  const addItem = (line: { id: string; quantity: number }) =>
    setState(s => ({
      lines: [...s.lines, line]
    }));

  const totalQuantity = state.lines.reduce((sum, l) => sum + l.quantity, 0);

  const value = { addItem, totalQuantity };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
```

`pnpm test` → ✅ 통과

### 2.3 Refactor – 설계 개선 & 커버리지 확장

1. **Duplicate 제거**: `addItem` 중복(product id) 시 수량만 증가
2. **추가 테스트**: 동일 id 두 번 추가 → 총 수량 2

```tsx
// 테스트
act(() => {
  result.current.addItem({ id: 'prod1', quantity: 1 });
  result.current.addItem({ id: 'prod1', quantity: 1 });
});
expect(result.current.totalQuantity).toBe(2);
```

```tsx
// 구현 리팩터
const addItem = (line: Line) =>
  setState(s => {
    const existing = s.lines.find(l => l.id === line.id);
    return existing
      ? {
          lines: s.lines.map(l =>
            l.id === line.id ? { ...l, quantity: l.quantity + line.quantity } : l
          )
        }
      : { lines: [...s.lines, line] };
  });
```

모든 테스트 통과 & 코드 중복 최소화.

---

## 3. 예제 2: E2E – 홈 → PDP → 장바구니

### 3.1 Red – Playwright 테스트 작성

`__tests__/checkout.e2e.spec.ts`

```ts
import { test, expect } from '@playwright/test';

test('user can purchase a product', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /product abc/i }).click();
  await page.getByRole('button', { name: /add to cart/i }).click();
  await page.getByRole('link', { name: /cart/i }).click();
  await expect(page.getByText(/subtotal/i)).toContainText('$');
});
```

초기 실행 시 **장바구니 페이지 라우팅 오류**로 실패 → 💥 Red.

### 3.2 Green – 라우트 구현/수정

- `components/cart/modal.tsx` 의 “Cart” 링크를 `/cart` 페이지로 교체  
- `app/cart/page.tsx` 생성 → 장바구니 합계 표시  

재실행 → ✅ 통과.

### 3.3 Refactor – 테스트 안정화

- 지급 페이지를 `data-testid="subtotal"` 로 지정  
- Playwright 테스트에서 해당 id 사용해 flaky 감소  

---

## 4. 다음 단계

| 작업 | 설명 |
|------|------|
| Coverage Badge | Codecov 연동 → PR에 커버리지 코멘트 |
| Pact 도입 | `lib/shopify/cart.ts` GraphQL Mutation 계약 테스트 |
| CI Gate | GitHub Actions: Jest + Playwright 병렬 실행, 실패 시 배포 차단 |

TDD 사이클을 통해 **신뢰할 수 있는 기능 증분**을 빠르게 반복하세요.  
