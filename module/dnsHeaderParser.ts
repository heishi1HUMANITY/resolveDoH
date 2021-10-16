"use strict";
export interface DnsHeader {
  ID: number;
  QR: "query" | "response";
  RCODE: number;
  QDCOUNT: number;
  ANCOUNT: number;
  NSCOUNT: number;
  ARCOUNT: number;
}
export function dnsHeaderParser(raw: Uint8Array): DnsHeader {
  const header: DnsHeader = {} as DnsHeader;
  header.ID = parseInt(
    raw[0].toString(2).padStart(8, "0") +
      raw[1].toString(2).padStart(8, "0"),
    2,
  );
  header.QR = ((raw[2] & 128) === 128) ? "response" : "query";
  header.RCODE = raw[3] & 15;
  header.QDCOUNT = parseInt(
    raw[4].toString(2).padStart(8, "0") +
      raw[5].toString(2).padStart(8, "0"),
    2,
  );
  header.ANCOUNT = parseInt(
    raw[6].toString(2).padStart(8, "0") +
      raw[7].toString(2).padStart(8, "0"),
    2,
  );
  header.NSCOUNT = parseInt(
    raw[8].toString(2).padStart(8, "0") +
      raw[9].toString(2).padStart(8, "0"),
    2,
  );
  header.ARCOUNT = parseInt(
    raw[10].toString(2).padStart(8, "0") +
      raw[11].toString(2).padStart(8, "0"),
    2,
  );
  return header;
}
