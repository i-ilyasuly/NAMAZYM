import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, X, Clock, Loader2, Navigation } from "lucide-react";
import { useStore, LocationInfo } from "../store";
import { fetchPrayerTimes } from "../lib/aladhan";
import { format } from "date-fns";

interface LocationSearchScreenProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelected: () => void;
}

export function LocationSearchScreen({ isOpen, onClose, onLocationSelected }: LocationSearchScreenProps) {
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchTimeout = useRef<number | null>(null);

  const {
    searchHistory,
    addSearchHistory,
    removeSearchHistory,
    setLocationName,
    setCoordinates,
    setPrayerTimes,
    setLocationError,
    calculationMethod
  } = useStore();

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  const searchLocation = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    try {
      const lang = i18n.language === "kk" ? "kk" : "ru";
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&addressdetails=1&limit=5&accept-language=${lang}`
      );
      if (!response.ok) throw new Error(`OSM API Error: ${response.status}`);
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Error searching location:", error);
      setSearchError("Іздеу кезінде қате шықты. Интернетті тексеріңіз.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = window.setTimeout(() => {
      searchLocation(value);
    }, 500);
  };

  const formatLocationName = (item: any) => {
    const address = item.address;
    const city = address.city || address.town || address.village || address.county || address.state;
    const detail = address.suburb || address.neighbourhood || address.road || address.state;
    const firstWordDetail = detail ? detail.split(/[ ,./]/)[0] : "";
    const formatted = city ? (firstWordDetail && firstWordDetail !== city ? `${city}, ${firstWordDetail}` : city) : (detail || "Unknown");
    return formatted;
  };

  const handleSelectLocation = async (lat: number, lng: number, name: string) => {
    try {
      const todayStr = format(new Date(), "yyyy-MM-dd");
      const times = await fetchPrayerTimes(lat, lng, new Date(), calculationMethod);
      
      if (times) {
        setPrayerTimes(times, todayStr);
        setCoordinates({ lat, lng });
        setLocationName(name);
        setLocationError(null);
        
        addSearchHistory({ name, lat, lng });
        onLocationSelected();
        onClose();
      }
    } catch (error) {
      console.error("Error fetching prayer times for selected location:", error);
    }
  };

  const handleAutoLocation = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const lang = i18n.language === "kk" ? "kk" : "ru";
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1&accept-language=${lang}`
            );
            const data = await response.json();
            
            let name = "Unknown Location";
            if (data && data.address) {
              const city = data.address.city || data.address.town || data.address.village || data.address.county;
              const detail = data.address.suburb || data.address.neighbourhood || data.address.road || data.address.state;
              const firstWordDetail = detail ? detail.split(/[ ,./]/)[0] : "";
              name = city ? (firstWordDetail && firstWordDetail !== city ? `${city}, ${firstWordDetail}` : city) : (detail || "Unknown Location");
            }
            
            await handleSelectLocation(latitude, longitude, name);
          } catch (error) {
            console.error("Error reverse geocoding:", error);
            // Fallback to coordinates
            await handleSelectLocation(latitude, longitude, `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
          } finally {
            setIsLocating(false);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          setIsLocating(false);
        }
      );
    } else {
      setIsLocating(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: "100%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-50 bg-background flex flex-col"
        >
          <div className="p-4 pt-8 pb-4 flex items-center gap-3 border-b border-border/50">
            <button 
              onClick={onClose}
              className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={handleQueryChange}
                placeholder={t("search_location") || "Орналасқан жерді іздеу"}
                className="w-full bg-muted/50 border-none rounded-xl py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                autoFocus
              />
              {query && (
                <button 
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {!query && (
              <button
                onClick={handleAutoLocation}
                disabled={isLocating}
                className="w-full flex items-center gap-3 p-3 mb-6 rounded-xl bg-primary/5 text-primary hover:bg-primary/10 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  {isLocating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Navigation className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <div className="font-medium text-sm">Ағымдағы орынды анықтау</div>
                  <div className="text-xs opacity-70">GPS арқылы автоматты түрде</div>
                </div>
              </button>
            )}

            {query ? (
              <div className="space-y-1">
                {isSearching ? (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                ) : searchError ? (
                  <div className="text-center py-8 text-destructive text-sm bg-destructive/5 rounded-xl border border-destructive/10">
                    {searchError}
                  </div>
                ) : results.length > 0 ? (
                  results.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectLocation(parseFloat(item.lat), parseFloat(item.lon), formatLocationName(item))}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left"
                    >
                      <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{formatLocationName(item)}</div>
                        <div className="text-xs text-muted-foreground truncate">{item.display_name}</div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Нәтиже табылмады
                  </div>
                )}
              </div>
            ) : (
              searchHistory.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
                    Іздеу тарихы
                  </h3>
                  <div className="space-y-1">
                    {searchHistory.map((item, index) => (
                      <div key={index} className="flex items-center group">
                        <button
                          onClick={() => handleSelectLocation(item.lat, item.lng, item.name)}
                          className="flex-1 flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left"
                        >
                          <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="font-medium text-sm truncate">{item.name}</span>
                        </button>
                        <button
                          onClick={() => removeSearchHistory(index)}
                          className="p-3 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
