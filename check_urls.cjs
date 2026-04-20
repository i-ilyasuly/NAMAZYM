const https = require('https');

const urls = [
  'https://android.quran.com/data/width_1260/page001.png',
  'https://android.quran.com/data/width_tajweed/page001.png',
  'https://android.quran.com/data/tajweed_width_1260/page001.png',
  'https://android.quran.com/data/width_1260_tajweed/page001.png',
  'https://android.quran.com/data/width_1024_tajweed/page001.png',
  'https://android.quran.com/data/tajweed_width_1024/page001.png',
  'https://android.quran.com/data/tajweed/page001.png',
  'https://raw.githubusercontent.com/quran/quran_android/master/app/src/main/res/values/strings.xml'
];

urls.forEach(url => {
  https.get(url, (res) => {
    console.log(`${res.statusCode} - ${url}`);
  }).on('error', (e) => {
    console.error(e);
  });
});
