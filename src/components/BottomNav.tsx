import React from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart2, Settings, Calendar } from 'lucide-react';
import { cn } from '../lib/utils';
import { AppLogo } from './AppLogo';

interface BottomNavProps {
  activeTab: 'home' | 'calendar' | 'statistics' | 'settings';
  onChange: (tab: 'home' | 'calendar' | 'statistics' | 'settings') => void;
}

export function BottomNav({ activeTab, onChange }: BottomNavProps) {
  const { t } = useTranslation();

  const tabs = [
    { id: 'home', icon: null, label: t('home') },
    { id: 'calendar', icon: Calendar, label: t('calendar') },
    { id: 'statistics', icon: BarChart2, label: t('statistics') },
    { id: 'settings', icon: Settings, label: t('settings') },
  ] as const;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t pb-safe pt-2 px-6 flex justify-around items-center z-50">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id as any)}
            className={cn(
              "flex flex-col items-center p-2 min-w-[72px] transition-colors",
              isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.id === 'home' ? (
              <AppLogo size={24} withBackground={false} className={cn("mb-1", !isActive && "opacity-50")} />
            ) : (
              Icon && <Icon className={cn("w-6 h-6 mb-1", isActive && "stroke-[2.5px]")} />
            )}
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
