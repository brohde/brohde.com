# brohde.com DNS cutover runbook + record inventory

_Captured live 2026-07-17, pre-cutover. Registrar: DreamHost. Nameservers: ns1/ns2/ns3.dreamhost.com. The domain serves NO website today (no A/AAAA/www records), but EMAIL IS LIVE at Migadu: every record below must exist in the Cloudflare zone BEFORE nameservers flip, or brian@brohde.com breaks._

## Records that must survive (verified by external dig)

| Type | Name | Value | Notes |
| --- | --- | --- | --- |
| MX | @ | 10 aspmx1.migadu.com | DNS only |
| MX | @ | 20 aspmx2.migadu.com | DNS only |
| TXT | @ | "v=spf1 include:spf.migadu.com -all" | SPF |
| TXT | @ | "hosted-email-verify=zzw7fdhu" | Migadu domain verification |
| TXT | _dmarc | "v=DMARC1; p=quarantine;" | DMARC |
| CNAME | key1._domainkey | key1.brohde.com._domainkey.migadu.com | DKIM, DNS only |
| CNAME | key2._domainkey | key2.brohde.com._domainkey.migadu.com | DKIM, DNS only |
| CNAME | key3._domainkey | key3.brohde.com._domainkey.migadu.com | DKIM, DNS only |

CORRECTED at zone build (the external dig inventory above was incomplete; the assist verified against DreamHost's authoritative servers): THREE Migadu SRV records also exist and were kept (_autodiscover._tcp 0 1 443 autodiscover.migadu.com; _imaps._tcp 0 1 993 imap.migadu.com; _pop3s._tcp 0 1 995 pop.migadu.com), and TWO vestigial DreamHost A records exist (local 76.21.34.198; mysql 208.113.245.188), carried over DNS-only, deletion pending Brian's call. Cloudflare's scan missed the DKIM CNAMEs; the assist added them from dig-verified values. SOA serial 2026071502 (zone last edited 2026-07-15).

## Zone state in Cloudflare (built 2026-07-17, pre-flip)

13 records, ALL DNS only: the 8 mail-critical rows from the table above, the 3 SRV rows, and the 2 vestigial A rows. Assigned nameservers: alec.ns.cloudflare.com + robin.ns.cloudflare.com. AI Crawl Control left at Cloudflare defaults (Search Allow, Agent Allow, robots.txt training block ON; the training block is an open call for Brian given the LLM-readability goal).

## Cutover sequence

1. Cloudflare (Brian's account, the one holding the brohde-com Pages project): Add site brohde.com, Free plan. Verify the scanned import against the table above; add anything missing by hand. MX, TXT, and the DKIM CNAMEs stay DNS only (grey cloud).
2. Note the two Cloudflare nameservers assigned to the zone.
3. DreamHost panel (Brian logs in himself): domain brohde.com, change nameservers from ns1/2/3.dreamhost.com to the two Cloudflare ones.
4. Cloudflare, Workers and Pages, brohde-com project, Custom domains: add brohde.com AND www.brohde.com (records auto-created once the zone is active).
5. After propagation: verify per the checks below. Optional polish: a redirect rule www to apex 301 (canonicals already point at the apex).

## Post-cutover verification

- dig +short brohde.com NS shows the Cloudflare pair
- curl -sI https://brohde.com/ returns 200 with the site (and www resolves)
- dig MX/TXT/DKIM against the new zone matches the table exactly
- iMessage preview of a shared link now matches a domain that actually resolves
- Optional (Brian): send + receive one test email through brian@brohde.com

## Rollback

DreamHost keeps the old zone; pointing nameservers back at ns1/2/3.dreamhost.com restores the pre-cutover state entirely.

## Completion record (2026-07-18, #176)

The 2026-07-17 nameserver save at DreamHost never reached the com registry: the browser assist clicked Save and verified the form values survived a page reload, but that is form state, not registry state, and the change did not take. Brian clicked Save himself on 2026-07-18 and the registry flipped to alec + robin within minutes. Verification for registrar changes happens at the TLD registry (dig NS domain @a.gtld-servers.net +norecurse), never at the form.

Completed sequence and evidence:

- Registry delegation: alec.ns.cloudflare.com + robin.ns.cloudflare.com at a.gtld-servers.net
- Mail through the new zone: all 11 records exact vs the inventory above (2 MX, SPF, verify TXT, DMARC, 3 DKIM CNAMEs, 3 SRV), queried against alec directly
- Zone: Active (pending banner cleared on the third "Check nameservers now" click)
- Pages custom domains: brohde.com and www.brohde.com attached to the brohde-com project, proxied CNAMEs to brohde-com.pages.dev
- Site: HTTP/2 200 on https://brohde.com and https://www.brohde.com, homepage title served, cert CN=brohde.com valid 2026-07-18 to 2026-10-16, HSTS present

Still open (Brian's calls): optional send + receive test through brian@brohde.com; delete vs keep the vestigial local/mysql A rows (rec: delete after a quiet week); AI Crawl Control robots.txt training block ON vs OFF (rec: consider OFF given the LLM-readability goal).
