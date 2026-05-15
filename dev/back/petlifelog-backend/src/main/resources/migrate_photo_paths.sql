-- 기존 Photo.path_origin 과 MemoryMoment.representative_photo_path 에
-- 전체 URL 대신 storedPath(상대경로)를 저장하도록 마이그레이션합니다.
--
-- 변경 전 (잘못된 방식): https://petlifelog-upload.s3.us-east-1.amazonaws.com/memory/{id}/uuid.jpg
--                        /files/memory/{id}/uuid.jpg
-- 변경 후 (올바른 방식): memory/{id}/uuid.jpg

-- S3 URL 접두사 제거 (운영 환경에서 저장된 레코드)
UPDATE photos
SET path_origin = SUBSTRING(path_origin FROM LENGTH('https://petlifelog-upload.s3.us-east-1.amazonaws.com/') + 1)
WHERE path_origin LIKE 'https://petlifelog-upload.s3.us-east-1.amazonaws.com/%';

-- /files/ 접두사 제거 (로컬 환경에서 저장된 레코드)
UPDATE photos
SET path_origin = SUBSTRING(path_origin FROM LENGTH('/files/') + 1)
WHERE path_origin LIKE '/files/%';

-- 모멘트 대표 사진 경로 동일하게 정리
UPDATE memory_moments
SET representative_photo_path = SUBSTRING(representative_photo_path FROM LENGTH('https://petlifelog-upload.s3.us-east-1.amazonaws.com/') + 1)
WHERE representative_photo_path LIKE 'https://petlifelog-upload.s3.us-east-1.amazonaws.com/%';

UPDATE memory_moments
SET representative_photo_path = SUBSTRING(representative_photo_path FROM LENGTH('/files/') + 1)
WHERE representative_photo_path LIKE '/files/%';
