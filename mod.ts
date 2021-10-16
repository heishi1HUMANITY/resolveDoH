import { createDnsQuestion } from "./module/createDnsQuestion.ts";
import { DnsMessage, dnsMessageParser } from "./module/dnsMessageParser.ts";
import { dnsErrorCheck } from "./module/dnsErrorCheck.ts";
import { Answer } from "./module/dnsAnswerParser.ts";
import { compressedMessageParser } from "./module/compressedMessageParser.ts";

export interface DoHResponse {
  raw: Uint8Array;
  parsedMessage: DnsMessage;
  answer: string[];
}

/**
 * resolveDoH resolved domain name by "DNS Queries over HTTPS" (RFC 8484).
 * You need to prepare DoH server (e.g. Google Public DNS, OpenDNS).
 *
 * A record:
 *
 * ```
 * import { resolveDoH } from "https://deno.land/x/resolvedoh/mod.ts";
 *
 * const DoHServer = new URL("https://dns.google/dns-query");
 * const records = await resolveDoH(DoHServer, "example.com");
 * console.log(records.answer); // => [ "93.184.216.34" ]
 * ```
 *
 * Another records:
 *
 * ```
 * import { resolveDoH } from "https://deno.land/x/resolvedoh/mod.ts";
 *
 * const DoHServer = new URL("https://dns.google/dns-query");
 * const records = await resolveDoH(DoHServer, "example.com", "AAAA");
 * console.log(records.answer); // => ["2606:2800:220:1:248:1893:25c8:1946" ]
 * ```
 *
 * @param {URL} server
 * @param {string} query
 * @param {"A" | "CNAME" | "TXT" | "AAAA" | undefined} recordType
 * @returns {Promise<DoHResponse>}
 */
export async function resolveDoH(
  server: URL,
  query: string,
  recordType?: "A" | "CNAME" | "TXT" | "AAAA",
): Promise<DoHResponse> {
  recordType ??= "A";
  const dnsRequest: Uint8Array = createDnsQuestion(recordType, query);

  const f: Response = await fetch(server, {
    method: "POST",
    headers: {
      "accept": "application/dns-message",
      "content-type": "application/dns-message",
    },
    body: dnsRequest,
  });
  const b: Blob = await f.blob();
  const answer: Uint8Array = new Uint8Array(await b.arrayBuffer());
  if (!f.ok && f.headers.get("content-type") !== "application/dns-message") {
    throw new Error(new TextDecoder().decode(answer));
  }

  const dnsAnswer: DnsMessage = dnsMessageParser(answer);

  const dnsError: Error | void = dnsErrorCheck(dnsAnswer.header);
  if (dnsError) throw dnsError;

  const res = {} as DoHResponse;
  res.raw = answer;
  res.parsedMessage = dnsAnswer;
  res.answer = [];

  dnsAnswer.answer.forEach((ans: Answer) => {
    switch (ans.TYPE) {
      case 1: {
        const ipv4: string[] = [];
        ans.RDATA.forEach((v) => ipv4.push(v.toString()));
        res.answer.push(ipv4.join("."));
        break;
      }
      case 5: {
        let pointer = 0;
        let cname = "";
        while (true) {
          if ((ans.RDATA[pointer] & 0b11000000) === 0b11000000) {
            const decompressed: Uint8Array = compressedMessageParser(
              answer,
              parseInt(
                (ans.RDATA[pointer++] & 0b00111111).toString(2).padStart(
                  8,
                  "0",
                ) +
                  ans.RDATA[pointer++].toString(2).padStart(8, "0"),
                2,
              ),
            );
            for (let i = 0; i < decompressed.length; i++) {
              const len = decompressed[i++];
              if (len === 0) break;
              cname +=
                new TextDecoder().decode(decompressed.slice(i, i + len)) + ".";
              i += len - 1;
            }
            break;
          }
          const len: number = ans.RDATA[pointer++];
          if (len === 0) break;
          cname +=
            new TextDecoder().decode(ans.RDATA.slice(pointer, pointer + len)) +
            ".";
          pointer += len;
        }
        res.answer.push(cname);
        break;
      }
      case 16: {
        res.answer.push(new TextDecoder().decode(ans.RDATA.slice(1)));
        break;
      }
      case 28: {
        const ipv6 = [];
        for (let i = 0; i < ans.RDATA.length; i += 2) {
          ipv6.push(
            (ans.RDATA[i].toString(16).padStart(2, "0") +
              ans.RDATA[i + 1].toString(16).padStart(2, "0")).replace(/0*/, ""),
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
        res.answer.push(ipv6.join(":"));
      }
    }
  });
  return res;
}
