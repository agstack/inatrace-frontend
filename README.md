# INATrace

Open-source blockchain-based track and trace system for an agricultural commodities (such as coffee) supply
chain run. It provides transparency and creation of trust through
digitalization of supply chains, connects every actor along the supply chain, assures quality and fair pricing.

Project is composed of 4 parts, coordinated from the [INATrace project hub](https://github.com/agstack/inatrace) (project-wide documentation and governance):

* [Frontend application](https://github.com/agstack/inatrace-frontend)
* [Mobile app](https://github.com/agstack/inatrace-mobile)
* [Java backend](https://github.com/agstack/inatrace-backend)
* [Coffee network](https://github.com/agstack/inatrace-coffee-network)

# Frontend

The Angular web application: where cooperatives and their partners configure
products and value chains, record deliveries, processing and payments, and
manage farmers.

## Quick start

```bash
nvm use                   # Node 14, from .nvmrc
npm install
npm run generate-api      # generates the API client from the Java backend
npm run dev               # http://localhost:4200
```

`npm run generate-api` needs the backend running, and the dev server needs an
`environment.dev.ts`. Both are covered in
[docs/getting-started.md](docs/getting-started.md).

## Documentation

| Page | What it covers |
|---|---|
| [Getting started](docs/getting-started.md) | Requirements, running locally, tests, ports, regenerating the API client |
| [Using INATrace](docs/user-interface.md) | Welcome page, registration, the home screen |
| [Products](docs/products.md) | Product settings, QR labels, stakeholders, final products, B2C page |
| [Company operations](docs/companies.md) | Deliveries, processing, payments, farmers and collectors |
| [Dashboard](docs/dashboard.md) | Delivery and processing-performance reporting |
| [System settings](docs/settings.md) | Companies, users, types, value chains, currencies |
| [Building](docs/building.md) | Production build, the Docker image and its runtime settings |

These pages are written to be read on GitHub, and are also published at
<https://docs.agstack.org/> — which imports this `docs/` directory directly, so
editing them here updates the site.

## Contribution

Project INATrace welcomes contribution from everyone. See CONTRIBUTING.md for help to get started.

## License

Copyright (c) 2023 Antje ECG d.o.o., GIZ - Deutsche Gesellschaft für Internationale Zusammenarbeit GmbH, Sunesis ltd.

This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
If a copy of the MPL was not distributed with this file, you can obtain one at
https://mozilla.org/MPL/2.0/. The full text is in [LICENSE](LICENSE).
