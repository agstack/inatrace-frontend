# Products

A product is what a company sells and traces. This is where its details, its QR labels, the companies involved in making it, and the public-facing B2C page are configured.

![Products_icon](images/icon-products.svg)

Each company has its products, which are visible in the products tab which is opened by clicking the above icon.

## Product settings

Each product can contain information like name, picture, origin, data about social responsibility, environmental sustainability, etc. This is defined in the "Product settings".

## QR labels

For traceability, QR labels with product information are created here.

![Product_QR_labels](images/inatrace_product_qr.png)

## Stakeholders

Stakeholders are companies participating in the production of the final product. Companies from the system can be added here. Their roles can be:

- Buyer
- Importer
- Exporter
- Producer
- Association
- Processor
- Trader

![Product_stakeholders](images/inatrace_product_stakeholders.png)

### Supplier visibility in orders

The supplier facility selector in orders and processing actions uses the
`available-selling` facility endpoint. This is the rule for that selector, not a
universal rule for every INatrace feature:

- the user's company must be a **Buyer** on the product, and the supplier must be
  an **Exporter** on the same product; or
- the user's company must be an **Exporter** on the product, and the supplier must
  be a **Producer** on the same product;
- the supplier facility must be public, active and, when an item is selected,
  configured for that item;
- being only an **Owner** does not make a supplier eligible for this list.

Example: in the fictional Cashew4U chain, the buyer company is a **Buyer** on the
cashew product and the supplier company is an **Exporter** on the same product.
If the supplier is only an **Owner**, that supplier's facility will not appear in
the buyer's supplier selector, even though the company exists in the system.

If the selector is empty, check the roles above. If you cannot edit the product
stakeholders, ask an administrator to review them.

## Final products

Final products are retail products for sale to the end customers.

![Product_final_products](images/inatrace_product_final_product.png)

## B2C settings

The public-facing B2C page has editable colors, fonts and content to allow for corporate identity compliance. The settings are visible on `Product settings` and `QR labels` tabs.

The B2C configuration on the `Product settings` is automatically inherited by QR labels. If QR labels define another value, this value overrides the product values. This way QR labels inherit product settings by default, but can be changed on a label-by-label basis.

The following values can be customized:
- Colors
  - Primary
  - Secondary
  - Ternary
  - Quaternary
  - Header
  - Text
- Enable/disable tabs
  - Fair prices
  - Producers
  - Quality
  - Feedback
- Font (TTF, WOFF and WOFF2)
  - Product
  - Text
- Images
  - Header (PNG, JPG and JPEG)
  - Header background (PNG, JPG, JPEG and SVG)
  - Footer (PNG, JPG and JPEG)

![Product_B2C_settings](images/b2c_settings.png)
