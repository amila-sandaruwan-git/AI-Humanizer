declare module 'pdf-parse' {
  interface PDFData {
    text: string;
    numpages: number;
    info: {
      PDFFormatVersion: string;
      IsAcroFormPresent: boolean;
      IsXFAPresent: boolean;
      Author?: string;
      Creator?: string;
      Producer?: string;
      CreationDate?: string;
      ModDate?: string;
    };
    metadata: any;
  }

  function pdfParse(dataBuffer: ArrayBuffer | Buffer, options?: any): Promise<PDFData>;
  
  export default pdfParse;
}