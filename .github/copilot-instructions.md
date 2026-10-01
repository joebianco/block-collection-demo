# Repository instructions

## Commands

Use Node.js 20, matching `.github/workflows/main.yaml`.

Run from the repository root:

```sh
npm ci
npm run lint           # JavaScript, then CSS; also run by root CI
npm run lint:js        # eslint .
npm run lint:css       # blocks/**/*.css and styles/*.css
npm run build:json     # regenerate all three root UE component JSON files
```

For a focused lint check, use `npx eslint blocks/cards/cards.js` or
`npx stylelint blocks/cards/cards.css`.

Local site development uses the AEM CLI, not the experimentation test server:
install `@adobe/aem-cli` globally and run `aem up` from the root, as described
in `README.md`.

The experimentation plugin has its own package and Playwright suite. Run these
commands from `plugins/experimentation`:

```sh
npm install
npx playwright install chromium
npm run lint
npm test
npm test -- tests/experiments.test.js
npm test -- tests/experiments.test.js --grep '^Page-level experiments Replaces the page content with the variant\.$'
```

Playwright starts `npm run start` automatically at `http://127.0.0.1:3000`
and uses the `Desktop Chrome` project. Tests serve the plugin's
`tests/fixtures`, including their own `scripts.js` and `aem.js`; they do not
exercise the site's root page loader.

## Architecture

This is an AEM Edge Delivery Services block collection customized for DA live
preview. `fstab.yaml` mounts authored markup from
`https://content.da.live/joebianco/block-collection-demo/`. The browser consumes
native JavaScript modules and CSS directly: `head.html` loads `scripts/aem.js`,
`scripts/scripts.js`, and `styles/styles.css`.

`scripts/aem.js` provides shared block, section, metadata, image, and loading
helpers. `scripts/scripts.js` owns site orchestration and exports
`decorateMain` and `loadPage`. Preserve the loading order:

- **Eager:** run content experimentation before decoration, decorate the main
  content, then load the first section and wait for its first image.
- **Lazy:** load the preview experimentation UI when permitted, remaining
  sections, header/footer, lazy styles, fonts, and Quick Edit listeners.
- **Delayed:** import `scripts/delayed.js` after three seconds.

Blocks live at `blocks/<name>/<name>.js` and `.css`. The runtime derives the
block name from its first CSS class, dynamically loads both assets using
`window.hlx.codeBasePath`, and awaits the module's default decorator.
`blocks/fragment/fragment.js` fetches `<path>.plain.html` and reuses
`decorateMain` and `loadSections`, so shared decoration changes affect
fragments as well as full pages.

`scripts/experiment-loader.js` bridges the site to
`plugins/experimentation/src/index.js`. Eager activation checks page metadata
and section metadata for experiments, campaigns, or audiences. Lazy loading
is preview-gated; `scripts/scripts.js` additionally skips that UI for
`dapreview`. Production host and audience predicates are configured in
`experimentationConfig`; the current `prodHost` is the placeholder
`www.mysite.com`.

## Codebase conventions

- A block decorator receives authored row/cell DOM and transforms it in place.
  Reuse helpers from `scripts/aem.js`, such as `createOptimizedPicture`,
  rather than bypassing the shared loading and media pipeline.
- Site section decoration is implemented locally in `scripts/scripts.js`.
  It unwraps DA `richtext` classes into default-content wrappers, creates
  `.section` containers, and consumes `section-metadata`. The `style` field
  becomes normalized CSS classes; other fields become camel-cased dataset
  entries. Preserve this authored-content contract.
- Universal Editor source models are `ue/models/*.json` and
  `ue/models/blocks/*.json`. Block files combine `definitions`, `models`, and
  `filters`; aggregate files use `"..."` JSON references. Edit those sources
  and regenerate root `component-definition.json`, `component-models.json`,
  and `component-filters.json` with `npm run build:json`.
- For a UE-enabled block, align definition IDs, model/filter references, DA
  row/cell selectors, and the allowed components in `ue/models/section.json`.
  Container filters specify allowed child components. Block-option fields
  use `classes` or `classes_<suffix>` as documented in `ue/README.md`.
- UE support loads before page decoration on `.ue.da.live` and
  `.stage-ue.da.live` hosts. `ue/scripts/ue.js` uses
  `moveInstrumentation` from `ue/scripts/ue-utils.js` to transfer `data-aue-*`
  and `data-richtext-*` attributes when cards, accordion, and carousel replace
  DOM nodes. DOM restructuring in these blocks must preserve editor mappings.
- DA preview calls back into `loadPage`. Quick Edit is loaded on
  `custom:quick-edit` or the `quick-edit` query parameter; Sidekick listeners
  support both an already-present element and `sidekick-ready`.
- Experimentation tests use `track(test)` from `tests/coverage.js` and helpers
  from `tests/utils.js` to await experiment initialization. Follow that
  fixture-based pattern when extending the plugin suite.
- `.husky/pre-commit.mjs` regenerates component JSON when UE model files are
  staged and then runs `git add .`; account for that broad staging behavior
  when unrelated work is present.
- Follow `.github/pull_request_template.md`. `CONTRIBUTING.md` requests an
  issue reference and an explanation of intent, behavior changes, and
  breaking changes. Use executable commands from the package manifests:
  the root package scripts above are the authoritative workflow.
