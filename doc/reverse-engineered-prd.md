# 📄 Product Requirements Document (Reverse-Engineered)
Project: **Next.js + Shopify Headless Commerce**  
Version: v1.0.0   Date: 2025-06-09

---

## 1. Meta Information
| Item | Description |
|------|-------------|
| Document Title | Headless Commerce – PRD (Reverse-Engineered) |
| Repository | https://github.com/Teddy-22/commerce |
| Authors | Reverse engineering by AI + Dev team |
| Methodology | Agile (2-week sprints), TDD |
| Related Docs | `tdd-master-plan.md`, Shopify API specs |

---

## 2. Product Overview
| Topic | Details |
|-------|---------|
| Elevator Pitch | “브랜드가 최단 시간 내 고성능 스토어프론트를 런칭할 수 있도록 하는 Next.js 기반 헤드리스 커머스 프론트엔드.” |
| Business Problem | 기존 Shopify Liquid 테마의 커스터마이징 한계·SEO·성능 이슈를 해결하고, 모듈식 컴포넌트로 빠른 UI 개편을 가능하게 함. |
| Value Proposition | • SSR & ISR로 SEO + 초고속 로딩<br>• Shopify 백오피스 그대로 사용 → 운영비↓<br>• React 컴포넌트 레벨 재사용성으로 유지보수 비용↓ |
| Success Metrics (KPI) | LCP < 2 s(P95), 구매 전환율 ≥ 3 %, 유지보수 시간 ≤ 20 h/월 |

---

## 3. Goals & Non-Goals
### 3.1 Goals
- G1: 페이지 LCP 2 초 이하(95th) 유지
- G2: 데스크탑·모바일 전환율 3 % 달성
- G3: 장바구니→체크아웃 이탈률 10 % 감소
- G4: 코드 커버리지 90 % (TDD)

### 3.2 Non-Goals
- 자체 결제 게이트웨이 개발
- Shopify Admin UI 재구현
- 멀티 테넌트 지원 (1-store 기준)

---

## 4. Current System / Architecture
### 4.1 High-Level
Next.js 14(App Router) → Vercel Edge  
Shopify Storefront/Admin GraphQL → 데이터 원천  
Client-side cart state(+optimistic UI)  
ISR + `next/cache` 태그 캐싱

### 4.2 Component Map
| Layer | Key Modules |
|-------|-------------|
| UI | `ThreeItemGrid`, `Carousel`, `Gallery`, `ProductDescription`, `VariantSelector`, `CartModal` |
| State | React Context: `ProductProvider`, `CartProvider` |
| Data | `lib/shopify/index.ts` (fetch wrapper), GraphQL fragments/queries |
| API Routes | `/api/revalidate` (Shopify Webhook), potential `/api/checkout` |

### 4.3 Data Flow
1. Visitor → `/`  
   • `ThreeItemGrid` 서버컴포넌트가 컬렉션 `hidden-homepage-featured-items` 제품 3개 fetch  
2. PDP `/product/[handle]`  
   • `getProduct`, SEO 메타+JSON-LD → Static+ISR  
   • `AddToCart` client action → Cart Context optimistic update  
3. Checkout  
   • Cart ID 쿠키 → Shopify Checkout URL 리다이렉트  
4. Admin 가격 변경 → Shopify Webhook → `/api/revalidate` → `revalidateTag(TAGS.products)` → ISR 새로고침

---

## 5. Personas & User Journeys
### 5.1 Personas
| Persona | Goals | Pain Points |
|---------|-------|-------------|
| Shopper | 빠른 탐색·안전 결제 | 느린 페이지, 재고불일치 |
| Store Admin | 재고·가격 즉시 반영 | 프론트 캐시 지연 |

### 5.2 Key Journeys
1. **Browsing & Purchase**  
   Home → Collection/Search → PDP → Variant 선택 → Add to Cart → Cart Modal → Checkout(Shopify) → Thank You  
2. **Content Freshness**  
   Admin 가격 업데이트 → Webhook → ISR revalidate ≤ 1 min → 이용자 새 가격 확인

---

## 6. Functional Requirements
| ID | User Story | Acceptance Criteria (Given/When/Then) | Priority |
|----|------------|---------------------------------------|----------|
| FR-001 | As a Shopper I want to view homepage featured products | Given `/` load, When first paint, Then 3 grid items & carousel visible under 2 s | Must |
| FR-002 | As a Shopper I want to filter products by collection & sort | Given `/search/[collection]?sort=price-desc`, Then sorted list matches GraphQL response | Must |
| FR-003 | As a Shopper I want to see variant-specific price & inventory | When selecting size/color, Then Add To Cart reflects variant state | Must |
| FR-004 | As a Shopper I want Add-to-Cart to update instantly | When click Add, Then cart badge increments without page reload | Must |
| FR-005 | As an Admin I want price changes to propagate to UI | Given price edit in Shopify, Then cached PDP/collection refresh ≤ 60 s | Must |

---

## 7. Non-Functional Requirements
| Category | Metric | Target |
|----------|--------|--------|
| Performance | LCP | < 2 s(P95) |
| Availability | Uptime | 99.9 % |
| SEO | Core Web Vitals | All green | 
| Security | Token Leakage | 0 critical |

---

## 8. Implementation Notes
### 8.1 Homepage Feature Grid
```ts
const homepageItems = await getCollectionProducts({
  collection: 'hidden-homepage-featured-items'
});
```
• Hidden collection naming convention `hidden-*`  
• ISR cache tag `TAGS.collections`

### 8.2 Cart Context (Optimistic)
- `CartProvider` uses `useOptimistic` reducer pattern  
- Local state mirrors Shopify Cart for latency hiding  
- Edge case: merging existing line item vs new

### 8.3 SEO
- Dynamic `generateMetadata` for PDP & Collection  
- JSON-LD product schema embedded

### 8.4 Revalidation
```ts
if (isProductUpdate) revalidateTag(TAGS.products);
```
Secret param `SHOPIFY_REVALIDATION_SECRET`.

---

## 9. Data Model Snapshot (Shopify)
| Entity | Fields (subset) |
|--------|-----------------|
| Product | id, title, handle, description, images[], variants[] |
| Variant | id, title, price.amount, selectedOptions[] |
| Collection | id, title, handle, products[] |
| Cart | id, lines[], totalQuantity, cost{} |
| CartLine | merchandiseId, quantity, cost.totalAmount |

---

## 10. Release Plan
| Sprint | Deliverable | Exit Criteria |
|--------|-------------|---------------|
| 1 | MVP Home & PDP | Lighthouse ≥ 90, FR-001 pass |
| 2 | Cart & Checkout | FR-004 pass, E2E happy path |
| 3 | Search & Collection Sort | FR-002 pass |
| 4 | Webhook ISR | FR-005 pass |

---

## 11. TDD & QA
- Unit+Integration tests per `tdd-master-plan.md`  
- MSW 모킹으로 로컬 개발·CI 테스트 수행  
- Playwright for E2E purchase flow

---

## 12. Open Issues / Tech Debt
| Item | Impact | Plan |
|------|--------|------|
| Cold start on Vercel Edge | 300 ms latency | Pre-warm ping |
| Cart server-side persistence | None (client only) | Consider server-side cart |

---

## 13. Glossary
| Term | Definition |
|------|------------|
| PDP | Product Detail Page |
| ISR | Incremental Static Regeneration |
| GraphQL Storefront API | Shopify storefront data API |

---

*End of Document*
