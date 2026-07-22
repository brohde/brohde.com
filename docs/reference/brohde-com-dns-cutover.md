# brohde.com DNS cutover

_Summary of the DNS work done for launch. The full pre-cutover record inventory, the step-by-step runbook, and account-specific values (record values, verification tokens, vestigial IPs, nameserver and zone identifiers) were removed from this file before the repo went public. They are operational infrastructure detail with no bearing on the AI-studio story, and any of the public records is rediscoverable with `dig` by anyone who needs it._

## What was done, and when

On 2026-07-18 (#176) brohde.com was cut over to Cloudflare (Free plan) so the domain could serve the site ahead of launch. The domain had previously served no website, but mail was already live on the domain, so the priority was moving DNS without breaking email.

- Every mail-related record was rebuilt in the new Cloudflare zone and verified record by record **before** the nameservers were changed, so email kept working across the switch.
- The nameservers were then repointed to Cloudflare. (An earlier assisted save had only updated the registrar form state, not the registry; Brian did the final save himself and the delegation took within minutes. The lesson logged at the time: registrar changes are verified at the TLD registry, never at the registrar's form.)
- After propagation the apex and www both served the site over HTTPS with a valid certificate and HSTS present, mail continued to resolve, and shared-link previews finally pointed at a domain that actually resolved.

Rollback was available throughout: pointing the nameservers back at the previous provider would have restored the pre-cutover state entirely.

A couple of housekeeping items were left as open calls for Brian at the time: two vestigial legacy DNS rows carried over DNS-only (delete after a quiet week), and the AI Crawl Control robots.txt training-block toggle (consider OFF given the LLM-readability goal).
