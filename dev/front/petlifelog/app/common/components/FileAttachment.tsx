'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import { Plus, X, FileText, ImageIcon, Film, Music, Archive } from 'lucide-react';
import { DisplayFile, useAttachedFiles } from '../hooks/useAttachedFiles';

// ─── 유틸 ──────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function isImage(contentType?: string, name?: string): boolean {
  if (contentType?.startsWith('image/')) return true;
  if (!name) return false;
  return /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(name);
}

function FileIcon({ contentType, name }: { contentType?: string; name?: string }) {
  if (isImage(contentType, name)) return <ImageIcon className="w-6 h-6 text-blue-400" />;
  if (contentType?.startsWith('video/') || /\.(mp4|mov|avi)$/i.test(name ?? ''))
    return <Film className="w-6 h-6 text-purple-400" />;
  if (contentType?.startsWith('audio/'))
    return <Music className="w-6 h-6 text-green-400" />;
  if (/\.(zip|rar|7z|tar|gz)$/i.test(name ?? ''))
    return <Archive className="w-6 h-6 text-yellow-500" />;
  return <FileText className="w-6 h-6 text-text-sub" />;
}

// ─── FileCard ─────────────────────────────────────────────────────

interface FileCardProps {
  item: DisplayFile;
  onRemove: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isCircle?: boolean;
}

function FileCard({ item, onRemove, size = 'md', isCircle = false }: FileCardProps) {
  const sizeClass = { 
    sm: 'w-20 h-20', 
    md: 'w-28 h-28', 
    lg: 'w-36 h-36',
    xl: 'w-48 h-48'
  }[size];
  const isImg = item.type === 'existing'
    ? isImage(item.data.contentType, item.data.originalName)
    : isImage(item.file.type, item.file.name);

  const name = item.type === 'existing' ? item.data.originalName : item.file.name;
  const sizeBytes = item.type === 'existing' ? item.data.fileSize : item.file.size;
  const imgSrc = item.type === 'existing' ? item.fullUrl : item.previewUrl;

  const roundedClass = isCircle ? 'rounded-full' : 'rounded-2xl';

  return (
    <div className={`relative group ${sizeClass} shrink-0`}>
      <div className={`w-full h-full ${roundedClass} overflow-hidden border border-border bg-surface-green/30 relative`}>
        {isImg ? (
          <Image src={imgSrc} alt={name} fill className="object-cover" unoptimized />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-2">
            <FileIcon contentType={item.type === 'existing' ? item.data.contentType : item.file.type} name={name} />
            <span className="text-[9px] font-bold text-text-sub text-center leading-tight line-clamp-2 break-all">{name}</span>
            <span className="text-[8px] text-text-sub/60">{formatFileSize(sizeBytes)}</span>
          </div>
        )}

        {/* 이미지 hover 오버레이 */}
        {isImg && (
          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>

      {/* NEW 뱃지 */}
      {item.type === 'pending' && (
        <div className={`absolute ${isCircle ? 'bottom-2 left-1/2 -translate-x-1/2' : 'bottom-1 left-1'} px-1.5 py-0.5 bg-main-green text-white text-[8px] font-black rounded-md z-10 shadow-sm`}>
          NEW
        </div>
      )}

      {/* 삭제 버튼 */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className={`absolute ${isCircle ? 'top-1 right-1' : 'top-1 right-1'} p-1.5 bg-black/70 text-white rounded-full 
          ${isCircle ? 'opacity-100 shadow-md' : 'opacity-0 group-hover:opacity-100'} 
          transition-all hover:bg-red-500 hover:scale-110 z-20`}
      >
        <X className={`${isCircle ? 'w-4 h-4' : 'w-3 h-3'}`} />
      </button>
    </div>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────

interface FileAttachmentProps {
  /** useAttachedFiles() 훅의 반환값을 그대로 전달 */
  attachedFiles: ReturnType<typeof useAttachedFiles>;

  /** input[accept] 값. 기본: 모든 파일 */
  accept?: string;

  /** 다중 선택 허용 여부. 기본: true */
  multiple?: boolean;

  /** 섹션 라벨 */
  label?: string;

  /** 헤더 숨김 여부 */
  hideHeader?: boolean;

  /** 카드 크기 */
  cardSize?: 'sm' | 'md' | 'lg' | 'xl';

  /** 원형 여부 (프로필 등) */
  isCircle?: boolean;

  /** 파일 없을 때 안내 문구 */
  emptyText?: string;

  /** 추가 버튼 텍스트 */
  addButtonText?: string;

  /** 읽기 전용 모드 (추가/삭제 버튼 숨김) */
  readOnly?: boolean;

  className?: string;
}

export default function FileAttachment({
  attachedFiles,
  accept,
  multiple = true,
  label = '첨부파일',
  hideHeader = false,
  cardSize = 'md',
  isCircle = false,
  emptyText = '첨부된 파일이 없습니다.',
  addButtonText = '파일 추가',
  readOnly = false,
  className = '',
}: FileAttachmentProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { displayFiles, totalCount, addFiles, removePending, removeExisting, isLoading } = attachedFiles;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
      e.target.value = ''; // 같은 파일 재선택 가능하도록 초기화
    }
  };

  const addButtonSizeClass = { 
    sm: 'w-20 h-20', 
    md: 'w-28 h-28', 
    lg: 'w-36 h-36',
    xl: 'w-48 h-48'
  }[cardSize];
  const roundedClass = isCircle ? 'rounded-full' : 'rounded-2xl';

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 헤더 */}
      {!hideHeader && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-black text-text-main flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-main-green" />
            {label}
            {totalCount > 0 && (
              <span className="px-1.5 py-0.5 bg-main-green/10 text-main-green text-[10px] font-black rounded-full">
                {totalCount}
              </span>
            )}
          </span>

          {!readOnly && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-black text-main-green border border-main-green/30 rounded-xl hover:bg-light-green transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              {addButtonText}
            </button>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={handleInputChange}
      />

      {/* 파일 목록 */}
      {isLoading ? (
        <div className="flex items-center justify-center h-20 text-xs text-text-sub font-bold">
          불러오는 중...
        </div>
      ) : displayFiles.length === 0 ? (
        <div
          onClick={readOnly ? undefined : () => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center ${addButtonSizeClass} ${roundedClass} border-2 border-dashed border-border text-text-sub/50 text-[10px] font-bold gap-2 text-center p-4
            ${!readOnly ? 'cursor-pointer hover:border-main-green/40 hover:text-main-green/50 transition-colors' : ''}`}
        >
          <ImageIcon className="w-6 h-6" />
          {emptyText}
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {displayFiles.map((item, idx) => (
            <FileCard
              key={item.type === 'existing' ? item.data.id : `pending-${item.pendingIndex}`}
              item={item}
              size={cardSize}
              isCircle={isCircle}
              onRemove={() => {
                if (item.type === 'existing') removeExisting(item.data.id);
                else removePending(item.pendingIndex);
              }}
            />
          ))}

          {/* 파일 추가 버튼 (목록 안에도 표시) */}
          {!readOnly && (multiple || displayFiles.length === 0) && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`${addButtonSizeClass} ${roundedClass} border-2 border-dashed border-main-green/25 bg-light-green/20 flex flex-col items-center justify-center gap-1.5 text-main-green hover:bg-light-green/40 transition-all shrink-0`}
            >
              <Plus className="w-5 h-5" />
              <span className="text-[9px] font-black">추가</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
