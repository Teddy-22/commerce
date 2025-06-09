# 🛠️ TDD Adoption Task Board – README  
Directory: `task/tdd/`

본 폴더는 **TDD 도입**을 위해 정의된 모든 일을 _작고 병렬 가능한 태스크_ 단위로 관리하는 장소입니다.  
AI-Agent 혹은 개발자가 이 폴더의 파일을 읽고 **스스로 작업을 Claim → 실행 → 완료**할 수 있도록 설계되었습니다.

---

## 1. 폴더 구조

```
task/
└─ tdd/
   ├─ 000-bootstrap-env.md
   ├─ 010-unit-cart-hook.md
   ├─ 020-contract-cart-pact.md
   ├─ 030-integration-pdp-cart.md
   ├─ 040-e2e-checkout-desktop.md
   ├─ 045-e2e-checkout-mobile.md
   ├─ 050-errorflow-payment-fail.md
   └─ README.md   <─ ★ this file
```

*번호 앞 3자리는** 우선순위 + 의존성을 암시*합니다.  
동일 숫자 블록(예: `04x`) 은 **병렬** 진행이 가능하며, 낮은 번호 작업이 완료된 뒤 높은 번호가 착수됩니다.

---

## 2. 개별 태스크 파일 포맷

모든 태스크는 **Markdown** 상단에 YAML 메타데이터(Front-matter)를 포함합니다.

```yaml
---
id: TDD-010
title: "Implement unit tests for useCart hook"
dependsOn:
  - TDD-000   # 없으면 []
status: "open"      # open | in-progress | review | done
owner: ""           # Agent or human id가 Claim 시 작성
estimate: "4h"
---
```

YAML 아래에는 자유롭게 _세부 설명_, **수용 기준(Given/When/Then)**, 참고 링크, 체크리스트 등을 기술합니다.

### 필드 설명
| 필드 | 역할 |
|------|------|
| id | 고유 식별자 (변경 불가) |
| title | 한 줄 요약 |
| dependsOn | 선행 태스크 id 배열 |
| status | 작업 상태 |
| owner | Claim 한 주체 |
| estimate | 예측 소요 시간 |

---

## 3. 작업 흐름

| 단계 | 책임 | 설명 |
|------|------|------|
| 1. Claim | AI / Dev | `status: in-progress`, `owner` 입력 후 PR 생성 |
| 2. Implement | AI / Dev | 코드·테스트 작성, CI 통과 |
| 3. Review | Peers | `status: review`, 코멘트 반영 |
| 4. Done | Reviewer | 머지 후 `status: done` 으로 수정 & 닫힘 |

> **병렬 처리** – dependsOn 이 없는 태스크는 여러 AI 가 동시에 Claim 가능.  
> 의존성이 있는 태스크는 선행 작업 `status: done` 확인 후 Claim하십시오.

---

## 4. 우선순위 & 병렬 전략

| 블록 | 내용 | 병렬 가능? |
|------|------|-----------|
| 000 | 환경 부트스트랩 (Jest, Playwright, MSW) | 선행 필수 (단독) |
| 010–020 | Unit / Contract | 서로 병렬 가능 |
| 030 | Integration 테스트 | 010 완료 필요, 020 병렬 가능 |
| 04x | E2E Happy Path | 030 완료 후 **Desktop & Mobile(045)** 병렬 |
| 05x | 오류/엣지 케이스 | 대부분 04x 이후 병렬 |

---

## 5. 커밋 & PR 규칙

1. **Conventional Commits** `test:`, `feat:`, `ci:` 등 사용  
2. 태스크 하나당 **하나의 PR** 원칙  
3. PR 설명에 `Closes #TDD-010` 형식으로 태스크 id 명시  
4. CI 녹색 + 코드리뷰 승인 시 머지

---

## 6. 참고 문서

- `doc/reverse-engineered-prd.md`
- `doc/tdd-master-plan.md` / `tdd-master-plan-detailed.md`
- MSW / Jest / Playwright 공식 가이드

---

**모든 AI Agents** 는 이 README 를 따라 태스크를 생성·수행하십시오.  
Happy Testing! 🚀
