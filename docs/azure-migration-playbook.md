# Azure 이관 플레이북 — GitHub + Render/Vercel + Supabase → Azure

> `target_keyword_rank` 프로젝트를 Supabase에서 Azure(PostgreSQL + Functions)로 이관하며 겪은 시행착오와,
> `quotation_web` 프로젝트를 Supabase+Vercel에서 Azure(PostgreSQL + **App Service**)로 전면 이관하며 겪은
> 시행착오를 함께 정리한 문서.
> 다른 프로젝트에서 같은 이관 작업을 할 때 이 파일을 프로젝트에 복사해 넣고 Claude Code에게 "이 문서 참고해서 Azure로 이관해줘"라고 요청하면 된다.

## 이 문서를 어떻게 쓰나

1. 이 파일을 이관하려는 프로젝트 폴더에 복사 (예: `docs/azure-migration-playbook.md`)
2. Claude Code에게 아래 요청 예시를 그대로(또는 상황에 맞게 수정해서) 전달
3. Claude Code가 먼저 해야 할 것: 아래 "0단계: 프로젝트 분석 체크리스트"부터 실행
4. **API 레이어를 Azure Functions로 새로 만들지, App Service에 기존 API 구조를 그대로 옮길지**는 1단계에서 프로젝트 성격에 따라 갈린다 (아래 1단계 참고). 이후 5단계가 "5단계-A"와 "5단계-B" 두 갈래로 나뉜다.

### Claude Code에게 보낼 요청 예시 (복붙 가능)

```
이 프로젝트를 docs/azure-migration-playbook.md 참고해서 Azure로 이관하려고 해.

- 나는 Azure 사용 경험이 거의 없어서 각 단계를 상세하게 안내해줘
- 언제든 기존 서비스(Supabase 등)로 롤백 가능하도록 안전장치도 같이 만들어줘
- 먼저 문서의 0단계 체크리스트대로 이 프로젝트 코드를 분석해서
  (어떤 Supabase 기능을 쓰는지, 테이블 스키마, 이미지/파일 첨부 여부, 데이터량, 배포 방식)
  정리해서 알려줘. 실제 리소스 생성은 그다음에 진행하자.
```

**이렇게 요청하면 좋은 이유**:
- "0단계 체크리스트대로 코드 분석부터" → 컬럼 타입을 잘못 추측하는 등 이번에 겪은 실수를 미리 방지하는 핵심 단계라 반드시 먼저 시킬 것
- "Azure 경험 거의 없다" → 명령어 하나하나 상세히, 결과 확인하며 진행하는 방식으로 맞춰줌
- "롤백 안전장치도" → config 스위치(또는 Next.js라면 env var 스위치), 필요하면 이중 쓰기(dual-write)까지 포함해서 계획을 짜줌

---

## 범용 개발 워크플로우 스킬 활용

> 스킬 내용은 계속 바뀔 수 있어서, 여기 미리 요약해두지 않는다. 대신 **아래 단계에 도달하면 그 시점에 `Skill` 도구로 실제 호출해서, 그때의 진짜 지침을 그대로 따를 것.** (이게 정확한 이유: 이름만 보고 요약한 설명은 시간이 지나면 틀린 정보가 될 수 있지만, 실행 시점의 직접 호출은 항상 최신 내용을 따른다.)

### 지금 이 환경에 이미 설치되어 있어 바로 호출 가능 (`obra/superpowers`, `anthropics/skills`)

| 이 단계에 도달하면 | 호출할 스킬 |
|---|---|
| 0단계 시작 전, 요구사항/설계가 애매할 때 | `Skill(brainstorming)` |
| 0단계 분석 결과를 바탕으로 이관 계획을 문서화할 때 | `Skill(writing-plans)` |
| 6단계 코드 구현 시, 테스트부터 짜고 싶을 때 | `Skill(test-driven-development)` |
| 원인 불명 에러(예: `getaddrinfo ENOTFOUND base` 같은)를 만났을 때 | `Skill(systematic-debugging)` |
| 계획대로 여러 단계를 순서대로 실행할 때 | `Skill(executing-plans)` |
| 독립된 작업공간에서 이관 작업을 하고 싶을 때 | `Skill(using-git-worktrees)` |
| 데이터 이관 + 코드 이관처럼 서로 독립적인 작업을 병렬로 돌리고 싶을 때 | `Skill(dispatching-parallel-agents)` / `Skill(subagent-driven-development)` |
| 이관 브랜치 작업을 마무리(머지/PR)할 때 | `Skill(finishing-a-development-branch)` |
| "완료됐다"고 선언하기 전에 | `Skill(verification-before-completion)` |
| 코드 변경 후 리뷰를 요청/수행할 때 | `Skill(requesting-code-review)` / `Skill(receiving-code-review)` |
| 웹앱 배포 후 실제 브라우저 동작을 테스트할 때 | `Skill(webapp-testing)` |
| 결과 보고서나 문서를 PDF/Word/Excel/PPT로 만들어야 할 때 | `Skill(pdf)` / `Skill(docx)` / `Skill(xlsx)` / `Skill(pptx)` |
| 이관 후 UI를 새로 다듬어야 할 때 | `Skill(frontend-design)` |

### 이 환경엔 설치돼 있지 않음 — 이름/출처만 확인, 실제 내용 미검증 (`mattpocock/skills` 등)

`improve-codebase-architecture`, `domain-modeling`, `to-prd`/`to-spec`/`to-tickets`, `research`, `tdd`, `code-review`, `resolving-merge-conflicts`, `git-guardrails-claude-code`, `diagnosing-bugs`, `handoff`, `triage`, `qa`, `write-a-skill`, `writing-great-skills` — 전부 `mattpocock/skills` 저장소. 필요하면 `npx skills find <이름>`으로 실제 설치·확인 후 사용할 것 (이 환경에서 검증 안 됨).

⚠️ **알아둘 사실 (판단은 그때그때 알아서 — 이건 절차가 아니라 사실 정보)**: 스킬 이름/설치 수는 `azure-rbac`/`azure-observability`/`azure-cost-optimization`/`azure-postgres`처럼 리더보드와 `npx skills find` 실시간 검색 양쪽 모두에서 실제 저장소엔 없는 이름이 나온 적이 있다(`azure-postgres`는 검색에 27.8K 설치로 떴지만 실제 URL은 404였음). 이 문서 목록에 없는 스킬을 쓰게 되면 이름만 믿지 말고 실제 파일을 열어서 확인할 것.

---

## 0단계. 프로젝트 분석 체크리스트 (이관 시작 전 필수 확인)

새 프로젝트마다 아래를 먼저 파악해야 계획이 정확해진다:

