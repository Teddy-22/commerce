# 🧪 TDD 작업 흐름도 (TDD Task Flow)

> 이 문서는 Next.js + Shopify Commerce 프로젝트의 TDD 도입을 위한 작업 흐름과 의존성을 시각화합니다.
> 각 작업의 병렬 처리 가능성과 담당 주체(단일/다중 AI)를 명확히 표시하여 효율적인 작업 분배를 돕습니다.

## 작업 의존성 및 병렬 처리 다이어그램

flowchart TD
    %% 노드 정의
    TDD000[TDD-000\n환경 부트스트랩\n단일 AI만 수행 가능] --> TDD010[TDD-010\n장바구니 훅 단위 테스트\n병렬 AI 가능]
    TDD000 --> TDD020[TDD-020\nPact 계약 테스트\n병렬 AI 가능]
    TDD010 --> TDD030[TDD-030\nPDP-Cart 통합 테스트\n병렬 AI 가능]
    TDD030 --> TDD040[TDD-040\nE2E 데스크탑\n병렬 AI 가능]
    TDD030 --> TDD045[TDD-045\nE2E 모바일\n병렬 AI 가능]
    TDD040 --> TDD050[TDD-050\n오류 플로우\n병렬 AI 가능]
    TDD045 --> TDD050
    
    %% 스타일 정의
    classDef singleAI fill:#8b251e,color:white,stroke:#333,stroke-width:2px
    classDef parallelAI fill:#47956f,color:white,stroke:#333,stroke-width:2px
    
    %% 클래스 적용
    class TDD000 singleAI
    class TDD010,TDD020,TDD030,TDD040,TDD045,TDD050 parallelAI
    
    %% 병렬 작업 표시
    subgraph "병렬 그룹 1"
        TDD010
        TDD020
    end
    
    subgraph "병렬 그룹 2"
        TDD040
        TDD045
    end

## 작업 단계별 설명

### 1. 초기 설정 (선행 필수)
- **TDD-000: 환경 부트스트랩** (6h)
  - 모든 작업의 선행 조건
  - Jest, RTL, MSW, Playwright 설정
  - **단일 AI만 수행 가능** (환경 충돌 방지)

### 2. 기본 테스트 (병렬 가능)
- **TDD-010: Cart 훅 단위 테스트** (4h)
  - TDD-000 완료 후 시작
  - **여러 AI 병렬 작업 가능**
  
- **TDD-020: Shopify API Pact 계약 테스트** (5h)
  - TDD-000 완료 후 시작
  - TDD-010과 병렬 진행 가능
  - **여러 AI 병렬 작업 가능**

### 3. 통합 테스트
- **TDD-030: PDP-Cart 통합 테스트** (5h)
  - TDD-000, TDD-010 완료 후 시작
  - **여러 AI 병렬 작업 가능**

### 4. E2E 테스트 (병렬 가능)
- **TDD-040: E2E 데스크탑** (4h)
  - TDD-030 완료 후 시작
  - **여러 AI 병렬 작업 가능**
  
- **TDD-045: E2E 모바일** (4h)
  - TDD-030 완료 후 시작
  - TDD-040과 병렬 진행 가능
  - **여러 AI 병렬 작업 가능**

### 5. 오류 케이스
- **TDD-050: 오류 플로우 테스트** (3h)
  - TDD-040, TDD-045 완료 후 시작
  - **여러 AI 병렬 작업 가능**

## 작업 할당 전략

1. **단일 AI 작업**
   - 환경 설정 (TDD-000)은 충돌 방지를 위해 단일 AI가 담당

2. **병렬 AI 작업**
   - 각 테스트 레이어(단위, 통합, E2E)는 서로 다른 AI가 병렬로 작업 가능
   - 동일 레이어 내 병렬 작업(TDD-040/045)도 가능

3. **최적 작업 분배**
   - 총 예상 시간: 27시간 (순차 진행 시)
   - 최적 병렬 처리 시: 약 14시간으로 단축 가능

> **참고**: 각 작업의 상세 내용은 `task/tdd/` 디렉토리의 개별 Markdown 파일을 참조하세요.
