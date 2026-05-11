# KPM (KPM Project Manager) 작업내역

## 개요

Claude Code로 진행하는 여러 게임 개발 프로젝트를 한눈에 관리하기 위한 로컬 웹 대시보드.

- **백엔드**: Node.js + Express 4 (포트 3001)
- **프론트엔드**: React 18 + Vite 5 (포트 5173)
- **데이터**: `projects.json`, `settings.json`
- **테스트**: Jest + Supertest (백엔드 15개), Vitest + Testing Library (프론트엔드 10개)

---

## 실행 방법

```bash
# 터미널 1 — 백엔드
cd backend && node server.js

# 터미널 2 — 프론트엔드
cd frontend && npm run dev
```

→ http://localhost:5173 접속

---

## 구현된 기능

### 1. 프로젝트 카드

각 프로젝트를 카드로 표시. 카드에 포함된 정보:

- 프로젝트 이름 + 상태 선택 (진행중 / 일시정지 / 완료)
- 지시사항 총 건수 + 마지막 지시 시각
- 지시사항 목록 (체크박스로 완료 처리, ✕로 삭제)
- 지시사항 입력 필드 (Enter 또는 + 버튼으로 추가)
- Plan 파일 진행률 바 (`docs/superpowers/plans/*.md`의 `- [x]` 체크박스 기반)
- 버튼: ▶ 실행 / Push / 열기 / 기획서 / 문서 / 삭제

### 2. 헤더 버튼

| 버튼 | 기능 |
|------|------|
| ⚙ 규칙 | 공용 규칙 설정 모달 열기 |
| 스캔 | Claude Code 기록에서 프로젝트 자동 탐지 |
| 새로고침 | 전체 프로젝트 데이터 새로고침 |
| + 추가 | 프로젝트 수동 등록 모달 열기 |

### 3. Claude Code 기록 자동 스캔

`~/.claude/projects/` 디렉토리를 탐색해 세션 JSONL 파일의 `cwd` 필드에서 실제 프로젝트 경로를 추출. 이미 등록된 프로젝트는 제외하고 새 프로젝트 목록을 보여준 후 선택하여 일괄 추가.

**탐지된 프로젝트 (2026-04-27 기준):**
0_KPM, 1_TOS, 12_NIKKE, 14_LT, LotteryFantasy, 2_Pioneer, 3_LOP, 4_GM, BS, SquadVsMonster

### 4. Claude 기록 표시

각 카드의 **"Claude 기록 ▼"** 버튼 클릭 시, 해당 프로젝트 디렉토리에서 진행한 Claude Code 대화 내역(사용자 메시지)을 최신순으로 최대 30건 표시.

### 5. 최근 실행파일 실행 (▶ 실행)

프로젝트 폴더를 재귀 탐색해 가장 최근 수정된 `.exe` 파일을 찾아 Windows `start` 명령으로 실행. 탐색 시 `node_modules`, `.git`, `Library`, `Temp`, `obj` 등은 제외.

### 6. Git Push

각 카드의 **Push** 버튼 클릭 시 해당 프로젝트 경로에서 `git push` 실행. 성공/실패 결과 인라인 표시.

### 7. 공용 규칙 설정

⚙ 규칙 버튼 → 모달에서 모든 프로젝트에 공통 적용할 규칙 텍스트 목록을 추가/삭제/저장. `settings.json`에 저장.

### 8. 오류 표시

API 요청 실패 시 상단 빨간 배너로 오류 메시지 표시.

### 9. 기획서 열람

각 카드의 **"기획서"** 버튼 클릭 시, 해당 프로젝트의 `docs/superpowers/plans/` 디렉토리에서 가장 최근 수정된 `.md` 파일을 모달로 표시. 기획서 없으면 버튼 비활성화.

### 10. 최신 문서 열람

각 카드의 **"문서"** 버튼 클릭 시, 프로젝트 전체를 재귀 탐색해 `docs/superpowers/plans/`를 제외한 가장 최근 수정된 `.md` 파일을 모달로 표시. `node_modules`, `.git`, `Library` 등 노이즈 폴더는 제외.

