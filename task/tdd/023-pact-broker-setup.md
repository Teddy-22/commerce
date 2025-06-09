---
id: TDD-023
title: "Configure Pact Broker & CI publishing/verification for contract tests"
dependsOn:
  - TDD-004        # CI workflow scaffold
  - TDD-021        # Cart mutations Pact JSON
  - TDD-022        # Product queries Pact JSON
status: "open"
owner: ""
estimate: "4h"
---

## 목적
- **Pact Broker**(또는 PactFlow, self-hosted broker)를 설정하여 **소비자(프론트엔드) 계약**을 중앙 저장소에 게시한다.  
- CI/CD 파이프라인에서 **계약 게시 → 제공자 검증(필요 시) → 상태 체크**까지 자동화하여, Shopify API(또는 사내 Provider Stub)의 변화가 프론트엔드에 영향을 주지 않도록 품질 게이트를 마련한다.

## 범위
1. Pact Broker 인프라
   - 옵션 A: PactFlow SaaS (무료 플랜)  
   - 옵션 B: Self-hosted Docker (`pactfoundation/pact-broker`) on GH Actions Service
2. **환경 변수 & 시크릿**  
   - `PACT_BROKER_URL`, `PACT_BROKER_TOKEN`
3. **npm 스크립트**  
   - `pact:publish` – `pact-broker publish pacts/*.json --consumer-app-version=$GITHUB_SHA`
   - `pact:can-i-deploy` – `pact-broker can-i-deploy --pacticipant frontend --version=$GITHUB_SHA --latest`
4. **GitHub Actions**  
   - `contract` job 단계 확장  
     1. Generate pacts (`pact:mutations`, `pact:products`)  
     2. Publish (`pact:publish`)  
     3. Verify deploy permission (`can-i-deploy`) – 실패 시 워크플로 중단  
   - Matrix 환경(브랜치별) 적용
5. README / TDD 문서 업데이트 – Broker URL, badge 예시

## 수용 기준 (Given / When / Then)

| Given | When | Then |
|-------|------|------|
| CI `contract` job | Pact 생성 후 `pact:publish` 실행 | GitHub log에 “published X pact files” |
| CI `contract` job | `can-i-deploy` 실행 | Exit code 0 → 다음 job 진행, Exit code ≠0 → 워크플로 실패 |
| Pact Broker UI | 브랜치 main 최신 커밋 | Consumer(frontend)-Provider(shopifyCart/shopifyProduct) 계약 확인 가능 |
| 신규 PR | 계약 변경 발생 | `can-i-deploy` 결과 Pending/Fail → PR 상태 “contract ❌” |

## 작업 체크리스트
- [ ] **Broker 선택**  
  - [ ] PactFlow 계정 생성 _또는_ Docker compose 파일 작성  
  - [ ] Obtain `PACT_BROKER_URL` & `PACT_BROKER_TOKEN`
- [ ] **GitHub Secrets** 추가  
  - `PACT_BROKER_URL`, `PACT_BROKER_TOKEN`
- [ ] **npm scripts**  
  ```json
  "scripts": {
    "pact:publish": "pact-broker publish pacts --consumer-app-version=$GITHUB_SHA --broker-base-url=$PACT_BROKER_URL --broker-token=$PACT_BROKER_TOKEN",
    "pact:can-i-deploy": "pact-broker can-i-deploy --pacticipant frontend --version=$GITHUB_SHA --broker-base-url=$PACT_BROKER_URL --broker-token=$PACT_BROKER_TOKEN"
  }
  ```
- [ ] **Actions workflow 수정** (`.github/workflows/test.yml`)  
  ```yaml
  contract:
    needs: unit
    runs-on: ubuntu-latest
    env:
      PACT_BROKER_URL: ${{ secrets.PACT_BROKER_URL }}
      PACT_BROKER_TOKEN: ${{ secrets.PACT_BROKER_TOKEN }}
      NEXT_PUBLIC_USE_MOCKS: true
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install
      - run: pnpm pact:mutations && pnpm pact:products
      - run: pnpm pact:publish
      - run: pnpm pact:can-i-deploy
  ```
- [ ] **README** ➜ “Contract Testing & Broker” 섹션  
  - How to view contracts  
  - Badges (e.g., `[![pact](https://.../badge)]`)  
- [ ] **Documentation** (`doc/tdd-master-plan.md`) 업데이트

## 병렬성 & 의존성
- **TDD-021, TDD-022** 파생 Pact 파일이 생성된 후 진행  
- Broker 설정 후 다른 팀(Provider)에서 검증 파이프라인 구축 가능  
- 계약 게시·검증은 **메인 브랜치** merge 이벤트마다 실행되도록 설정

## 산출물
- 환경 변수 & 시크릿 등록 확인 스크린샷(내부)  
- 업데이트된 workflow 파일  
- npm script 추가 & `package.json` diff  
- README / master-plan 업데이트  
- Pact Broker 캡처(계약 목록) 링크

## 참고
- Pact Broker Docs: https://docs.pact.io/pact_broker  
- PactFlow SaaS: https://pactflow.io  
- Example GitHub Action: https://github.com/pactflow/example-consumer-jest/blob/master/.github/workflows/ci.yml  
- `task/tdd/020-contract-cart-pact.md`, `task/tdd/021-*`, `task/tdd/022-*`
