declare module "html2pdf.js" {
  interface Html2PdfOptions {
    margin?: number | [number, number, number, number];
    filename?: string;
    image?: { type: string; quality: number };
    html2canvas?: any;
    jsPDF?: any;
  }

  interface Html2PdfInstance {
    set(options: Html2PdfOptions): Html2PdfInstance;
    from(element: HTMLElement): Html2PdfInstance;
    save(): Promise<void>;
    output(type: string): Promise<any>;
    toPdf(): any;
    toCanvas(): any;
  }

  function html2pdf(): Html2PdfInstance;
  function html2pdf(element: HTMLElement): Html2PdfInstance;
  function html2pdf(
    element: HTMLElement,
    options: Html2PdfOptions
  ): Html2PdfInstance;

  export default html2pdf;
}

declare global {
  interface Window {
    html2pdf: any;
  }
}
