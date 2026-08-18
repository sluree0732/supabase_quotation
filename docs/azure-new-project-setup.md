# 새 프로젝트 환경 구축 가이드 — GitHub + Azure

> Supabase 이관이 아니라, **처음부터** GitHub + Azure로 새 프로젝트를 시작할 때 참고하는 문서.
> 기존 서비스 이관 작업은 [azure-migration-playbook.md](azure-migration-playbook.md) 참고.
> API 레이어를 Functions로 새로 만들지, App Service에 프레임워크 자체 API(Next.js 등)를 올릴지에 따라
> 4/6/7단계가 "-A"(Functions)와 "-B"(App Service) 두 갈래로 나뉜다. 0단계에서 먼저 정한다.

## 이 문서를 어떻게 쓰나

1. 이 파일을 새로 시작하는 프로젝트 폴더에 복사 (예: `docs/azure-new-project-setup.md`)
2. Claude Code에게 아래 요청 예시를 그대로(또는 상황에 맞게 수정해서) 전달
3. Claude Code가 먼저 해야 할 것: 아래 "0단계: 이 프로젝트가 정말 Azure 인프라가 필요한지 판단"부터 실행

### Claude Code에게 보낼 요청 예시 (복붙 가능)

```
이 프로젝트를 docs/azure-new-project-setup.md 참고해서 처음부터 GitHub + Azure로 구축하려고 해.

- 나는 Azure 사용 경험이 거의 없어서 각 단계를 상세하게 안내해줘
- 먼저 문서의 0단계 판단 기준대로, 이 프로젝트가 정말 Azure 인프라가 필요한지부터
  판단해서 알려줘 (프레임워크 구조, API 필요 여부, 예상 트래픽 등 기준으로)
- Azure가 필요하다고 판단되면, API 레이어를 Functions로 새로 만들지 App Service로
  갈지도 그 기준에 맞춰 판단해줘. 실제 리소스 생성은 그다음에 진행하자.
```

**이 요청이 `azure-migration-playbook.md`용 문구와 다른 이유**:
- "언제든 기존 서비스로 롤백 가능하도록" 문구가 없음 — 이관이 아니라 처음부터 새로 만드는 프로젝트라 롤백 대상 자체가 없음
- "코드 분석"이 아니라 "0단계 판단"이 먼저 → 분석할 기존 코드가 없으니, 이 프로젝트 성격상 Azure가 정말 필요한지부터 판단하는 게 우선

---

## 범용 개발 워크플로우 스킬 활용

> 스킬 내용은 계속 바뀔 수 있어서, 여기 미리 요약해두지 않는다. 대신 **아래 단계에 도달하면 그 시점에 `Skill` 도구로 실제 호출해서, 그때의 진짜 지침을 그대로 따를 것.** (이게 정확한 이유: 이름만 보고 요약한 설명은 시간이 지나면 틀린 정보가 될 수 있지만, 실행 시점의 직접 호출은 항상 최신 내용을 따른다.)

### 지금 이 환경에 이미 설치되어 있어 바로 호출 가능 (`obra/superpowers`, `anthropics/skills`)

| 이 단계에 도달하면 | 호출할 스킬 |
|---|---|
| 0단계 판단이 애매할 때(정말 Azure가 필요한지 등) | `Skill(brainstorming)` |
| 리소스 생성 계획을 문서화할 때 | `Skill(writing-plans)` |
| 6단계 API 코드를 새로 짤 때, 테스트부터 짜고 싶을 때 | `Skill(test-driven-development)` |
| 원인 불명 에러(예: `MissingSubscription`, `Cannot GET` 같은)를 만났을 때 | `Skill(systematic-debugging)` |
| 계획대로 여러 단계를 순서대로 실행할 때 | `Skill(executing-plans)` |
| 독립된 작업공간에서 새 기능을 시작할 때 | `Skill(using-git-worktrees)` |
| 서로 독립적인 작업(DB 세팅 + 배포 파이프라인 구성 등)을 병렬로 돌리고 싶을 때 | `Skill(dispatching-parallel-agents)` / `Skill(subagent-driven-development)` |
| 기능 브랜치 작업을 마무리(머지/PR)할 때 | `Skill(finishing-a-development-branch)` |
| "완료됐다"고 선언하기 전에 | `Skill(verification-before-completion)` |
| 코드 변경 후 리뷰를 요청/수행할 때 | `Skill(requesting-code-review)` / `Skill(receiving-code-review)` |
| 배포 후 실제 브라우저 동작을 테스트할 때 | `Skill(webapp-testing)` |
| 결과 보고서나 문서를 PDF/Word/Excel/PPT로 만들어야 할 때 | `Skill(pdf)` / `Skill(docx)` / `Skill(xlsx)` / `Skill(pptx)` |
| 화면 UI를 새로 디자인해야 할 때 | `Skill(frontend-design)` |

