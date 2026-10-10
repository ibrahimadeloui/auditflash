import assert from "node:assert/strict";
import test from "node:test";
import { analyze } from "./analyze.ts";
import { demoExchange } from "./demo.ts";
import { isBlockedIp } from "./net.ts";
import { summarize } from "./score.ts";

test("les adresses privées sont refusées", () => {
  assert.equal(isBlockedIp("127.0.0.1"), true);
  assert.equal(isBlockedIp("10.1.2.3"), true);
  assert.equal(isBlockedIp("192.168.1.8"), true);
  assert.equal(isBlockedIp("169.254.169.254"), true);
  assert.equal(isBlockedIp("::1"), true);
  assert.equal(isBlockedIp("1.1.1.1"), false);
  assert.equal(isBlockedIp("8.8.8.8"), false);
});

test("la boutique de démo obtient un score faible et un correctif simulable", () => {
  const exchange = demoExchange();
  const { findings, stack } = analyze(exchange);
  const summary = summarize(findings);
  assert.equal(stack, "php");
  assert.ok(findings.some((finding) => finding.id === "header-frame"));
  assert.ok(findings.some((finding) => finding.id === "cms-wordpress"));
  assert.ok(findings.some((finding) => finding.id === "payment-public"));
  assert.equal(findings.some((finding) => finding.id === "secret-pattern"), false);
  assert.ok(summary.score < 35);
  assert.equal(summary.grade, "F");
  assert.ok(summary.lossMax > 1_000_000);

  const after = summarize(findings.filter((finding) => !finding.fixedByPatch));
  assert.ok(after.score > summary.score);
  assert.equal(after.grade, "A+");
});