- [ ] Supabase에서 실제로 쓰는 기능이 뭔가? (REST 테이블 API만? Auth? Storage? Realtime?)
- [ ] 테이블 목록과 **실제 컬럼 타입** 확인 — 코드만 보고 타입을 추측하지 말 것 (예: 이번 프로젝트에서 `ids` 컬럼이 코드상 JSON처럼 다뤄져서 jsonb로 추측했으나 실제로는 `text[]`였음 — 잘못 추측하면 저장 시 데이터가 깨짐). 확인 방법은 두 가지:
  - **Supabase 대시보드 → Database → Schema Visualizer**에서 직접 확인 (스크린샷 캡처 필요)
  - **(더 빠른 대안) REST API로 OpenAPI 스펙 받기**: `GET {SUPABASE_URL}/rest/v1/` 에 헤더 `Accept: application/openapi+json`, `apikey`/`Authorization`(anon 또는 service role key)을 넣어 요청하면, 모든 테이블의 실제 컬럼 타입(`jsonb`/`bigint`/`uuid`/`character varying` 등)이 JSON으로 바로 나옴. 스크린샷 없이, 터미널에서 바로 확인 가능해서 훨씬 빠르고 정확함
- [ ] 이미지/파일 첨부가 있는가? 있다면 **Supabase Storage**(별도 서비스, DB 덤프에 안 포함됨)인지 DB 컬럼에 직접 바이너리로 저장되는지 확인. Storage라면 버킷이 `public`인지도 확인 (Azure Blob 이관 시 컨테이너 공개 설정을 맞춰야 함)
- [ ] 데이터 양 (테이블당 대략 행 수, Storage 파일 용량) — Supabase REST API에 `Prefer: count=exact` 헤더로 HEAD 요청하면 대시보드 없이도 바로 확인 가능
- [ ] 현재 배포 방식 (데스크톱 EXE / 웹 서버 / Vercel·Render 정적+서버리스 등) — **API 레이어를 새로 만들지(Functions), 기존 구조를 그대로 옮길지(App Service)를 가르는 핵심 정보**. 아래 1단계 참고
- [ ] GitHub 저장소 소유 계정 확인 — push 권한 있는 계정인지 미리 확인 (아래 "자주 겪은 문제 → GitHub 계정 혼동" 참고)

💡 참고 스킬: `supabase`, `supabase-postgres-best-practices` (출처: supabase/agent-skills) — Supabase 쪽 분석에 참고 (미검증, `npx skills find`로 확인 후 사용).

---

## 1단계. 아키텍처 결정

| 결정 사항 | 기본 선택 | 이유 |
|---|---|---|
| DB 엔진 | **Azure Database for PostgreSQL** (Azure SQL 아님) | Supabase는 PostgreSQL 기반이라, 같은 엔진이어야 `pg_dump`/`pg_restore`로 스키마·데이터를 그대로 옮길 수 있음. Azure SQL로 가면 스키마 전면 재설계 필요 (배열 타입 자체가 없음 등) |
| 파일 저장소 | Supabase Storage 썼다면 → **Azure Blob Storage** | DB와 완전히 별개 서비스. DB 마이그레이션과 별도 트랙으로 진행 |

### API 레이어 — 프로젝트 성격에 따라 두 갈래

| 프로젝트 성격 | 선택 | 이유 | 이어지는 단계 |
|---|---|---|---|
| API 레이어 자체가 없던 프로젝트 (데스크톱 EXE, 정적 페이지 + Supabase 클라이언트 직접 호출 등) | **Azure Functions** (Python) | 서버리스 함수 경험이 있으면 학습 곡선이 가장 완만함. Data API builder(DAB)는 코드는 적지만 Container Apps 배포 + 자체 인증 체계를 새로 배워야 해서 오히려 진입장벽이 더 큼 | 5단계-A |
| **이미  서버 프레임워크로 API 레이어가 있는 프로젝트** (Next.js API Routes, Express 등 — 예: Vercel에 배포된 Next.js 앱) | **Azure App Service**에 앱 전체(화면+API)를 그대로 이전 | Functions를 새로 도입하면 브라우저→Supabase 직접 호출 부분만 API로 바꾸면 되는데 굳이 새 서버리스 인프라를 하나 더 추가하는 셈이 됨. 기존 API Route 구조를 유지한 채 DB/Storage 클라이언트만 교체하는 게 작업량이 훨씬 적고 관리 포인트도 하나로 유지됨 (Vercel 자리를 App Service가 통째로 대체) | 5단계-B |

인증 방식: Functions 경로는 **Function Key**(`x-functions-key` 헤더, Supabase의 `apikey`와 개념적으로 동일), App Service 경로는 **기존 앱의 인증 방식 그대로**(둘 다 없으면 그대로 없음).

**예외**: 여러 프로젝트를 운영 중이고 프로젝트별로 계속 인원/트래픽이 매우 적다면(안 쓸 때 비용 0으로 만들고 싶다면) Azure SQL 서버리스(자동 일시정지)가 유리할 수 있음 — 단, 이건 **처음부터 새로 만드는 프로젝트**에만 해당. Supabase에서 이관하는 경우는 항상 PostgreSQL.

---

## 2단계. 로컬 도구 준비

| 도구 | 용도 | 설치 | 필요한 경로 |
|---|---|---|---|
| Azure CLI | 리소스 생성 명령 실행 | `winget install Microsoft.AzureCLI` (또는 브라우저의 **Azure Cloud Shell** 사용 — 설치/로그인 절차 자체가 생략됨, 이미 브라우저에 Azure 로그인돼 있으면 이쪽이 더 빠름) | 공통 |
| Azure Functions Core Tools | 함수 로컬 테스트/배포 | `winget install Microsoft.Azure.FunctionsCoreTools` | 5단계-A(Functions)만 |
| pgAdmin | Postgres 데이터 확인/백업/복원 GUI, **CLI 도구(pg_dump/pg_restore/psql)도 설치 폴더 안에 함께 번들됨** | `winget install PostgreSQL.pgAdmin` | 공통 |

**설치 후 cmd 창을 반드시 새로 열 것** (PATH 반영 안 되면 `az`, `func` 명령어 인식 안 됨).

`az login` 실행 → 브라우저 로그인 → **계정이 여러 개면 반드시 push 권한 있는 계정인지 확인**.

---

## 3단계. Azure 리소스 생성

