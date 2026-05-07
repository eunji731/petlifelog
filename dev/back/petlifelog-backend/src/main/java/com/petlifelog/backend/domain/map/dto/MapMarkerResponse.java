package com.petlifelog.backend.domain.map.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.util.UUID;

@Getter
@Builder
public class MapMarkerResponse {
    private UUID id;
    private double lat;
    private double lng;
    private String thumb;
    private UUID momentId;
    private LocalDate dateKey;
}
