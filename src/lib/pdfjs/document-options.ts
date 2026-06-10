/** PDF.js asset paths — cmaps/wasm are copied to /public/pdfjs on postinstall. */
export function getPdfJsDocumentOptions(version: string) {
  return {
    cMapUrl: "/pdfjs/cmaps/",
    cMapPacked: true,
    standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${version}/standard_fonts/`,
    wasmUrl: "/pdfjs/wasm/",
    useSystemFonts: true,
  };
}
