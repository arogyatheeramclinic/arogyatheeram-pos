import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SOURCE_IMG = 'C:\\Users\\rishi\\Downloads\\Meditating Under the Herbal Tree.png';
const PUBLIC_DIR = 'C:\\Users\\rishi\\Desktop\\Work\\Arogyatheeram\\POS\\public';
const APP_DIR = 'C:\\Users\\rishi\\Desktop\\Work\\Arogyatheeram\\POS\\src\\app';

async function generateAssetsWithWhiteBorders() {
  console.log('Reading source image from:', SOURCE_IMG);
  const fileBuffer = fs.readFileSync(SOURCE_IMG);
  const base64 = fileBuffer.toString('base64');
  const dataUrl = `data:image/png;base64,${base64}`;

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
  });
  const page = await browser.newPage();

  const targets = [
    { name: 'favicon-16.png', size: 16, format: 'png' },
    { name: 'favicon-32.png', size: 32, format: 'png' },
    { name: 'icon.png', size: 32, format: 'png' },
    { name: 'apple-icon.png', size: 180, format: 'png' },
    { name: 'logo.png', size: 256, format: 'png' },
    { name: 'logo.webp', size: 256, format: 'webp', quality: 0.85 },
    { name: 'logo-sm.webp', size: 96, format: 'webp', quality: 0.85 },
    { name: 'logo-hd.webp', size: 512, format: 'webp', quality: 0.88 },
  ];

  for (const t of targets) {
    const data = await page.evaluate(async ({ dataUrl, size, format, quality }) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const w = img.naturalWidth;
          const h = img.naturalHeight;

          // 1. Process master canvas with flood-fill to turn outer black borders into white
          const masterCanvas = document.createElement('canvas');
          masterCanvas.width = w;
          masterCanvas.height = h;
          const mctx = masterCanvas.getContext('2d');
          mctx.drawImage(img, 0, 0);

          const imgData = mctx.getImageData(0, 0, w, h);
          const data = imgData.data;

          const visited = new Uint8Array(w * h);
          const queue = [];

          function isDark(idx, thresh = 110) {
            return data[idx] < thresh && data[idx+1] < thresh && data[idx+2] < thresh;
          }

          // Push perimeter dark pixels
          for (let x = 0; x < w; x++) {
            if (isDark(x * 4)) { queue.push(x, 0); visited[x] = 1; }
            const bIdx = ((h - 1) * w + x) * 4;
            if (isDark(bIdx)) { queue.push(x, h - 1); visited[(h - 1) * w + x] = 1; }
          }
          for (let y = 0; y < h; y++) {
            const lIdx = (y * w) * 4;
            if (isDark(lIdx) && !visited[y * w]) { queue.push(0, y); visited[y * w] = 1; }
            const rIdx = (y * w + (w - 1)) * 4;
            if (isDark(rIdx) && !visited[y * w + (w - 1)]) { queue.push(w - 1, y); visited[y * w + (w - 1)] = 1; }
          }

          let head = 0;
          while (head < queue.length) {
            const cx = queue[head++];
            const cy = queue[head++];
            const neighbors = [
              [cx + 1, cy],
              [cx - 1, cy],
              [cx, cy + 1],
              [cx, cy - 1]
            ];
            for (let i = 0; i < 4; i++) {
              const nx = neighbors[i][0];
              const ny = neighbors[i][1];
              if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                const nPos = ny * w + nx;
                if (!visited[nPos]) {
                  const nIdx = nPos * 4;
                  if (isDark(nIdx, 110)) {
                    visited[nPos] = 1;
                    queue.push(nx, ny);
                  }
                }
              }
            }
          }

          // Set all outer border pixels to pure white
          for (let i = 0; i < w * h; i++) {
            if (visited[i]) {
              data[i * 4] = 255;
              data[i * 4 + 1] = 255;
              data[i * 4 + 2] = 255;
              data[i * 4 + 3] = 255;
            }
          }

          mctx.putImageData(imgData, 0, 0);

          // 2. Downscale onto target size canvas with high-quality bicubic smoothing
          const targetCanvas = document.createElement('canvas');
          targetCanvas.width = size;
          targetCanvas.height = size;
          const tctx = targetCanvas.getContext('2d');
          tctx.imageSmoothingEnabled = true;
          tctx.imageSmoothingQuality = 'high';

          // Fill target canvas background with white
          tctx.fillStyle = '#FFFFFF';
          tctx.fillRect(0, 0, size, size);

          tctx.drawImage(masterCanvas, 0, 0, size, size);

          const mimeType = format === 'webp' ? 'image/webp' : 'image/png';
          const outUrl = targetCanvas.toDataURL(mimeType, quality || 0.92);
          resolve(outUrl.split(',')[1]);
        };
        img.src = dataUrl;
      });
    }, { dataUrl, size: t.size, format: t.format, quality: t.quality });

    const buffer = Buffer.from(data, 'base64');
    const pubPath = path.join(PUBLIC_DIR, t.name);
    fs.writeFileSync(pubPath, buffer);
    console.log(`Generated ${t.name} (${t.size}x${t.size}, white border): ${buffer.length} bytes (${(buffer.length / 1024).toFixed(1)} KB)`);

    // Also copy icon.png and apple-icon.png to src/app for Next.js convention
    if (t.name === 'icon.png' || t.name === 'apple-icon.png') {
      fs.writeFileSync(path.join(APP_DIR, t.name), buffer);
    }
  }

  // Favicon.ico
  const fav32Buffer = fs.readFileSync(path.join(PUBLIC_DIR, 'favicon-32.png'));
  fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.ico'), fav32Buffer);
  fs.writeFileSync(path.join(APP_DIR, 'favicon.ico'), fav32Buffer);
  console.log('Updated favicon.ico in public/ and src/app/');

  await browser.close();
  console.log('All favicons and logos successfully updated with pure white borders!');
}

generateAssetsWithWhiteBorders().catch(console.error);
