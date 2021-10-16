"use strict";
import { compressedMessageParser } from "./compressedMessageParser.ts";
export interface Question {
  QNAME: string;
  QTYPE: number;
  QCLASS: number;
}
export function dnsQuestionParser(
  rawDnsMessage: Uint8Array,
  q: Uint8Array,
): Question {
  const QUESTION = {} as Question;
  let pointer = 0;
  QUESTION.QNAME = "";
  while (true) {
    if ((q[pointer] & 0b11000000) === 0b11000000) {
      const decompressed: Uint8Array = compressedMessageParser(
        rawDnsMessage,
        parseInt(
          (q[pointer++] & 0b00111111).toString(2).padStart(8, "0") +
            q[pointer++].toString(2).padStart(8, "0"),
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
        QUESTION.QNAME += new TextDecoder().decode(n) + ".";
      });
      break;
    }
    const len = q[pointer++];
    if (len === 0) break;
    QUESTION.QNAME +=
      new TextDecoder().decode(q.slice(pointer, pointer + len)) + ".";
    pointer += len;
  }
  QUESTION.QTYPE = parseInt(
    q[pointer++].toString().padStart(8, "0") +
      q[pointer++].toString().padStart(8, "0"),
  );
  QUESTION.QCLASS = parseInt(
    q[pointer++].toString().padStart(8, "0") +
      q[pointer].toString().padStart(8, "0"),
  );
  return QUESTION;
}
