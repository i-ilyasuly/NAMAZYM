import * as fs from "fs";

const lines = fs.readFileSync("src/App.tsx", "utf-8").split("\n");

// Identify Home Screen boundaries
const nightSkyIdx = lines.findIndex(l => l.includes(`{activeTab === "home" && isDarkMode && isStarrySky && <NightSky />}`));
const endMainDivIdx = lines.findIndex((l, i) => i > nightSkyIdx && l.includes(`{activeTab === "statistics" && (`)) - 4; // up to the closing `)}` and `</div>` of home tab.
// Actually, let's find exact ending bracket
const searchStr = `        {activeTab === "statistics" && (`;
const beforeStatsIdx = lines.findIndex(l => l.includes(searchStr));
const homeEndIdx = beforeStatsIdx - 2;

if (nightSkyIdx !== -1 && beforeStatsIdx !== -1) {
  const newLines = [
    ...lines.slice(0, nightSkyIdx),
    `      {activeTab === "home" && (`,
    `        <HomeScreen`,
    `          user={user}`,
    `          t={t}`,
    `          i18n={i18n}`,
    `          selectedDate={selectedDate}`,
    `          setSelectedDate={setSelectedDate}`,
    `          hijriDate={hijriDate}`,
    `          isLoadingLocation={isLoadingLocation}`,
    `          locationError={locationError}`,
    `          locationName={locationName}`,
    `          setIsLocationSearchOpen={setIsLocationSearchOpen}`,
    `          currentStreak={currentStreak}`,
    `          statusStreaks={statusStreaks}`,
    `          weeklyRecords={weeklyRecords}`,
    `          dailyProgress={dailyProgress}`,
    `          nextPrayer={nextPrayer}`,
    `          timeToNextPrayer={timeToNextPrayer}`,
    `          prayerTimes={prayerTimes}`,
    `          handlePrayerClick={handlePrayerClick}`,
    `          getDominantStatusColor={getDominantStatusColor}`,
    `          getStatusDotColor={getStatusDotColor}`,
    `          handlePrayerLocChange={handlePrayerLocChange}`,
    `          handleKhushuChange={handleKhushuChange}`,
    `          handleExtraPrayerUpdate={handleExtraPrayerUpdate}`,
    `          gender={gender}`,
    `        />`,
    `      )}`,
    ...lines.slice(homeEndIdx)
  ];
  fs.writeFileSync("src/App.tsx.new", newLines.join("\n"));
  console.log("Found bounds:", nightSkyIdx, homeEndIdx);
} else {
  console.log("Could not find start or end index.", nightSkyIdx, beforeStatsIdx);
}