```bash
# 1) Resource Group
az group create --name rg-<프로젝트명> --location koreacentral

# 2) PostgreSQL Flexible Server — --public-access 0.0.0.0 옵션이 Azure 서비스 접근 허용 방화벽 규칙을 자동 생성해줌 (별도 단계 불필요)
az postgres flexible-server create \
  --resource-group rg-<프로젝트명> \
  --name <서버명-고유해야함> \
  --location koreacentral \
  --admin-user <관리자ID> \
  --admin-password "<비밀번호>" \
  --sku-name Standard_B1ms --tier Burstable --version 16 --storage-size 32 \
  --public-access 0.0.0.0

# 3) 내 PC 접속용 방화벽 규칙 (아래 "IP 확인" 주의사항 참고)
az postgres flexible-server firewall-rule create \
  --resource-group rg-<프로젝트명> --server-name <서버명> \
  --name AllowMyPC --start-ip-address <내IP> --end-ip-address <내IP>

# 4) 데이터베이스 생성
az postgres flexible-server db create \
  --resource-group rg-<프로젝트명> --server-name <서버명> --name <DB명>

# 5) Storage 계정 (파일/이미지 이관이 필요한 경우)
az storage account create --name <스토리지계정명-소문자숫자만> \
  --resource-group rg-<프로젝트명> --location koreacentral --sku Standard_LRS

# Supabase Storage 버킷이 public이었다면 컨테이너도 public으로 맞출 것.
# 계정 자체의 공개 접근이 기본적으로 막혀있을 수 있어 계정 레벨에서 먼저 허용해야 함:
az storage account update --name <스토리지계정명> --resource-group rg-<프로젝트명> \
  --allow-blob-public-access true

KEY=$(az storage account keys list --account-name <스토리지계정명> \
  --resource-group rg-<프로젝트명> --query "[0].value" -o tsv)
az storage container create --account-name <스토리지계정명> --account-key "$KEY" \
  --name <컨테이너명> --public-access blob
```

### ⚠️ CLI 옵션명 주의 (실제로 틀렸던 부분)

- `firewall-rule create`는 `--server-name`(서버 지정)과 `--name`(규칙 이름)이 **별개 옵션**. `--name`에 서버명을 넣으면 "the following arguments are required: --server-name" 에러
- `db create`는 `--database-name`이 아니라 **`--name`**

### ⚠️ 공인 IP는 반드시 cmd에서 확인 (브라우저 X)

```cmd
curl ifconfig.me
```

브라우저로 "my ip" 검색하면 브라우저 확장/프록시 설정 때문에 **실제와 다른 IP**가 나올 수 있음 (VPN 확장 프로그램 등). pgAdmin 같은 데스크톱 앱은 시스템 네트워크 경로를 타므로, **cmd에서 확인한 IP가 진짜**임.

### ⚠️ Git Bash(Windows)에서 `az` 명령이 `MissingSubscription` 에러를 내면

`az role assignment create` 등 `--scope /subscriptions/...`처럼 **슬래시로 시작하는 경로형 인자**를 쓰는 명령에서, Git Bash가 이걸 자기 나름대로 Windows 경로로 변환해버려서 값이 깨지는 경우가 있음 (`MissingSubscription` 에러가 뜨는데 스코프 문자열 자체는 멀쩡해 보이는 게 특징). 명령 앞에 `MSYS_NO_PATHCONV=1`을 붙이면 해결됨:

```bash
MSYS_NO_PATHCONV=1 az role assignment create --assignee <appId> --role "Website Contributor" \
  --scope "/subscriptions/<구독ID>/resourceGroups/<RG명>"
```

### (App Service 경로인 경우) App Service Plan + Web App 생성

```bash
az appservice plan create --name plan-<프로젝트명> --resource-group rg-<프로젝트명> \
  --location koreacentral --sku B1 --is-linux

az webapp create --resource-group rg-<프로젝트명> --plan plan-<프로젝트명> \
  --name <앱명-고유해야함> --runtime "NODE:22-lts"
```

⚠️ **Node 런타임 버전은 먼저 확인할 것** — `NODE:20-lts`처럼 오래된 버전은 Azure에서 이미 지원 종료되어 `Linux Runtime 'NODE|20-lts' is not supported` 에러가 남. 실행 전에 유효한 값을 확인:

```bash
az webapp list-runtimes --os-type linux | grep -i node
```

---

## 4단계. 데이터 이관

💡 참고 스킬: 실제 저장소를 확인한 결과, 이 단계(DB 데이터 이관)에 정확히 맞는 microsoft/azure-skills 항목은 없었다. (`azure-postgres`는 존재하지 않고, `azure-cloud-migrate`는 이름과 달리 AWS Lambda→Functions처럼 **타 클라우드 컴퓨트 워크로드 이관** 전용이라 이 단계엔 해당 없음.)

두 가지 방법이 있다. **GUI가 명령어 실수 없이 안전**하지만, **CLI는 완전 자동화(스크립트화)가 가능**하다 — Claude Code에게 시킬 거면 CLI 쪽이 훨씬 낫다.

### 4-1. Supabase 연결 정보 확인

Supabase 대시보드 → 우측 상단 **Connect** 버튼 → **Session pooler** 탭

### ⚠️ 반드시 "Session pooler" 사용 (Direct connection 아님)

> **Direct connection은 기본적으로 IPv6 전용**이라 일반 가정/사무실 네트워크(IPv4)에서 접속 자체가 안 될 수 있음. **Session pooler**를 선택할 것 — "Only recommended as an alternative to direct connection when connecting via an IPv4 network"라고 Supabase 화면에 직접 안내되어 있음.

Session pooler 연결 정보 형태:
```
postgresql://postgres.<project-ref>:[PASSWORD]@aws-x-xxxx.pooler.supabase.com:5432/postgres
```
- Username은 `postgres.<project-ref>` 전체를 그대로 사용 (project-ref 부분 생략하면 인증 실패)
- DB 비밀번호를 모르면 같은 화면의 **"Reset database password"**로 재발급 (REST API 키와는 별개 값)
- ⚠️ **pooler 호스트의 `aws-x` 부분(리전 세대)이 예상과 다를 수 있음** — `aws-0-<region>`으로 시도했는데 "tenant/user ... not found" 에러가 나면 `aws-1-<region>`도 시도해볼 것 (Supabase가 내부적으로 pooler 인프라 세대를 리전별로 다르게 운영함)

### 4-2. (GUI) pgAdmin으로 백업/복원

1. Servers 우클릭 → Register → Server. Connection 탭에 위 정보 입력 (Host/Port/Database/Username/Password)
2. 각 테이블 우클릭 → **Backup...** → Format: `Custom` → 파일 경로 지정 → Backup 클릭
3. Azure 서버 트리에서 대상 DB 우클릭 → **Restore...** → 백업 파일 선택 → Restore 클릭

### 4-3. (CLI, 자동화 가능) pg_dump / pg_restore 직접 사용

