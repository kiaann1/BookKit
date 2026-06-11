export function isValidPdfBuffer(buffer: Buffer) {
  return (
    buffer.byteLength >= 5 &&
    buffer.subarray(0, 5).toString("utf8") === "%PDF-"
  );
}
