import fs from 'fs';
const appPath = 'src/App.tsx';
let source = fs.readFileSync(appPath, 'utf8');

// The starting div
const startMarker = '<div className="mt-4 mb-2 px-[5%]">';
const endMarker = '</div>\n              </div>\n            </div>'; // The three closing divs of the horizontal scroll

const indexOfStart = source.indexOf(startMarker);
if (indexOfStart === -1) {
    console.error("Could not find start");
    process.exit(1);
}

// Find the start of the LayoutGroup container
const layoutMarker = '<div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full px-4 md:px-0 pt-4 pb-32">';

const indexOfLayout = source.indexOf(layoutMarker, indexOfStart);
if (indexOfLayout === -1) {
    console.error("Could not find layout container");
    process.exit(1);
}

const endOfLayout = source.indexOf('</LayoutGroup>\n            </div>', indexOfLayout);
if (endOfLayout === -1) {
    console.error("Could not find end of layout container");
    process.exit(1);
}

const endIndexOfLayoutAndDiv = source.indexOf('</div>', endOfLayout) + 6;

// Get map function String
const startOfMap = source.indexOf('{(() => {', indexOfStart);
const endOfMap = source.indexOf('})()}', startOfMap) + 5;
const mapFunction = source.substring(startOfMap, endOfMap);

// Layout group content
const startOfLayoutGroup = source.indexOf('<LayoutGroup>', indexOfLayout) + 13;
const endOfLayoutGroupStr = '</LayoutGroup>';
const layoutGroupContent = source.substring(startOfLayoutGroup, source.indexOf(endOfLayoutGroupStr, startOfLayoutGroup));


const newLayout = `
            <div className="flex-1 flex flex-row items-center max-w-2xl mx-auto w-full px-2 md:px-0 pt-4 pb-32 gap-3 relative h-[450px]">
              <div className="w-[50px] sm:w-[60px] shrink-0 border-r border-zinc-100 dark:border-zinc-800/30 pr-1 h-full">
                <div 
                  className="flex flex-col h-full overflow-y-auto no-scrollbar gap-2 snap-y snap-mandatory relative pb-10" 
                  ref={horizontalCalendarRef}
                  style={{ maskImage: "linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)", WebkitMaskImage: "linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)" }}
                >
                  <div className="h-4 shrink-0"></div>
                  ${mapFunction}
                  <div className="h-4 shrink-0"></div>
                </div>
              </div>
              <div className="flex-1 flex flex-col justify-center min-w-0">
                <LayoutGroup>
                  ${layoutGroupContent}
                </LayoutGroup>
              </div>
            </div>`;


const chunkToRemove = source.substring(indexOfStart, source.indexOf('</div>', endOfLayoutGroupStr) + 6);
source = source.replace(chunkToRemove, newLayout);

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
