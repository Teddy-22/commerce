# 📄 Product Requirements Document (PRD) – **Reusable Template**

> Purpose  
> ‑ Provide a universal structure for capturing product requirements across **any** software project.  
> ‑ Optimised for Agile development and Test-Driven Development (TDD).  
> ‑ Designed for human + AI collaboration: clear, atomic sections that can be parsed, diffed, and iterated.

---

## 1. Meta Information
| Item | Description |
|------|-------------|
| Document Title | |
| Version / Revision | |
| Created | |
| Author(s) / Role(s) | |
| Repository / Project Link | |
| Related Docs | Roadmap, Design System, API Spec, etc. |

---

## 2. Product Overview
| Topic | Details |
|-------|---------|
| Elevator Pitch | One-sentence description of the product/functionality. |
| Business Problem | What pain point or opportunity does this address? |
| Value Proposition | Why users & stakeholders will care. |
| Success Metrics (KPI/OKR) | e.g., adoption %, revenue, latency, NPS. |

---

## 3. Goals & Non-Goals
### 3.1 Goals (SMART)
- [ ] G1:  
- [ ] G2:  

### 3.2 Non-Goals / Out-of-Scope
- ❌ Item 1  
- ❌ Item 2  

---

## 4. Current System / Context Analysis
| Aspect | Current State | Issues / Constraints | Evidence |
|--------|---------------|----------------------|----------|
| Architecture | | | Diagrams/links |
| Functional Flow | | | |
| Data Model | | | ERD / schemas |
| APIs / Events | | | |
| Performance | | | Logs / APM |
| Security / Compliance | | | |

---

## 5. Personas & User Journeys
### 5.1 Personas
| Persona | Overview | Goals | Pain Points |
|---------|----------|-------|-------------|
| <Name> | e.g., End-user, Admin, DevOps | | |

### 5.2 Key User Journeys
1. _User_ does **X** → **Y** → **Z**  
2. _Admin_ configures **A** → monitors **B**

---

## 6. Assumptions & Constraints
- Tech stack (placeholder): `<Language>`, `<Framework>`, `<Cloud/On-prem>`  
- Regulatory: GDPR, SOC2, HIPAA, etc.  
- Time / budget / team size constraints  
- External dependencies: 3rd-party APIs, legacy services  

---

## 7. Functional Requirements
| ID | User Story (INVEST) | Acceptance Criteria (Given/When/Then) | Priority | Notes |
|----|---------------------|----------------------------------------|----------|-------|
| FR-001 | **As** a \<persona\> **I want** \<capability\> **so that** \<benefit\> | ‑ **Given** …<br>- **When** …<br>- **Then** … | Must | |
| FR-002 | | | Should | |

---

## 8. Non-Functional Requirements (NFR)
| Category | Metric | Target | Validation Method |
|----------|--------|--------|-------------------|
| Performance | Response time | < 200 ms (95th) | Load tests |
| Reliability | Uptime | 99.9 % monthly | SLO tracking |
| Security | Vulnerabilities | 0 critical | SAST/DAST |
| Accessibility | WCAG | AA | Audit |

---

## 9. Backlog Structure & Agile Cadence
```
EPIC: <Theme>
  ├─ FR-001
  ├─ FR-002
```
- Sprint length: 1-2 weeks  
- Prioritisation: MoSCoW, WSJF, or custom score  
- Definition of Done (DoD): code merged, tests pass, docs updated, metrics instrumented

---

## 10. Test Strategy (TDD-Aligned)
| Layer | Tooling (examples) | Coverage Target |
|-------|--------------------|-----------------|
| Unit | e.g., Jest, JUnit | ≥ 90 % |
| Integration | e.g., Playwright, REST Assured | Core flows 100 % |
| Contract / API | e.g., Pact | All external contracts |
| E2E | e.g., Cypress | Happy paths |

TDD Cycle: **Red → Green → Refactor** documented per story.

---

## 11. Data & Integration (if applicable)
### 11.1 Key Entities
| Entity | Core Fields | Relationships |
|--------|-------------|---------------|
| ExampleEntity | id, name, status | 1-* AnotherEntity |

### 11.2 API / Event Map
| Producer | Interface | Consumer | Payload (schema ref) |
|----------|-----------|----------|----------------------|

---

## 12. Dependencies
- External services / vendors  
- Internal microservices  
- Feature flags / platform components  

---

## 13. Risks & Mitigations
| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| | | | |

---

## 14. Analytics & Observability
- Event tracking plan (e.g., `UserSignedUp`, `FeatureUsed`)  
- Metrics & dashboards (Grafana, Datadog, etc.)  
- Alerting thresholds  

---

## 15. Roll-out & Release Plan
| Phase / Sprint | Deliverables | Exit Criteria | Release Strategy |
|----------------|--------------|---------------|------------------|
| 1 | MVP skeleton | All unit tests pass | Feature flag OFF |
| 2 | Beta features | Stakeholder demo | Canary |

---

## 16. Glossary
| Term | Definition |
|------|------------|
| MVP | Minimum Viable Product |
| KPI | Key Performance Indicator |

---

## 17. Change Log
| Version | Date | Author | Description |
|---------|------|--------|-------------|

---

### How to Maintain This Document
1. Update relevant section with every feature PR.  
2. Record version bump in **Change Log**.  
3. Archive obsolete goals/requirements instead of deleting.  
