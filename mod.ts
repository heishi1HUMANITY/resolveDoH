import { createDnsQuestion } from "./module/createDnsQuestion.ts";
import { DnsMessage, dnsMessageParser } from "./module/dnsMessageParser.ts";
import { dnsErrorCheck } from "./module/dnsErrorCheck.ts";
import { Answer } from "./module/dnsAnswerParser.ts";
import { answerParser } from "./module/answerParser.ts";

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
 * console.log(records.answer); // => [ "2606:2800:220:1:248:1893:25c8:1946" ]
 * ```
 *
 * @param {URL} server
 * @param {string} query
 * @param {"A" | "CNAME" | "PTR" | "MX" | "TXT" | "AAAA" | undefined} recordType
 * @returns {Promise<DoHResponse>}
 */
export async function resolveDoH(
  server: URL,
  query: string,
  recordType?: "A" | "CNAME" | "PTR" | "MX" | "TXT" | "AAAA",
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
    res.answer.push(answerParser(answer, ans));
  });
  return res;
}
