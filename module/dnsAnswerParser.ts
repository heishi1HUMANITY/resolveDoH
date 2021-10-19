"use strict";
import { compressedMessageParser } from "./compressedMessageParser.ts";
export interface Answer {
  NAME: string;
  TYPE: number;
  CLASS: number;
  TTL: number;
  RDLENGTH: number;
  RDATA: Uint8Array;
}
export function dnsAnswerParser(
  rawDnsMessage: Uint8Array,
  a: Uint8Array,
): Answer {
  const ANSWER = {} as Answer;
  let pointer = 0;
  while (true) {
    if ((a[pointer] & 0b11000000) === 0b11000000) {
      const decompressed: Uint8Array = compressedMessageParser(
        rawDnsMessage,
        parseInt(
          (a[pointer++] & 0b00111111).toString(2).padStart(8, "0") +
            a[pointer++].toString(2).padStart(8, "0"),
          2,
        ),
      );
      const ntmp: Uint8Array[] = [];
      for (let i = 0; i < decompressed.length; i++) {
        const len = decompressed[i++];
        if (len === 0) break;
        ntmp.push(decompressed.slice(i, i + len));
        i += len - 1;
      }
      ntmp.forEach((n: Uint8Array) => {
        ANSWER.NAME += new TextDecoder().decode(n) + ".";
      });
      break;
    }
    const len = a[pointer++];
    if (len === 0) break;
    ANSWER.NAME += new TextDecoder().decode(a.slice(pointer, pointer + len)) +
      ".";
    pointer += len;
  }
  ANSWER.TYPE = parseInt(
    a[pointer++].toString().padStart(8, "0") +
      a[pointer++].toString().padStart(8, "0"),
  );
  ANSWER.CLASS = parseInt(
    a[pointer++].toString().padStart(8, "0") +
      a[pointer++].toString().padStart(8, "0"),
  );
  ANSWER.TTL = parseInt(
    a[pointer++].toString().padStart(8, "0") +
      a[pointer++].toString().padStart(8, "0") +
      a[pointer++].toString().padStart(8, "0") +
      a[pointer++].toString().padStart(8, "0"),
  );
  ANSWER.RDLENGTH = parseInt(
    a[pointer++].toString().padStart(8, "0") +
      a[pointer++].toString().padStart(8, "0"),
  );
  ANSWER.RDATA = a.slice(pointer, a.length);
  return ANSWER;
}
