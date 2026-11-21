# PostBabel

Compare three supplier quotations for a 100-unit brief. Each supplier leaves a different evidence gap. Selecting a quote highlights its exact source phrase. The quote reference opens a signed record with the original wording and character offsets. Open the bilingual follow-up to ask for the missing detail.

The collector case compares four sample offers for POP MART’s **LABUBU Green Grape**. Follow a Chinese resale listing from its original wording through translation, registry checks, seller evidence and delivery comparison. Inspect the signed, hash-linked record in **Audit**.

- [Open PostBabel](https://openclaw-d.github.io/postbabel/)
- [简体中文版本](https://openclaw-d.github.io/postbabel/?lang=zh)
- [Run the built-in diagnostics](https://openclaw-d.github.io/postbabel/?selftest=1)

Switch between **EN** and **中文** in the top-right corner. The language choice is saved on this device. Source listings, hash values and bilingual seller drafts retain their original text.

Set your criteria on the homepage before comparing three supplier quotes or four collector listings. A six-axis chart pairs the selected requirements with the evidence in each offer. Read the original quote or a recorded follow-up from Duixi Core, produced locally from three synthetic calls in rules mode. The verification workspace contains the seven-step case, signed records, disputes and the version history.

### Local copy

Open `index.html` directly, or serve the directory with `python3 -m http.server 8000 --bind 127.0.0.1`. No build step or external service is required. The optional Ethereum signing library is loaded on demand in the local integration mode.

### Data and attribution

All prices, sellers, delivery promises, registry codes and attestations in this demonstration are simulated. The official-channel sample represents a later restock. A hash can verify the integrity of the evidence record. Physical inspection and brand verification are separate steps. The improvement scores are recorded fixture data and the blockchain checkpoint defaults to a dry run.

Product name and reference image are credited to POP MART. The character belongs to THE MONSTERS by Kasing Lung. This independent demonstration uses the **Exciting Macaron** series as a product reference. [Official series and Green Grape image](https://www.popmart.com/us/products/675/THE-MONSTERS---Exciting-Macaron-Vinyl-Face-Blind-Box).

The GitHub Pages version uses sample data and a recorded Jev result when available. Opening the public site incurs zero model calls. Optional live functionality runs through the separate local backend.

The faint architectural background is a crop of Pieter Bruegel the Elder’s *The Tower of Babel* (1563), Kunsthistorisches Museum, Vienna. [Artwork source](https://commons.wikimedia.org/wiki/File:Pieter_Bruegel_the_Elder_-_The_Tower_of_Babel_(Vienna)_-_Google_Art_Project_-_edited.jpg).

### Read API

The CDN serves versioned JSON for [the catalog](https://openclaw-d.github.io/postbabel/api/v1/catalog.json), [the sourcing brief](https://openclaw-d.github.io/postbabel/api/v1/sourcing.json), [the collector verdict](https://openclaw-d.github.io/postbabel/api/v1/verdict.json) and [Jev receipt status](https://openclaw-d.github.io/postbabel/api/v1/jev-base.json). Recorded model decisions can be reused without another paid request. The original-language source quote, monetary assumptions and missing evidence are available in the response.
