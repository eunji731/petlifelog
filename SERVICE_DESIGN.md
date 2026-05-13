# PetLifeLog 전체 서비스 설계도

> 반려동물의 일상을 사진으로 기록하면, AI가 자동으로 일기를 써주는 서비스

---

## 1. 서비스 개요

| 항목 | 내용 |
|------|------|
| 서비스명 | PetLifeLog (펫라이프로그) |
| 핵심 기능 | 사진 업로드 → Gemini AI 분석 → 반려동물 일기 자동 생성 |
| 인증 방식 | 카카오 소셜 로그인 (OAuth2) |
| AI 엔진 | Google Gemini 2.5 Flash |
| 타겟 | 반려동물을 키우는 보호자 |

---

## 2. 기술 스택

### 백엔드
| 분류 | 기술 |
|------|------|
| 언어 | Java 17 |
| 프레임워크 | Spring Boot 4.0.6 |
| ORM | Spring Data JPA (Hibernate) |
| DB | PostgreSQL (Supabase 호스팅) |
| 인증 | Spring Security + OAuth2 + JWT (쿠키 방식) |
| AI | Google Gemini 2.5 Flash API |
| 이미지 처리 | Thumbnailator (썸네일 생성), metadata-extractor (EXIF) |
| API 문서 | springdoc-openapi 3.0.2 (Swagger UI) |

### 프론트엔드
| 분류 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) |
| UI 라이브러리 | React 19 + Tailwind CSS v4 |
| 상태 관리 | Zustand (with persistence) |
| HTTP 클라이언트 | Axios |
| 지도 | Naver Maps SDK |
| 아이콘 | Lucide React |

---

## 3. 전체 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                    사용자 브라우저                         │
│                 Next.js (localhost:3000)                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │  달력 /  │ │ 대시보드 │ │  지도    │ │ 아카이브  │  │
│  │ 일기쓰기 │ │  홈화면  │ │  추억    │ │  사진탭   │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬─────┘  │
│       └────────────┴────────────┴─────────────┘        │
│                    Axios (쿠키 자동 포함)                  │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTP (localhost:8080)
┌───────────────────────────▼─────────────────────────────┐
│                Spring Boot 백엔드                         │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Security Filter Chain              │    │
│  │  JWT 쿠키 검증 → @AuthenticationPrincipal 주입  │    │
│  └────────────────────┬────────────────────────────┘    │
│                       │                                 │
│  ┌──────┐ ┌────────┐ ┌┴──────┐ ┌──────┐ ┌──────────┐  │
│  │ /ai  │ │/memory │ │/pets  │ │ /map │ │/dashboard│  │
│  │      │ │        │ │       │ │      │ │          │  │
│  └──┬───┘ └───┬────┘ └───┬───┘ └──┬───┘ └────┬─────┘  │
│     │         │           │        │           │        │
│  ┌──▼─────────▼───────────▼────────▼───────────▼─────┐  │
│  │                   Service Layer                    │  │
│  └──────────────────────┬─────────────────────────────┘  │
│                          │                              │
│  ┌───────────┐    ┌──────▼──────┐    ┌──────────────┐  │
│  │  Gemini   │    │  PostgreSQL  │    │ File Storage  │  │
│  │  AI API   │    │  (Supabase) │    │ (로컬 디스크)  │  │
│  └───────────┘    └─────────────┘    └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 4. 인증 흐름

```
사용자                프론트엔드           백엔드                   카카오
  │                      │                 │                        │
  │  "카카오 로그인" 클릭  │                 │                        │
  │──────────────────────▶│                 │                        │
  │                       │ /oauth2/authorization/kakao 리다이렉트   │
  │                       │─────────────────────────────────────────▶│
  │                       │                 │   카카오 로그인 화면    │
  │◀─────────────────────────────────────────────────────────────────│
  │  로그인 완료          │                 │                        │
  │──────────────────────────────────────────────────────────────────▶
  │                       │                 │  code 파라미터와 함께 콜백
  │                       │                 │◀───────────────────────│
  │                       │                 │ code → 카카오 API 교환  │
  │                       │                 │───────────────────────▶│
  │                       │                 │  카카오 사용자 정보      │
  │                       │                 │◀───────────────────────│
  │                       │                 │ Member 생성/조회        │
  │                       │                 │ JWT 발급               │
  │                       │◀────────────────│ Set-Cookie: accessToken│
  │                       │                 │ Set-Cookie: refreshToken│
  │                       │ 메인 페이지로 이동│                        │
  │◀──────────────────────│                 │                        │
```