### 이 환경엔 설치돼 있지 않음 — 이름/출처만 확인, 실제 내용 미검증 (`mattpocock/skills` 등)

`improve-codebase-architecture`, `domain-modeling`, `to-prd`/`to-spec`/`to-tickets`, `research`, `tdd`, `code-review`, `resolving-merge-conflicts`, `git-guardrails-claude-code`, `diagnosing-bugs`, `handoff`, `triage`, `qa`, `write-a-skill`, `writing-great-skills` — 전부 `mattpocock/skills` 저장소. 필요하면 `npx skills find <이름>`으로 실제 설치·확인 후 사용할 것 (이 환경에서 검증 안 됨).

⚠️ **알아둘 사실 (판단은 그때그때 알아서 — 이건 절차가 아니라 사실 정보)**: 스킬 이름/설치 수는 `azure-rbac`/`azure-observability`/`azure-cost-optimization`/`azure-postgres`처럼 리더보드와 `npx skills find` 실시간 검색 양쪽 모두에서 실제 저장소엔 없는 이름이 나온 적이 있다(`azure-postgres`는 검색에 27.8K 설치로 떴지만 실제 URL은 404였음). 이 문서 목록에 없는 스킬을 쓰게 되면 이름만 믿지 말고 실제 파일을 열어서 확인할 것.

---

## 0단계. 이 프로젝트가 정말 Azure 인프라가 필요한지 먼저 판단

**모든 프로젝트를 무조건 Azure로 만들 필요는 없다.** 아래 기준으로 먼저 판단할 것:

| 프로젝트 성격 | 추천 |
|---|---|
| 백엔드/DB 없이 단순 정적 페이지 | GitHub Pages, Vercel, Azure Static Web Apps 중 아무거나 (Azure 고집 불필요) |
| 프론트엔드 + 가벼운 API/DB 필요, API를 처음부터 새로 설계 | Azure Static Web Apps + Azure Functions + Azure PostgreSQL |
| **Next.js 등 프레임워크 자체에 API Route가 내장된 구조로 시작** | **Azure App Service** 하나로 화면+API 통합 — Static Web Apps + Functions 조합은 관리 포인트가 두 개로 늘어나고, 특히 `sharp`/PDF 라이브러리 등 무거운 네이티브 npm 패키지를 쓸 예정이면 Static Web Apps의 서버리스 함수 제약(번들 크기, 실행시간 제한)에 걸릴 수 있음 |
| 안 쓸 때 비용을 0에 가깝게 만들고 싶은 저트래픽 프로젝트 | Azure SQL 서버리스 티어 검토 (자동 일시정지 지원, PostgreSQL Flexible Server엔 없는 기능) |
| 이미지/AI 임베딩 검색 등 확장 기능 필요 | PostgreSQL (pgvector 등 확장 생태계가 훨씬 풍부) |
| 여러 소규모 프로젝트를 동시에 운영 중 | PostgreSQL 서버 하나에 데이터베이스를 여러 개 만들어 프로젝트별로 나눠 쓰기 (Azure는 프로젝트당 과금 아님 — Supabase와의 핵심 차이) |

