package com.petlifelog.backend.domain.dashboard.service;

import com.petlifelog.backend.domain.dashboard.dto.DashboardSummaryResponse;
import com.petlifelog.backend.domain.dashboard.dto.DashboardSummaryResponse.*;
import com.petlifelog.backend.domain.memory.repository.MemoryMomentRepository;
import com.petlifelog.backend.domain.memory.repository.MemoryRepository;
import com.petlifelog.backend.domain.memory.domain.Photo;
import com.petlifelog.backend.domain.memory.repository.PhotoRepository;
import com.petlifelog.backend.domain.pet.domain.Pet;
import com.petlifelog.backend.domain.pet.repository.PetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Period;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Service
@Transactional(readOnly = true)
public class DashboardService {

    private final PetRepository petRepository;
    private final MemoryRepository memoryRepository;
    private final MemoryMomentRepository memoryMomentRepository;
    private final PhotoRepository photoRepository;

    public DashboardSummaryResponse getSummary(UUID userId, UUID petId, YearMonth yearMonth) {
        LocalDate today = LocalDate.now();
        LocalDate monthStart = yearMonth.atDay(1);
        LocalDate monthEnd = yearMonth.atEndOfMonth();

        PetInfo petInfo = buildPetInfo(petId);
        MonthlyStats monthlyStats = buildMonthlyStats(userId, petId, monthStart, monthEnd);
        List<BestPhotoItem> bestPhotos = buildBestPhotos(userId, petId);
        List<FavoritePlaceItem> favoritePlaces = buildFavoritePlaces(userId, petId, monthStart, monthEnd);
        StreakInfo streak = buildStreak(userId);

        return DashboardSummaryResponse.builder()
                .pet(petInfo)
                .monthlyStats(monthlyStats)
                .bestPhotos(bestPhotos)
                .favoritePlaces(favoritePlaces)
                .streak(streak)
                .build();
    }

    private PetInfo buildPetInfo(UUID petId) {
        if (petId == null) return null;
        return petRepository.findById(petId)
                .filter(Pet::getIsActive)
                .map(pet -> PetInfo.builder()
                        .id(pet.getId().toString())
                        .name(pet.getName())
                        .breed(pet.getBreed())
                        .ageLabel(buildAgeLabel(pet.getBirthDate()))
                        .daysTogether(calculateDaysTogether(pet.getAdoptionDate()))
                        .birthdayDday(calculateBirthdayDday(pet.getBirthDate()))
                        .profileImagePath(pet.getProfileImagePath())
                        .build())
                .orElse(null);
    }

    private MonthlyStats buildMonthlyStats(UUID userId, UUID petId, LocalDate start, LocalDate end) {
        long recordedDays = memoryRepository.countByUserAndDateRangeAndPet(userId, start, end, petId);
        long visitedPlaces = memoryMomentRepository.countDistinctVisitedPlaces(userId, petId, start, end);
        long bestPhotosCount = photoRepository.countBestPhotos(userId, petId, start, end);

        return MonthlyStats.builder()
                .recordedDays(recordedDays)
                .visitedPlaces(visitedPlaces)
                .bestPhotosCount(bestPhotosCount)
                .build();
    }

    private List<BestPhotoItem> buildBestPhotos(UUID userId, UUID petId) {
        return photoRepository.findBestPhotos(userId, petId).stream()
                .limit(6)
                .map(photo -> BestPhotoItem.builder()
                        .photoPath(photo.getPathOrigin())
                        .memoryId(photo.getMemory().getId().toString())
                        .memoryDate(photo.getMemory().getMemoryDate().toString())
                        .vibeScore(photo.getVibeScore())
                        .aiComment(photo.getAiComment())
                        .build())
                .collect(Collectors.toList());
    }

    private List<FavoritePlaceItem> buildFavoritePlaces(UUID userId, UUID petId, LocalDate start, LocalDate end) {
        return memoryMomentRepository.findFavoritePlaces(userId, petId, start, end).stream()
                .limit(5)
                .map(row -> FavoritePlaceItem.builder()
                        .locationName((String) row[0])
                        .count((Long) row[1])
                        .build())
                .collect(Collectors.toList());
    }

    private StreakInfo buildStreak(UUID userId) {
        List<LocalDate> dates = memoryRepository.findAllMemoryDatesByUserIdOrderByDesc(userId);
        return StreakInfo.builder()
                .current(calculateCurrentStreak(dates))
                .longest(calculateLongestStreak(dates))
                .build();
    }

    private String buildAgeLabel(LocalDate birthDate) {
        if (birthDate == null) return null;
        Period period = Period.between(birthDate, LocalDate.now());
        int years = period.getYears();
        int months = period.getMonths();
        if (years == 0) return months + "개월";
        if (months == 0) return years + "살";
        return years + "살 " + months + "개월";
    }

    private Integer calculateDaysTogether(LocalDate adoptionDate) {
        if (adoptionDate == null) return null;
        return (int) ChronoUnit.DAYS.between(adoptionDate, LocalDate.now()) + 1;
    }

    private Integer calculateBirthdayDday(LocalDate birthDate) {
        if (birthDate == null) return null;
        LocalDate today = LocalDate.now();
        LocalDate nextBirthday = birthDate.withYear(today.getYear());
        if (!nextBirthday.isAfter(today)) {
            nextBirthday = nextBirthday.plusYears(1);
        }
        return (int) ChronoUnit.DAYS.between(today, nextBirthday);
    }

    private int calculateCurrentStreak(List<LocalDate> dates) {
        if (dates.isEmpty()) return 0;
        LocalDate expected = LocalDate.now();
        int streak = 0;
        for (LocalDate date : dates) {
            if (date.equals(expected)) {
                streak++;
                expected = expected.minusDays(1);
            } else if (date.isBefore(expected)) {
                break;
            }
        }
        return streak;
    }

    private int calculateLongestStreak(List<LocalDate> dates) {
        if (dates.isEmpty()) return 0;
        int longest = 1, current = 1;
        for (int i = 1; i < dates.size(); i++) {
            if (dates.get(i).equals(dates.get(i - 1).minusDays(1))) {
                current++;
                if (current > longest) longest = current;
            } else {
                current = 1;
            }
        }
        return longest;
    }
}