pgAdmin을 설치하면 `pg_dump`/`pg_restore`/`psql` 실행 파일이 **pgAdmin 설치 폴더 안에 함께 번들되어 있어서**, 별도 설치 없이 CLI로 완전 자동화할 수 있다. Windows 기준 경로 예:
```
%LOCALAPPDATA%\Programs\pgAdmin 4\runtime\pg_dump.exe
%LOCALAPPDATA%\Programs\pgAdmin 4\runtime\pg_restore.exe
```

```bash
# Supabase → 로컬 덤프 파일 (데이터만, 테이블 목록은 실제 존재하는 테이블로 -t 반복)
pg_dump "host=aws-1-<region>.pooler.supabase.com port=5432 dbname=postgres user=postgres.<project-ref> sslmode=require" \
  --data-only --format=custom \
  -t public.<table1> -t public.<table2> ... \
  -f migration.dump

# 로컬 덤프 파일 → Azure DB
pg_restore -h <서버명>.postgres.database.azure.com -p 5432 -U <관리자ID> -d <DB명> \
  --data-only --no-owner --no-privileges \
  migration.dump
```

⚠️ **`--disable-triggers` 옵션은 쓰지 말 것(또는 에러 무시할 것)** — Azure의 관리자 계정은 진짜 superuser가 아니라서, FK 제약 트리거를 껐다 켰다 하는 이 옵션이 `permission denied: "RI_ConstraintTrigger_..." is a system trigger` 에러를 냄. 다만 이건 **트리거 on/off 시도만 실패하는 것**이고, 테이블을 올바른 의존성 순서(부모→자식)로 덤프했다면 실제 데이터 INSERT는 정상적으로 전부 성공한다 — `pg_restore` exit code가 1이어도 당황하지 말고 아래처럼 행 수를 직접 세어 확인할 것.

### ⚠️ 복원 시 아래 에러들은 정상 — 무시해도 됨

```
ERROR: role "postgres" does not exist       (OWNER TO 구문)
ERROR: role "authenticated" does not exist  (CREATE POLICY 구문 — RLS 정책)
ERROR: role "anon" does not exist           (GRANT 구문)
ERROR: extension "pgcrypto" is not allow-listed for users in Azure Database for PostgreSQL
ERROR: permission denied: "RI_ConstraintTrigger_..." is a system trigger
```

Supabase 전용 역할(RLS 정책, 소유권, 익명/인증 사용자 권한)이 Azure엔 없어서 나는 에러들. `pgcrypto` 관련 에러도 무시 가능 — PostgreSQL 13+ 부터는 `gen_random_uuid()`가 core에 내장돼 있어서 확장 없이도 잘 동작함. **테이블 구조와 실제 데이터는 정상적으로 복원됨** (로그에서 `creating TABLE`, `processing data for table`, `creating CONSTRAINT` 줄이 에러 없이 지나갔는지로 확인). `pg_restore: utility failed with exit code: 1`이 떠도 **exit code만으로 실패로 판단하지 말고 반드시 실제 데이터를 조회해서 확인**할 것:

```sql
SELECT count(*) FROM <테이블명>;
```

### 4-4. RLS 비활성화 (안전장치)

복원 과정에서 RLS는 켜지는데 정책(POLICY)은 못 만들어져서, 소유자 외 접근이 막힐 수 있음. 이관한 테이블마다 실행:

```sql
ALTER TABLE <테이블명> DISABLE ROW LEVEL SECURITY;
```

---

## 5단계-A. Azure Functions 배포 (1단계에서 Functions를 선택한 경우)

```bash
# Storage 계정 (Function App 필수 의존성 — 앱 데이터 저장용이 아니라 Functions 자체 운영에 필요)
az storage account create --name <스토리지계정명-소문자숫자만> --resource-group rg-<프로젝트명> --location koreacentral --sku Standard_LRS

# Function App 생성 (Python, Consumption plan = 사용한 만큼만 과금)
az functionapp create \
  --resource-group rg-<프로젝트명> \
  --consumption-plan-location koreacentral \
  --runtime python --runtime-version 3.11 --functions-version 4 \
  --name <함수앱명-고유해야함> --storage-account <스토리지계정명> --os-type Linux

# DB 연결 문자열을 환경변수로 (코드에 하드코딩 금지)
az functionapp config appsettings set \
  --resource-group rg-<프로젝트명> --name <함수앱명> \
  --settings PG_CONN="postgresql://<user>:<pw>@<서버명>.postgres.database.azure.com:5432/<DB명>"
```

### 코드 구조 (Python v2 프로그래밍 모델)

- `function_app.py` — 엔트리포인트, Blueprint 등록
- 리소스별로 파일 분리 (예: `blog_lists_api.py`, `keyword_corrections_api.py`)
- `db.py` — `psycopg2` 연결 헬퍼, `os.environ['PG_CONN']`으로 환경변수 읽기
- `host.json`, `requirements.txt` (`azure-functions`, `psycopg2-binary`)
- `authLevel: FUNCTION` — Function Key 인증
- **컬럼 타입에 맞춰 코드 작성**: Postgres 배열(`text[]`) 컬럼에 값을 넣을 땐 `json.dumps()`로 문자열화하지 말고 **Python list를 그대로 psycopg2에 전달** (자동 변환됨). jsonb 컬럼이면 반대로 `json.dumps()` 필요 — 0단계에서 확인한 실제 컬럼 타입에 맞출 것

### 배포

```bash
cd <azure_functions 폴더>
func azure functionapp publish <함수앱명> --python
```

### ⚠️ 자주 나는 에러

- `Can't determine project language from files` → `local.settings.json`이 없어서 발생. `--python` 옵션을 명시적으로 붙이면 해결 (로컬 설정 파일 없이도 배포 가능)
- 로컬 Python 버전이 Function App 버전(예: 3.11)과 달라도 무관 — **원격 빌드(Remote build)**를 쓰기 때문에 실제 패키지 설치는 Azure 서버에서 이루어짐

### 배포 후 테스트

```bash
az functionapp keys list --resource-group rg-<프로젝트명> --name <함수앱명>
# functionKeys.default 값을 사용

curl -H "x-functions-key: <키>" https://<함수앱명>.azurewebsites.net/api/<엔드포인트>
```

---

## 5단계-B. App Service 배포 (1단계에서 App Service를 선택한 경우)

기존 앱(Next.js 등)을 화면 + API Route 통째로 App Service에 올리고, GitHub Actions로 자동 배포한다. **이 경로에서 실제로 시행착오가 가장 많았던 구간이니 순서대로 확인할 것.**

### 5-B-1. 앱 코드에서 Supabase 클라이언트 부분만 교체