💡 참고 스킬: `deploy-to-vercel`, `vercel-react-best-practices` (출처: vercel-labs/agent-skills) — Azure 대신 Vercel 유지가 더 맞는지 판단할 때 참고 (미검증).

---

## 1단계. GitHub 설정

### 저장소 생성

```bash
gh repo create <계정명>/<프로젝트명> --private --source=. --push
```

### ⚠️ 계정 확인부터 (자주 겪는 실수)

Windows에 여러 GitHub 계정이 캐시되어 있으면 `git push`가 엉뚱한 계정으로 시도되어 `403 Permission denied`가 난다. 프로젝트 시작 전에 미리 확인:

```cmd
git config user.name
git config user.email
gh auth status
```

캐시가 꼬여있으면: **자격 증명 관리자**(Windows 시작 메뉴 검색) → Windows 자격 증명 탭 → `git:https://github.com` 항목 제거 → 다음 `git push` 시 브라우저에서 올바른 계정 선택.

### .gitignore 필수 항목

```gitignore
# 환경/시크릿
.env
config.json
*.local.json

# Azure Functions 로컬 시크릿
**/local.settings.json

# Python
__pycache__/
venv/
.venv/

# 빌드 산출물
dist/
build/
```

**절대 원칙**: DB 연결 문자열, API 키, Function Key 등은 코드에 하드코딩하지 말고 항상 gitignore된 설정 파일이나 환경변수로.

---

## 2단계. Azure 계정/구독 확인

💡 참고 스킬: `azure-app-onboard`, `azure-app-onboard-prereq` (출처: microsoft/azure-skills) — 이름상 신규 프로젝트 온보딩에 정확히 맞아 보임 (미검증).

```cmd
az login
az account show
```

- 구독이 여러 개면 이 프로젝트에 쓸 구독을 명확히 확인 (`az account set --subscription <ID>`)
- 신규 계정이면 크레딧 만료일 확인 (`az account show`의 결과 또는 Azure Portal 홈 화면 "비용" 카드)

### 로컬 도구 vs 브라우저 Cloud Shell

| | 로컬 CLI | Azure Cloud Shell |
|---|---|---|
| 설치 | `winget install Microsoft.AzureCLI` 필요 | 불필요 (portal.azure.com 우측 상단 `>_` 아이콘) |
| 로그인 | `az login` 별도 필요 | 이미 로그인된 브라우저 세션 재사용, 로그인 절차 없음 |
| 언제 유리한가 | 반복 작업이 많고 로컬 스크립트와 연계할 때 | 처음 한두 번 빠르게 리소스만 만들 때, 설치 자체를 피하고 싶을 때 |

둘 다 같은 `az` 명령어를 쓰므로 아래 명령어들은 어느 쪽에서 실행해도 동일하다.

### ⚠️ Windows Git Bash에서 `az` 명령이 `MissingSubscription` 에러를 내면

`--scope /subscriptions/...`처럼 **슬래시로 시작하는 경로형 인자**를 쓰는 명령(`az role assignment create` 등, App Service를 GitHub Actions OIDC로 배포할 때 특히 자주 씀)에서, Git Bash가 이걸 자기 나름대로 Windows 경로로 변환해버려서 값이 깨지는 경우가 있다. 스코프 문자열 자체는 멀쩡해 보이는데 계속 실패하면 이걸 의심할 것. 명령 앞에 `MSYS_NO_PATHCONV=1`을 붙이면 해결됨:

```bash
MSYS_NO_PATHCONV=1 az role assignment create --assignee <appId> --role "Website Contributor" \
  --scope "/subscriptions/<구독ID>/resourceGroups/<RG명>"
```

(cmd나 Azure Cloud Shell에서는 이 문제가 없다 — Git Bash 고유 이슈.)

---

## 3단계. 프로젝트별 리소스 네이밍 규칙

Azure 리소스 이름은 종류마다 규칙이 다르고 **전역에서 유일**해야 하는 것들이 많다:

