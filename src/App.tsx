import React, { startTransition } from "react";
import { useTranslation } from "react-i18next";
import { auth, db } from "./firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { AuthScreen } from "./components/AuthScreen";
import { Toaster } from "sonner";
import { BottomNav } from "./components/BottomNav";
import { ShareScreen } from "./components/ShareScreen";
import { LocationSearchScreen } from "./components/LocationSearchScreen";
import { LoadingScreen } from "./components/LoadingScreen";
import { AnalyticsScreen } from "./components/AnalyticsScreen";
import { CommunityScreen } from "./components/CommunityScreen";
import { LeaderboardScreen } from "./components/LeaderboardScreen";
import { SettingsScreen } from "./components/SettingsScreen";
import { StatisticsScreen } from "./components/StatisticsScreen";
import { QuranScreen } from "./components/QuranScreen";
import { HomeScreen } from "./components/HomeScreen";
import WallpaperGallery from "./components/WallpaperGallery";
import { UsernameSetupModal } from "./components/auth/UsernameSetupModal";
import { GlobalBackground } from "./components/layout/GlobalBackground";
import { StatusSelectionDrawer } from "./components/home/StatusSelectionDrawer";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./components/ui/button";
import { User } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./components/ui/alert-dialog";
import { QuranProvider } from "./context/QuranContext";
import { cn } from "./lib/utils";
import { useAppController } from "./hooks/useAppController";

export default function App() {
  return (
    <QuranProvider>
      <AppContent />
    </QuranProvider>
  );
}

