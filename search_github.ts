import fs from 'fs';

async function searchGithub() {
  const code = await fetch("https://api.github.com/search/code?q=repo:quran/quran_android+ayahinfo", {
    headers: { "User-Agent": "test-ai" }
  });
  const text = await code.json();
  console.log(text.items?.map((i: any) => i.path));
}
searchGithub();