| 리소스 | 이름 규칙 | 예시 |
|---|---|---|
| Resource Group | 프로젝트 내에서만 유일하면 됨 | `rg-<프로젝트명>` |
| PostgreSQL 서버 | 전역 유일, 소문자/숫자/하이픈 | `<프로젝트명>-pg-<임의숫자>` |
| Storage 계정 | 전역 유일, **소문자+숫자만 (하이픈 불가)**, 3~24자 | `<프로젝트명>storage<임의숫자>` |
| Function App | 전역 유일 (URL의 일부가 됨) | `<프로젝트명>-func-<임의숫자>` |
| **App Service (Web App)** | **전역 유일 (`<이름>.azurewebsites.net`의 일부가 됨)**, 소문자/숫자/하이픈 | `<프로젝트명>-web-<임의숫자>` |

이름 충돌 시 임의숫자 부분만 바꿔서 재시도하면 된다. 매번 새로 고민하지 말고 이 패턴을 그대로 재사용할 것.

---

## 4단계-A. 기본 리소스 생성 템플릿 (Functions 경로)

```bash
# Resource Group
az group create --name rg-<프로젝트명> --location koreacentral

# DB (PostgreSQL 기준 — Azure SQL 서버리스로 갈 경우 별도 명령 필요)
az postgres flexible-server create \
  --resource-group rg-<프로젝트명> --name <프로젝트명>-pg-<번호> \
  --location koreacentral --admin-user <admin> --admin-password "<비밀번호>" \
  --sku-name Standard_B1ms --tier Burstable --version 16 --storage-size 32 \
  --public-access 0.0.0.0

# 내 PC 방화벽 허용 (IP는 반드시 cmd에서 curl ifconfig.me로 확인 — 브라우저 X, VPN/프록시로 다르게 나올 수 있음)
az postgres flexible-server firewall-rule create \
  --resource-group rg-<프로젝트명> --server-name <서버명> \
  --name AllowMyPC --start-ip-address <내IP> --end-ip-address <내IP>

az postgres flexible-server db create \
  --resource-group rg-<프로젝트명> --server-name <서버명> --name <DB명>

# Function App용 Storage + Function App
az storage account create --name <프로젝트명>storage<번호> --resource-group rg-<프로젝트명> --location koreacentral --sku Standard_LRS

az functionapp create \
  --resource-group rg-<프로젝트명> --consumption-plan-location koreacentral \
  --runtime python --runtime-version 3.11 --functions-version 4 \
  --name <프로젝트명>-func-<번호> --storage-account <프로젝트명>storage<번호> --os-type Linux
```

---

## 4단계-B. 기본 리소스 생성 템플릿 (App Service 경로)

DB/방화벽 생성 명령은 4단계-A와 동일. App Service 부분만 다르다:

```bash
az appservice plan create --name plan-<프로젝트명> --resource-group rg-<프로젝트명> \
  --location koreacentral --sku B1 --is-linux

az webapp create --resource-group rg-<프로젝트명> --plan plan-<프로젝트명> \
  --name <프로젝트명>-web-<번호> --runtime "NODE:22-lts"
```

⚠️ **Node 런타임 버전은 먼저 확인할 것** — `NODE:20-lts`처럼 오래된 버전은 Azure에서 이미 지원 종료되어 `Linux Runtime 'NODE|20-lts' is not supported` 에러가 남. 실행 전에 유효한 값을 확인:

```bash
az webapp list-runtimes --os-type linux | grep -i node
```

파일/이미지 저장이 필요하면 Storage 계정도 추가 (컨테이너를 공개로 쓸 거면 계정 레벨 공개 접근도 별도로 허용해야 함):

```bash
az storage account create --name <프로젝트명>storage<번호> --resource-group rg-<프로젝트명> \
  --location koreacentral --sku Standard_LRS

az storage account update --name <프로젝트명>storage<번호> --resource-group rg-<프로젝트명> \
  --allow-blob-public-access true

KEY=$(az storage account keys list --account-name <프로젝트명>storage<번호> \
  --resource-group rg-<프로젝트명> --query "[0].value" -o tsv)
az storage container create --account-name <프로젝트명>storage<번호> --account-key "$KEY" \
  --name <컨테이너명> --public-access blob
```

