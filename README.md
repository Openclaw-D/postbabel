# PostBabel

Compare four sample offers for POP MART’s **LABUBU Green Grape**. Follow a Chinese resale listing from its original wording through translation, registry checks, seller evidence and delivery comparison. Inspect the signed, hash-linked record in **Audit**.

- [Open the demo](https://openclaw-d.github.io/postbabel/)
- [Play the guided replay](https://openclaw-d.github.io/postbabel/?demo=1)
- [Run the built-in diagnostics](https://openclaw-d.github.io/postbabel/?selftest=1)

Choose **Start manually** to use the interactive console. The **Verdict** step includes an all-fail scenario. The Audit, Network and Evolve tabs operate on the same in-memory claim tape. Refresh starts a new session.

### Local copy

Open `index.html` directly, or serve the directory with `python3 -m http.server 8000 --bind 127.0.0.1`. No build step or external service is required. The optional Ethereum signing library is loaded on demand in the local integration mode.

### Data and attribution

All prices, sellers, delivery promises, registry codes and attestations in this demonstration are simulated. The official-channel sample represents a later restock. A hash can verify the integrity of the evidence record. Physical inspection and brand verification are separate steps. The improvement scores are recorded fixture data and the blockchain checkpoint defaults to a dry run.

Product name and reference image are credited to POP MART. The character belongs to THE MONSTERS by Kasing Lung. This independent demonstration uses the **Exciting Macaron** series as a product reference. [Official series and Green Grape image](https://www.popmart.com/us/products/675/THE-MONSTERS---Exciting-Macaron-Vinyl-Face-Blind-Box).

The GitHub Pages version uses sample data and a recorded Jev result when available. Opening the public demo incurs zero model calls. Optional live functionality runs through the separate local backend.
