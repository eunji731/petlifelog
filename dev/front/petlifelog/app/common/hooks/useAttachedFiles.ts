'use client';

import { useState, useCallback, useEffect } from 'react';
import clientApi, { getImagePath } from '../lib/clientApi';

// ─── 타입 ──────────────────────────────────────────────────────────

/** 백엔드 /api/files 응답 단일 파일 */
export interface AttachedFileResponse {
  id: string;
  originalName: string;
  fileUrl: string;   // 백엔드 반환값 (/files/... 상대경로)
  contentType: string;
  fileSize: number;
  sortOrder: number;
  createdAt: string;
}

/** 화면에 표시할 파일 아이템 (기존 or 신규) */
export type DisplayFile =
  | { type: 'existing'; data: AttachedFileResponse; fullUrl: string }
  | { type: 'pending';  file: File; previewUrl: string; pendingIndex: number };

// ─── 훅 ──────────────────────────────────────────────────────────

interface UseAttachedFilesOptions {
  /** 부모 도메인 타입 (MEMORY, PET_PROFILE 등) */
  parentType?: string;
  /** 부모 ID. 지정하면 마운트 시 자동으로 기존 파일을 불러옴 */
  parentId?: string;
  /** 허용할 최대 파일 수 (기존 + 신규 합산, undefined = 무제한) */
  maxFiles?: number;
  /** 이미지 경로 변환 시 사용할 서브폴더 (기본: daily) */
  subfolder?: 'daily' | 'profiles';
}

export function useAttachedFiles(options: UseAttachedFilesOptions = {}) {
  const { parentType, parentId, maxFiles, subfolder = 'daily' } = options;

  const [existingFiles, setExistingFiles] = useState<AttachedFileResponse[]>([]);
  const [pendingFiles, setPendingFiles]   = useState<File[]>([]);
  const [pendingPreviews, setPendingPreviews] = useState<string[]>([]);
  const [deletedIds, setDeletedIds]       = useState<string[]>([]);
  const [isLoading, setIsLoading]         = useState(false);

  // parentId 가 주어지면 기존 파일 자동 로드
  useEffect(() => {
    if (!parentType || !parentId) return;
    setIsLoading(true);
    clientApi.get<{ data: AttachedFileResponse[] }>(`/api/files/${parentType}/${parentId}`)
      .then(res => setExistingFiles(res.data.data ?? []))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [parentType, parentId]);

  /** 파일 추가 (로컬 상태만 변경 — 즉시 업로드 없음) */
  const addFiles = useCallback((files: File[]) => {
    const currentTotal = existingFiles.length + pendingFiles.length;
    const allowedCount = maxFiles != null
      ? Math.max(0, maxFiles - currentTotal)
      : files.length;
    const toAdd = files.slice(0, allowedCount);

    setPendingFiles(prev => [...prev, ...toAdd]);
    setPendingPreviews(prev => [...prev, ...toAdd.map(f => URL.createObjectURL(f))]);
  }, [existingFiles.length, pendingFiles.length, maxFiles]);

  /** 신규 추가 파일 제거 (로컬 상태만 변경) */
  const removePending = useCallback((index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
    setPendingPreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  /** 기존 파일 삭제 예약 (로컬 상태만 변경 — 즉시 삭제 없음) */
  const removeExisting = useCallback((id: string) => {
    setExistingFiles(prev => prev.filter(f => f.id !== id));
    setDeletedIds(prev => [...prev, id]);
  }, []);

  /**
   * 최종 저장: 삭제 목록 + 신규 파일을 백엔드에 한 번에 동기화
   * PUT /api/files/{parentType}/{parentId}/sync
   */
  const syncToBackend = useCallback(async (
    syncParentType: string,
    syncParentId: string,
  ): Promise<AttachedFileResponse[]> => {
    // 변경사항이 없으면 현재 목록 그대로 반환
    if (deletedIds.length === 0 && pendingFiles.length === 0) {
      return existingFiles;
    }

    const formData = new FormData();
    formData.append(
      'sync',
      new Blob([JSON.stringify({ deletedFileIds: deletedIds })], { type: 'application/json' }),
    );
    pendingFiles.forEach(f => formData.append('files', f));

    const res = await clientApi.put<{ data: AttachedFileResponse[] }>(
      `/api/files/${syncParentType}/${syncParentId}/sync`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );

    const updated: AttachedFileResponse[] = res.data.data ?? [];

    // 로컬 상태 리셋
    pendingPreviews.forEach(url => URL.revokeObjectURL(url));
    setExistingFiles(updated);
    setPendingFiles([]);
    setPendingPreviews([]);
    setDeletedIds([]);

    return updated;
  }, [deletedIds, pendingFiles, pendingPreviews, existingFiles]);

  /** 외부에서 기존 파일 목록을 직접 세팅 (부모가 별도로 fetch 한 경우) */
  const setInitialFiles = useCallback((files: AttachedFileResponse[]) => {
    setExistingFiles(files);
    setPendingFiles([]);
    setPendingPreviews([]);
    setDeletedIds([]);
  }, []);

  // ─── 화면 표시용 통합 목록 ──────────────────────────────────────

  const displayFiles: DisplayFile[] = [
    ...existingFiles.map(f => ({
      type: 'existing' as const,
      data: f,
      fullUrl: getImagePath(f.fileUrl, subfolder),   // 절대 URL로 변환
    })),
    ...pendingFiles.map((file, i) => ({
      type: 'pending' as const,
      file,
      previewUrl: pendingPreviews[i] ?? '',
      pendingIndex: i,
    })),
  ];

  return {
    displayFiles,
    existingFiles,
    pendingFiles,
    deletedIds,
    isLoading,
    isDirty: deletedIds.length > 0 || pendingFiles.length > 0,
    totalCount: existingFiles.length + pendingFiles.length,
    addFiles,
    removePending,
    removeExisting,
    syncToBackend,
    setInitialFiles,
  };
}