---

## 5단계. 로컬 데이터 확인 도구

Azure Portal은 **PostgreSQL 테이블 데이터를 직접 조회하는 화면이 없다** (Azure SQL은 있지만 PostgreSQL Flexible Server는 없음). 프로젝트 시작 시 **pgAdmin**을 같이 설치해서 서버를 등록해둘 것:

```cmd
winget install PostgreSQL.pgAdmin
```

pgAdmin 서버 등록 시 "Name" 필드는 표시용 별명일 뿐 실제 접속과 무관 — 프로젝트 이름 등 알아보기 쉬운 걸로.

💡 pgAdmin을 설치하면 `pg_dump`/`pg_restore`/`psql` 실행 파일도 설치 폴더 안에 함께 번들되어 있다(`%LOCALAPPDATA%\Programs\pgAdmin 4\runtime\`). GUI를 안 열고도 CLI로 스크립트화해서 데이터 작업을 자동화할 수 있다.

---

## 6단계-A. API 인증 패턴 (Functions 경로, 매 프로젝트 재사용)

Azure Functions는 `authLevel: FUNCTION`으로 만들고, 클라이언트는 `x-functions-key` 헤더로 인증하는 패턴을 기본으로 쓴다:

```bash
az functionapp keys list --resource-group rg-<프로젝트명> --name <함수앱명>
```

`functionKeys.default` 값을 클라이언트 설정 파일에 저장하고 `x-functions-key` 헤더에 실어 호출.

DB 연결 문자열은 Function App의 App Settings(환경변수)에 저장:

```bash
az functionapp config appsettings set \
  --resource-group rg-<프로젝트명> --name <함수앱명> \
  --settings PG_CONN="postgresql://<user>:<pw>@<서버명>.postgres.database.azure.com:5432/<DB명>"
```

---

## 6단계-B. 서버 설정 패턴 (App Service 경로, 매 프로젝트 재사용)

App Service는 Function Key 같은 별도 인증 키 개념이 없다 — 대신 **앱이 실제로 뜨게 만드는 설정 몇 가지를 빠뜨리지 않는 게 핵심**이다.

### Startup Command 반드시 지정

```bash
az webapp config set --resource-group rg-<프로젝트명> --name <앱명> --startup-file "npm start"
```

이걸 빠뜨리면 **배포는 "성공"으로 뜨는데 정작 사이트는 `Cannot GET /...` 에러만 낸다** — App Service가 뭘 실행해야 할지 몰라서 아무것도 안 띄운 상태이기 때문. `package.json`의 `start` 스크립트가 실제 실행 명령(`next start` 등)과 일치하는지도 같이 확인.

### App Settings(환경변수)는 JSON 파일로 설정할 것

```bash
# ⚠️ 이렇게 셸에서 직접 조립하면 위험함 — 따옴표가 값 안에 그대로 섞여 들어갈 수 있음
az webapp config appsettings set --settings KEY="$VALUE"
```

값에 따옴표가 섞여 저장되면, DB 연결 문자열 같은 경우 `Error: getaddrinfo ENOTFOUND base`처럼 **원인을 짐작하기 어려운 에러**가 난다(URL 파서가 낀 따옴표 때문에 스킴/호스트를 엉뚱하게 잘라내는 것으로 추정). 대신 JSON 파일로 한 번에 넘길 것:

```bash
cat > appsettings.json << 'EOF'
[
  { "name": "PG_CONN", "value": "postgresql://user:pw@host:5432/db?sslmode=require" },
  { "name": "STORAGE_CONN", "value": "DefaultEndpointsProtocol=https;..." }
]
EOF
az webapp config appsettings set --resource-group rg-<프로젝트명> --name <앱명> --settings @appsettings.json
```

설정 후엔 **JSON으로 다시 조회해서 값의 앞/뒤 글자를 직접 확인**할 것 (TSV 조회는 CLI 자체 출력 포맷 때문에 끝에 개행이 붙어 보여서 헷갈릴 수 있음):

```bash
az webapp config appsettings list --resource-group rg-<프로젝트명> --name <앱명> -o json
```

### Always On 켜기

```bash
az webapp config set --resource-group rg-<프로젝트명> --name <앱명> --always-on true
```

기본값이 꺼져 있어서 20분 무요청 시 워커 프로세스가 내려가고, 재접속 시 콜드 스타트로 최대 1~2분 대기하게 된다. Basic 이상 요금제는 상시 과금이라 켜도 추가 비용이 들지 않으니 **처음부터 켜두는 걸 기본으로 할 것**.

### 이미 빌드된 걸 배포하는 거라면 이중 빌드 끄기

```bash
az webapp config appsettings set --resource-group rg-<프로젝트명> --name <앱명> \
  --settings SCM_DO_BUILD_DURING_DEPLOYMENT=false
```

CI에서 이미 빌드를 끝내고 결과물을 올리는 방식인데 이 설정이 켜져 있으면, App Service가 서버에서 또 한 번 자체 빌드/최적화를 시도해서 배포가 불필요하게 오래 걸린다(무거운 `node_modules`가 있으면 특히).

---

## 7단계-A. 배포 워크플로 (Functions 경로)

```bash
cd <functions 코드 폴더>
func azure functionapp publish <함수앱명> --python
```

`local.settings.json`이 없으면 `--python` 등 언어를 명시적으로 지정해야 에러가 안 난다.

---

## 7단계-B. 배포 워크플로 (App Service 경로 — GitHub Actions + OIDC)

App Service는 로컬에서 한 줄로 배포하기보다 **처음부터 GitHub Actions로 자동 배포 파이프라인을 만드는 걸 기본값으로 할 것**을 권장한다.

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
          NEXT_PUBLIC_SOMETHING: ${{ secrets.NEXT_PUBLIC_SOMETHING }}
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

⚠️ **빌드 단계에 클라이언트 노출용 환경변수를 반드시 넘길 것.** Vercel과 달리 GitHub Actions는 이런 값을 자동으로 안 넣어준다. 빠뜨리면 (Next.js 기준) 정적 페이지 프리렌더링 중 "supabaseUrl is required" 같은 에러로 **빌드 자체가 실패**한다.

⚠️ **`main` push = 즉시 프로덕션 배포라는 점을 감안할 것.** 이 워크플로우는 `main` 브랜치에 push되는 순간 자동으로 실제 서비스에 배포된다. 만약 프로젝트의 `CLAUDE.md` 등에 "구현 완료 시 자동으로 커밋·푸시"라는 규칙이 있다면, 이 둘이 합쳐져서 **작은 수정 하나도 검증 없이 곧바로 운영 환경에 올라갈 수 있다.** 검증 안 된 변경을 자동 커밋·푸시하는 규칙과 이 배포 워크플로우를 같이 쓰는 프로젝트라면, 별도 브랜치에서 작업 후 머지하는 방식을 고려할 것.

### 배포 인증은 Publish Profile 대신 OIDC로 처음부터 설정할 것

💡 참고 스킬: `entra-app-registration` (출처: microsoft/azure-skills) — App Registration/OAuth 2.0/서비스 프린시펄 생성을 다루는 실제 스킬로 확인됨 (`azure-rbac`이라는 이름은 존재하지 않았음 — 정정).

Publish Profile(Portal에서 XML 파일을 받아 GitHub Secret에 통째로 붙여넣는 방식)은 복사-붙여넣기 과정에서 내용이 손상되는 사례가 있었고, 그때마다 에러 메시지가 달라서 원인 파악이 어려웠다. **OIDC는 비밀값 자체를 복사-붙여넣을 필요가 없어서** 이 문제가 원천적으로 없다 — 새 프로젝트는 처음부터 이 방식으로 설정할 것:

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

# 4) 역할 부여 (Git Bash면 MSYS_NO_PATHCONV=1 붙일 것 — 2단계 참고)
MSYS_NO_PATHCONV=1 az role assignment create \
  --assignee <appId> --role "Website Contributor" \
  --scope "/subscriptions/<구독ID>/resourceGroups/rg-<프로젝트명>"
```

`appId` / 테넌트 ID(`az account show`) / 구독 ID(`az account show`) 3개를 GitHub Secret `AZURE_CLIENT_ID` / `AZURE_TENANT_ID` / `AZURE_SUBSCRIPTION_ID`로 등록. 이 3개는 GUID일 뿐 비밀번호가 아니라서 복사-붙여넣기 실수가 날 여지가 거의 없다.

---

## 부록: Azure Claude 스킬 전체 카탈로그

> **Azure로 앞으로도 계속 프로젝트를 진행할 예정이라, 이번 프로젝트에 당장 안 쓰는 것까지 포함해 `microsoft/azure-skills`의 28개 스킬 전체를 여기 정리해둔다.** 전부 실제 저장소를 clone해서 각 SKILL.md 원문을 직접 읽고 확인했다 (마켓플레이스 등록까지 실제 테스트 완료: `claude plugin marketplace add microsoft/azure-skills`). "이 문서 관련 단계" 컬럼이 있는 것만 지금 당장 관련 있고, 나머지는 향후 다른 성격의 프로젝트(AI, Kubernetes, 메시징, 엔터프라이즈 인프라 등)에서 참고. `vercel-labs` 계열은 이름과 출처만 확인했고 내용은 미검증이니 도입 전 직접 확인할 것. 범용 개발 워크플로우 스킬은 문서 맨 위 섹션 참고.

### 컴퓨트/배포 오케스트레이션

| 스킬 | 설명 (SKILL.md 원문 기반) | 이 문서 관련 단계 |
|---|---|---|
| `azure-app-onboard` | 아이디어나 기존 앱 → Azure 배포까지 엔드투엔드 오케스트레이터. 앱 분석, 서비스 자동 감지, 인프라 스캐폴딩, 비용 추정+배포 전 승인까지 | 2단계, 0단계 판단에도 참고 가능 |
| `azure-app-onboard-prereq` | 배포 전 소스코드 준비도 평가(빌드 상태/의존성/스택 호환성) | 2단계 |
| `azure-prepare` | azd 기반 프로젝트 준비 — azure.yaml, Bicep/Terraform, Dockerfile 생성 (azd 워크플로 전용) | 해당 없음 (azd 안 씀) |
| `azure-deploy` | 이미 준비된 앱(.azure/deployment-plan.md 존재)의 실제 배포 실행 — azd up, terraform apply 등 | 해당 없음 (azd 워크플로 전용) |
| `azure-validate` | 배포 전 사전 검증 — 설정, IaC(Bicep/Terraform), RBAC 역할, 관리 ID 권한 | 해당 없음 (azd 워크플로 전용) |
| `python-appservice-deploy` | Python(Flask/Django/FastAPI) 코드를 App Service Linux에 배포 | (참고용 — Node 경로와는 언어가 다름) |
| `azure-cloud-migrate` | 타 클라우드→Azure **컴퓨트** 워크로드 이관(Lambda→Functions, Heroku→App Service 등) | 해당 없음 (신규 구축이라 이관 대상 없음) |
| `azure-upgrade` | Azure 워크로드 플랜/SKU 업그레이드, Azure SDK 현대화 | 유지보수 시 참고 |

### 컴퓨트 리소스

| 스킬 | 설명 | 이 문서 관련 단계 |
|---|---|---|
| `azure-compute` | VM/VMSS 생성, 사이징 추천, 가격 비교, 용량 예약(CRG) | 해당 없음 (App Service/Functions만 다룸) |
| `azure-kubernetes` | AKS 클러스터 계획/생성/설정 — SKU 선택, 네트워킹, 보안, 오토스케일링 | 해당 없음 |
| `airunway-aks-setup` | AKS 위에 AI 모델 서빙(AI Runway) 설치·구성 | 해당 없음 |

### DB/스토리지

| 스킬 | 설명 | 이 문서 관련 단계 |
|---|---|---|
| `azure-storage` | Blob/File/Queue/Table Storage 가이드, 접근 티어(hot/cool/cold/archive) | 4단계-B(Storage 생성) |

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
| `entra-app-registration` | App Registration, OAuth 2.0, 서비스 프린시펄 생성 | 7단계-B (OIDC 배포 인증) |
| `entra-agent-id` | Entra Agent Identity Blueprint 프로비저닝, 에이전트 OAuth 토큰 교환 | 해당 없음 |

### 모니터링/진단

| 스킬 | 설명 | 이 문서 관련 단계 |
|---|---|---|
| `appinsights-instrumentation` | Application Insights로 웹앱 계측 — 텔레메트리 패턴, SDK 설정 | 해당 없음(도입 시 참고 가능) |
| `azure-diagnostics` | 프로덕션 이슈 디버깅 — App Service/Functions/AKS/VM/메시징 등 | 운영 단계 참고 |
| `azure-reliability` | 배포된 리소스의 안정성 진단 — zone redundancy, health probe, 다중 리전 장애조치 | 운영 단계 참고 |
| `azure-resource-visualizer` | 리소스 그룹을 Mermaid 아키텍처 다이어그램으로 시각화 | 해당 없음(문서화 시 참고 가능) |
| `azure-resource-lookup` | 구독/리소스 그룹 전체에서 리소스 조회, 태그 분석, 고아 리소스 탐지 | 해당 없음 |

### 거버넌스/비용/보안

| 스킬 | 설명 | 이 문서 관련 단계 |
|---|---|---|
| `azure-cost` | 비용 조회·예측·최적화 | 운영 단계 참고 |
| `azure-quotas` | 구독 할당량/용량 확인, 리전 가용성 | 해당 없음 |
| `azure-compliance` | 컴플라이언스/보안 감사(azqr), Key Vault 만료 체크 | 해당 없음 |
| `azure-enterprise-infra-planner` | 엔터프라이즈급 인프라 설계 — 네트워킹, 아이덴티티, 보안, WAF 정렬, Bicep/Terraform 생성 | 해당 없음 (소규모 프로젝트라 과함) |
| `azure-messaging` | Event Hubs/Service Bus 문제 해결 — 연결 실패, 인증 에러, 메시지 처리 이슈 | 해당 없음 |

### 기타 (Azure 외 출처, 미검증)

| 스킬 | 출처 | 검증 상태 | 등장 단계 |
|---|---|---|---|
| `deploy-to-vercel` | vercel-labs/agent-skills | 이름만 확인, 미검증 | 0단계 |
| `vercel-react-best-practices` | vercel-labs/agent-skills | 이름만 확인, 미검증 | 0단계 |

---

## 체크리스트 요약 (새 프로젝트 시작 시 순서대로)

- [ ] 0단계 판단: 이 프로젝트에 정말 Azure 백엔드가 필요한가? Functions인가 App Service인가?
- [ ] GitHub 저장소 생성 + 계정 확인 + `.gitignore` 설정
- [ ] `az login` + 구독 확인 (Git Bash면 `MSYS_NO_PATHCONV=1` 기억해둘 것)
- [ ] 리소스 네이밍 규칙에 맞춰 이름 정하기
- [ ] Resource Group → DB → 방화벽(내 IP는 cmd로 확인) → Storage 순서로 생성
- [ ] pgAdmin 설치 및 서버 등록
- [ ] **(Functions 경로)** Function App 생성 → Function Key 발급 + curl 테스트
- [ ] **(App Service 경로)** App Service Plan + Web App 생성(Node 버전 사전 확인) → Startup Command 지정 → App Settings는 JSON 파일로 → Always On 켜기 → GitHub Actions + OIDC 배포 파이프라인 구성
- [ ] DB 연결 문자열은 App Settings로, 코드에 하드코딩 금지
- [ ] 클라이언트 코드에 API 엔드포인트 + 키(또는 App Service라면 그냥 fetch 경로) 설정 반영
