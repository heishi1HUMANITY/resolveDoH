# resolveDoH

resolveDoH resolves domain name by "DNS Queries over HTTPS"
([RFC 8484](https://www.rfc-editor.org/info/rfc8484)).

## Supported record

- A
- AAAA
- CNAME
- TXT

## Usage

You need to prepare DoH server (e.g.
[Google Public DNS](https://dns.google/dns-query),
[OpenDNS](https://doh.opendns.com/dns-query)).

### A record

```typescript
import { resolveDoH } from "https://raw.githubusercontent.com/heishi1HUMANITY/resolveDoH/main/mod.ts";

const DoHServer = new URL("https://dns.google/dns-query");
const records = await resolveDoH(DoHServer, "example.com");
console.log(records.answer); // => [ "93.184.216.34" ]
```

### Another records

```typescript
import { resolveDoH } from "https://raw.githubusercontent.com/heishi1HUMANITY/resolveDoH/main/mod.ts";

const DoHServer = new URL("https://dns.google/dns-query");
const records = await resolveDoH(DoHServer, "example.com", "AAAA");
console.log(records.answer); // => ["2606:2800:220:1:248:1893:25c8:1946" ]
```
