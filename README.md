# resolveDoH

[![deno doc](https://doc.deno.land/badge.svg)](https://doc.deno.land/https/deno.land%2Fx%2Fresolvedoh%2Fmod.ts)
[![test](https://github.com/heishi1HUMANITY/resolveDoH/actions/workflows/test.yml/badge.svg)](https://github.com/heishi1HUMANITY/resolveDoH/actions/workflows/test.yml)

resolveDoH resolves domain name by "DNS Queries over HTTPS"
([RFC 8484](https://www.rfc-editor.org/info/rfc8484)).

## Supported record

- A
- AAAA
- CNAME
- MX
- TXT

## Usage

You need to prepare DoH server (e.g.
[Google Public DNS](https://dns.google/dns-query),
[OpenDNS](https://doh.opendns.com/dns-query)).

### A record

```typescript
import { resolveDoH } from "https://deno.land/x/resolvedoh/mod.ts";

const DoHServer = new URL("https://dns.google/dns-query");
const records = await resolveDoH(DoHServer, "example.com");
console.log(records.answer); // => [ "93.184.216.34" ]
```

### Another records

```typescript
import { resolveDoH } from "https://deno.land/x/resolvedoh@0.0.2/mod.ts";

const DoHServer = new URL("https://dns.google/dns-query");
const records = await resolveDoH(DoHServer, "example.com", "AAAA");
console.log(records.answer); // => ["2606:2800:220:1:248:1893:25c8:1946" ]
```
