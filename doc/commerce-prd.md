# 📄 Commerce Project PRD – **Teddy-22/commerce**

> 목적  
> ‑ 현행 Next.js + Shopify 통합 전자상거래 애플리케이션의 아키텍처·기능·제약을 체계적으로 문서화  
> ‑ 향후 개선·기능 확장을 위한 기반 자료 제공 (애자일 & TDD)  
> ‑ AI 보조 작성·유지를 고려한 섹션 구분 및 세부 지표 명시  

---

## 1. Meta Information
| 항목 | 내용 |
|------|------|
| Document Title | Commerce Platform – Current System PRD |
| Version / Revision | v1.0.0 |
| 작성일 | 2025-06-09 |
| 작성자 | AI Assistant + Team |
| Repository | https://github.com/Teddy-22/commerce |
| 관련 문서 | README, Architecture Overview, Shopify Storefront API Docs |

---

## 2. Product Overview
| 주제 | 세부 내용 |
|------|----------|
| Elevator Pitch | “모든 브랜드가 빠르게 시작할 수 있는 Headless Commerce 프론트엔드.” |
| 비즈니스 문제 | 자체 CMS/ERP와 연동 가능한 유연한 스토어프론트가 필요하지만, 구축 비용과 시간 부담이 크다. |
| 가치 제안 |  • Next.js 기반 SSR/ISR로 SEO 최적화 & 고속 렌더링 <br> • Shopify Storefront API 통합으로 백오피스 불필요 <br> • 모듈식 컴포넌트로 브랜드 UI 커스터마이징 용이 |
| 핵심 성공 지표 | ‑ 페이지 LCP < 2 s (P95) <br>- 구매 전환율 +15 % <br>- NPS ≥ 50 <br>- 월 유지보수 시간 < 20 h |

---

## 3. Goals & Non-Goals
### 3.1 Goals (SMART)
- [ ] G1 : 2025 Q3 까지 일 평균 1 만 페이지뷰를 99.9 % 가용성으로 서비스  
- [ ] G2 : 장바구니 → 결제 완료 전환율을 현재 2.3 % → 3.0 % 이상으로 향상  
- [ ] G3 : 전체 코드 커버리지 90 % 이상 유지 (TDD)  

### 3.2 Non-Goals
- ❌ Shopify Admin 대시보드 커스터마이징  
- ❌ 자체 결제 게이트웨이 개발 (Stripe/Shopify Payments 사용)  

---

## 4. Current System / Context Analysis
| 영역 | 현재 동작 | 문제점 / 제약 | 근거 자료 |
|------|-----------|---------------|-----------|
| 아키텍처 | • Next.js 14 App Router + React 19 <br>• Static Generation+ISR → Edge <br>• Backend 기능은 Shopify Storefront / Admin API 호출로 대체 | • 서버리스 함수 콜드스타트 <br>• Shopify API Rate Limit 4 /s | `/next.config.ts`, `lib/shopify/` |
| 컴포넌트 | 장바구니(Context API), 제품 갤러리, 검색 컬렉션, Variant Selector | 장바구니 상태가 새 세션에 유실 | `components/cart/*` |
| 데이터 | 데이터 영속성은 Shopify 쪽에서 관리 (Product, Variant, Checkout, Cart) | 일부 파생 데이터(재고 캐시) Redis 미구현 | `lib/shopify/queries/*.ts` |
| 빌드·배포 | Vercel CI→CD, Preview URL 자동 | Preview 환경별 Shopify 스토어 분리 X | `.github`, Vercel logs |
| 보안 | Shopify OAuth App Token 저장 (환경변수) <br>CSP default-src 'self' | 토큰 rotation 프로세스 없음 | `.env.example` |
| 퍼포먼스 | LCP 1.8 s (home), CLS 0.03 | `product/[handle]` 페이지 이미지 lazy 기준 미흡 | Lighthouse CI |

---

## 5. Personas & User Journeys
### 5.1 Personas
| Persona | 설명 | 목표 | Pain Points |
|---------|------|------|-------------|
| Shopper | 일반 고객 (B2C) | 빠르고 신뢰성 있는 구매 | 느린 로딩, 재고 불일치 |
| Store Admin | Shopify 관리자 | 제품·재고·주문 일원화 | 프론트 업데이트 시 코드 의존 |

### 5.2 핵심 시나리오
1. Shopper 브라우징 → 제품 상세 → Variant 선택 → Add to Cart → Checkout (Shopify) → Order Confirmation  
2. Admin Shopify에서 가격 수정 → ISR / on-demand revalidate → 60 s 이내 프론트 가격 반영  

---