### 토큰 정보
| 토큰 | 유효기간 | 저장 위치 |
|------|---------|----------|
| accessToken | 24시간 | HttpOnly 쿠키 |
| refreshToken | 14일 | HttpOnly 쿠키 (해시는 DB 저장) |

---

## 5. 핵심 기능: AI 일기 생성 흐름

```
사용자                 프론트엔드                  백엔드             Gemini AI
  │                       │                        │                    │
  │  날짜 선택 + 사진 선택  │                        │                    │
  │──────────────────────▶│                        │                    │
  │                       │ ① POST /api/ai/check-metadata              │
  │                       │────────────────────────▶│                   │
  │                       │  EXIF 날짜/GPS 유무 확인 │                   │
  │                       │◀────────────────────────│                   │
  │                       │                        │                    │
  │                       │ ② POST /api/ai/analyze  │                   │
  │                       │  (images + petInfo +    │                   │
  │                       │   targetDate + tags)    │                   │
  │                       │────────────────────────▶│                   │
  │                       │                        │ 이미지 임시 저장    │
  │                       │                        │ EXIF 메타데이터 추출│
  │                       │                        │ 이미지 Base64 변환 │
  │                       │                        │ 프롬프트 구성      │
  │                       │                        │───────────────────▶│
  │                       │                        │  AI 분석 결과      │
  │                       │                        │◀───────────────────│
  │                       │  AI 일기 초안 + storedFiles 반환            │
  │                       │◀────────────────────────│                   │
  │  일기 미리보기 표시     │                        │                    │
  │◀──────────────────────│                        │                    │
  │                       │                        │                    │
  │  (사용자 검토 후 저장)  │                        │                    │
  │──────────────────────▶│                        │                    │
  │                       │ ③ POST /api/ai/save     │                   │
  │                       │  (aiResult + storedFiles│                   │
  │                       │   + petIds)             │                   │
  │                       │────────────────────────▶│                   │
  │                       │                        │ Memory 생성        │
  │                       │                        │ MemoryMoment 생성  │
  │                       │                        │ Photo 생성         │
  │                       │                        │ PhotoThemeTag 생성 │
  │                       │                        │ MemoryDog 생성     │
  │                       │   Memory UUID 반환      │                   │
  │                       │◀────────────────────────│                   │
  │  완료!                 │                        │                    │
  │◀──────────────────────│                        │                    │
```

### AI Rate Limit
| 제한 유형 | 한도 | 초과 시 응답 |
|----------|------|------------|
| 날짜별 분석 횟수 | 2회/날짜 | HTTP 429 |
| 하루 전체 분석 횟수 | 10회/일 | HTTP 429 |
| 대시보드 리포트 갱신 | 3회/일 | HTTP 429 |

---

## 6. 데이터베이스 스키마

### ERD (Entity Relationship Diagram)

```
┌─────────────────┐     ┌─────────────────┐
│     members     │─┬──▶│      pets       │
│─────────────────│ │   │─────────────────│
│ id (UUID, PK)   │ │   │ id (UUID, PK)   │
│ kakao_id        │ │   │ user_id (FK)    │
│ nickname        │ │   │ name            │
│ profile_image   │ │   │ breed           │
│ refresh_token   │ │   │ birth_date      │
│ is_active       │ │   │ gender          │
│ ai_context      │ │   │ weight_kg       │
│ role            │ │   │ personality     │
└─────────────────┘ │   │ diary_tone      │
         │          │   │ is_active       │
         │          │   └─────────────────┘
         │                      │
         ▼                      │
┌─────────────────┐             │
│    memories     │◀────────────┘ (memory_dogs)
│─────────────────│     ┌─────────────────┐
│ id (UUID, PK)   │────▶│  memory_dogs    │
│ user_id (FK)    │     │─────────────────│
│ memory_date     │     │ memory_id (FK)  │
│ summary         │     │ dog_id (FK)     │
│ ai_title        │     │ role            │
│ ai_diary        │     └─────────────────┘
│ ai_status       │
│ rep_photo_id    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ memory_moments  │     │     photos      │
│─────────────────│     │─────────────────│
│ id (UUID, PK)   │◀────│ moment_id (FK)  │
│ memory_id (FK)  │     │ memory_id (FK)  │
│ category        │     │ path_origin     │
│ ai_title        │     │ path_thumb_300  │
│ ai_content      │     │ taken_at        │
│ location_name   │     │ gps_lat         │
│ energy_level    │     │ gps_lng         │
│ tags (JSON)     │     │ ai_caption      │
│ sort_order      │     │ vibe_score      │
└─────────────────┘     │ is_best         │
                        └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │ photo_theme_tags │
                        │─────────────────│
                        │ photo_id (FK)   │
                        │ tag             │
                        └─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│ inventory_items │     │ dashboard_reports│
│─────────────────│     │─────────────────│
│ id (UUID, PK)   │     │ id (UUID, PK)   │
│ user_id (FK)    │     │ user_id (FK)    │
│ name            │     │ pet_id (FK)     │
│ category        │     │ report_year_month│
│ brand           │     │ monthly_headline│
│ ingredients     │     │ activity_trend  │
│ is_feeding      │     │ personality_type│
│ expiry_date     │     │ location_verdict│
└─────────────────┘     └─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│ ai_diary_usage  │     │  attached_files  │
│─────────────────│     │─────────────────│
│ member_id (FK)  │     │ parent_domain   │
│ target_date     │     │ parent_id       │
│ usage_type      │     │ file_path       │
│ called_at       │     │ content_type    │
└─────────────────┘     └─────────────────┘
```

