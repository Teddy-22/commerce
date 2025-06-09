---
id: TDD-004
title: "Configure GitHub Actions CI/CD workflow & code coverage reporting"
dependsOn:
  - TDD-001   # Jest + RTL
  - TDD-002   # MSW
  - TDD-003   # Playwright
status: "open"
owner: ""
estimate: "3h"
---

## 목적
모든 테스트(Job)와 코드 커버리지 리포트를 자동 실행·집계하는 **GitHub Actions** 워크플로를 구축한다.  
이를 통해 Pull Request 단위로 **품질 게이트**를 마련하고, Codecov 배지로 커버리지 추이를 시각화한다.

## 범위
1. `.github/workflows/test.yml` 작성  
   - **Unit**(Jest)  
   - **Contract**(Pact)  
   - **E2E-desktop**(Playwright)  
   - **E2E-mobile**(Playwright)  
   - (선택) **Error-flow** job placeholder  
2. 잡 캐시: `~/.cache/pnpm`, `~/.cache/ms-playwright`  
3. 병렬 실행 matrix → Unit & Contract 선행 → E2E 병렬  
4. 커버리지 업로드: **Codecov** CLI (`bash <(curl -s https://codecov.io/bash)`)  
5. PR 코멘트/상태 체크 활성화  
6. 프로젝트 README에 배지 추가

## 수용 기준 (Given / When / Then)

| Given | When | Then |
|-------|------|------|
| 새 PR 생성 | 워크플로 실행 | Unit → Contract → E2E 모든 job 녹색 |
| PR 내 Codecov | Tests 완료 후 | 커버리지 코멘트 & 상태 체크 ✓ |
| `main` 브랜치 | 머지 후 | Codecov 배지(README) 최신 커버리지 반영 |
| 실패 테스트 | Unit job 실패 | 이후 job 자동 취소 & PR 상태 실패 |

## 작업 체크리스트
- [ ] **Codecov** 무료 계정/토큰 발급 → GitHub `CODECOV_TOKEN` secret 저장
- [ ] **test.yml** 초안  
  ```yaml
  name: test
  on: [push, pull_request]
  defaults: { run: { shell: bash } }

  concurrency:
    group: ${{ github.workflow }}-${{ github.ref }}
    cancel-in-progress: true

  jobs:
    unit:
      runs-on: ubuntu-latest
      env: { NEXT_PUBLIC_USE_MOCKS: true }
      steps:
        - uses: actions/checkout@v4
        - uses: pnpm/action-setup@v3
        - run: pnpm install
        - run: pnpm test --coverage
        - run: bash <(curl -s https://codecov.io/bash)
    contract:
      needs: unit
      runs-on: ubuntu-latest
      env: { NEXT_PUBLIC_USE_MOCKS: true }
      steps: *unit-steps  # 재사용 or 작성
      # run pact scripts…
    e2e:
      needs: [unit, contract]
      strategy:
        matrix: { project: [desktop, mobile] }
      uses: microsoft/playwright-github-action@v1
      with:
        args: pnpm e2e --project ${{ matrix.project }}

  ```
- [ ] 캐시 스텝 추가 (`actions/cache@v4`)  
  - pnpm store, Playwright binaries
- [ ] 실패 시 아티팩트(`trace.zip`, `video`) 업로드  
  ```yaml
  if: failure()
  uses: actions/upload-artifact
  ```
- [ ] **README** 상단에 Codecov 배지 추가  
  ```
  [![codecov](https://codecov.io/gh/<user>/commerce/branch/main/graph/badge.svg)](https://codecov.io/gh/<user>/commerce)
  ```
- [ ] **package.json**  
  - `"coverage:upload": "bash <(curl -s https://codecov.io/bash)"`

## 병렬성 & 의존성
- **TDD-003** 완료 후 바로 착수 가능  
- 완료 후 **TDD-020, 030, 040, 045, 050** 태스크 PR 은 자동으로 품질 게이트 적용  
- job 의존성(needs) 로 Unit→Contract→E2E 순서를 보장하면서, E2E 내부는 매트릭스로 **병렬화** 처리

## 산출물
- `.github/workflows/test.yml`
- README 배지 커밋
- `package.json` 스크립트(coverage:upload)
- CI 처음 실행 로그 스크린샷(선택)  

## 참고
- Codecov Docs: https://docs.codecov.com
- Playwright GitHub Action: https://github.com/microsoft/playwright-github-action
- GitHub Actions Cache: https://github.com/actions/cache
- `doc/tdd-master-plan.md` §8 CI/CD 통합