- DB: Supabase JS SDK(`supabase.from(...)`) → Postgres 드라이버(예: Node면 `pg`)로 직접 연결하는 헬퍼 모듈 하나 신설
- Storage: Supabase Storage SDK → 해당 언어의 Azure Blob SDK(예: Node면 `@azure/storage-blob`)로 교체
- 브라우저에서 Supabase를 직접 호출하던 코드(클라이언트 컴포넌트 등)는 **DB 자격증명을 브라우저에 노출할 수 없으므로**, 자체 서버(API Route)를 거치도록 구조를 바꿔야 함 — 이미 API Route가 있다면 거기서 DB 드라이버를 쓰고, 클라이언트 코드는 그 API Route를 `fetch`하도록 변경

### 5-B-2. GitHub Actions 워크플로우

```yaml
name: Deploy to Azure App Service

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  id-token: write
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
        env:
          # 클라이언트에 노출되는(NEXT_PUBLIC_ 등) 환경변수는 반드시 여기서 명시 전달
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
      - name: Azure Login (OIDC)
        uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
      - name: Deploy to Azure App Service
        uses: azure/webapps-deploy@v3
        with:
          app-name: <앱명>
          package: .
```

⚠️ **빌드 단계에 클라이언트 노출용 환경변수를 반드시 넘길 것.** Vercel은 프로젝트 설정에 등록해둔 값을 빌드 시점에 자동으로 주입해주지만, GitHub Actions는 그런 게 없다. 이걸 빠뜨리면 (Next.js 기준) 정적 페이지를 프리렌더링하는 중에 `supabaseUrl is required` 같은 에러로 **빌드 자체가 실패**한다 — 배포가 아니라 빌드 단계에서 죽는 거라 원인 파악이 헷갈릴 수 있음. 로컬에서 같은 문제를 재현하려면 `git archive HEAD | tar -x`로 정확히 git에 커밋된 파일만 클린 체크아웃한 뒤 그 안에서 빌드해볼 것 (로컬에만 있는 미추적 폴더가 원인이 아님을 확인하는 목적도 겸함).

⚠️ **`main` push = 즉시 프로덕션 배포라는 점을 감안할 것.** 이 워크플로우는 `main` 브랜치에 push되는 순간 자동으로 실제 서비스에 배포된다. 만약 프로젝트의 `CLAUDE.md` 등에 "구현 완료 시 자동으로 커밋·푸시"라는 규칙이 있다면, 이 둘이 합쳐져서 **작은 수정 하나도 검증 없이 곧바로 운영 환경에 올라갈 수 있다.** 검증 안 된 변경을 자동 커밋·푸시하는 규칙과 이 배포 워크플로우를 같이 쓰는 프로젝트라면, 별도 브랜치에서 작업 후 머지하는 방식을 고려할 것.

### 5-B-3. 배포 인증 — OIDC를 권장, Publish Profile은 피할 것

💡 참고 스킬: `entra-app-registration` (출처: microsoft/azure-skills) — App Registration/OAuth 2.0/서비스 프린시펄 생성을 다루는 실제 스킬로 확인됨 (`azure-rbac`이라는 이름은 존재하지 않았음 — 정정).

**Publish Profile 방식(비권장)**: Azure Portal에서 XML 파일을 받아 GitHub Secret에 통째로 붙여넣는 방식. **이번 프로젝트에서 이 XML을 GitHub Secret에 복사-붙여넣기하는 과정이 두 번 연속 실패**했다 — 매번 다른 에러가 났다(`Publish profile does not contain kudu URL` → 재시도 후 `Publish profile is invalid for app-name and slot-name provided`). 원인을 특정하지 못했지만(브라우저 텍스트박스의 줄바꿈 처리 등으로 추정) **재현성이 낮고 디버깅이 어려워서 그냥 이 방식 자체를 포기**하고 아래 OIDC로 전환했다.

**OIDC 방식(권장)**: 복사-붙여넣을 비밀값 자체가 없어서 이 문제가 원천적으로 발생하지 않는다.

```bash
# 1) App Registration 생성
az ad app create --display-name "<프로젝트명>-github-deploy"
# → appId 기록

# 2) Service Principal 생성
az ad sp create --id <appId>

# 3) Federated Credential — 이 GitHub 저장소의 main 브랜치 push만 신뢰하도록 스코프 지정
cat > fed-cred.json << 'EOF'
{
  "name": "github-<프로젝트명>-main",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:<계정>/<저장소>:ref:refs/heads/main",
  "audiences": ["api://AzureADTokenExchange"]
}
EOF
az ad app federated-credential create --id <appId> --parameters fed-cred.json

# 4) 역할 부여 (Git Bash면 MSYS_NO_PATHCONV=1 붙일 것 — 위 3단계 참고)
MSYS_NO_PATHCONV=1 az role assignment create \
  --assignee <appId> --role "Website Contributor" \
  --scope "/subscriptions/<구독ID>/resourceGroups/rg-<프로젝트명>"
```

이렇게 만든 `appId`, 테넌트 ID(`az account show`), 구독 ID(`az account show`) 3개를 각각 GitHub Secret `AZURE_CLIENT_ID` / `AZURE_TENANT_ID` / `AZURE_SUBSCRIPTION_ID`로 등록한다. **이 3개는 GUID일 뿐 비밀번호가 아니라서(OIDC는 토큰 교환 방식이라 장기 자격증명이 아예 안 만들어짐) 값 자체가 짧고 복사-붙여넣기 실수가 날 여지가 거의 없다.**

### 5-B-4. Startup Command를 반드시 지정할 것

```bash
az webapp config set --resource-group rg-<프로젝트명> --name <앱명> --startup-file "npm start"
```

이걸 빠뜨리면 **GitHub Actions는 "성공"이라고 뜨고 배포 자체도 실제로 완료되는데, 정작 사이트에 접속하면 `Cannot GET /어쩌고` 같은 에러만 뜬다.** App Service가 어떤 명령으로 앱을 실행해야 할지 몰라서 아무것도 안 띄운 상태이기 때문. Node 앱이면 `package.json`의 `start` 스크립트가 실제 실행 명령과 일치하는지(`next start` 등) 같이 확인할 것.

### 5-B-5. 환경변수(App Settings) 설정 — 셸 스크립트로 넣을 때 따옴표 조심

```bash
# ⚠️ 이렇게 하면 위험함 — 값에 공백/특수문자가 있으면 따옴표가 값 안에 그대로 섞여 들어갈 수 있음
az webapp config appsettings set --settings KEY="$VALUE"
```

실제로 겪은 문제: 여러 값을 한 번에 넣으려고 `KEY=\"value\"` 형태의 문자열을 조립해서 넘겼더니, **그 따옴표 문자가 실제 저장된 값의 일부로 들어가버려서** DB 연결 문자열이 깨졌다. 겉보기엔 값이 있어 보이는데 앱은 `Error: getaddrinfo ENOTFOUND base` 같은 뜬금없는 호스트 이름을 못 찾는 에러를 냄 (URL 파서가 앞뒤에 낀 따옴표 때문에 스킴/호스트를 엉뚱하게 잘라낸 것으로 추정). **가장 안전한 방법은 JSON 파일로 만들어서 통째로 넘기는 것:**

