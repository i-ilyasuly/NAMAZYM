import fs from 'fs';
const appPath = 'src/App.tsx';
let source = fs.readFileSync(appPath, 'utf8');

// Fix 1: Move pb-32 out of the flex-row, so the container height doesn't stretch down
const targetContainerRegex = /<div className="flex-1 flex flex-row items-stretch max-w-3xl mx-auto w-full px-2 md:px-0 pt-4 pb-32 gap-3 relative">([\s\S]*?)<\/main>/;

// Wait, <main> is the parent. We can just change pb-32 to pb-4, and put a new div with pb-28, 
// or just put pb-32 on <main> itself!
// Let's check where pb-32 was.
// In the original code, <main className="flex-1 relative overflow-y-auto..."> and then the tab contents.

const replaceOuter = `<div className="flex-1 flex flex-row items-stretch max-w-3xl mx-auto w-full px-2 md:px-0 pt-4 pb-32 gap-3 relative">`;
const targetOuter = `<div className="flex-1 flex flex-row items-stretch max-w-3xl mx-auto w-full px-2 md:px-0 pt-4 pb-8 gap-3 relative mb-24">`;
source = source.replace(replaceOuter, targetOuter);

// Fix 2: Remove right border from calendar
const replaceBorder = `<div className="w-[50px] sm:w-[60px] shrink-0 border-r border-zinc-100 dark:border-zinc-800/30 pr-1 h-auto relative">`;
const targetBorder = `<div className="w-[50px] sm:w-[60px] shrink-0 pr-1 h-auto relative">`;
source = source.replace(replaceBorder, targetBorder);

// Fix 3: Reverse calendar map
const replaceMap = `const days = Array.from({ length: 60 }).map((_, i) => {
                      const d = new Date();
                      d.setHours(0, 0, 0, 0);
                      d.setDate(today.getDate() - 59 + i); // 59 days past + today
                      return d;
                    });`;
const targetMap = `const days = Array.from({ length: 60 }).map((_, i) => {
                      const d = new Date();
                      d.setHours(0, 0, 0, 0);
                      d.setDate(today.getDate() - i); // today is top, then past days going down
                      return d;
                    });`;
source = source.replace(replaceMap, targetMap);

// Also remove `pb-10` from inner calendar absolute inset if we want it to not overshoot.
const replacePb10 = `className="absolute inset-0 flex flex-col overflow-y-auto no-scrollbar gap-2 snap-y snap-mandatory pb-10"`;
const targetPb10 = `className="absolute inset-0 flex flex-col overflow-y-auto no-scrollbar gap-2 snap-y snap-mandatory pb-4"`;
source = source.replace(replacePb10, targetPb10);

fs.writeFileSync(appPath, source, 'utf8');
console.log("Updated App.tsx successfully");
