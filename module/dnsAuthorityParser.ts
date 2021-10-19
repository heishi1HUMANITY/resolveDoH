"use strict";
import { Answer, dnsAnswerParser } from "./dnsAnswerParser.ts";
export type Authority = Answer;
export function dnsAuthorityParser(
  rawDnsMessage: Uint8Array,
  a: Uint8Array,
): Authority {
  return dnsAnswerParser(rawDnsMessage, a);
}
