-- ============================================================
-- PetLifeArchive DDL v5.1 (Hierarchical Diary Architecture)
-- Target: PostgreSQL 15 + PostGIS 3.4
-- ============================================================

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. DAILY_LOGS (부모: 하루 총괄 일기)
-- ============================================================
CREATE TABLE daily_logs (
    id                      UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 UUID        NOT NULL,
    date_key                DATE        NOT NULL, -- YYYY-MM-DD
    
    -- AI 생성 총괄 결과
    ai_title                TEXT,       -- 오늘 하루 한줄 요약 제목
    ai_summary              TEXT,       -- 오늘 하루 전체 총괄 일기
    
    representative_photo_id UUID,       -- 캘린더/목록용 대표 사진 (photos 테이블 참조)

    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_daily_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_daily_user_date UNIQUE (user_id, date_key)
);
CREATE INDEX idx_daily_logs_user_date ON daily_logs(user_id, date_key);


-- ============================================================
-- 2. MOMENTS (자식: 개별 사건/모멘트)
-- ============================================================
CREATE TABLE moments (
    id                      UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    daily_log_id            UUID        NOT NULL, -- 부모 참조
    
    -- 메타데이터
    category                TEXT        NOT NULL DEFAULT 'GENERAL', -- ACTIVITY, HEALTH, etc.
    event_time              TIMESTAMPTZ, -- 사건 발생 시간 (EXIF 기반)
    location_name           TEXT,       -- 장소명
    
    -- AI 생성 상세 결과
    ai_title                TEXT,       -- 모멘트 제목
    ai_content              TEXT,       -- 모멘트 상세 일기
    energy_level            SMALLINT    CHECK (energy_level BETWEEN 1 AND 5),

    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_moments_daily_log FOREIGN KEY (daily_log_id) REFERENCES daily_logs(id) ON DELETE CASCADE
);


-- ============================================================
-- 3. PHOTOS (모멘트에 속한 사진들)
-- ============================================================
CREATE TABLE photos (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    moment_id           UUID        NOT NULL,
    
    path_origin         TEXT        NOT NULL,
    path_thumb          TEXT,

    taken_at            TIMESTAMPTZ,
    location            GEOGRAPHY(POINT, 4326),
    
    sort_order          INTEGER     NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_photos_moment FOREIGN KEY (moment_id) REFERENCES moments(id) ON DELETE CASCADE
);

-- 순환 참조 해제용 제약 조건 (daily_logs의 대표 사진)
ALTER TABLE daily_logs
    ADD CONSTRAINT fk_daily_rep_photo
    FOREIGN KEY (representative_photo_id) REFERENCES photos(id) ON DELETE SET NULL
    DEFERRABLE INITIALLY DEFERRED;


-- ============================================================
-- 4. MOMENT_TAGS (모멘트별 태그)
-- ============================================================
CREATE TABLE moment_tags (
    moment_id   UUID    NOT NULL,
    tag_name    TEXT    NOT NULL,

    PRIMARY KEY (moment_id, tag_name),
    CONSTRAINT fk_moment_tags_moment FOREIGN KEY (moment_id) REFERENCES moments(id) ON DELETE CASCADE
);


-- ============================================================
-- 5. MOMENT_DOGS (모멘트 참여 반려견)
-- ============================================================
CREATE TABLE moment_dogs (
    moment_id   UUID    NOT NULL,
    dog_id      UUID    NOT NULL,

    PRIMARY KEY (moment_id, dog_id),
    CONSTRAINT fk_moment_dogs_moment FOREIGN KEY (moment_id) REFERENCES moments(id) ON DELETE CASCADE,
    CONSTRAINT fk_moment_dogs_pet FOREIGN KEY (dog_id) REFERENCES pets(id) ON DELETE CASCADE
);

-- 자동 업데이트 트리거
CREATE TRIGGER trg_daily_logs_updated_at BEFORE UPDATE ON daily_logs FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_moments_updated_at BEFORE UPDATE ON moments FOR EACH ROW EXECUTE FUNCTION set_updated_at();
