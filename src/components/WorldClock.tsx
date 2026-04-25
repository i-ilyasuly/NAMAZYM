import React, { useState } from 'react';
import { Menu, Sun, Moon } from 'lucide-react';

interface CityTime {
  name: string;
  time: string;
  utc: string;
  isDark?: boolean;
}

const WorldClock: React.FC = () => {
  const [is24Hour, setIs24Hour] = useState(true);

  const cities: CityTime[] = [
    { name: 'London', time: '06:15', utc: 'UTC+1', isDark: false },
    { name: 'New York', time: '01:15', utc: 'UTC-5', isDark: true },
    { name: 'Tokyo', time: '14:15', utc: 'UTC+9', isDark: false },
    { name: 'Los Angeles', time: '22:15', utc: 'UTC-8', isDark: true },
  ];

  return (
    <div className="w-[450px] bg-[#e6e6e6] rounded-[48px] p-8 shadow-2xl flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex justify-between items-center">
        <button className="p-4 bg-[#dadada] rounded-full shadow-inner">
          <Menu className="w-6 h-6 text-gray-700" />
        </button>
        <div className="flex bg-[#d1d1d1] rounded-full p-1 shadow-inner">
          <button 
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors ${!is24Hour ? 'bg-white text-gray-800 shadow-md' : 'text-gray-500'}`}
            onClick={() => setIs24Hour(false)}
          >
            12h
          </button>
          <button 
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors ${is24Hour ? 'bg-[#4d4de8] text-white shadow-md' : 'text-gray-500'}`}
            onClick={() => setIs24Hour(true)}
          >
            24h
          </button>
        </div>
      </div>

      {/* Main City */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-gray-600 text-sm font-medium px-1">
          <span>Kyiv</span>
          <span>Wednesday, Oct 15 2025</span>
        </div>
        <div className="text-[72px] font-bold text-gray-900 tracking-tighter leading-none">
          08:15:40
        </div>
      </div>

      {/* Cities Grid */}
      <div className="grid grid-cols-2 gap-4">
        {cities.map((city) => (
          <div 
            key={city.name} 
            className={`p-6 rounded-[32px] flex flex-col justify-between aspect-square ${city.isDark ? 'bg-[#1a1a1a]' : 'bg-[#d9d9d9]'}`}
          >
            <div className="flex justify-between items-start gap-2">
              <span className={`font-semibold text-lg whitespace-nowrap ${city.isDark ? 'text-white' : 'text-gray-900'}`}>
                  {city.name}
              </span>
              <span className={`text-sm font-medium whitespace-nowrap ${city.isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  {city.utc}
              </span>
            </div>
            <div className="flex justify-between items-end mt-4">
              <span className={`text-4xl font-bold whitespace-nowrap ${city.isDark ? 'text-white' : 'text-gray-900'}`}>
                  {city.time}
              </span>
              <div className={`flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap ${city.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {city.isDark ? <Moon className="w-4 h-4 text-yellow-500" /> : <Sun className="w-4 h-4 text-yellow-500" />}
                  {city.isDark ? 'Night' : 'Day'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorldClock;
