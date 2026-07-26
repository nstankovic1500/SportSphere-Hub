const DICEBEAR_STYLE = 'adventurer-neutral';

const buildDiceBearAvatarUrl = (seed: string) => {
  const encodedSeed = encodeURIComponent(seed.trim() || `sportsphere-${Date.now()}`);

  return `https://api.dicebear.com/9.x/${DICEBEAR_STYLE}/svg?seed=${encodedSeed}&backgroundType=gradientLinear`;
};

const loadImageFromUrl = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Nije moguće učitati avatar sliku.'));
    image.src = url;
  });

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Nije moguće obraditi avatar sliku.'));
    reader.readAsDataURL(blob);
  });

const generateAvatarPreview = async (seed: string) => {
  const response = await fetch(buildDiceBearAvatarUrl(seed));

  if (!response.ok) {
    throw new Error('Nije moguće generisati avatar.');
  }

  const svgMarkup = await response.text();
  const svgBlob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
  const svgDataUrl = await blobToDataUrl(svgBlob);

  return {
    previewUrl: svgDataUrl,
    seed,
  };
};

const avatarPreviewToPngFile = async (
  previewUrl: string,
  fileName = 'avatar.png',
) => {
  const image = await loadImageFromUrl(previewUrl);
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;

  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Nije moguće pripremiti avatar za slanje.');
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((result) => resolve(result), 'image/png');
  });

  if (!blob) {
    throw new Error('Nije moguće konvertovati avatar u PNG.');
  }

  return new File([blob], fileName, { type: 'image/png' });
};

export { avatarPreviewToPngFile, buildDiceBearAvatarUrl, generateAvatarPreview };
