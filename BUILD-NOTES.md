# Build notes

**PostBabel · Shanghai Impact Hackathon · Cross Border Trade**

**What works.** A buyer selects a unit price of $40 or less, dispatch within seven days of payment, and freight included. Supplier B meets all three written terms at $35 per unit. A meets one and C meets none. The six-axis comparison links the findings to the Chinese quote and its translation. B’s edition is still unconfirmed. The buyer can copy a bilingual request for the batch label and proof of authorised supply.

**Sample data and integrations.** The prototype runs in the browser on static JSON. Supplier quotes, call excerpts and the four collector listings are simulated. Registry checks and the blockchain checkpoint are demonstrations. The browser signs and hashes the text it records. Physical authenticity and supplier identity still need independent evidence.

**Pre-existing work.** We adapted the six-axis layout from SEAL and used Duixi Core’s local text rules to prepare follow-up suggestions for three sample call excerpts. The artwork is Bruegel’s *Tower of Babel*. The product reference shows Green Grape from POP MART’s THE MONSTERS by Kasing Lung. [Painting source](https://commons.wikimedia.org/wiki/File:Pieter_Bruegel_the_Elder_-_The_Tower_of_Babel_(Vienna)_-_Google_Art_Project_-_edited.jpg) · [Product image](https://www.popmart.com/us/products/675/THE-MONSTERS---Exciting-Macaron-Vinyl-Face-Blind-Box)

<details>
<summary>Run a local copy</summary>

From the repository root, run `python3 -m http.server 8000 --bind 127.0.0.1 --directory docs` and open [the local prototype](http://127.0.0.1:8000/). Select **EN** or **中文** in the header.

</details>
