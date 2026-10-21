import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

/**
 * Render a Code128 barcode onto an SVG element
 */
export function renderBarcodeSvg(
  svgElement: SVGSVGElement | null,
  text: string,
  options?: {
    height?: number;
    width?: number;
    displayValue?: boolean;
    fontSize?: number;
    font?: string;
  }
) {
  if (!svgElement || !text) return;

  try {
    JsBarcode(svgElement, text, {
      format: 'CODE128',
      lineColor: '#000000',
      width: options?.width ?? 2,
      height: options?.height ?? 50,
      displayValue: options?.displayValue ?? true,
      fontSize: options?.fontSize ?? 13,
      font: options?.font ?? 'JetBrains Mono',
      margin: 6,
      background: '#ffffff',
    });
  } catch (err) {
    console.error('Failed to render barcode:', err);
  }
}

/**
 * Generate QR Code data URL
 */
export async function generateQrCodeDataUrl(data: string): Promise<string> {
  try {
    return await QRCode.toDataURL(data, {
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('Failed to generate QR Code:', err);
    return '';
  }
}

/**
 * Auto-generate a unique 13-digit barcode
 */
export function generateRandomBarcode(): string {
  const prefix = '628'; // GS1 prefix
  const middle = Math.floor(10000000 + Math.random() * 90000000).toString();
  const raw11 = prefix + middle;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(raw11[i] || '0', 10);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return raw11.slice(0, 12) + checkDigit.toString();
}
