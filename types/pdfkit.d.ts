declare module "pdfkit" {
  class PDFDocument {
    constructor(options?: any);
    on(event: string, callback: Function): void;
    addPage(): void;
    text(text: string, x?: number, y?: number, options?: any): this;
    fontSize(size: number): this;
    font(font: string): this;
    moveDown(n?: number): this;
    end(): void;
    page: {
      height: number;
    };
  }

  export = PDFDocument;
}
