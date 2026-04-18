import fs from 'fs';
const appPath = 'src/App.tsx';
let source = fs.readFileSync(appPath, 'utf8');

// 1. Extract the weekly calendar
const weeklyCalendarRegex = /(<div className="bg-card rounded-2xl border border-muted\/40 shadow-sm p-4 flex flex-col items-center w-full max-w-md mx-auto">\s+<div className="flex justify-between items-center w-full mb-4 px-2">\s+<Button\s+variant="outline"[\s\S]*?<\/div>\s+<\/div>\s+<\/div>\s+<\/div>)/;
const match = source.match(weeklyCalendarRegex);

if (!match) {
  console.log('Weekly calendar not found by regex');
  process.exit(1);
}
const weeklyCalendarSrc = match[1];

// Remove the calendar tab completely
const calendarTabRegex = /{\s*activeTab === "calendar"\s*&&\s*\([\s\S]*?<div\s+className="bg-card rounded-2xl border border-muted\/40 shadow-sm p-4 flex flex-col items-center w-full max-w-md mx-auto">[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<\/div>\s*<\/div>\s*\)\s*}/;
const calendarMatch = source.match(calendarTabRegex);
if (!calendarMatch) {
    console.log("Could not find calendar tab wrapper to remove.");
} else {
    source = source.replace(calendarTabRegex, '');
}

// Add the weekly calendar to the end of the statistics 'calendar' subtab
const statsSubTabRegex = /({statisticsSubTab === "calendar" && \(\s*<div className="flex flex-col gap-6 w-full max-w-md mx-auto">[\s\S]*?<div className="bg-card rounded-2xl border border-muted\/40 shadow-sm p-4 flex flex-col items-center w-full max-w-4xl mx-auto">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*)(<\/div>\s*\)\s*})/;
source = source.replace(statsSubTabRegex, `$1\n{/* Weekly Calendar Start */}
$weeklyCalendarSrc
{/* Weekly Calendar End */}\n$2`.replace('$weeklyCalendarSrc', weeklyCalendarSrc));

// Add the share button for the calendar
// We insert it next to the ChevronRight button in the Monthly Calendar top bar
const targetForShare = `<div className="flex justify-between items-center w-full mb-4 px-2">
                  <Button 
                    variant="outline" 
                    className="h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100" 
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-sm font-medium">
                    {['Қаңтар', 'Ақпан', 'Наурыз', 'Сәуір', 'Мамыр', 'Маусым', 'Шілде', 'Тамыз', 'Қыркүйек', 'Қазан', 'Қараша', 'Желтоқсан'][currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </div>
                  <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100" 
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 w-8 bg-transparent p-0 opacity-80 hover:opacity-100 text-primary"
                    onClick={() => setIsShareScreenOpen(true)}
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                  </div>
                </div>`;

const monthlyCurrent = `<div className="flex justify-between items-center w-full mb-4 px-2">
                  <Button 
                    variant="outline" 
                    className="h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100" 
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-sm font-medium">
                    {['Қаңтар', 'Ақпан', 'Наурыз', 'Сәуір', 'Мамыр', 'Маусым', 'Шілде', 'Тамыз', 'Қыркүйек', 'Қазан', 'Қараша', 'Желтоқсан'][currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </div>
                  <Button 
                    variant="outline" 
                    className="h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100" 
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>`;

source = source.replace(monthlyCurrent, targetForShare);

fs.writeFileSync(appPath, source, 'utf8');
console.log("Successfully extracted, replaced, and appended.");
