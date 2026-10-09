# Third-party components

## PDF.js / pdfjs-dist 6.4.299

- Project: https://github.com/mozilla/pdf.js
- Distribution: https://registry.npmjs.org/pdfjs-dist/-/pdfjs-dist-6.4.299.tgz
- Main license: Apache License 2.0, retained at `vendor/pdfjs/LICENSE`
- Package version and integrity: `vendor/pdfjs/version.json`
- The unmodified legacy display and worker bundles are included as `pdf.mjs` and `pdf.worker.mjs`
- The full generic viewer, annotations/scripting UI, unused QuickJS sandbox, source maps, and Node dependencies are omitted
- Runtime resources are served from this app's own `vendor/` folder, not a CDN

Additional retained notices:

- Bundled core-js 3.50.0 (MIT): `vendor/pdfjs/LICENSE_CORE_JS`
- Adobe CMaps: `vendor/pdfjs/cmaps/LICENSE`
- Foxit standard fonts: `vendor/pdfjs/standard_fonts/LICENSE_FOXIT`
- Liberation standard fonts: `vendor/pdfjs/standard_fonts/LICENSE_LIBERATION`
- JBIG2: `vendor/pdfjs/wasm/LICENSE_JBIG2`, `LICENSE_PDFJS_JBIG2`
- OpenJPEG: `vendor/pdfjs/wasm/LICENSE_OPENJPEG`, `LICENSE_PDFJS_OPENJPEG`
- QCMS: `vendor/pdfjs/wasm/LICENSE_QCMS`, `LICENSE_PDFJS_QCMS`

The original license texts and copyright notices are kept alongside the files. Retain them when redistributing. The fonts and WASM components have their own terms; the app's eventual license does not replace those terms. Upstream sources and build scripts for the distributed PDF.js resources are available in the PDF.js repository at tag `v6.4.299` and the upstream projects identified by those notices.

## Application files

No application-wide license has been selected. See `docs/LICENSE-選択について.md`. The MIT template is not applied automatically.

## User documents

No event PDF, map image, or extracted booth coordinate set is included. User-imported PDFs and their derived local images remain the user's responsibility and are not granted any license by this project.
