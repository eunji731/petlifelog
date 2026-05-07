'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

interface NaverMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  onMapLoad?: (map: naver.maps.Map) => void;
  className?: string;
}

export default function NaverMap({ 
  center = { lat: 37.5665, lng: 126.9780 }, 
  zoom = 15,
  onMapLoad,
  className 
}: NaverMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);
  const mapInstanceRef = useRef<naver.maps.Map | null>(null);

  const clientId = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID;

  const initMap = () => {
    if (!mapRef.current || !window.naver || !window.naver.maps || mapInstanceRef.current) {
      return;
    }

    console.log('Initializing Naver Map with Client ID:', clientId);
    const mapOptions = {
      center: new naver.maps.LatLng(center.lat, center.lng),
      zoom: zoom,
      minZoom: 7,
      zoomControl: false,
      mapTypeControl: false,
    };

    try {
      const map = new naver.maps.Map(mapRef.current, mapOptions);
      mapInstanceRef.current = map;
      console.log('Map instance created successfully');
      
      if (onMapLoad) {
        onMapLoad(map);
      }
    } catch (error) {
      console.error('Error creating map instance:', error);
    }
  };

  useEffect(() => {
    if (window.naver && window.naver.maps) {
      setIsSdkLoaded(true);
      initMap();
    }
  }, []);

  useEffect(() => {
    if (isSdkLoaded) {
      initMap();
    }
  }, [isSdkLoaded]);

  if (!clientId) {
    console.error('Naver Maps Client ID is missing! Check your .env.local file.');
    return <div className="w-full h-full flex items-center justify-center bg-gray-100">API Key 설정이 필요합니다.</div>;
  }

  return (
    <>
      <Script
        src={`https://openapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`}
        onLoad={() => {
          console.log('Naver Maps Script Loaded');
          setIsSdkLoaded(true);
        }}
        strategy="afterInteractive"
      />
      <div 
        ref={mapRef} 
        className={`w-full h-full ${className}`}
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
      />
    </>
  );
}
