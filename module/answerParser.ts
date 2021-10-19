"use strict";
import { Answer } from "./dnsAnswerParser.ts";
import { domainParser } from "./domainParser.ts";

export function answerParser(
  rawDnsMessage: Uint8Array,
  answer: Answer,
): string {
  switch (answer.TYPE) {
    case 1: {
      const ipv4: string[] = [];
      answer.RDATA.forEach((v: number) => ipv4.push(v.toString()));
      return ipv4.join(".");
    }
    case 5: {
      return domainParser(rawDnsMessage, answer.RDATA);
    }
    case 12: {
      return domainParser(rawDnsMessage, answer.RDATA);
    }
    case 15: {
      const preference = parseInt(
        answer.RDATA[0].toString(2).padStart(8, "0") +
          answer.RDATA[1].toString(2).padStart(8, "0"),
        2,
      );
      const exchange = domainParser(rawDnsMessage, answer.RDATA.slice(2));
      return `${preference} ${exchange}`;
    }
    case 16: {
      return new TextDecoder().decode(answer.RDATA.slice(1));
    }
    case 28: {
      const ipv6 = [];
      for (let i = 0; i < answer.RDATA.length; i += 2) {
        ipv6.push(
          (answer.RDATA[i].toString(16).padStart(2, "0") +
            answer.RDATA[i + 1].toString(16).padStart(2, "0")).replace(
              /0*/,
              "",
            ),
        );
        if (ipv6[ipv6.length - 1].length === 0) ipv6[ipv6.length - 1] = "0";
      }
      const tmp = [];
      let zero: number[] = [];
      for (let i = 0; i < ipv6.length; i++) {
        if (ipv6[i] === "0") {
          if (zero.length === 0) {
            zero[0] = i;
            zero[1] = 1;
            continue;
          }
          zero[1]++;
          continue;
        }
        if (zero.length !== 0) {
          tmp.push(zero);
          zero = [];
        }
      }
      tmp.sort((a, b) => b[1] - a[1]);
      if (tmp.length > 0) {
        ipv6.splice(tmp[0][0], tmp[0][1], "");
      }
      return ipv6.join(":");
    }
    default: {
      return "";
    }
  }
}