```bash
cat > appsettings.json << 'EOF'
[
  { "name": "AZURE_PG_CONNECTION_STRING", "value": "postgresql://user:pw@host:5432/db?sslmode=require" },
  { "name": "AZURE_STORAGE_CONNECTION_STRING", "value": "DefaultEndpointsProtocol=https;..." }
]
EOF
az webapp config appsettings set --resource-group rg-<프로젝트명> --name <앱명> --settings @appsettings.json
```

설정 후에는 반드시 **JSON 형식으로 다시 조회해서 값의 앞/뒤 몇 글자를 직접 확인**할 것 (TSV로 조회하면 CLI 자체 출력 포맷 때문에 끝에 개행이 붙어 보여서 헷갈릴 수 있음 — JSON 조회가 더 정확함):

```bash
az webapp config appsettings list --resource-group rg-<프로젝트명> --name <앱명> -o json
```

### 5-B-6. 이중 빌드 방지

App Service의 `SCM_DO_BUILD_DURING_DEPLOYMENT` 설정이 켜져 있으면, GitHub Actions에서 이미 빌드를 끝낸 결과물을 올려도 **서버(Kudu)에서 또 한 번 자체적으로 빌드/최적화(특히 `node_modules` 압축)를 시도**해서 배포가 불필요하게 오래 걸린다(무거운 네이티브 패키지가 있으면 수 분 단위). 이미 빌드된 걸 올리는 방식이면 꺼둘 것:

```bash
az webapp config appsettings set --resource-group rg-<프로젝트명> --name <앱명> \
  --settings SCM_DO_BUILD_DURING_DEPLOYMENT=false
```

### 5-B-7. Always On 켜기 (콜드 스타트 방지)

기본값이 꺼져 있어서, **약 20분 동안 요청이 없으면 워커 프로세스가 내려간다.** 그 상태에서 며칠 뒤 다시 접속하면, 처음부터 새로 기동하느라(특히 무거운 프레임워크 앱은) 최대 1~2분 가까이 첫 응답이 걸릴 수 있다. Basic 등급 이상은 어차피 상시 과금이라 **켜도 추가 비용이 들지 않으므로 기본으로 켜둘 것**:

```bash
az webapp config set --resource-group rg-<프로젝트명> --name <앱명> --always-on true
```

---

## 6단계. 앱 코드에 백엔드 스위치 적용 (롤백 안전장치)

기존 코드 구조를 유지하면서, **설정값 하나**로 Supabase ↔ Azure를 전환할 수 있게 만든다. 언어/프레임워크에 따라 두 가지 변형이 있다.

### 변형 A — 별도 설정 파일 (Python/데스크톱 앱 등)

- 기존 함수 시그니처(`get_all()`, `save()`, `delete()` 등)는 그대로 유지 → **호출부(UI 코드 등) 수정 불필요**
- 함수 내부에서 `config`의 `backend` 값(`"supabase"` | `"azure"`)에 따라 분기
- 민감 정보(연결 문자열, Function Key)는 `.gitignore` 처리된 설정 파일에만 저장, 코드에 하드코딩 금지

```json
{
  "backend": "supabase",
  "azure": {
    "function_base_url": "https://<함수앱명>.azurewebsites.net/api",
    "function_key": "<Function Key>"
  }
}
```

### 변형 B — 환경변수 스위치 (Next.js 등 웹 프레임워크)

배포 플랫폼(App Service Application Settings / Vercel Environment Variables)에 값을 넣는 구조라, 별도 설정 파일보다 **환경변수 하나**로 스위치하는 게 더 자연스럽다.

```ts
// src/lib/backend.ts
export const BACKEND = (process.env.NEXT_PUBLIC_BACKEND === 'supabase' ? 'supabase' : 'azure') as
  | 'azure' | 'supabase'
```

각 데이터 접근 함수 파일 안에 **Supabase 버전과 Azure 버전을 함수명만 다르게 해서 나란히 두고**(예: `getCompaniesSupabase()` / `getCompaniesAzure()`), 실제로 export하는 함수는 `BACKEND` 값에 따라 둘 중 하나를 호출하도록 얇게 감싼다:

```ts
export const getCompanies = () => BACKEND === 'supabase' ? getCompaniesSupabase() : getCompaniesAzure()
```

이렇게 하면 **기존 Supabase 코드를 지우지 않고 그대로 보존**하면서(코드 리뷰 시 "롤백 코드가 죽은 코드처럼 보이지 않을까" 걱정할 필요 없이, 실제로 `NEXT_PUBLIC_BACKEND=supabase`로 바꾸면 즉시 동작함), 새 Azure 코드를 추가하는 형태가 된다. Realtime처럼 Azure에 1:1 대응 서비스가 없는 기능(폴링으로 대체 등)도 같은 패턴으로 분기하면 됨.

### ⚠️ 패키징된 앱(EXE 등)이라면 — "즉시 전환"이 사실이 아닐 수 있음

PyInstaller 같은 도구로 실행 파일을 빌드하는 프로젝트라면, 설정 파일이 **빌드 시점에 실행 파일 안에 통째로 포함**되는 구조인지 먼저 확인할 것 (`.spec` 파일의 `datas` 항목 확인). 만약 그렇다면:
- `python main.py`(개발 모드 직접 실행): 설정 파일 수정 즉시 반영됨
- 배포된 실행 파일: 설정 파일을 수정해도 반영 안 됨 → **재빌드해야 전환됨**

웹 앱(App Service/Vercel)은 이 문제가 없음 — 환경변수 값을 바꾸고 재시작(또는 재배포)하면 바로 반영됨.

"설정 값만 바꾸면 즉시 롤백"이라고 사용자에게 안내하기 전에 이 부분을 먼저 확인해서 정확히 전달할 것.

### (선택) 이중 쓰기(Dual-write) — 전환 과도기 안전장치

Azure로 전환했다가 다시 Supabase로 되돌릴 가능성이 있다면, 저장/삭제 시 **두 백엔드에 동시에 기록**하도록 만들어두면 어느 쪽으로 전환해도 데이터 유실이 없다.

```python
def save(...):
    if backend == 'azure':
        _save_azure(...)
        if dual_write:
            try_secondary(_save_supabase, ...)  # 실패해도 예외 전파 안 함, 로그만
    else:
        _save_supabase(...)
        if dual_write:
            try_secondary(_save_azure, ...)
```

조회는 여전히 `backend` 쪽 하나에서만 (양쪽 다 읽으면 복잡도만 커짐).

---

