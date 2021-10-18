"use strict";
export function createDnsQuestion(
  recordType: "A" | "CNAME" | "MX" | "TXT" | "AAAA",
  url: string,
): Uint8Array {
  let queryType: number;
  switch (recordType) {
    case "A":
      queryType = 1;
      break;
    case "CNAME":
      queryType = 5;
      break;
    case "MX":
      queryType = 15;
      break;
    case "TXT":
      queryType = 16;
      break;
    case "AAAA":
      queryType = 28;
      break;
  }
  const queryHeader: number[] = [0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0];
  const queryQuestion: number[] = [];
  url.split(/\./g).forEach((q: string) => {
    const encodedQ = new TextEncoder().encode(q);
    queryQuestion.push(encodedQ.byteLength, ...encodedQ);
  });
  queryQuestion.push(0, 0, queryType, 0, 1);
  const question: Uint8Array = new Uint8Array([
    ...queryHeader,
    ...queryQuestion,
  ]);
  return question;
}
