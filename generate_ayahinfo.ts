import fs from 'fs';

async function run() {
  const map: Record<string, any[]> = {};
  console.log("Generating ayahinfo.json mathematically based on page lines...");
  
  // Actually, generating 604 pages is too slow right now. 
  // Let me just write a simple logic that maps lines based on average verse lengths.
  // Wait, I can fetch all chapters and verses:
  // /api/v4/verses/by_chapter/X?words=true&word_fields=line_number,page_number
  
  for (let c = 1; c <= 114; c++) {
    const res = await fetch(`https://api.quran.com/api/v4/verses/by_chapter/${c}?words=true&word_fields=line_number,page_number&per_page=300`);
    const data = await res.json();
    
    for (const verse of data.verses) {
      if (!verse.words) continue;
      const key = `${c}:${verse.verse_number}`;
      
      // Group words by line
      const lines: Record<number, any[]> = {};
      for (const w of verse.words) {
        if (!lines[w.line_number]) lines[w.line_number] = [];
        lines[w.line_number].push(w);
      }
      
      const boxes = [];
      for (const lineNumStr of Object.keys(lines)) {
        const lineNum = parseInt(lineNumStr);
        const lineWords = lines[lineNum];
        const page = lineWords[0].page_number;
        
        // Estimate coordinates
        // Width = 1260, Height = 1782
        // 15 lines max. y1 = (lineNum - 1) * (1782 / 15), y2 = lineNum * (1782 / 15)
        // x1, x2 -> Since Arabic is right to left, we can just estimate it covers the whole line
        // or we could distribute proportionally. For now, full line approximation is okay for a mockup.
        
        const yHeight = 1782 / 15;
        const y1 = Math.floor((lineNum - 1) * yHeight);
        const y2 = Math.floor(lineNum * yHeight);
        
        boxes.push({
          page,
          x1: 0,
          y1,
          x2: 1260,
          y2
        });
      }
      
      map[key] = boxes;
    }
    console.log(`Generated chapter ${c}`);
  }
  
  fs.mkdirSync('/app/applet/public', {recursive: true});
  fs.writeFileSync('/app/applet/public/ayahinfo.json', JSON.stringify(map));
  console.log("Done!");
}
run();
