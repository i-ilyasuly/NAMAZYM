import fs from 'fs';
import { execSync } from 'child_process';
import Database from 'better-sqlite3';

const URLS = [
  "https://android.quran.com/data/databases/ayahinfo_1260.zip",
  "https://android.quran.com/data/ayahinfo_1260.zip",
  "https://android.quran.com/data/ayahinfo_1260.db",
  "https://android.quran.com/data/databases/ayahinfo_1260.db"
];

async function run() {
  for (const url of URLS) {
    console.log("Trying URL:", url);
    try {
      execSync(`curl -sL -o /tmp/test_download ${url}`);
      const format = execSync(`file /tmp/test_download`).toString();
      console.log("Format:", format);
      if (format.includes("Zip") || format.includes("SQLite")) {
        console.log("FOUND IT!");
        if (format.includes("Zip")) {
           execSync(`unzip -o /tmp/test_download -d /tmp/`);
        }
        
        fs.copyFileSync("/tmp/ayahinfo_1260.db", "/app/applet/public/ayahinfo.db");
        break;
      }
    } catch(e) {
      console.log("Failed");
    }
  }
}
run();
