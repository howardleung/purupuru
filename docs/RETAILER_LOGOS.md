# Retailer logo asset review

Retailer marks on PuruPuru are optional presentation assets. Offer identity and link behavior remain data-driven, and accessible linked text is the required fallback. The registry in `apps/web/lib/retailer-logos.ts` is keyed by the stable `Retailer.sourceKey`; display-name matching is not permitted.

Only repository-hosted artwork with reviewed provenance and sufficiently clear reuse terms may be added. Remote hotlinks, reconstructed marks, and assets copied from a retailer storefront without a reuse grant are not accepted. A mark must identify the exact retailer represented by the offer rather than merely a related manufacturer or parent brand.

## Current retailer review

Reviewed 2026-09-14 against both the seed and the configured development database.

| Retailer source key | Display name | Current presentation | Review note |
| --- | --- | --- | --- |
| `retailer:well-ca` | Well.ca | Text fallback | The official site has a press page and media contact, but no reusable logo kit or applicable permission was located. |
| `retailer:shoppers-drug-mart-ca` | Shoppers Drug Mart | Text fallback | The official legal terms reserve site content and prohibit copying it to another website without permission. A public brand guide does not itself grant PuruPuru reuse rights. |
| `retailer:round-lab-kr` | Round Lab Korea | Text fallback | Official storefront terms reserve logos and other site content; no applicable logo reuse grant was located. |
| `retailer:shiseido-beauty-key-jp` | Shiseido Beauty Key | Text fallback | Shiseido publishes corporate/brand imagery, but a grant for using the SHISEIDO mark as the Beauty Key retailer identity was not located. The related brand wordmark is not assumed to be the store mark. |
| `retailer:japanese-taste-ca` | Japanese Taste | Text fallback | Official terms state that logos and other intellectual property may not be used without express written consent. |

Olive Young and @cosme are not current `Retailer` offer records. They appear only as external evidence signals, so they are outside the offer-logo registry unless real retailer records and offers are deliberately added later.

## Sources reviewed

- Well.ca official press page: <https://well.ca/press>
- Shoppers Drug Mart official legal terms: <https://corporate.shoppersdrugmart.ca/en/legal/>
- Shoppers Drug Mart official Brand Hub Guide: <https://dis-prod.assetful.loblaw.ca/content/dam/loblaw-companies-limited/creative-assets/loblaw-media/adspecs/LM_Shoppers_Drug_Mart_Brand_Hub_Guide_2022-3.pdf>
- Round Lab official terms: <https://roundlab.com/policies/terms-of-service>
- Shiseido official company-name and logo history: <https://corp.shiseido.com/en/company/company-name/>
- Japanese Taste official terms: <https://int.japanesetaste.com/pages/terms-of-use>

Before adding an asset, record its exact source URL, retrieval date, relevant permission or license, dimensions, and any required attribution here. Trademark review remains separate from copyright provenance.
