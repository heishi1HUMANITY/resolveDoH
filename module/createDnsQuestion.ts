"use strict";
export function createDnsQuestion(
  recordType: "A" | "CNAME" | "PTR" | "MX" | "TXT" | "AAAA",
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
    case "PTR":
      queryType = 12;
      if (!url.match(/(.|)(in-addr.arpa|ip6.arpa)(.|)/)) {
        url = url.replace(/(.|)(in-addr.arpa|ip6.arpa)(.|)/, "");
        if (url.includes(":") === true) {
          let ipv6: string[] = url.split(":");
          if (ipv6.includes("") === true) {
            ipv6 = [
              ...ipv6.slice(0, ipv6.indexOf("")),
              ...Array(8 - (ipv6.length - 1)).fill("0"),
              ...ipv6.slice(ipv6.indexOf("") + 1, ipv6.length),
            ];
          }
          ipv6.reverse();
          url = "";
          ipv6.forEach((ip: string) => {
            url += Array.from(ip.padStart(4, "0")).reverse().join(".") + ".";
          });
          url += "ip6.arpa";
          break;
        }
        url = url.split(".").reverse().join(".") + ".in-addr.arpa";
        break;
      }
      url = url.replace(/\.$/, "");
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