function AppContent() {
  const ctrl = useAppController();

  if (!ctrl.isAuthReady) {
    return <LoadingScreen message={ctrl.t("loading")} />;
  }

  if (!ctrl.user) {
    return <AuthScreen />;
  }

  return (
    <div className={cn(
      "h-[100dvh] overflow-hidden font-sans text-foreground transition-colors duration-300 flex flex-col",
      (ctrl.activeTab === "home" && (
        (ctrl.backgroundType === 'stars' && ctrl.isDarkMode && ctrl.isStarrySky) || 
        (ctrl.backgroundType !== 'stars' && ctrl.backgroundUrl)
      )) ? "bg-transparent" : "bg-background"
    )}>
      <UsernameSetupModal />
      <GlobalBackground activeTab={ctrl.activeTab} />

      <main className={cn(
        "flex-1 flex flex-col max-w-full mx-auto w-full overflow-y-auto no-scrollbar border-x border-muted/10",
        ctrl.activeTab === "home" || ctrl.activeTab === "quran" ? "p-0" : "p-4 pt-6"
      )}>
        {ctrl.activeTab === "home" && (
          <HomeScreen
            selectedDate={ctrl.selectedDate}
            setSelectedDate={ctrl.setSelectedDate}
            hijriDate={ctrl.hijriDate}
            locationName={ctrl.locationName}
            locationError={ctrl.locationError ?? ""}
            isLoadingLocation={ctrl.isLoadingLocation}
            setIsLocationSearchOpen={ctrl.setIsLocationSearchOpen}
            currentStreak={ctrl.currentStreak}
            streakAnimationTrigger={ctrl.streakAnimationTrigger}
            statusStreaks={ctrl.statusStreaks}
            getStatusStreakConfig={ctrl.getStatusStreakConfig}
            showQuranSettings={ctrl.showQuranSettings}
            setShowQuranSettings={ctrl.setShowQuranSettings}
            PRAYER_BLOCK_SCALE={ctrl.PRAYER_BLOCK_SCALE}
            horizontalCalendarRef={ctrl.horizontalCalendarRef}
            days={ctrl.days}
            getDominantStatusColor={ctrl.getDominantStatusColor}
            getStatusDotColor={ctrl.getStatusDotColor}
            prayerTimes={ctrl.prayerTimes}
            prayers={ctrl.prayers}
            expandedPrayerId={ctrl.expandedPrayerId}
            setExpandedPrayerId={ctrl.setExpandedPrayerId}
            currentRecord={ctrl.currentRecord}
            gender={ctrl.gender}
            weeklyRecords={ctrl.weeklyRecords}
            historyMap={ctrl.historyMap}
            setExpansionStep={ctrl.setExpansionStep}
            expansionStep={ctrl.expansionStep}
            setSelectedPrayer={ctrl.setSelectedPrayer}
            setTempStatus={ctrl.setTempStatus}
            setTempContext={ctrl.setTempContext}
            tempStatus={ctrl.tempStatus}
            tempContext={ctrl.tempContext}
            handleExtraPrayerUpdate={ctrl.handleExtraPrayerUpdate}
            handleExtraPrayerUpdates={ctrl.handleExtraPrayerUpdates}
            handleStatusUpdate={ctrl.handleStatusUpdate}
            showExtraPrayerSheet={ctrl.showExtraPrayerSheet}
            setShowExtraPrayerSheet={ctrl.setShowExtraPrayerSheet}
            isDarkMode={ctrl.isDarkMode}
            isStarrySky={ctrl.isStarrySky}
            backgroundType={ctrl.backgroundType}
            contexts={ctrl.contexts}
            startTransition={startTransition}
          />
        )}

        {ctrl.activeTab === "statistics" && (
          <StatisticsScreen
            user={ctrl.user}
            t={ctrl.t}
            gender={ctrl.gender}
            statisticsSubTab={ctrl.statisticsSubTab}
            setStatisticsSubTab={ctrl.setStatisticsSubTab}
            statsPeriod={ctrl.statsPeriod}
            setStatsPeriod={ctrl.setStatsPeriod}
            statsStatus={ctrl.statsStatus}
            setStatsStatus={ctrl.setStatsStatus}
            activeChartType={ctrl.activeChartType}
            setActiveChartType={ctrl.setActiveChartType}
            isLoadingStats={ctrl.isLoadingStats}
            statsData={ctrl.statsData}
            isGeneratingMock={ctrl.isGeneratingMock}
            generateMockData={ctrl.generateMockData}
            setIsShareScreenOpen={ctrl.setIsShareScreenOpen}
            currentMonth={ctrl.currentMonth}
            setCurrentMonth={ctrl.setCurrentMonth}
            calendarWeekStart={ctrl.calendarWeekStart}
            setCalendarWeekStart={ctrl.setCalendarWeekStart}
            weeklyRecords={ctrl.weeklyRecords}
            handleCalendarCellClick={ctrl.handleCalendarCellClick}
            getDominantStatusColor={ctrl.getDominantStatusColor}
            getStatusDotColor={ctrl.getStatusDotColor}
            getStatusDotColorForCell={ctrl.getStatusDotColorForCell}
            getDynamicDayScore={ctrl.getDynamicDayScore}
            setActiveTab={ctrl.setActiveTab}
            selectedDate={ctrl.selectedDate}
            setSelectedDate={ctrl.setSelectedDate}
            isStarrySky={ctrl.isStarrySky}
            backgroundType={ctrl.backgroundType}
          />
        )}

        {ctrl.activeTab === "analytics" && (
          <AnalyticsScreen currentStreak={ctrl.currentStreak} />
        )}

        {ctrl.activeTab === "quran" && (
          <QuranScreen />
        )}

        {ctrl.activeTab === "settings" && (
          <SettingsScreen
            setActiveTab={ctrl.setActiveTab}
            setIsShareScreenOpen={ctrl.setIsShareScreenOpen}
            toggleDarkMode={ctrl.toggleDarkMode}
            toggleStarrySky={ctrl.toggleStarrySky}
            isStarrySky={ctrl.isStarrySky}
            openWallpaperGallery={() => ctrl.setIsWallpaperGalleryOpen(true)}
            generateMockData={ctrl.generateMockData}
            isGeneratingMock={ctrl.isGeneratingMock}
            setIsLogoutDialogOpen={ctrl.setIsLogoutDialogOpen}
          />
        )}

        {ctrl.activeTab === "leaderboard" && (
          <LeaderboardScreen />
        )}
      </main>

      {!(ctrl.activeTab === "quran" && ctrl.store.isQuranImmersive) && (
        <BottomNav activeTab={ctrl.activeTab} onChange={(tab) => startTransition(() => ctrl.setActiveTab(tab))} />
      )}

      {/* Logout Confirmation Dialog */}
      <AlertDialog
        open={ctrl.isLogoutDialogOpen}
        onOpenChange={ctrl.setIsLogoutDialogOpen}
      >
        <AlertDialogContent className="max-w-[90%] sm:max-w-[400px]">
          <AlertDialogHeader>
            <AlertDialogTitle>{ctrl.t("logout_confirm_title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {ctrl.t("logout_confirm_desc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{ctrl.t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                ctrl.setIsLogoutDialogOpen(false);
                ctrl.setGender(null);
                ctrl.setUser(null);
                ctrl.store.setCurrentRecord(null);
                auth.signOut();
              }}
              className="bg-rose-500 hover:bg-rose-600 text-white"
            >
              {ctrl.t("yes_logout")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Gender Selection Dialog */}
      <AlertDialog open={!ctrl.isCheckingGender && ctrl.user !== null && !ctrl.gender}>
        <AlertDialogContent className="max-w-[90%] sm:max-w-[400px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Қош келдіңіз!</AlertDialogTitle>
            <AlertDialogDescription>
              Қосымшаны толық пайдалану үшін жынысыңызды көрсетіңіз. Бұл статистиканы дұрыс есептеу үшін қажет (мысалы, әйелдер үшін хайз күндері).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-3 py-4">
            <Button 
              variant="outline" 
              className="h-14 justify-start px-6"
              onClick={async () => {
                ctrl.setGender("male");
                if (ctrl.user) {
                  await setDoc(doc(db, "users", ctrl.user.uid), { 
                    uid: ctrl.user.uid,
                    email: ctrl.user.email,
                    gender: "male",
                    updatedAt: serverTimestamp()
                  }, { merge: true });
                }
              }}
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center mr-4">
                <User className="w-4 h-4" />
              </div>
              <span className="text-base font-medium">Ер адам</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-14 justify-start px-6"
              onClick={async () => {
                ctrl.setGender("female");
                if (ctrl.user) {
                  await setDoc(doc(db, "users", ctrl.user.uid), { 
                    uid: ctrl.user.uid,
                    email: ctrl.user.email,
                    gender: "female",
                    updatedAt: serverTimestamp()
                  }, { merge: true });
                }
              }}
            >
              <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-600 flex items-center justify-center mr-4">
                <User className="w-4 h-4" />
              </div>
              <span className="text-base font-medium">Әйел адам</span>
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <StatusSelectionDrawer
        isOpen={ctrl.isStatusDrawerOpen}
        onOpenChange={ctrl.setIsStatusDrawerOpen}
        drawerStep={ctrl.drawerStep}
        setDrawerStep={ctrl.setDrawerStep}
        tempStatus={ctrl.tempStatus}
        setTempStatus={ctrl.setTempStatus}
        tempContext={ctrl.tempContext}
        setTempContext={ctrl.setTempContext}
        prayers={ctrl.prayers}
        selectedPrayer={ctrl.selectedPrayer}
        gender={ctrl.gender}
        contexts={ctrl.contexts}
        handleStatusUpdate={ctrl.handleStatusUpdate}
      />
      
      <ShareScreen 
        isOpen={ctrl.isShareScreenOpen} 
        onClose={() => ctrl.setIsShareScreenOpen(false)} 
        user={ctrl.user}
        statsData={ctrl.statsData}
        currentStreak={ctrl.currentStreak}
        weeklyRecords={ctrl.weeklyRecords}
      />
      <LocationSearchScreen
        isOpen={ctrl.isLocationSearchOpen}
        onClose={() => ctrl.setIsLocationSearchOpen(false)}
        onLocationSelected={() => {
        }}
      />
      <AnimatePresence>
        {ctrl.isWallpaperGalleryOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[70]"
          >
            <WallpaperGallery onBack={() => ctrl.setIsWallpaperGalleryOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
      <Toaster richColors position="top-center" />
    </div>
  );
}