---

## 파일 구조

```
0_KPM/
├── backend/
│   ├── server.js                    # Express 앱 + 라우터 등록
│   ├── routes/
│   │   ├── projects.js              # 프로젝트 CRUD + 기능 라우트
│   │   └── settings.js              # 공용 규칙 GET/PUT
│   ├── services/
│   │   ├── storage.js               # projects.json 읽기/쓰기
│   │   ├── parser.js                # plan .md 파일 진행률 파싱
│   │   └── settingsStorage.js       # settings.json 읽기/쓰기
│   └── __tests__/
│       ├── routes.test.js
│       ├── parser.test.js
│       └── storage.test.js
├── frontend/
│   ├── src/
│   │   ├── App.jsx                  # 루트 컴포넌트
│   │   ├── App.css                  # 전체 스타일
│   │   ├── api.js                   # fetch 래퍼 함수 모음
│   │   └── components/
│   │       ├── ProjectCard.jsx      # 프로젝트 카드
│   │       ├── AddProjectModal.jsx  # 수동 추가 모달
│   │       ├── ScanModal.jsx        # Claude Code 스캔 모달
│   │       ├── SettingsModal.jsx    # 공용 규칙 설정 모달
│   │       └── MdViewerModal.jsx    # 기획서/문서 마크다운 열람 모달
│   └── vite.config.js
├── projects.json                    # 프로젝트 목록 데이터
├── settings.json                    # 공용 규칙 데이터
└── KPM_작업내역.md                   # 이 파일
```

---

## API 엔드포인트

### 프로젝트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/projects` | 전체 프로젝트 목록 (진행률 포함) |
| POST | `/api/projects` | 프로젝트 추가 |
| PUT | `/api/projects/:id` | 프로젝트 수정 (지시사항, 상태 등) |
| DELETE | `/api/projects/:id` | 프로젝트 삭제 |
| POST | `/api/projects/:id/open` | VSCode로 열기 |
| POST | `/api/projects/:id/refresh` | 진행률 새로고침 |
| GET | `/api/projects/scan-claude` | Claude Code 기록에서 프로젝트 탐지 |
| POST | `/api/projects/bulk-add` | 프로젝트 일괄 추가 |
| POST | `/api/projects/:id/git-push` | git push 실행 |
| POST | `/api/projects/:id/run-exe` | 최근 실행파일 실행 |
| GET | `/api/projects/:id/claude-messages` | Claude Code 대화 기록 조회 |
| GET | `/api/projects/:id/plan-file` | 기획서 최신 파일 조회 (`docs/superpowers/plans/`) |
| GET | `/api/projects/:id/latest-doc` | 프로젝트 내 최신 마크다운 문서 조회 |

### 설정

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/settings` | 공용 규칙 조회 |
| PUT | `/api/settings` | 공용 규칙 저장 |

---

## 주요 수정 이력

| 일자 | 내용 |
|------|------|
| 2026-04-27 | 초기 브레인스토밍 및 설계 |
| 2026-04-27 | 백엔드 Express API 구현 (Jest 15개 테스트) |
| 2026-04-27 | 프론트엔드 React 구현 (Vitest 10개 테스트) |
| 2026-04-27 | 프로젝트 추가 버그 수정 (에러 처리 추가) |
| 2026-04-27 | Claude Code 기록 스캔 + 일괄 추가 기능 |
| 2026-04-27 | Git Push 버튼 추가 |
| 2026-04-27 | 공용 규칙 설정 기능 추가 |
| 2026-04-27 | 지시사항 표시 버그 수정 (낙관적 업데이트 + 로컬 상태) |
| 2026-04-27 | 한글 IME Enter 버그 수정 (`isComposing` 체크) |
| 2026-04-27 | 최근 실행파일 실행 기능 (Windows `start` 명령) |
| 2026-04-27 | Claude Code 대화 기록 표시 기능 |
| 2026-04-27 | 기획서 열람 버튼 (docs/superpowers/plans/ 최신 md) |
| 2026-04-27 | 최신 문서 열람 버튼 (프로젝트 내 최신 md) |
