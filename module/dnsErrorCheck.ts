"use strict";
import { DnsHeader } from "./dnsHeaderParser.ts";
export function dnsErrorCheck(header: DnsHeader): Error | void {
  if (header.RCODE === 5) {
    return new Error(
      "Refused - The name server refuses to perform the specified operation for policy reasons. For example, a name server may not wish to provide the information to the particular requester, or a name server may not wish to perform a particular operation (e.g., zone transfer) for particular data.",
    );
  }
  if (header.RCODE === 4) {
    return new Error(
      "Not Implemented - The name server does not support the requested kind of query.",
    );
  }
  if (header.RCODE === 3) {
    return new Error(
      "Name Error - Meaningful only for responses from an authoritative name server, this code signifies that the domain name referenced in the query does not exist.",
    );
  }
  if (header.RCODE === 2) {
    return new Error(
      "Server failure - The name server was unable to process this query due to a problem with the name server.",
    );
  }
  if (header.RCODE === 1) {
    return new Error(
      "Format Error - The name server was unable to interpret th query.",
    );
  }
}