## 6. Assumptions & Constraints
- 프론트엔드: Next.js App Router, TypeScript, TailwindCSS  
- 호스팅: Vercel Edge Network  
- 백엔드: Shopify Storefront・Admin GraphQL (Rate Limit 4 req/s)  
- 결제: Shopify Payments / Stripe only  
- 법규: GDPR, PCI-DSS SAQ A  

---

## 7. Functional Requirements
| ID | User Story | 수용 기준 (Given/When/Then) | 우선순위 |
|----|------------|-----------------------------|----------|
| FR-001 | **As a** Shopper **I want** to add variant to cart **so that** I can purchase | Given 제품 상세, When Add to Cart 클릭, Then `cart-context` 수량+1, MiniCart open | Must |
| FR-002 | **As a** Shopper **I want** cached images **so that** pages load fast | Given Product grid, When 첫 진입, Then 모든 썸네일 WebP + CDN 캐시 HIT 95 % | Should |
| FR-003 | **As an** Admin **I want** to revalidate ISR page on price change | Given Shopify Admin price update, When Webhook fired, Then `/api/revalidate` 200 & 경로 캐시 무효화 | Must |

---

## 8. Non-Functional Requirements
| 카테고리 | 목표 | 검증 |
|----------|------|------|
| 성능 | FCP < 1.5 s (P90) | Lighthouse CI |
| 가용성 | 99.9 % 월간 | Vercel SLA |
| 보안 | OWASP Top 10 Zero hotspots | Snyk Scan |
| 접근성 | WCAG 2.1 AA | Axe CI |

---

## 9. Backlog & Agile Cadence
```
EPIC 1: Core Shopping
  ├─ FR-001 Add to Cart
  ├─ FR-002 Cached images
EPIC 2: Content Freshness
  ├─ FR-003 ISR Revalidation
```
- 2-주 스프린트, Jira 관리  
- WSJF 우선순위 + MoSCoW  

---

## 10. Test Strategy (TDD)
| 레이어 | 도구 | 커버리지 |
|--------|------|----------|
| Unit | Jest + React Testing Library | 90 % |
| Integration | Playwright | 주요 플로우 100 % |
| Contract | Pact (Shopify GraphQL mocks) | 모든 쿼리 |
| E2E | Cypress Cloud | Checkout Happy Path |

---

## 11. Data & Integration
### 11.1 핵심 엔티티
| Entity | 주요 필드 | 출처 |
|--------|-----------|------|
| Product | id, title, handle, images, variants | Shopify |
| Cart | id, lines[], buyerIdentity | Shopify |
| Order | id, totalPrice, status | Shopify |

### 11.2 API / 이벤트 맵
| Producer | 채널 | Consumer | Payload |
|----------|-------|----------|---------|
| Shopify | Webhook `PRODUCTS_UPDATE` | Next.js API `/api/revalidate` | {productIds[]} |
| Checkout Page | fetch `/api/checkout` | Stripe / Shopify | {cartId, paymentInfo} |

---

## 12. Dependencies
- 외부: Shopify Storefront/Admin API, Stripe, Vercel Edge Functions  
- 내부: (예정) Notification Service, Inventory Cache (Redis)  

---

## 13. Risk & Mitigation
| 위험 | 영향 | 가능성 | 대응 |
|------|------|--------|------|
| Shopify Rate Limit 초과 | 429 → 페이지 오류 | Medium | SWR 캐싱, Retry-After 백오프 |
| Vercel cold-start | 첫 요청 지연 | Low | Edge Functions에 Pre-warm ping |
| 환율 변동 | 표시 가격 불일치 | High | ISR 재검증 주기 < 5 min |

---

## 14. Analytics & Observability
- 추적 이벤트: `ProductViewed`, `AddToCart`, `CheckoutStarted`, `PurchaseCompleted`  
- Datadog RUM + Next.js middleware tracing  
- Error Budget 0.1 %  

---

## 15. Roll-out Plan
| Sprint | 목표 | Exit Criteria | Launch |
|--------|------|--------------|--------|
| 1 | Cart & PDP 기본 | Lighthouse ≥ 90 | Hidden URL |
| 2 | Checkout 연동 | E2E pass | Canary 10 % |
| 3 | SEO / ISR 완성 | Organic 트래픽 기준 | Full Rollout |

---

## 16. Glossary
| 용어 | 정의 |
|------|------|
| ISR | Incremental Static Regeneration |
| PDP | Product Detail Page |
| RUM | Real User Monitoring |

---

## 17. Change Log
| Version | Date | Author | Notes |
|---------|------|--------|-------|
| 1.0.0 | 2025-06-09 | AI + Team | 최초 작성 |
