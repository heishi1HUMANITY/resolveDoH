import { resolveDoH } from "https://raw.githubusercontent.com/heishi1HUMANITY/resolveDoH/main/mod.ts";
import {
  bench,
  runBenchmarks,
} from "https://deno.land/std@0.103.0/testing/bench.ts";

const domain = "www.example.com";
const resolver = new URL("https://dns64.dns.google/dns-query");

bench({
  name: "resolveDoH speed",
  runs: 1,
  func: async (b) => {
    b.start();
    await resolveDoH(resolver, domain);
    b.stop();
  },
});

bench({
  name: "Deno.resolveDns speed",
  runs: 1,
  func: async (b) => {
    b.start();
    await Deno.resolveDns(domain, "A");
    b.stop();
  },
});

runBenchmarks();