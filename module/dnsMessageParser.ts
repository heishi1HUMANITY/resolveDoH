"use strict";
import { DnsHeader, dnsHeaderParser } from "./dnsHeaderParser.ts";
import { dnsQuestionParser, Question } from "./dnsQuestionParser.ts";
import { Answer, dnsAnswerParser } from "./dnsAnswerParser.ts";
export interface DnsMessage {
  header: DnsHeader;
  question: Question[];
  answer: Answer[];
}
export function dnsMessageParser(raw: Uint8Array): DnsMessage {
  const message: DnsMessage = {} as DnsMessage;
  message.header = dnsHeaderParser(raw);
  let pointer = 12;
  message.question = [];
  for (let i = 0; i < message.header.QDCOUNT; i++) {
    const qtmp: number[] = [];
    while (true) {
      if ((raw[pointer] & 0b11000000) === 0b11000000) {
        qtmp.push(raw[pointer++]);
        qtmp.push(raw[pointer++]);
        break;
      }
      const len: number = raw[pointer++];
      qtmp.push(len);
      if (len === 0) break;
      for (let j = 0; j < len; j++) {
        qtmp.push(raw[pointer++]);
      }
    }
    qtmp.push(raw[pointer++]);
    qtmp.push(raw[pointer++]);
    qtmp.push(raw[pointer++]);
    qtmp.push(raw[pointer++]);
    message.question.push(dnsQuestionParser(raw, new Uint8Array(qtmp)));
  }

  message.answer = [];
  for (let i = 0; i < message.header.ANCOUNT; i++) {
    const atmp: number[] = [];
    while (true) {
      if ((raw[pointer] & 0b11000000) === 0b11000000) {
        atmp.push(raw[pointer++]);
        atmp.push(raw[pointer++]);
        break;
      }
      const len: number = raw[pointer++];
      atmp.push(len);
      if (len === 0) break;
      for (let j = 0; j < len; j++) {
        atmp.push(raw[pointer++]);
      }
    }
    for (let j = 0; j < 10; j++) {
      atmp.push(raw[pointer++]);
    }
    const len: number = parseInt(
      atmp[atmp.length - 2].toString(2).padStart(8, "0") +
        atmp[atmp.length - 1].toString(2).padStart(8, "0"),
      2,
    );
    for (let j = 0; j < len; j++) {
      atmp.push(raw[pointer++]);
    }
    message.answer.push(dnsAnswerParser(raw, new Uint8Array(atmp)));
  }

  return message;
}
