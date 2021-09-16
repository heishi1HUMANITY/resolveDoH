export interface DoHResponse {
  raw: Uint8Array;
  rawAnswer: Uint8Array[];
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
  let queryType: number;
  switch (recordType) {
    case "A":
      queryType = 1;
      break;
    case "CNAME":
      queryType = 5;
      break;
    case "TXT":
      queryType = 16;
      break;
    case "AAAA":
      queryType = 28;
      break;
  }
  const id: Uint8Array = new Uint8Array(2);
  crypto.getRandomValues(id);
  const queryHeader: number[] = [...id, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0];
  const queryQuestion: number[] = [];
  query.split(/\./g).forEach((q) => {
    const encodedQ = new TextEncoder().encode(q);
    queryQuestion.push(encodedQ.byteLength, ...encodedQ);
  });
  queryQuestion.push(0, 0, queryType, 0, 1);
  const dnsMessage: Uint8Array = new Uint8Array([
    ...queryHeader,
    ...queryQuestion,
  ]);

  const f: Response = await fetch(server, {
    method: "POST",
    headers: {
      "accept": "application/dns-message",
      "content-type": "application/dns-message",
    },
    body: dnsMessage,
  });
  const b: Blob = await f.blob();
  const answer: Uint8Array = new Uint8Array(await b.arrayBuffer());
  if (!f.ok && f.headers.get("content-type") !== "application/dns-message") {
    throw new Error(new TextDecoder().decode(answer));
  }

  if ((answer[3] & 1) === 1) {
    throw new Error(
      "Format Error - The name server was unable to interpret th query.",
    );
  }
  if ((answer[3] & 2) === 2) {
    throw new Error(
      "Server failure - The name server was unable to process this query due to a problem with the name server.",
    );
  }
  if ((answer[3] & 3) === 3) {
    throw new Error(
      "Name Error - Meaningful only for responses from an authoritative name server, this code signifies that the domain name referenced in the query does not exist.",
    );
  }
  if ((answer[3] & 4) === 4) {
    throw new Error(
      "Not Implemented - The name server does not support the requested kind of query.",
    );
  }
  if ((answer[3] & 5) === 5) {
    throw new Error(
      "Refused - The name server refuses to perform the specified operation for policy reasons. For example, a name server may not wish to provide the information to the particular requester, or a name server may not wish to perform a particular operation (e.g., zone transfer) for particular data.",
    );
  }

  const QDCOUNT: number = parseInt(
    answer[4].toString(2).padStart(8, "0") +
      answer[5].toString(2).padStart(8, "0"),
    2,
  );
  const ANCOUNT: number = parseInt(
    answer[6].toString(2).padStart(8, "0") +
      answer[7].toString(2).padStart(8, "0"),
    2,
  );

  let position = 12;
  for (let i = 0; i < QDCOUNT; i++) {
    while (true) {
      const qlen: number = answer[position];
      if (qlen === 0) {
        position += 5;
        break;
      }
      position += (qlen + 1);
    }
  }

  const resp: DoHResponse = { raw: answer, rawAnswer: [], answer: [] };
  for (let _ = 0; _ < ANCOUNT; _++) {
    if ((answer[position] & 0b11000000) !== 0b11000000) {
      const tmp: number[] = [];
      while (true) {
        const nameLen = answer[position];
        if (nameLen === 0) {
          tmp.push(answer[position++]);
          break;
        }
        tmp.push(...answer.slice(position, position += nameLen));
      }
      tmp.push(...answer.slice(position, position += 8));
      const RDLENGTH = parseInt(
        answer[position].toString(2).padStart(8, "0") +
          answer[++position].toString(2).padStart(8, "0"),
        2,
      );
      tmp.push(...answer.slice(position, position += RDLENGTH));
      resp.rawAnswer.push(new Uint8Array(tmp));
      continue;
    }

    const tmp: number[] = [];
    const offset = parseInt(
      (answer[position] ^ 0b11000000).toString(2).padStart(8, "0") +
        answer[position + 1].toString(2).padStart(8, "0"),
      2,
    );
    tmp.push(...answer.slice(position, position += offset));
    const RDLENGTH = parseInt(
      answer[position - 2].toString(2).padStart(8, "0") +
        answer[position - 1].toString(2).padStart(8, "0"),
      2,
    );
    tmp.push(...answer.slice(position, position += RDLENGTH));
    resp.rawAnswer.push(new Uint8Array(tmp));
  }

  resp.rawAnswer.forEach((r) => {
    const resource: number[] = [];
    let type: number;
    if ((r[0] & 0b11000000) !== 0b11000000) {
      let i = 1;
      while (true) {
        const nameLen = r[i];
        if (nameLen === 0) {
          i++;
          break;
        }
        i += nameLen;
      }
      type = parseInt(
        r[i++].toString(2).padStart(8, "0") +
          r[i++].toString(2).padStart(8, "0"),
        2,
      );
      i += 4;
      const RDLENGTH = parseInt(
        r[i++].toString(2).padStart(8, "0") +
          r[i++].toString(2).padStart(8, "0"),
        2,
      );
      resource.push(...r.slice(i, i + RDLENGTH));
    } else {
      const offset = parseInt(
        (r[0] ^ 0b11000000).toString(2).padStart(8, "0") +
          r[1].toString(2).padStart(8, "0"),
        2,
      );
      type = parseInt(
        r[2].toString(2).padStart(8, "0") + r[3].toString(2).padStart(8, "0"),
        2,
      );
      const RDLENGTH = parseInt(
        r[offset - 2].toString(2).padStart(8, "0") +
          r[offset - 1].toString(2).padStart(8, "0"),
        2,
      );
      resource.push(...r.slice(offset, offset + RDLENGTH));
    }

    switch (type) {
      case 1: {
        const ipv4: string[] = resource.map((v) => v.toString());
        resp.answer.push(ipv4.join("."));
        break;
      }
      case 5: {
        const cname = [];
        for (let i = 0; i < resource.length; i++) {
          const len = resource[i++];
          if (len === 0) continue;
          const tmp = [];
          for (let j = 0; j < len; j++) {
            tmp.push(resource[i++]);
          }
          cname.push(new TextDecoder("ascii").decode(new Uint8Array(tmp)));
          i--;
        }
        resp.answer.push(cname.join("."));
        break;
      }
      case 16: {
        resource.shift();
        resp.answer.push(new TextDecoder().decode(new Uint8Array(resource)));
        break;
      }
      case 28: {
        const ipv6 = [];
        for (let i = 0; i < resource.length; i += 2) {
          ipv6.push(
            (resource[i].toString(16).padStart(2, "0") +
              resource[i + 1].toString(16).padStart(2, "0")).replace(/0*/, ""),
          );
          if (ipv6[ipv6.length - 1].length === 0) ipv6[ipv6.length - 1] = "0";
        }
        const tmp = [];
        let zero = [];
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
        }
        if (zero.length !== 0) {
          tmp.push(zero);
          zero = [];
        }
        tmp.sort((a, b) => b[1] - a[1]);
        if (tmp.length > 0) {
          ipv6.splice(tmp[0][0], tmp[0][1], "");
        }
        resp.answer.push(ipv6.join(":"));
        break;
      }
    }
  });

  return resp;
}