### 주요 엔티티 설명

| 엔티티 | 테이블명 | 역할 |
|--------|---------|------|
| Member | members | 사용자 계정 (카카오 로그인) |
| Pet | pets | 반려동물 프로필 |
| Memory | memories | 일기 헤더 (날짜, 제목, 요약) |
| MemoryMoment | memory_moments | 일기 내 모멘트 (시간대별 활동 단위) |
| Photo | photos | 사진 (원본+썸네일 경로, GPS, AI 점수) |
| PhotoThemeTag | photo_theme_tags | AI가 분류한 사진 테마 태그 |
| MemoryDog | memory_dogs | 일기-반려동물 다대다 연결 |
| InventoryItem | inventory_items | 반려동물 용품 재고 |
| DashboardReport | dashboard_reports | AI 월간 리포트 캐시 |
| AiDiaryUsage | ai_diary_usage | AI 사용량 추적 (rate limit) |
| AttachedFile | attached_files | 범용 파일 첨부 (모든 엔티티 공용) |

---

## 7. API 엔드포인트 전체 목록

> Swagger UI: `http://localhost:8080/swagger-ui/index.html`

### 인증 (`/api/auth`)
| 메서드 | 경로 | 설명 | 인증 |
|-------|------|------|------|
| POST | `/api/auth/reissue` | 액세스 토큰 재발급 | 불필요 |
| POST | `/api/auth/logout` | 로그아웃 | 필요 |

### 회원 (`/api/members`)
| 메서드 | 경로 | 설명 | 인증 |
|-------|------|------|------|
| GET | `/api/members/me` | 내 프로필 조회 | 필요 |
| PUT | `/api/members/me/ai-context` | AI 설정 수정 | 필요 |
| DELETE | `/api/members/me` | 회원 탈퇴 | 필요 |
| POST | `/api/members/rejoin` | 재가입 (계정 복구) | 불필요 |

### 반려동물 (`/api/pets`)
| 메서드 | 경로 | 설명 |
|-------|------|------|
| GET | `/api/pets` | 반려동물 목록 조회 |
| POST | `/api/pets` | 반려동물 등록 |
| PUT | `/api/pets/{petId}` | 반려동물 수정 |
| DELETE | `/api/pets/{petId}` | 반려동물 삭제 |

### AI 일기 (`/api/ai`)
| 메서드 | 경로 | 설명 | Rate Limit |
|-------|------|------|-----------|
| GET | `/api/ai/usage` | 사용량 조회 | - |
| POST | `/api/ai/check-metadata` | EXIF 확인 (AI 없음) | - |
| POST | `/api/ai/analyze` | AI 일기 분석 | 날짜별 2회/일 10회 |
| POST | `/api/ai/save` | 일기 저장 | - |
| POST | `/api/ai/analyze-product` | 제품 사진 AI 분석 | - |

### 추억(일기) (`/api/memories`)
| 메서드 | 경로 | 설명 |
|-------|------|------|
| GET | `/api/memories` | 일기 목록 (날짜 범위 필터) |
| DELETE | `/api/memories/{memoryId}` | 일기 삭제 |

### 대시보드 (`/api/dashboard`)
| 메서드 | 경로 | 설명 | Rate Limit |
|-------|------|------|-----------|
| GET | `/api/dashboard/summary` | 월별 통계 | - |
| GET | `/api/dashboard/ai-report` | AI 월간 리포트 | - |
| POST | `/api/dashboard/ai-report/refresh` | 리포트 강제 재생성 | 3회/일 |

