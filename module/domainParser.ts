"use strict";
import { compressedMessageParser } from "./compressedMessageParser.ts";
export function domainParser(rawDnsMessage: Uint8Array, d: Uint8Array): string {
  let pointer = 0;
  let domain = "";
  while (true) {
    if ((d[pointer] & 0b11000000) === 0b11000000) {
      const decompressed: Uint8Array = compressedMessageParser(
        rawDnsMessage,
        parseInt(
          (d[pointer++] & 0b00111111).toString(2).padStart(8, "0") +
            d[pointer++].toString(2).padStart(8, "0"),
          2,
        ),
      );
      for (let i = 0; i < decompressed.length; i++) {
        const len: number = decompressed[i++];
        if (len === 0) break;
        domain += new TextDecoder().decode(decompressed.slice(i, i + len)) +
          ".";
        i += len - 1;
      }
      break;
    }
    const len: number = d[pointer++];
    if (len === 0) break;
    domain += new TextDecoder().decode(d.slice(pointer, pointer + len)) +
      ".";
    pointer += len;
  }
  return domain;
}
