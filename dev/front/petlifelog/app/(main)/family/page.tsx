'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Plus, Trash2, Sparkles, User, Heart, Info, X, Calendar, TrendingUp } from 'lucide-react';
import { usePet, PetProfile, PetFormData } from '@/app/common/hooks/usePet';
import { getImagePath } from '@/app/common/lib/clientApi';
import { useToast } from '@/app/common/hooks/useToast';
import { useAttachedFiles } from '@/app/common/hooks/useAttachedFiles';
import FileAttachment from '@/app/common/components/FileAttachment';

export default function FamilyPage() {
  const { pets, addPet, updatePet, uploadPetPhoto, removePet, loading } = usePet();
  const { success, error: toastError, warning } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [editingPetId, setEditingPetId] = useState<string | null>(null);
  const [viewingPet, setViewingPet] = useState<PetProfile | null>(null);
  
  // New/Edit Pet Form State
  const [newName, setNewName] = useState('');
  const [newBreed, setNewBreed] = useState('');
  const [newBirthDate, setNewBirthDate] = useState('');
  const [newAdoptionDate, setNewAdoptionDate] = useState('');
  const [newGender, setNewGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [newWeightKg, setNewWeightKg] = useState('');
  const [newTraits, setNewTraits] = useState('');
  const [newAppearance, setNewAppearance] = useState('');
  const [newLikes, setNewLikes] = useState('');
  const [newDislikes, setNewDislikes] = useState('');
  const [newDiaryTone, setNewDiaryTone] = useState('');
  // 프로필 사진 — 공통 파일 훅 사용 (최대 1장)
  const profilePhoto = useAttachedFiles({ maxFiles: 1, subfolder: 'profiles' });

  const handleEditClick = (e: React.MouseEvent, pet: PetProfile) => {
    e.stopPropagation();
    setEditingPetId(pet.id);
    setNewName(pet.name);
    setNewBreed(pet.breed);
    setNewBirthDate(pet.birthDate);
    setNewAdoptionDate(pet.adoptionDate || '');
    setNewGender(pet.gender);
    setNewWeightKg(pet.weightKg?.toString() || '');
    setNewTraits(pet.traits);
    setNewAppearance(pet.appearance || '');
    setNewLikes(pet.likes || '');
    setNewDislikes(pet.dislikes || '');
    setNewDiaryTone(pet.diaryTone || '');
    // 수정 시: 기존 사진을 AttachedFileResponse 형태로 변환해 훅에 세팅
    profilePhoto.setInitialFiles(
      pet.photo ? [{ id: `existing-${pet.id}`, originalName: '프로필 사진', fileUrl: pet.photo,
                     contentType: 'image/jpeg', fileSize: 0, sortOrder: 0, createdAt: '' }] : []
    );
    setIsAdding(true);
    setViewingPet(null);
  };

  const handleSavePet = async () => {
    if (!newName.trim()) {
      warning('아이의 이름을 입력해 주세요.');
      return;
    }
    if (!newBreed.trim()) {
      warning('견종을 입력해 주세요.');
      return;
    }
    if (!newBirthDate) {
      warning('아이의 생일을 선택해 주세요.');
      return;
    }

    // photo 제외 - 파일은 별도로 전달
    const petData: PetFormData = {
      name: newName,
      breed: newBreed,
      birthDate: newBirthDate,
      adoptionDate: newAdoptionDate || undefined,
      gender: newGender,
      weightKg: newWeightKg ? parseFloat(newWeightKg) : undefined,
      traits: newTraits,
      appearance: newAppearance || undefined,
      likes: newLikes || undefined,
      dislikes: newDislikes || undefined,
      diaryTone: newDiaryTone || undefined,
    };

    try {
      if (editingPetId) {
        // 1) 기본 정보 수정
        await updatePet(editingPetId, petData);
        // 2) 사진 변경이 있으면 파일 API로 동기화 (신규 추가된 경우만)
        const newFile = profilePhoto.pendingFiles[0];
        if (newFile) await uploadPetPhoto(editingPetId, newFile);
        success(`${newName}의 정보가 수정되었습니다! ✨`);
      } else {
        // 1) 기본 정보 등록
        const created = await addPet(petData);
        // 2) 사진이 있으면 파일 API로 업로드
        const newFile = profilePhoto.pendingFiles[0];
        if (newFile) await uploadPetPhoto(created.id, newFile);
        success(`${newName}가 우리 가족으로 등록되었습니다! 🐶`);
      }
      resetForm();
    } catch (err) {
      toastError(editingPetId ? '정보 수정에 실패했습니다.' : '반려동물 등록에 실패했습니다.');
    }
  };

  const handleRemovePet = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    try {
      await removePet(id);
      success(`${name} 프로필이 삭제되었습니다.`);
      if (viewingPet?.id === id) setViewingPet(null);
    } catch (err) {
      toastError('프로필 삭제에 실패했습니다.');
    }
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingPetId(null);
    setNewName('');
    setNewBreed('');
    setNewBirthDate('');
    setNewAdoptionDate('');
    setNewGender('MALE');
    setNewWeightKg('');
    setNewTraits('');
    setNewAppearance('');
    setNewLikes('');
    setNewDislikes('');
    setNewDiaryTone('');
    profilePhoto.setInitialFiles([]);
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return '정보 없음';
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return '정보 없음';
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age > 0 ? `${age}세` : '1세 미만';
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-surface-green/30 overflow-hidden">
      {/* Header */}
      <div className="bg-background border-b border-border p-6 lg:p-10 shrink-0">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="text-xs font-black text-main-green tracking-widest uppercase mb-1 block">Family Management</span>
            <h1 className="text-3xl lg:text-4xl font-black text-text-main tracking-tight">우리 가족 관리</h1>
            <p className="text-text-sub text-sm lg:text-base font-bold mt-2">함께 지내는 아이들의 프로필을 관리하고 AI에게 알려주세요.</p>
          </div>
          
          <button 
            onClick={() => {
              resetForm();
              setViewingPet(null);
              setIsAdding(true);
            }}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-main-green text-white font-black rounded-2xl shadow-lg shadow-main-green/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5" /> 아이 추가하기
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 lg:p-10">
        <div className="max-w-5xl mx-auto">
          {/* Add/Edit Pet Form */}
          {isAdding && (
            <div className="mb-12 bg-background rounded-[32px] border-2 border-main-green/20 shadow-xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-8 lg:p-10">
                <div className="flex justify-between items-start mb-8">
                  <h2 className="text-2xl font-black text-text-main flex items-center gap-2">
                    <Heart className="w-6 h-6 text-main-green fill-main-green" /> 
                    {editingPetId ? '아이 정보 수정' : '새로운 가족 등록'}
                  </h2>
                  <button onClick={resetForm} className="p-2 hover:bg-surface-green rounded-xl transition-colors">
                    <X className="w-6 h-6 text-text-sub" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  {/* Photo Upload */}
                  <div className="flex flex-col items-center gap-4">
                    <FileAttachment
                      attachedFiles={profilePhoto}
                      accept="image/*"
                      multiple={false}
                      isCircle={true}
                      hideHeader={true}
                      cardSize="xl"
                      emptyText="사진 추가"
                    />
                    
                    <div className="w-full space-y-2">
                      <label className="text-sm font-black text-text-main">일기 말투</label>
                      <input 
                        type="text" value={newDiaryTone} onChange={e => setNewDiaryTone(e.target.value)}
                        placeholder="예: 발랄하게, 정중하게"
                        className="w-full px-4 py-3 bg-surface-green border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-main-green/20 font-bold"
                      />
                    </div>
                  </div>

                  {/* Fields */}
                  <div className="md:col-span-2 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-black text-text-main">이름 *</label>
                        <input 
                          type="text" value={newName} onChange={e => setNewName(e.target.value)}
                          placeholder="이름"
                          className="w-full px-4 py-3 bg-surface-green border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-main-green/20 font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-black text-text-main">견종 *</label>
                        <input 
                          type="text" value={newBreed} onChange={e => setNewBreed(e.target.value)}
                          placeholder="견종"
                          className="w-full px-4 py-3 bg-surface-green border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-main-green/20 font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-black text-text-main">생일 *</label>
                        <div className="relative">
                          <input 
                            type="date" value={newBirthDate} onChange={e => setNewBirthDate(e.target.value)}
                            className="w-full px-4 py-3 bg-surface-green border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-main-green/20 font-bold appearance-none dark:color-scheme-dark"
                          />
                          <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-sub pointer-events-none" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-black text-text-main">성별</label>
                        <div className="flex bg-surface-green border border-border rounded-xl p-1">
                          <button
                            type="button"
                            onClick={() => setNewGender('MALE')}
                            className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${newGender === 'MALE' ? 'bg-background text-blue-500 shadow-sm' : 'text-text-sub'}`}
                          >
                            남아
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewGender('FEMALE')}
                            className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${newGender === 'FEMALE' ? 'bg-background text-pink-500 shadow-sm' : 'text-text-sub'}`}
                          >
                            여아
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-black text-text-main">입양일</label>
                        <div className="relative">
                          <input 
                            type="date" value={newAdoptionDate} onChange={e => setNewAdoptionDate(e.target.value)}
                            className="w-full px-4 py-3 bg-surface-green border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-main-green/20 font-bold appearance-none dark:color-scheme-dark"
                          />
                          <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-sub pointer-events-none" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-black text-text-main">몸무게 (kg)</label>
                        <input 
                          type="number" step="0.01" value={newWeightKg} onChange={e => setNewWeightKg(e.target.value)}
                          placeholder="0.00"
                          className="w-full px-4 py-3 bg-surface-green border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-main-green/20 font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-black text-text-main">좋아하는 것</label>
                        <input 
                          type="text" value={newLikes} onChange={e => setNewLikes(e.target.value)}
                          placeholder="좋아하는 간식, 장난감 등"
                          className="w-full px-4 py-3 bg-surface-green border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-main-green/20 font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-black text-text-main">싫어하는 것</label>
                        <input 
                          type="text" value={newDislikes} onChange={e => setNewDislikes(e.target.value)}
                          placeholder="싫어하는 행동, 소리 등"
                          className="w-full px-4 py-3 bg-surface-green border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-main-green/20 font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-black text-text-main">외형적 특징</label>
                      <input 
                        type="text" value={newAppearance} onChange={e => setNewAppearance(e.target.value)}
                        placeholder="예: 한쪽 귀가 접혀있음, 털이 곱슬거림"
                        className="w-full px-4 py-3 bg-surface-green border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-main-green/20 font-bold"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-black text-text-main flex items-center justify-between">
                        <span>성격 및 특징 (AI 참고용)</span>
                        <div className="group relative">
                          <Info className="w-4 h-4 text-text-sub cursor-help" />
                          <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-text-main text-white text-[10px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 leading-relaxed">
                            여기에 입력한 정보가 AI 일기 작성 시 반영됩니다. 평소 행동 습관을 적어주면 더 생생한 일기를 써드려요!
                          </div>
                        </div>
                      </label>
                      <textarea 
                        rows={3} value={newTraits} onChange={e => setNewTraits(e.target.value)}
                        placeholder="아이의 성격을 자세히 적어주세요. AI가 더 똑똑해집니다."
                        className="w-full px-4 py-3 bg-surface-green border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-main-green/20 font-medium resize-none"
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button onClick={resetForm} className="flex-1 py-4 bg-surface-green text-text-sub font-black rounded-2xl hover:bg-border transition-all">취소</button>
                      <button 
                        onClick={handleSavePet} 
                        disabled={loading}
                        className="flex-[2] py-4 bg-main-green text-white font-black rounded-2xl shadow-lg shadow-main-green/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                      >
                        {loading ? '처리 중...' : (editingPetId ? '수정하기' : '등록하기')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* viewing pet detail */}
          {viewingPet && (
            <div className="mb-12 bg-background rounded-[40px] border-2 border-main-green/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
              <div className="relative h-48 bg-gradient-to-br from-main-green/20 to-surface-green">
                <button 
                  onClick={() => setViewingPet(null)}
                  className="absolute top-6 right-6 p-3 bg-background/80 backdrop-blur-md hover:bg-background rounded-2xl shadow-sm z-10 transition-all"
                >
                  <X className="w-6 h-6 text-text-main" />
                </button>
                
                <div className="absolute -bottom-16 left-10 flex items-end gap-6">
                  <div className="relative w-32 h-32 rounded-[32px] overflow-hidden border-4 border-background shadow-xl bg-background">
                    <Image src={getImagePath(viewingPet.photo, 'profiles')} alt={viewingPet.name} fill className="object-cover" />
                  </div>
                  <div className="pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-3xl font-black text-text-main tracking-tight">{viewingPet.name}</h2>
                      <div className={`px-2.5 py-1 rounded-full text-[10px] font-black text-white ${viewingPet.gender === 'MALE' ? 'bg-blue-500' : 'bg-pink-500'}`}>
                        {viewingPet.gender === 'MALE' ? '남아' : '여아'}
                      </div>
                    </div>
                    <p className="text-text-sub font-bold">{viewingPet.breed} · {calculateAge(viewingPet.birthDate)}</p>
                  </div>
                </div>
              </div>

              <div className="p-10 pt-20 grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-surface-green/50 rounded-3xl border border-main-green/5">
                      <div className="text-[10px] font-black text-main-green uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" /> 생일
                      </div>
                      <div className="text-sm font-black text-text-main">{viewingPet.birthDate}</div>
                    </div>
                    <div className="p-5 bg-surface-green/50 rounded-3xl border border-main-green/5">
                      <div className="text-[10px] font-black text-main-green uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <Heart className="w-3 h-3" /> 입양일
                      </div>
                      <div className="text-sm font-black text-text-main">{viewingPet.adoptionDate || '정보 없음'}</div>
                    </div>
                    <div className="p-5 bg-surface-green/50 rounded-3xl border border-main-green/5">
                      <div className="text-[10px] font-black text-main-green uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <TrendingUp className="w-3 h-3" /> 몸무게
                      </div>
                      <div className="text-sm font-black text-text-main">{viewingPet.weightKg ? `${viewingPet.weightKg}kg` : '정보 없음'}</div>
                    </div>
                    <div className="p-5 bg-surface-green/50 rounded-3xl border border-main-green/5">
                      <div className="text-[10px] font-black text-main-green uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3" /> 일기 말투
                      </div>
                      <div className="text-sm font-black text-text-main">{viewingPet.diaryTone || '기본 설정'}</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-main-green tracking-widest uppercase">성격 및 특징</h4>
                    <div className="p-6 bg-background border border-border rounded-3xl shadow-sm italic leading-relaxed text-sm font-medium text-text-main/80">
                      &quot;{viewingPet.traits || '등록된 특징이 없습니다.'}&quot;
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-main-green tracking-widest uppercase">좋아하고 싫어하는 것</h4>
                    <div className="space-y-3">
                      <div className="flex items-start gap-4 p-5 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100/50 dark:border-blue-900/20">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs shrink-0 font-black">Like</div>
                        <p className="text-sm font-bold text-text-main leading-relaxed mt-1.5">{viewingPet.likes || '정보 없음'}</p>
                      </div>
                      <div className="flex items-start gap-4 p-5 bg-pink-50/50 dark:bg-pink-900/10 rounded-2xl border border-pink-100/50 dark:border-pink-900/20">
                        <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-white text-xs shrink-0 font-black">Hate</div>
                        <p className="text-sm font-bold text-text-main leading-relaxed mt-1.5">{viewingPet.dislikes || '정보 없음'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-main-green tracking-widest uppercase">외형적 특징</h4>
                    <div className="p-6 bg-surface-green/20 border border-main-green/10 rounded-3xl text-sm font-bold text-text-main leading-relaxed">
                      {viewingPet.appearance || '정보 없음'}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button 
                      onClick={(e) => handleEditClick(e, viewingPet)}
                      className="flex-1 py-4 bg-main-green text-white font-black rounded-2xl shadow-lg shadow-main-green/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" /> 정보 수정
                    </button>
                    <button 
                      onClick={(e) => handleRemovePet(e, viewingPet.id, viewingPet.name)}
                      className="flex-1 py-4 bg-background border-2 border-red-100 dark:border-red-900/30 text-red-500 font-black rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/10 transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" /> 삭제
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pet List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pets.map(pet => (
              <div 
                key={pet.id} 
                onClick={() => {
                  setViewingPet(pet);
                  setIsAdding(false);
                }}
                className={`group bg-background rounded-[32px] border p-6 flex items-center gap-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer ${viewingPet?.id === pet.id ? 'border-main-green ring-4 ring-main-green/5' : 'border-border'}`}
              >
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-background shadow-md shrink-0">
                  <Image src={getImagePath(pet.photo, 'profiles')} alt={pet.name} fill className="object-cover" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <h3 className="text-xl font-black text-text-main truncate">{pet.name}</h3>
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-black text-white ${pet.gender === 'MALE' ? 'bg-blue-500' : 'bg-pink-500'}`}>
                        {pet.gender === 'MALE' ? '남아' : '여아'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleEditClick(e, pet)}
                        className="p-2 text-text-sub hover:text-main-green opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleRemovePet(e, pet.id, pet.name)}
                        className="p-2 text-text-sub hover:text-red-500 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-text-sub mb-3">
                    {pet.breed} · {calculateAge(pet.birthDate)} ({pet.birthDate})
                    {pet.weightKg && ` · ${pet.weightKg}kg`}
                  </div>
                  <div className="bg-surface-green/50 p-3 rounded-2xl border border-main-green/5">
                    <p className="text-[11px] text-text-sub font-medium line-clamp-2 italic leading-relaxed">
                      &quot;{pet.traits || '등록된 특징이 없습니다. AI를 위해 입력해 주세요!'}&quot;
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {pets.length === 0 && !isAdding && (
              <div className="md:col-span-2 py-20 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-main-green/10 rounded-full flex items-center justify-center mb-6">
                  <User className="w-10 h-10 text-main-green" />
                </div>
                <h3 className="text-xl font-black text-text-main">등록된 가족이 없어요</h3>
                <p className="text-text-sub mt-2 font-medium">우리 아이의 정보를 먼저 등록해 주세요!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