### 인벤토리 (`/api/inventory`)
| 메서드 | 경로 | 설명 |
|-------|------|------|
| GET | `/api/inventory` | 용품 목록 |
| POST | `/api/inventory` | 용품 등록 (multipart) |
| GET | `/api/inventory/{id}` | 용품 단건 조회 |
| PATCH | `/api/inventory/{id}` | 용품 수정 (multipart) |
| DELETE | `/api/inventory/{id}` | 용품 삭제 |
| PATCH | `/api/inventory/{id}/feeding` | 급여중 토글 |

### 지도 (`/api/map`)
| 메서드 | 경로 | 설명 |
|-------|------|------|
| GET | `/api/map/memories` | 추억 목록 (bbox + 날짜 필터) |
| GET | `/api/map/markers` | 경량 마커 목록 (bbox 필수) |
| GET | `/api/map/search/suggestions` | 검색 자동완성 |
| GET | `/api/map/search` | 키워드 검색 |
| GET | `/api/map/memories/{memoryId}` | 추억 단건 상세 |

### 사진 아카이브 (`/api/archive`)
| 메서드 | 경로 | 설명 |
|-------|------|------|
| GET | `/api/archive/themes` | 상위 테마 목록 |
| GET | `/api/archive/photos` | 테마별 사진 목록 |
| GET | `/api/archive/search` | 사진 키워드 검색 |
| GET | `/api/archive/themes/{tag}` | 특정 테마 정보 |
| GET | `/api/archive/themes/search` | 테마 검색 |
| GET | `/api/archive/tags/suggest` | 태그 자동완성 |

### 파일 (`/api/files`)
| 메서드 | 경로 | 설명 |
|-------|------|------|
| GET | `/api/files/{parentType}/{parentId}` | 첨부 파일 목록 |
| POST | `/api/files/{parentType}/{parentId}/sync` | 파일 일괄 업로드 |
| PUT | `/api/files/{parentType}/{parentId}/sync` | 파일 동기화 (삭제+추가) |
| PUT | `/api/files/{parentType}/{parentId}/replace` | 단일 파일 교체 |

---

## 8. 프론트엔드 페이지 구조

```
/                         ← 로그인 페이지 (카카오 로그인 버튼)
/kakao/callback           ← 카카오 OAuth 콜백 처리
/rejoin                   ← 탈퇴 후 계정 복구

/(main)/                  ← 홈/대시보드
  ├── 월별 통계 카드
  ├── AI 월간 리포트
  ├── 베스트 사진 4장
  └── 즐겨찾는 장소

/(main)/calendar          ← 달력 + 일기 작성
  ├── 월별 달력 그리드
  ├── 날짜 클릭 → 일기 상세 패널
  └── + 버튼 → AI 일기 생성 흐름
       ├── 사진 선택
       ├── AI 분석 (로딩)
       ├── 일기 미리보기
       └── 저장

/(main)/timeline          ← 타임라인 뷰 (모든 일기)

/(main)/family            ← 반려동물 관리
  ├── 반려동물 목록
  ├── 프로필 등록/수정
  └── AI 성격/말투 설정

/(main)/inventory         ← 용품 재고 관리
  ├── 카테고리별 탭 (사료/간식/장난감...)
  ├── 용품 목록
  └── + 버튼 → 등록 (AI 사진 분석 포함)

/(main)/archive           ← 사진 아카이브 (테마별)
  └── /archive/[category] ← 특정 테마 사진 모음

/(main)/map               ← 지도로 보는 추억
  ├── Naver Maps 지도
  ├── GPS 마커 (사진 위치)
  └── 마커 클릭 → 일기 미리보기

/(main)/settings          ← 설정
  ├── 프로필 수정
  ├── AI 개인화 설정
  └── 회원 탈퇴
```

---

## 9. 파일 저장 구조

```
D:/uploads/                  ← 영구 저장 (정식 등록된 파일)
  ├── daily/                 ← 일기 사진
  │   └── {YYYY-MM-DD}/
  │       └── {uuid}/
  │           ├── original_photo.jpg
  │           ├── thumb_300_photo.jpg
  │           └── thumb_100_photo.jpg
  └── profiles/              ← 반려동물 프로필 사진
      └── {uuid}/

D:/files/                    ← 범용 파일 (AttachedFile 연동)
  └── memory/
      └── {sessionId}/       ← AI 분석 중 임시 저장
          └── photo.jpg      ← 24시간 후 고아 파일 자동 삭제

HTTP 경로:
  /uploads/**  → D:/uploads/  (인증 없이 접근 가능)
  /files/**    → D:/files/    (인증 없이 접근 가능)
  ※ 경로에 UUID가 포함되어 추측 불가능
```

---

## 10. 상태 관리 (프론트엔드 Zustand Store)

