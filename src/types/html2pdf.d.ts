declare module 'html2pdf.js' {
  interface Html2PdfInstance {
    set(options: object): Html2PdfInstance
    from(element: HTMLElement): Html2PdfInstance
    save(): Promise<void>
    output(type: string, options?: object): Promise<Blob | string>
  }
  function html2pdf(): Html2PdfInstance
  function html2pdf(element: HTMLElement, options?: object): Html2PdfInstance
  export = html2pdf
}
