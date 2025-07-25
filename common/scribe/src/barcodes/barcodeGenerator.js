import JsBarcode from 'jsbarcode';

const textToBase64Barcode = (text) => {
  const canvas = document.createElement('canvas');
  JsBarcode(canvas, text, { format: 'CODE39', fontSize: 28, textAlign: 'left', font: 'Times New Roman, Times, serif' });
  return canvas.toDataURL('image/png');
};

export default textToBase64Barcode;
