import fs from 'fs';
const appPath = 'src/App.tsx';
let source = fs.readFileSync(appPath, 'utf8');

const regex = /(<div className="mt-4 mb-2 px-\[5%\]">\s*<div className="border-b border-zinc-100 dark:border-zinc-800\/50 pb-4">\s*<div className="flex overflow-x-auto no-scrollbar gap-1 px-1 snap-x snap-mandatory" ref={horizontalCalendarRef}>\s*)({\(\) => {[\s\S]*?}\)\(\)})(\s*<\/div>\s*<\/div>\s*<\/div>\s*<div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full px-4 md:px-0 pt-4 pb-32">\s*<LayoutGroup>([\s\S]*?)<\/LayoutGroup>\s*<\/div>)/;

const match = source.match(regex);
if (!match) {
  console.log("Could not find layout elements via regex");
  process.exit(1);
}

const mapFunction = match[2];
const layoutGroupContent = match[4];

// Construct new layout
const newLayout = `
            <div className="flex-1 flex flex-row items-stretch max-w-2xl mx-auto w-full px-4 md:px-0 pt-4 pb-32 gap-2 relative h-full">
              <div className="w-[50px] sm:w-[60px] shrink-0 border-r border-zinc-100 dark:border-zinc-800/30 pr-1">
                <div 
                  className="flex flex-col h-full max-h-[440px] overflow-y-auto no-scrollbar gap-2 snap-y snap-mandatory relative" 
                  ref={horizontalCalendarRef}
                  style={{ maskImage: "linear-gradient(to bottom, transparent, black 5%, black 95%, transparent)", WebkitMaskImage: "linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)" }}
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

source = source.replace(regex, newLayout);

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
