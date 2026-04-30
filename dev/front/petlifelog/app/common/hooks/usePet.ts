'use client';

import { useState } from 'react';

export function usePet() {
  const [selectedPet, setSelectedPet] = useState({
    id: 1,
    name: '봉봉이',
    profileImage: '/dog-profile.png',
  });

  const pets = [
    { id: 1, name: '봉봉이', profileImage: '/dog-profile.png' },
    { id: 2, name: '망고', profileImage: '/dog-profile-2.png' },
  ];

  const selectPet = (id: number) => {
    const pet = pets.find(p => p.id === id);
    if (pet) setSelectedPet(pet);
  };

  return {
    selectedPet,
    pets,
    selectPet,
  };
}
