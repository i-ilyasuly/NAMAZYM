import fs from 'fs';
import { execSync } from 'child_process';

const URLS = [
  "https://raw.githubusercontent.com/quran/quran.com-images/master/ayahinfo.json",
  "https://raw.githubusercontent.com/rnquran/rnquran/master/ayahinfo.json",
  "https://raw.githubusercontent.com/GlobalQuran/dataset/master/ayahinfo.json"
];

for (const url of URLS) {
  try {
     execSync(`curl -sL -o /tmp/db ${url}`);
     const head = execSync(`head -c 20 /tmp/db`).toString();
     if(head.startsWith("{") || head.startsWith("[")) {
         console.log("FOUND IT with", url);
         process.exit(0);
     }
  } catch(e) {}
}
