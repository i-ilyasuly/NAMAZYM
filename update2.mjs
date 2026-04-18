import fs from 'fs';
const appPath = 'src/App.tsx';
let source = fs.readFileSync(appPath, 'utf8');

// 1. the outer container
const outerStart = '<div className="flex-1 flex flex-row items-stretch max-w-3xl mx-auto w-full px-2 md:px-0 pt-4 pb-8 gap-3 relative mb-24">';
// Replace outer container to just a wrapper
const outerReplacement = '<div className="flex-1 flex flex-col w-full max-w-3xl mx-auto px-1 sm:px-2 pt-2 md:pt-4 pb-20 relative">\n  <div className="flex flex-row items-stretch w-full gap-2 relative">';
source = source.replace(outerStart, outerReplacement);

// 2. The calendar container narrowing
const calendarStart = '<div className="w-[50px] sm:w-[60px] shrink-0 pr-1 h-auto relative">';
const calendarReplacement = '<div className="w-11 shrink-0 h-auto relative">';
source = source.replace(calendarStart, calendarReplacement);

// 3. Find the end of LayoutGroup which is right above Extra Prayers
const layoutGroupEndStr = '</LayoutGroup>\n\n              {/* Қосымша намаздар';
const splitLocation = source.indexOf(layoutGroupEndStr);

if (splitLocation !== -1) {
    // We want to insert closing tags for the flex-row, and open the next flex row.
    const layoutGroupEndReplacement = `</LayoutGroup>\n            </div>\n          </div>\n          <div className="flex flex-row w-full gap-2 mt-4">\n            <div className="w-11 shrink-0"></div>\n            <div className="flex-1 min-w-0">\n              {/* Қосымша намаздар`;
    source = source.replace(layoutGroupEndStr, layoutGroupEndReplacement);
}

// 4. Remove the extra closing tags we left behind from the old layout
// The old layout ended with:
//               )}
//             </div>
//           </div>
//         )}
//
// Which was the end of the home tab.
// Earlier we added the split. So we need to ensure the closing div matches perfectly.
// Let's do it using raw string manipulations if needed, but the previous script just added a pair of divs.
// The home bracket ends at: 
/*
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
*/
// The old layout structure was:
// <div flex-row>
//    <div calendar></div>
//    <div flex-col max-w-2xl>
//        <LayoutGroup> Main Prayers </LayoutGroup>
//        <div mt-6 grid> Extra Prayers </div>
//    </div>
// </div>
//
// Now it goes:
// <div flex-col outer>
//   <div flex-row>
//     <div calendar></div>
//     <div flex-col main>
//        <LayoutGroup> Main Prayers </LayoutGroup>
//     </div>
//   </div>
//   <div flex-row>
//     <div w-11 spacer></div>
//     <div flex-1>
//        <div mt-6 grid> Extra Prayers </div>
//     </div>
//   </div>
// </div>

const homeEndStr = `              )}
            </div>
            </div>
          </div>
        )}`;

const homeEndReplacement = `              )}
            </div>
            </div>
            </div>
          </div>
        )}`;

source = source.replace(homeEndStr, homeEndReplacement);


fs.writeFileSync(appPath, source, 'utf8');
console.log("Updated App.tsx successfully");
