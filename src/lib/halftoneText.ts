// HalftoneReveal 只接受图片纹理，文字要先排版画进 canvas 再当图片喂给它。
// createHalftoneCanvas 用同一套公式在 2D 画布上复刻一份静态网点，
// 供未悬停时使用 —— 这样列表页 12 张卡片不会同时开 12 个 WebGL 上下文。

export interface TextCanvasOptions {
  text: string;
  /** 逻辑像素（CSS px），与组件里的 uCell 同一单位 */
  width: number;
  height: number;
  font: string;
  lineHeight: number;
  color: string;
  paper: string;
  dpr: number;
  maxLines: number;
}

export interface HalftoneCanvasOptions {
  cellSize: number;
  angle: number;
  ink: string;
  paper: string;
  dpr: number;
  dotScale?: number;
}

const CJK = /[⺀-鿿豈-﫿＀-￯　-〿]/;

const parseRgb = (value: string): [number, number, number] => {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value.trim());
  if (hex) {
    const raw = hex[1];
    const full =
      raw.length === 3
        ? raw
            .split('')
            .map((c) => c + c)
            .join('')
        : raw;
    const n = parseInt(full, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const rgb = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i.exec(value);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  return [0, 0, 0];
};

const luma = (rgb: number[]): number => (rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722) / 255;

// 中文按字断行，西文按词断行，否则英文单词会被切碎
const tokenize = (text: string): string[] => {
  const tokens: string[] = [];
  let word = '';
  for (const char of text) {
    if (/\s/.test(char)) {
      if (word) {
        tokens.push(word);
        word = '';
      }
      tokens.push(' ');
    } else if (CJK.test(char)) {
      if (word) {
        tokens.push(word);
        word = '';
      }
      tokens.push(char);
    } else {
      word += char;
    }
  }
  if (word) tokens.push(word);
  return tokens;
};

export const wrapText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] => {
  const lines: string[] = [];
  let line = '';
  let truncated = false;

  for (const token of tokenize(text.replace(/\s+/g, ' ').trim())) {
    const candidate = line + token;
    if (line && ctx.measureText(candidate.trimEnd()).width > maxWidth) {
      // 这一行就是最后一行时不能再换行，改成省略号收尾
      if (lines.length + 1 >= maxLines) {
        truncated = true;
        break;
      }
      lines.push(line.trimEnd());
      line = token === ' ' ? '' : token;
    } else {
      line = candidate;
    }
  }

  if (truncated) {
    let last = line.trimEnd();
    // 每砍一个字符都要重新 trim，否则会留下 "学习 …" 这样的尾随空格
    while (last && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1).trimEnd();
    lines.push(`${last}…`);
  } else if (line.trim()) {
    lines.push(line.trimEnd());
  }

  return lines.slice(0, maxLines);
};

export const createTextCanvas = (options: TextCanvasOptions): HTMLCanvasElement => {
  const { text, width, height, font, lineHeight, color, paper, dpr, maxLines } = options;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * dpr));
  canvas.height = Math.max(1, Math.round(height * dpr));

  // 这张画布只当纹理用，不上屏，走 CPU 后端能让下面的 getImageData 免掉回读停顿
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;

  ctx.scale(dpr, dpr);
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, width, height);

  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  wrapText(ctx, text, width, maxLines).forEach((line, index) => {
    ctx.fillText(line, 0, index * lineHeight + lineHeight / 2);
  });

  return canvas;
};

// reach() 与 press() 抄自组件的片元着色器：网点面积等于该格的着墨比例，
// 所以半径是 sqrt(t/π)；超过 45% 着墨后改用线性外推让网点互相咬合（最多 0.72 格）
const reach = (t: number): number =>
  t < 0.785 ? Math.sqrt(t / Math.PI) : 0.5 + (0.72 - 0.5) * ((t - 0.785) / 0.215);

const press = (t: number): number => 0.05 + Math.min(1, Math.max(0, t)) * 0.89;

export const createHalftoneCanvas = (
  source: HTMLCanvasElement,
  options: HalftoneCanvasOptions
): HTMLCanvasElement => {
  const { cellSize, angle, ink, paper, dpr, dotScale = 1 } = options;
  const out = document.createElement('canvas');
  out.width = source.width;
  out.height = source.height;

  const ctx = out.getContext('2d');
  const reader = source.getContext('2d');
  if (!ctx || !reader || !out.width || !out.height) return out;

  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, out.width, out.height);

  const data = reader.getImageData(0, 0, out.width, out.height).data;
  const paperLuma = luma(parseRgb(paper));
  const inkLuma = luma(parseRgb(ink));
  const span = inkLuma - paperLuma;

  const step = Math.max(2, cellSize * dpr);
  const radians = (angle * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  // 网格旋转后要覆盖整个画布，索引范围取外接正方形的半径
  const extent = Math.ceil((out.width + out.height) / (2 * step)) + 2;
  const twoPi = Math.PI * 2;

  ctx.fillStyle = ink;
  for (let row = -extent; row <= extent; row += 1) {
    for (let column = -extent; column <= extent; column += 1) {
      // 着色器按格心取样（center() 把坐标吸附到格心），这里同样只取一个像素，
      // 细笔画才会出现和组件一致的断点感
      const gridX = (column + 0.5) * step;
      const gridY = (row + 0.5) * step;
      const x = cos * gridX - sin * gridY;
      const y = sin * gridX + cos * gridY;
      const sx = Math.floor(x);
      const sy = Math.floor(y);
      if (sx < 0 || sy < 0 || sx >= out.width || sy >= out.height) continue;

      const offset = (sy * out.width + sx) * 4;
      const shade =
        (data[offset] * 0.2126 + data[offset + 1] * 0.7152 + data[offset + 2] * 0.0722) / 255;
      const coverage = Math.abs(span) < 0.02 ? 1 - shade : (shade - paperLuma) / span;
      const radius = reach(press(coverage)) * step * dotScale;
      if (radius < 0.6) continue;

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, twoPi);
      ctx.fill();
    }
  }

  return out;
};
