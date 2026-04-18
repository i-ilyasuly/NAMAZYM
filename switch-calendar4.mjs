import fs from 'fs';
const appPath = 'src/App.tsx';
let source = fs.readFileSync(appPath, 'utf8');

const startMarker = '<div className="mt-4 mb-2 px-[5%]">';
const indexOfStart = source.indexOf(startMarker);
if (indexOfStart === -1) {
    console.error("Could not find start");
    process.exit(1);
}

const startOfMap = source.indexOf('{(() => {', indexOfStart);
const endOfMap = source.indexOf('})()}', startOfMap) + 5;
const mapFunction = source.substring(startOfMap, endOfMap);

// End of the horizontal calendar block is before the main layout container
const layoutMarker = '<div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full px-4 md:px-0 pt-4 pb-32">';
const indexOfLayout = source.indexOf(layoutMarker, endOfMap);

if (indexOfLayout === -1) {
    console.error("Could not find layout container");
    process.exit(1);
}

// Remove the old horizontal calendar block completely up to the layout container
const chunkToRemove = source.substring(indexOfStart, indexOfLayout);
source = source.replace(chunkToRemove, '');

// Replace the layout container's opening tag with the new flex-row wrapper
const newLayoutStart = `
            <div className="flex-1 flex flex-row items-stretch max-w-3xl mx-auto w-full px-2 md:px-0 pt-4 pb-32 gap-3 relative">
              <div className="w-[50px] sm:w-[60px] shrink-0 border-r border-zinc-100 dark:border-zinc-800/30 pr-1 h-auto relative">
                <div 
                  className="absolute inset-0 flex flex-col overflow-y-auto no-scrollbar gap-2 snap-y snap-mandatory pb-10" 
                  ref={horizontalCalendarRef}
                  style={{ maskImage: "linear-gradient(to bottom, transparent, black 5%, black 95%, transparent)", WebkitMaskImage: "linear-gradient(to bottom, transparent, black 5%, black 95%, transparent)" }}
                >
                  <div className="h-4 shrink-0"></div>
                  ${mapFunction}
                  <div className="h-4 shrink-0"></div>
                </div>
              </div>
              <div className="flex-1 flex flex-col justify-start min-w-0">
`;

source = source.replace(layoutMarker, newLayoutStart);


// Fix scrolling to use scroll top
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

fs.writeFileSync(appPath, source, 'utf8');
console.log("Rewrite successful");