## 7단계. 검증

- [ ] Azure DB의 행 수가 Supabase와 일치하는지 확인 (`SELECT count(*)` 비교)
- [ ] curl로 각 API 엔드포인트(Function 또는 App Service API Route) 직접 호출해서 정상 응답 확인
- [ ] 실제 앱에서 `backend: azure`(또는 `NEXT_PUBLIC_BACKEND=azure`)로 전체 흐름(생성/조회/수정/삭제) 테스트
- [ ] `backend: supabase`로 롤백 시 정상 동작 확인 (패키징 앱이면 재빌드 후 확인)
- [ ] 이미지/파일 URL이 새 Storage(Blob)를 정상적으로 가리키는지, 실제로 열리는지 확인
- [ ] Azure Portal → Function App/App Service → **Monitor/Log stream**에서 실제 호출이 찍히는지 확인 (문제 생겼을 때 원인 파악용)
- [ ] git 커밋 시 설정 파일/환경변수(비밀번호/키 포함)가 `.gitignore`에 걸려 있는지 재확인
- [ ] **(App Service 경로) Always On이 켜져 있는지 확인** — 배포 직후엔 정상 응답이 빨라서 놓치기 쉬운데, 며칠 방치했다가 재접속했을 때도 빠르게 뜨는지까지 확인해야 진짜 검증됨

💡 참고 스킬: `azure-reliability`, `azure-cost` (출처: microsoft/azure-skills) — 실제 SKILL.md 확인 완료. `azure-reliability`는 배포된 리소스의 안정성(zone redundancy, health probe, 다중 리전 장애조치) 진단, `azure-cost`는 비용 조회·예측·최적화. (`azure-observability`, `azure-cost-optimization`이라는 이름은 존재하지 않았음 — 정정.)

---

## 부록: Azure Claude 스킬 전체 카탈로그

> **Azure로 앞으로도 계속 작업할 예정이라, 이번 프로젝트에 당장 안 쓰는 것까지 포함해 `microsoft/azure-skills`의 28개 스킬 전체를 여기 정리해둔다.** 전부 실제 저장소를 clone해서 각 SKILL.md 원문을 직접 읽고 확인했다 (마켓플레이스 등록까지 실제 테스트 완료: `claude plugin marketplace add microsoft/azure-skills`). "이 문서 관련 단계" 컬럼이 있는 것만 지금 당장 관련 있고, 나머지는 향후 다른 성격의 프로젝트(AI, Kubernetes, 메시징, 엔터프라이즈 인프라 등)에서 참고. `supabase`/`vercel-labs` 계열은 이름과 출처만 확인했고 내용은 미검증이니 도입 전 직접 확인할 것. 범용 개발 워크플로우 스킬은 문서 맨 위 섹션 참고.

### 컴퓨트/배포 오케스트레이션

| 스킬 | 설명 (SKILL.md 원문 기반) | 이 문서 관련 단계 |
|---|---|---|
| `azure-app-onboard` | 아이디어나 기존 앱 → Azure 배포까지 엔드투엔드 오케스트레이터. 앱 분석, 서비스 자동 감지, 인프라 스캐폴딩, 비용 추정+배포 전 승인까지 | 0단계 |
| `azure-app-onboard-prereq` | 배포 전 소스코드 준비도 평가(빌드 상태/의존성/스택 호환성) | 0단계 |
| `azure-prepare` | azd 기반 프로젝트 준비 — azure.yaml, Bicep/Terraform, Dockerfile 생성 (azd 워크플로 전용) | (해당 없음 — 이 프로젝트는 azd 안 씀) |
| `azure-deploy` | 이미 준비된 앱(.azure/deployment-plan.md 존재)의 실제 배포 실행 — azd up, terraform apply 등 | (해당 없음 — azd 워크플로 전용) |
| `azure-validate` | 배포 전 사전 검증 — 설정, IaC(Bicep/Terraform), RBAC 역할, 관리 ID 권한 | (해당 없음 — azd 워크플로 전용) |
| `python-appservice-deploy` | Python(Flask/Django/FastAPI) 코드를 App Service Linux에 배포 | (참고용 — 이 프로젝트는 Node) |
| `azure-cloud-migrate` | 타 클라우드→Azure **컴퓨트** 워크로드 이관(Lambda→Functions, Heroku→App Service 등) | (해당 없음 — DB 이관과 무관) |
| `azure-upgrade` | Azure 워크로드 플랜/SKU 업그레이드, Azure SDK 현대화 | 유지보수 시 참고 |

### 컴퓨트 리소스

| 스킬 | 설명 | 이 문서 관련 단계 |
|---|---|---|
| `azure-compute` | VM/VMSS 생성, 사이징 추천, 가격 비교, 용량 예약(CRG) | 해당 없음 (App Service만 씀) |
| `azure-kubernetes` | AKS 클러스터 계획/생성/설정 — SKU 선택, 네트워킹, 보안, 오토스케일링 | 해당 없음 |
| `airunway-aks-setup` | AKS 위에 AI 모델 서빙(AI Runway) 설치·구성 | 해당 없음 |

### DB/스토리지

| 스킬 | 설명 | 이 문서 관련 단계 |
|---|---|---|
| `azure-storage` | Blob/File/Queue/Table Storage 가이드, 접근 티어(hot/cool/cold/archive) | 3단계(Storage 생성) |

### AI/데이터

| 스킬 | 설명 | 이 문서 관련 단계 |
|---|---|---|
| `azure-ai` | Azure AI Search, Speech, OpenAI, Document Intelligence(검색, STT/TTS, OCR) | 해당 없음 |
| `azure-aigateway` | API Management를 AI Gateway로 구성 — 시맨틱 캐싱, 토큰 제한, 콘텐츠 안전 | 해당 없음 |
| `microsoft-foundry` | Foundry 에이전트 배포/평가/파인튜닝(SFT/DPO/RFT), azd 기반 | 해당 없음 |
| `azure-kusto` | Kusto(Azure Data Explorer) KQL 쿼리 — 로그 분석, 시계열, IoT 텔레메트리 | 해당 없음 |

### 아이덴티티

| 스킬 | 설명 | 이 문서 관련 단계 |
|---|---|---|
| `entra-app-registration` | App Registration, OAuth 2.0, 서비스 프린시펄 생성 | 5단계-B (OIDC 배포 인증) |
| `entra-agent-id` | Entra Agent Identity Blueprint 프로비저닝, 에이전트 OAuth 토큰 교환 | 해당 없음 |

### 모니터링/진단

