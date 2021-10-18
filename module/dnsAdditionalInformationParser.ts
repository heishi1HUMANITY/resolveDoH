'use strict';
import { Answer, dnsAnswerParser } from './dnsAnswerParser.ts';
export type AdditionalInformation = Answer;
export function dnsAdditionalInformationParser(rawDnsMessage: Uint8Array, a: Uint8Array,): AdditionalInformation {
  return dnsAnswerParser(rawDnsMessage, a);
}