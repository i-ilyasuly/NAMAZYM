import fs from 'fs';
const appPath = 'src/App.tsx';
let source = fs.readFileSync(appPath, 'utf8');

// 1. Update the horizontal logic to vertical logic inside the useEffect
const oldEffect = `        if (selectedBtn) {
          const isDateChanged = lastSelectedDate.current !== selectedDate;
          const scrollLeft = selectedBtn.offsetLeft - container.offsetWidth / 2 + selectedBtn.offsetWidth / 2;
          
          const behavior = (isDateChanged && !isFirstHomeRender.current) ? "smooth" : "auto";
          
          container.scrollTo({ left: scrollLeft, behavior });
          
          lastSelectedDate.current = selectedDate;
          isFirstHomeRender.current = false;
        }`;

const newEffect = `        if (selectedBtn) {
          const isDateChanged = lastSelectedDate.current !== selectedDate;
          const scrollTop = selectedBtn.offsetTop - container.offsetHeight / 2 + selectedBtn.offsetHeight / 2;
          
          const behavior = (isDateChanged && !isFirstHomeRender.current) ? "smooth" : "auto";
          
          container.scrollTo({ top: scrollTop, behavior });
          
          lastSelectedDate.current = selectedDate;
          isFirstHomeRender.current = false;
        }`;

source = source.replace(oldEffect, newEffect);

// 2. Extract the calendar days generation code
const calendarDivRegex = /<div className="mt-4 mb-2 px-\[5%\]">\s*<div className="border-b border-zinc-100 dark:border-zinc-800\/50 pb-4">\s*<div className="flex overflow-x-auto no-scrollbar gap-1 px-1 snap-x snap-mandatory" ref={horizontalCalendarRef}>\s*({\(\) => {[\s\S]*?}\)\(\)})\s*<\/div>\s*<\/div>\s*<\/div>/;

const calendarMatch = source.match(calendarDivRegex);
if (!calendarMatch) {
  console.error("Could not match calendar div");
  process.exit(1);
}

// 3. Remove the horizontal calendar div completely
source = source.replace(calendarDivRegex, "");

// 4. Transform the inner map to vertical blocks
let innerDays = calendarMatch[1];
// Change the class inside to represent a row inside a vertical stack, or adjust button layout.
// In the original, the button had:
// "snap-center shrink-0 flex flex-col items-center justify-center w-11 h-14 rounded-2xl transition-all"
// We could change it slightly to fit a vertical column better.
const oldButtonClass = `"snap-center shrink-0 flex flex-col items-center justify-center w-11 h-14 rounded-2xl transition-all",`;
const newButtonClass = `"snap-center shrink-0 flex flex-col items-center justify-center w-11 h-14 rounded-2xl transition-all",`; // keep it same, just vertical layout

// But we don't strictly *need* to change the button string if it already works. 
// Just ensure the container uses `flex-col`.

const verticalCalendarHTML = `
            <div className="w-[52px] sm:w-[60px] shrink-0 border-r border-zinc-100 dark:border-zinc-800/20 pr-2">
              <div 
                className="flex flex-col overflow-y-auto no-scrollbar gap-2 px-1 snap-y snap-mandatory h-[400px]" 
                ref={horizontalCalendarRef}
                style={{ maskImage: "linear-gradient(to bottom, transparent, black 5%, black 95%, transparent)", WebkitMaskImage: "linear-gradient(to bottom, transparent, black 5%, black 95%, transparent)" }}
              >
                <div className="h-4 shrink-0"></div>
                ${innerDays}
                <div className="h-4 shrink-0"></div>
              </div>
            </div>
`;

// 5. Wrap the prayer block and vertical calendar in a flex-row
const prayerBlockRegex = /(<div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full px-4 md:px-0 pt-4 pb-32">([\s\S]*?)<\/LayoutGroup>\s*<\/div>)/;

const prayerMatch = source.match(prayerBlockRegex);
if (!prayerMatch) {
  console.error("Could not match prayer block");
  process.exit(1);
}

const newLayout = `
            <div className="flex-1 flex flex-row items-center max-w-[800px] mx-auto w-full px-2 md:px-4 pt-4 pb-32 gap-3">
              \${verticalCalendarHTML}
              <div className="flex-1 flex flex-col justify-center min-w-0">
                \${prayerMatch[2].replace(/border border-zinc-100 dark:border-zinc-800\\/50/g, "border border-zinc-100 dark:border-zinc-800/30")}
              </div>
            </div>
`.replace('${verticalCalendarHTML}', verticalCalendarHTML).replace('${prayerMatch[2]}', prayerMatch[2]);

// Actually replacing match[2] properly: Let's do it safely
const newPrayerBlockHtml = `
            <div className="flex-1 flex flex-row items-stretch max-w-3xl mx-auto w-full px-2 md:px-4 pt-4 pb-32 gap-3 relative">
              ${verticalCalendarHTML}
              <div className="flex-1 flex flex-col justify-center min-w-0">
                ${prayerMatch[2]}
              </div>
            </div>
`;


source = source.replace(prayerBlockRegex, newPrayerBlockHtml);

fs.writeFileSync(appPath, source, 'utf8');
console.log("Rewrite successful");
