import { resolveDoH } from "./mod.ts";
import {
  assertEquals,
  assertThrowsAsync,
} from "https://deno.land/std@0.103.0/testing/asserts.ts";

const domain = "www.example.com";
const server = new URL("https://doh.opendns.com/dns-query");

Deno.test({
  name: "A record",
  fn: async (): Promise<void> => {
    const res = await resolveDoH(server, domain);
    assertEquals(["93.184.216.34"], res.answer);
  },
});

Deno.test({
  name: "AAAA record",
  fn: async (): Promise<void> => {
    const res = await resolveDoH(server, domain, "AAAA");
    assertEquals(["2606:2800:220:1:248:1893:25c8:1946"], res.answer);
  },
});

Deno.test({
  name: "TXT record",
  fn: async (): Promise<void> => {
    const res = await resolveDoH(server, domain, "TXT");
    assertEquals(["v=spf1 -all"], res.answer);
  },
});

Deno.test({
  name: "CNAME record",
  fn: async (): Promise<void> => {
    const res = await resolveDoH(server, domain, "CNAME");
    assertEquals([], res.answer);
  },
});

Deno.test({
  name: "format error",
  fn: async (): Promise<void> => {
    await assertThrowsAsync(
      async () => await resolveDoH(server, "hoge"),
      Error,
      "Name Error - Meaningful only for responses from an authoritative name server, this code signifies that the domain name referenced in the query does not exist.",
    );
  },
});
