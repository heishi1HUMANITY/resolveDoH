"use strict";
export function compressedMessageParser(
  raw: Uint8Array,
  offset: number,
): Uint8Array {
  const res: number[] = [];
  let pointer = offset;
  while (true) {
    if ((raw[pointer] & 0b11000000) === 0b11000000) {
      res.push(
        ...compressedMessageParser(
          raw,
          parseInt(
            (raw[pointer++] & 0b00111111).toString(2).padStart(8, "0") +
              raw[pointer++].toString(2).padStart(8, "0"),
            2,
          ),
        ),
      );
      continue;
    }
    const len = raw[pointer++];
    res.push(len);
    if (len === 0) break;
    for (let i = 0; i < len; i++) {
      res.push(raw[pointer++]);
    }
  }
  return new Uint8Array(res);
}