| Store | 역할 | 지속성 |
|-------|------|--------|
| `usePetStore` | 반려동물 목록 + 선택된 반려동물 | localStorage |
| `useDiaryStore` | 일기 목록 + AI 분석 결과 | sessionStorage |
| `useDashboardStore` | 대시보드 통계 + AI 리포트 | 없음 |
| `useInventoryStore` | 용품 목록 | 없음 |
| `useArchiveStore` | 테마 목록 + 사진 목록 | 없음 |
| `useMapStore` | 지도 마커 + 검색 결과 | 없음 |
| `useConfirmStore` | 전역 확인 다이얼로그 | 없음 |
| `useToastStore` | 전역 토스트 알림 | 없음 |

---

## 11. 보안 설계

| 항목 | 구현 방법 |
|------|---------|
| 인증 | JWT (accessToken) HttpOnly 쿠키 |
| CSRF 방어 | SameSite=Lax 쿠키 설정 (브라우저 레벨 방어) |
| XSS 방어 | HttpOnly 쿠키로 JS 접근 차단 |
| 토큰 탈취 감지 | refreshToken을 SHA-256 해시로 DB 저장, Refresh Token Rotation |
| 정적 파일 접근 | UUID 포함 경로로 추측 불가 (Security through Obscurity) |
| 데이터 격리 | 모든 API에서 `@AuthenticationPrincipal`로 요청자 식별 후 본인 데이터만 반환 |

---

## 12. 개발 환경 설정

### 백엔드 실행

```bash
# application.yml (또는 .env.dev) 필요 설정:
spring:
  datasource:
    url: jdbc:postgresql://[SUPABASE_HOST]:5432/postgres
    username: [DB_USER]
    password: [DB_PASSWORD]
  security:
    oauth2:
      client:
        registration:
          kakao:
            client-id: [KAKAO_APP_KEY]
            client-secret: [KAKAO_CLIENT_SECRET]

jwt:
  secret: [32바이트 이상 랜덤 문자열]
  expiration: 86400000  # 24시간 (ms)

gemini:
  api-key: [GOOGLE_AI_API_KEY]

app:
  frontend-url: http://localhost:3000
  upload-dir: D:/uploads
  files-dir: D:/files
```

### 프론트엔드 실행

```bash
# .env.local
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=[NAVER_MAP_KEY]

# 실행
npm install
npm run dev  # localhost:3000
```

### Swagger UI 접속

```
http://localhost:8080/swagger-ui/index.html
```

1. 브라우저에서 카카오 로그인 (`http://localhost:8080/oauth2/authorization/kakao`)
2. 같은 브라우저에서 Swagger UI 접속
3. 쿠키 자동 포함으로 API 테스트 가능

---

## 13. 주요 비즈니스 로직

### AI 일기 생성 상세 로직

1. **이미지 전처리**
   - EXIF 메타데이터 추출 (촬영 날짜, GPS 좌표)
   - 카카오톡 파일명 패턴으로 날짜 추출 폴백 (`KakaoTalk_YYYYMMDD_HHmmss.jpg`)
   - 512px로 리사이즈 후 Base64 변환 (AI 전송용)

2. **Gemini 프롬프트 구성**
   - 보호자 AI 컨텍스트 (`member.aiContext`) 앞에 삽입
   - 반려동물 성격·말투 정보 포함
   - 촬영 시간 메타데이터 포함 (시간 순서 정렬용)
   - 사용자 입력 키워드(userTags) 포함

3. **AI 응답 처리**
   - JSON 파싱 후 Memory + Moment + Photo 엔티티 생성
   - 사진별 `vibeScore` (1~100), `isBest`, `themeTags` 저장
   - 대표 사진 선정 (AI 추천 또는 첫 번째 사진)

### 대시보드 AI 리포트 생성 조건

- 해당 월에 Memory ≥ 3개 필요
- 기존 리포트 있으면 캐시 반환 (DB `dashboard_reports`)
- `/refresh` API로 하루 3회 강제 재생성 가능
- 에너지 트렌드: 이전 달 평균과 비교 (UP/STABLE/DOWN)
- 장소 패턴: VARIED(다양) / FOCUSED(집중) / ROUTINE(루틴) / LOW_DATA(데이터 부족)

### 지도 성능 최적화

- bbox(Bounding Box) 기반 마커 로딩 (화면에 보이는 영역만)
- `/markers` (경량) vs `/memories` (상세) 분리
- 마커 클릭 시에만 단건 상세 API 호출
- GPS 컬럼 인덱스 적용으로 범위 쿼리 최적화

---

*최종 업데이트: 2026-05-13*