| 스킬 | 설명 | 이 문서 관련 단계 |
|---|---|---|
| `appinsights-instrumentation` | Application Insights로 웹앱 계측 — 텔레메트리 패턴, SDK 설정 | 해당 없음(도입 시 참고 가능) |
| `azure-diagnostics` | 프로덕션 이슈 디버깅 — App Service/Functions/AKS/VM/메시징 등 | 7단계 검증 시 참고 |
| `azure-reliability` | 배포된 리소스의 안정성 진단 — zone redundancy, health probe, 다중 리전 장애조치 | 7단계 |
| `azure-resource-visualizer` | 리소스 그룹을 Mermaid 아키텍처 다이어그램으로 시각화 | 해당 없음(문서화 시 참고 가능) |
| `azure-resource-lookup` | 구독/리소스 그룹 전체에서 리소스 조회, 태그 분석, 고아 리소스 탐지 | 해당 없음 |

### 거버넌스/비용/보안

| 스킬 | 설명 | 이 문서 관련 단계 |
|---|---|---|
| `azure-cost` | 비용 조회·예측·최적화 | 7단계 |
| `azure-quotas` | 구독 할당량/용량 확인, 리전 가용성 | 해당 없음 |
| `azure-compliance` | 컴플라이언스/보안 감사(azqr), Key Vault 만료 체크 | 해당 없음 |
| `azure-enterprise-infra-planner` | 엔터프라이즈급 인프라 설계 — 네트워킹, 아이덴티티, 보안, WAF 정렬, Bicep/Terraform 생성 | 해당 없음 (소규모 프로젝트라 과함) |
| `azure-messaging` | Event Hubs/Service Bus 문제 해결 — 연결 실패, 인증 에러, 메시지 처리 이슈 | 해당 없음 |

### 기타 (Azure 외 출처, 미검증)

| 스킬 | 출처 | 검증 상태 | 등장 단계 |
|---|---|---|---|
| `supabase` | supabase/agent-skills | 이름만 확인, 미검증 | 0단계 |
| `supabase-postgres-best-practices` | supabase/agent-skills | 이름만 확인, 미검증 | 0단계 |
| `deploy-to-vercel` | vercel-labs/agent-skills | 이름만 확인, 미검증 | 1단계 판단(App Service 대신 Vercel 유지를 고려할 때) |
| `vercel-react-best-practices` | vercel-labs/agent-skills | 이름만 확인, 미검증 | 롤백 시 Vercel 쪽 코드 참고 |

---

## 자주 겪은 문제 모음

| 증상 | 원인 | 해결 |
|---|---|---|
| `git push` 시 `Permission denied to <다른계정>` | Windows에 캐시된 GitHub 로그인이 저장소 소유 계정과 다름 | 자격 증명 관리자에서 `git:https://github.com` 항목 삭제 후 재로그인 시 올바른 계정 선택 |
| pgAdmin 접속 시 `password authentication failed` (여러 IP로 재시도 후 실패) | 비밀번호 오타 또는 예전 값 | Supabase 대시보드에서 "Reset database password"로 새로 발급받아 재시도 |
| pgAdmin에서 Session pooler 접속 안 됨 | Direct connection의 IPv6 문제와 혼동 | Session pooler는 IPv4 지원, 연결 문자열의 Username에 project-ref 포함 여부 재확인 |
| Session pooler 연결 시 `tenant/user ... not found` | pooler 인프라 세대(`aws-0-` vs `aws-1-`)가 리전마다 다름 | 둘 다 시도해볼 것 |
| `pg_restore` exit code 1인데 데이터는 있음 | Supabase 전용 역할 GRANT/POLICY/트리거 관련 구문 실패 (무해) | `SELECT count(*)`로 실제 데이터 존재 여부 직접 확인 |
| Function 배포 시 `Worker runtime cannot be 'None'` | `local.settings.json` 없음 | `func azure functionapp publish <이름> --python` 처럼 언어 명시 |
| 저장한 배열 데이터가 이상하게 들어감 | 컬럼이 실제로는 `text[]`인데 `jsonb`로 가정하고 `json.dumps()` 적용 | 실제 컬럼 타입(0단계의 OpenAPI 스펙 확인법 등) 확인 후 코드 수정 |
| `az webapp create` 시 `Linux Runtime 'NODE\|20-lts' is not supported` | 오래된 Node 버전은 지원 종료됨 | `az webapp list-runtimes --os-type linux`로 유효한 버전 확인 후 사용 |
| GitHub Actions 빌드가 40~50초 만에 실패 (exit code 1) | `NEXT_PUBLIC_*` 등 클라이언트 노출용 환경변수가 빌드 단계에 전달 안 됨 → 정적 페이지 프리렌더링 중 모듈 로드 실패 | Build step에 `env:`로 해당 Secret들 명시 전달 |
| Publish Profile을 GitHub Secret에 등록했는데 배포마다 다른 에러(kudu URL 없음 → invalid profile 등) | 복사-붙여넣기 과정에서 내용이 반복적으로 손상되는 것으로 추정, 원인 특정 실패 | OIDC(`azure/login` + Federated Credential) 방식으로 전환 — 비밀값 복사-붙여넣기 자체가 없어짐 |
| `az role assignment create` 시 `MissingSubscription` 에러 (Windows Git Bash) | Git Bash가 `/subscriptions/...` 경로형 인자를 Windows 경로로 자동 변환 | 명령 앞에 `MSYS_NO_PATHCONV=1` |
| 배포는 "성공"으로 뜨는데 사이트가 `Cannot GET /...` | App Service Startup Command 미설정 | `az webapp config set --startup-file "npm start"` |
| DB 연결 시 `Error: getaddrinfo ENOTFOUND base` 같은 정체불명의 호스트 에러 | 셸 스크립트로 App Settings 값을 조립할 때 따옴표가 실제 값 안에 문자로 껴서 저장됨 | JSON 파일(`@file.json`)로 App Settings 설정, 설정 후 JSON 조회로 값 앞/뒤 글자 재확인 |
| 로컬 `npm run build`는 실패하는데 원인이 프로젝트 코드가 아닌 것 같음 | 로컬에만 있는(git 미추적) 폴더/파일이 타입체크·빌드 스캔 범위에 걸림 | `git archive HEAD \| tar -x`로 커밋된 파일만 클린 체크아웃해서 재현·확인 |
| 배포 직후엔 멀쩡한데 며칠 뒤 재접속하면 사이트가 한참 있다 뜸 | App Service Always On이 꺼져있어 유휴 시 워커 프로세스가 내려감(콜드 스타트) | `az webapp config set --always-on true` (Basic 이상 요금제는 추가 비용 없음) |
| App Service 배포 후 첫 배포가 유난히 느림(수 분) | `SCM_DO_BUILD_DURING_DEPLOYMENT=true`로 인해 이미 빌드된 걸 서버에서 또 빌드/압축 | 이미 빌드본을 올리는 방식이면 `false`로 설정 |
