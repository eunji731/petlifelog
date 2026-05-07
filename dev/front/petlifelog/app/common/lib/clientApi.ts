import axios from 'axios';

export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

/**
 * 이미지 경로를 브라우저에서 접근 가능한 URL로 변환한다.
 *
 * 처리 순서:
 *  1. http/blob URL → 그대로 반환
 *  2. /files/... 또는 /uploads/... (백엔드 상대경로) → BACKEND_URL 붙여 반환
 *  3. storedPath 형식 (슬래시 포함, /로 시작 안 함) → /files/ 경로로 변환
 *  4. 파일명만 있는 레거시 케이스 → /uploads/{subfolder}/ 경로 사용
 */
export const getImagePath = (path?: string, subfolder: 'daily' | 'profiles' = 'daily'): string => {
  if (!path) return '/dog-profile.png';
  if (path.startsWith('http') || path.startsWith('blob:')) return path;
  if (path.startsWith('/files/') || path.startsWith('/uploads/')) return `${BACKEND_URL}${path}`;
  if (path.includes('/')) return `${BACKEND_URL}/files/${path}`;
  return `${BACKEND_URL}/uploads/${subfolder}/${path}`;
};

/**
 * FileStorageService 가 반환한 storedPath → 접근 가능한 URL
 * ex) "memory/uuid/abc.jpg" → "http://localhost:8080/files/memory/uuid/abc.jpg"
 */
export const toFileUrl = (storedPath: string): string =>
  `${BACKEND_URL}/files/${storedPath}`;

const clientApi = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

clientApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default clientApi;
