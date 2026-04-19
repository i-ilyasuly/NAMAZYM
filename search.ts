import fs from 'fs';

async function search() {
  const code = await fetch("https://api.github.com/search/code?q=ayahinfo_1260.zip+repo:quran/quran_android", {
    headers: { "User-Agent": "Mozilla/5.0" }
  });
  const text = await code.json();
  console.log(text.items?.map((i: any) => i.path));
}
search();
