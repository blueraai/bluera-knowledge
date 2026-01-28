# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## [0.18.0](https://github.com/blueraai/bluera-knowledge/compare/v0.17.2...v0.18.0) (2026-01-28)


### ⚠ BREAKING CHANGES

* **index:** Existing stores need to be re-indexed as document IDs
have changed format. Run `bluera-knowledge index <store>` to rebuild.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>

### Features

* add atomic file writes for crash-safe operations ([0392d94](https://github.com/blueraai/bluera-knowledge/commit/0392d94d84319deaa98fdcbd9f4a6f17b6fe4dfe))
* add two-phase drift detection for incremental indexing ([a05e101](https://github.com/blueraai/bluera-knowledge/commit/a05e1010a4f211d571f0719c5d65d43f9c6d2149))
* **index:** expand supported file extensions ([c585435](https://github.com/blueraai/bluera-knowledge/commit/c5854354e44b8335b91b452869b1669b1ffedd55))
* **mcp:** add missing store schema fields ([ae5ecd3](https://github.com/blueraai/bluera-knowledge/commit/ae5ecd3ea4b119b65a9148257493b854f4d1b5bc))
* **mcp:** add web store support to store:create ([d71aac4](https://github.com/blueraai/bluera-knowledge/commit/d71aac4aec9c5a47c3fa6f13437584494dfbd22c))
* **store:** preserve web store crawl options in sync ([838a9b5](https://github.com/blueraai/bluera-knowledge/commit/838a9b5085ed87cb69252642b7f720630a6f8c6a))


### Bug Fixes

* address 9 code bugs from CODEX-15 analysis ([6f324ff](https://github.com/blueraai/bluera-knowledge/commit/6f324ffbb49eeb63c3d30057f8cabab7b02de457))
* **analysis:** add .bluera to dependency analyzer ignore list ([10ad335](https://github.com/blueraai/bluera-knowledge/commit/10ad335cb8280a61b2b37f4b6d14ae941cc1b109))
* **bridge:** use platform-agnostic path detection ([7f75c43](https://github.com/blueraai/bluera-knowledge/commit/7f75c43e26c948b6a5b523c7595061cfc3589c29))
* **cache:** add event-based graph cache invalidation ([1288932](https://github.com/blueraai/bluera-knowledge/commit/128893216e41195317ab86bdf4b215d1b0bfb4f4))
* **chunking:** match export default declarations ([8fb074f](https://github.com/blueraai/bluera-knowledge/commit/8fb074f337b4dbdaed98720f0d6cbdb81014b45e))
* **chunking:** validate chunkOverlap < chunkSize ([10a7c9c](https://github.com/blueraai/bluera-knowledge/commit/10a7c9c6374bf256f2a7081f737911d03153f556))
* **cli:** add missing manifest cleanup to store delete ([3c6dd43](https://github.com/blueraai/bluera-knowledge/commit/3c6dd43ef3b3cc12fed03466dfc73ba3dbe12ef4))
* **cli:** add NaN validation for numeric options ([16b174d](https://github.com/blueraai/bluera-knowledge/commit/16b174d1126e342c8b5368c04f2a099d1de6d19e))
* **cli:** correct default paths in help text ([e1385b2](https://github.com/blueraai/bluera-knowledge/commit/e1385b29f3678a4b1cfee652f7158d677c7b612c))
* **cli:** correct repo path in help text ([3acf615](https://github.com/blueraai/bluera-knowledge/commit/3acf615e845acf3e0f26308e7abe2a71c9f8d3a5))
* **cli:** pass projectRoot to createServices in CLI commands ([6e245c7](https://github.com/blueraai/bluera-knowledge/commit/6e245c7b5d6ba71cdd842ec65dfb9d064cb9c46a))
* **cli:** standardize process termination to avoid cleanup bypass ([6b27ffc](https://github.com/blueraai/bluera-knowledge/commit/6b27ffc54ae29d0f717442ea375a1c9010f40b20))
* **cli:** support SSH git URLs in store create ([911761c](https://github.com/blueraai/bluera-knowledge/commit/911761c1e07035b0581442fe9b80bfc5c1893cd1))
* **config:** implement deep merge for partial configs ([451c8a6](https://github.com/blueraai/bluera-knowledge/commit/451c8a6ca5a82d8004a1ce55f12bca34933f30e6))
* **config:** prefer git root over PWD for project root resolution ([aed612c](https://github.com/blueraai/bluera-knowledge/commit/aed612ce161d2da10749fa38af35a30ae09445c1))
* **config:** remove unused search config fields ([515abad](https://github.com/blueraai/bluera-knowledge/commit/515abad947a11c8b5fa156a71bbf88e78c42b5a3))
* **config:** resolve explicit paths against projectRoot ([3dcb12a](https://github.com/blueraai/bluera-knowledge/commit/3dcb12a38a16352ecd4b986f254d02d1cd9535da))
* **config:** use path.isAbsolute() for Windows compatibility ([282c802](https://github.com/blueraai/bluera-knowledge/commit/282c802bf17ef6ad22f2e7410b4fcbc9999945c7))
* **config:** wire up crawl config to intelligent crawler ([81468d2](https://github.com/blueraai/bluera-knowledge/commit/81468d2238e08766b32236d3863d682e0c3699ae))
* **config:** wire up embedding batchSize from config ([ae4913f](https://github.com/blueraai/bluera-knowledge/commit/ae4913f4705d3c751ce2a000733650c622012c89))
* **config:** wire up ignorePatterns from config ([ed950f2](https://github.com/blueraai/bluera-knowledge/commit/ed950f21be3d402d72d411d15039736715d32973))
* **config:** wire up search defaults from config ([74bd956](https://github.com/blueraai/bluera-knowledge/commit/74bd956eba59d47e6107a29f8f7e7c028376b45b))
* **coverage:** improve branch coverage toward 80.5% threshold ([bd5c95f](https://github.com/blueraai/bluera-knowledge/commit/bd5c95fa7a65b2545a05ac83d6c055b361f652aa))
* **crawl:** clear existing documents before re-crawling web stores ([e4bc5b0](https://github.com/blueraai/bluera-knowledge/commit/e4bc5b0091e2e4931c156a50395e56366ba80317))
* **crawl:** correct user agent typo in crawler ([f19a491](https://github.com/blueraai/bluera-knowledge/commit/f19a491aa47bd65774537cc26191d945cd59941f))
* **crawl:** cross-platform Python executable detection ([782adc8](https://github.com/blueraai/bluera-knowledge/commit/782adc8804cafcc8dde1a9df95da35cd1d4b9622))
* **embeddings:** derive dimensions dynamically from model output ([8ec0ac8](https://github.com/blueraai/bluera-knowledge/commit/8ec0ac811b9357ead91fbad7e63578fedd3bb7ce))
* **http:** add full cleanup to DELETE /api/stores/:id ([91005de](https://github.com/blueraai/bluera-knowledge/commit/91005de7689315d7f638b9e2daede03654724d75))
* **index:** handle unreadable files gracefully ([103ee63](https://github.com/blueraai/bluera-knowledge/commit/103ee636cf9109bc28c9d3dcd382136c1c326586))
* **index:** implement --force flag with incremental indexing and duplicate prevention ([b3ad20b](https://github.com/blueraai/bluera-knowledge/commit/b3ad20b3cbaf79e354ec001110ac6af6da2780e2))
* **index:** include file path in document ID to prevent collisions ([7abd023](https://github.com/blueraai/bluera-knowledge/commit/7abd023729e2ad7bc24e9c92f4b20b3c0b7b8d0c))
* **index:** rebuild FTS index after document deletions ([0f8588b](https://github.com/blueraai/bluera-knowledge/commit/0f8588bdf7f83fadad13d33c82b0379b335e6e65))
* **index:** rename documentsIndexed to filesIndexed ([c2870fa](https://github.com/blueraai/bluera-knowledge/commit/c2870fa93397350c5900987810460c2d7b0a1e37))
* **index:** update code graphs on incremental indexing ([3446150](https://github.com/blueraai/bluera-knowledge/commit/344615074ba38c408f36f9c5a4e78a6fdafe97d9))
* **lance:** connect on-demand in deleteStore ([cc5a25f](https://github.com/blueraai/bluera-knowledge/commit/cc5a25f3591e2c27e2689fef64ab03ce5dbe73ac))
* **lance:** guard deleteDocuments against empty array ([617190c](https://github.com/blueraai/bluera-knowledge/commit/617190c16d500ec17a35435f257c7315bd64c098))
* **mcp:** add full cleanup to sync prune and resolve dataDir ([afdf39c](https://github.com/blueraai/bluera-knowledge/commit/afdf39c42bf2eef763101c4da437c0a4b8911395))
* **mcp:** add missing fields to store:create execute schema ([1e2a352](https://github.com/blueraai/bluera-knowledge/commit/1e2a35292efe994b485ee17df2434c5b55a13cb9))
* **mcp:** add sync and uninstall to execute tool description ([cea50aa](https://github.com/blueraai/bluera-knowledge/commit/cea50aa611b117753cef00979b04a218bd8805a6))
* **mcp:** correct stores:sync command name in execute tool description ([c4f09ca](https://github.com/blueraai/bluera-knowledge/commit/c4f09ca7bc9561b21eb5ee9c923d375958d4132f))
* **mcp:** pass projectRoot to runMCPServer in CLI command ([9a2d6e7](https://github.com/blueraai/bluera-knowledge/commit/9a2d6e7461722d4f6a5af65af58428da43714179))
* **mcp:** prevent bootstrap output from corrupting MCP stdio transport ([861f03f](https://github.com/blueraai/bluera-knowledge/commit/861f03fcd112fcfb145195852a3e1185c5707e39))
* **mcp:** queue crawl job for web stores ([8314014](https://github.com/blueraai/bluera-knowledge/commit/8314014cc0303cf20b34f4772cc55aaa5df32699))
* **mcp:** wire intent parameter through to search service ([305a608](https://github.com/blueraai/bluera-knowledge/commit/305a608668baa75b7cc93a65b88ef43d341b65e4))
* **plugin:** replace process.exit with exitCode pattern ([a64c420](https://github.com/blueraai/bluera-knowledge/commit/a64c4201aabeee132b24e204c5770b7866df4862))
* **search:** add changelog file type to ranking boosts ([035e414](https://github.com/blueraai/bluera-knowledge/commit/035e414481b416d0b59bf28f75d38bd07e08b870))
* **search:** include storeId in deduplication key ([251ff40](https://github.com/blueraai/bluera-knowledge/commit/251ff40614b2005b56ca55c56313f2107dc78588))
* **search:** skip minRelevance filter in FTS mode ([7429b79](https://github.com/blueraai/bluera-knowledge/commit/7429b79e18b746acc2caf7bf4b305e4803940bf1))
* **search:** validate threshold/minRelevance range (0-1) ([320d977](https://github.com/blueraai/bluera-knowledge/commit/320d977316c0653c4ed3ab31dfec07c4755bd014))
* **serve:** resolve dataDir for repo clone cleanup ([85abebe](https://github.com/blueraai/bluera-knowledge/commit/85abebe8e9f15255af356df98f2c7252019d61a3))
* **server:** use store.path for repo deletion ([3b1c151](https://github.com/blueraai/bluera-knowledge/commit/3b1c151f7192e8f7ac9112ea79658b03b03d0fa3))
* **serve:** use config values for host/port defaults ([b16812f](https://github.com/blueraai/bluera-knowledge/commit/b16812f4c77b98df5963bf6e280a0f140efc9611))
* **services:** skip search cleanup for uninitialized lazy containers ([f6387d2](https://github.com/blueraai/bluera-knowledge/commit/f6387d2ce996664f03a0eba2999c1b76248d7415))
* **services:** use ConfigService's resolved projectRoot ([a8b4a8e](https://github.com/blueraai/bluera-knowledge/commit/a8b4a8e3080b1346084a58a47feeafafcebf4fef))
* **store:** preserve depth field on RepoStore rename ([987a18c](https://github.com/blueraai/bluera-knowledge/commit/987a18c08d7df5298cbf24f34be32a6a7ea26076))
* **store:** prevent duplicate names on rename and sync definition correctly ([444b3df](https://github.com/blueraai/bluera-knowledge/commit/444b3dfb0ee01f676548f711c005b5dd383f6a54))
* **store:** use default depth in repo store metadata ([4e95048](https://github.com/blueraai/bluera-knowledge/commit/4e95048bec15de55e4a4d528ff8a5fd553546c76))
* **store:** validate empty names in update method ([2d30f57](https://github.com/blueraai/bluera-knowledge/commit/2d30f575e5b15fcbfd6a5dfb2490a148a7201e1d))
* **store:** validate local repo path exists before creating store ([6057d5e](https://github.com/blueraai/bluera-knowledge/commit/6057d5e717b859a1589a1fd15c82f2642fb6cdde))
* **sync:** complete cleanup in --prune ([a1c3dd2](https://github.com/blueraai/bluera-knowledge/commit/a1c3dd2b34edf4d70b7df8ecee8ff796986ec139))
* **sync:** use ProjectRootService for project root detection ([f7f166a](https://github.com/blueraai/bluera-knowledge/commit/f7f166a8a256fc83421925634610d54e59988438))
* **types:** allow SSH URLs in repo store definitions ([7855f5e](https://github.com/blueraai/bluera-knowledge/commit/7855f5ec0855fff2fda034cf17c280b544e63815))
* **types:** remove unused SearchQuery fields and align chunk defaults ([86e789e](https://github.com/blueraai/bluera-knowledge/commit/86e789e3b46f342a295411f4e672517926d791ff))
* **watch:** check full indexing result before calling onReindex ([c4622f5](https://github.com/blueraai/bluera-knowledge/commit/c4622f5ad563d030e8e4e331878a91a6f9225386))
* **watch:** inject embeddings for dimensions setup ([aafd89b](https://github.com/blueraai/bluera-knowledge/commit/aafd89b84b5c457daa4355e4f8c477691421a089))
* **watch:** proper SIGINT cleanup with destroyServices ([464f5d3](https://github.com/blueraai/bluera-knowledge/commit/464f5d362e40f8e1e1136aa2aad6b812871c621d))
* **worker:** set LanceDB dimensions before initialize ([b9554bb](https://github.com/blueraai/bluera-knowledge/commit/b9554bb36a399d2d425e63f25075b3829c616566))

## [0.17.2](https://github.com/blueraai/bluera-knowledge/compare/v0.17.0...v0.17.2) (2026-01-18)


### Bug Fixes

* **config:** use per-repo paths instead of global directories ([d642fec](https://github.com/blueraai/bluera-knowledge/commit/d642fec3510ef546dd5dc94f91410a38e8aea0e4))
* **logging:** use per-repo log directory instead of global ([d30000d](https://github.com/blueraai/bluera-knowledge/commit/d30000dd01bb1e8ac810a6fc086543c1368e5449))

## [0.17.1](https://github.com/blueraai/bluera-knowledge/compare/v0.17.0...v0.17.1) (2026-01-18)


### Bug Fixes

* **config:** use per-repo paths instead of global directories ([d642fec](https://github.com/blueraai/bluera-knowledge/commit/d642fec3510ef546dd5dc94f91410a38e8aea0e4))

## [0.17.0](https://github.com/blueraai/bluera-knowledge/compare/v0.16.6...v0.17.0) (2026-01-18)


### Features

* **bootstrap:** add interrupted install recovery via lock file ([5bf4773](https://github.com/blueraai/bluera-knowledge/commit/5bf4773b59f27fe04fc6e8f7da0fe37cc4902ac7))


### Bug Fixes

* **settings:** narrow deny rules to block execution only ([daf758b](https://github.com/blueraai/bluera-knowledge/commit/daf758b211eb2e2179d198485f0a7705fb137759))

## [0.16.4](https://github.com/blueraai/bluera-knowledge/compare/v0.16.3...v0.16.4) (2026-01-17)


### Features

* **test:** expand test-plugin to cover full API surface ([e473f09](https://github.com/blueraai/bluera-knowledge/commit/e473f09003f311ca8648d60ccf56fbd7f99bd480))


### Bug Fixes

* **bootstrap:** use system tar for extraction ([3a17b33](https://github.com/blueraai/bluera-knowledge/commit/3a17b33b99aa6ae0d35b2f2a4a96daa444336e99))

## [0.16.3](https://github.com/blueraai/bluera-knowledge/compare/v0.16.1...v0.16.3) (2026-01-17)


### Bug Fixes

* **plugin:** add author field to manifest ([9bf15c2](https://github.com/blueraai/bluera-knowledge/commit/9bf15c243b735d4a1763de9b3601781c6e4aeaf6))
* **plugin:** remove unrecognized prebuiltBinaries field ([329ac08](https://github.com/blueraai/bluera-knowledge/commit/329ac08b4f794e016bbfedc0d24c63491e9a7dfb))

## [0.16.2](https://github.com/blueraai/bluera-knowledge/compare/v0.16.1...v0.16.2) (2026-01-17)


### Bug Fixes

* **plugin:** add author field to manifest ([9bf15c2](https://github.com/blueraai/bluera-knowledge/commit/9bf15c243b735d4a1763de9b3601781c6e4aeaf6))

## [0.16.1](https://github.com/blueraai/bluera-knowledge/compare/v0.15.7...v0.16.1) (2026-01-17)


### Features

* **dist:** add multi-platform prebuilt binary distribution ([32be73e](https://github.com/blueraai/bluera-knowledge/commit/32be73e7de962b8245ebe3321e792be854385243))


### Bug Fixes

* **ci:** build platform binaries before npm publish ([6c3f267](https://github.com/blueraai/bluera-knowledge/commit/6c3f26700ffa5f7298d8bec95cf10d12fe1cf417))

## [0.16.0](https://github.com/blueraai/bluera-knowledge/compare/v0.15.7...v0.16.0) (2026-01-17)


### Features

* **dist:** add multi-platform prebuilt binary distribution ([32be73e](https://github.com/blueraai/bluera-knowledge/commit/32be73e7de962b8245ebe3321e792be854385243))

## [0.15.7](https://github.com/blueraai/bluera-knowledge/compare/v0.15.6...v0.15.7) (2026-01-17)


### Bug Fixes

* **deps:** downgrade LanceDB to 0.22.3 for Intel Mac compatibility ([36f8c03](https://github.com/blueraai/bluera-knowledge/commit/36f8c033f3da4587f1abeb1c1fdf44f65dc67da3))

## [0.15.6](https://github.com/blueraai/bluera-knowledge/compare/v0.15.4...v0.15.6) (2026-01-17)


### Features

* **mcp:** add comprehensive logging and /logs command ([bb22114](https://github.com/blueraai/bluera-knowledge/commit/bb221145d28166680d1f75afc2a864350f709cb3))


### Bug Fixes

* **mcp:** add cwd to resolve relative paths correctly ([ea8d403](https://github.com/blueraai/bluera-knowledge/commit/ea8d403eddf7713b75dcc44e261c41db11afbc9b))

## [0.15.5](https://github.com/blueraai/bluera-knowledge/compare/v0.15.4...v0.15.5) (2026-01-17)


### Bug Fixes

* **mcp:** add cwd to resolve relative paths correctly ([ea8d403](https://github.com/blueraai/bluera-knowledge/commit/ea8d403eddf7713b75dcc44e261c41db11afbc9b))

## [0.15.4](https://github.com/blueraai/bluera-knowledge/compare/v0.15.3...v0.15.4) (2026-01-17)


### Bug Fixes

* **mcp:** use JavaScript bootstrap instead of bash wrapper ([960a401](https://github.com/blueraai/bluera-knowledge/commit/960a401ea8aa3d294f349e428732ae01bcad2571))

## [0.15.3](https://github.com/blueraai/bluera-knowledge/compare/v0.15.1...v0.15.3) (2026-01-16)


### Bug Fixes

* **mcp:** add wrapper script to install deps before server start ([0029bd4](https://github.com/blueraai/bluera-knowledge/commit/0029bd485cdd7d6d3317987807415b454f3f40ac))
* **mcp:** use BASH_SOURCE with absolute path resolution ([4c99e28](https://github.com/blueraai/bluera-knowledge/commit/4c99e28227b8d692d8b7856ac9681bba950c259e))

## [0.15.2](https://github.com/blueraai/bluera-knowledge/compare/v0.15.1...v0.15.2) (2026-01-16)


### Bug Fixes

* **mcp:** add wrapper script to install deps before server start ([0029bd4](https://github.com/blueraai/bluera-knowledge/commit/0029bd485cdd7d6d3317987807415b454f3f40ac))

## [0.15.1](https://github.com/blueraai/bluera-knowledge/compare/v0.15.0...v0.15.1) (2026-01-16)

## [0.15.0](https://github.com/blueraai/bluera-knowledge/compare/v0.14.8...v0.15.0) (2026-01-16)


### Features

* **services:** wire up StoreDefinitionService and GitignoreService ([4d52052](https://github.com/blueraai/bluera-knowledge/commit/4d520523f52b1424f3bf523ad3596227add8fdb9))


### Bug Fixes

* **gitignore:** correct patterns to actually track stores.config.json ([7e0dd34](https://github.com/blueraai/bluera-knowledge/commit/7e0dd342610b45f59237ede36c14b5ed124943cd))
* **mcp:** use default value syntax for dual-mode MCP support ([4f62f5c](https://github.com/blueraai/bluera-knowledge/commit/4f62f5cfe67b24758ba2b198730a674f4b3055d7))

## [0.14.8](https://github.com/blueraai/bluera-knowledge/compare/v0.14.7...v0.14.8) (2026-01-16)


### Bug Fixes

* **mcp:** add missing mcpServers wrapper to config ([506c8b2](https://github.com/blueraai/bluera-knowledge/commit/506c8b20d2dd52e2c15dda43f9cc8ae620a37b5c))

## [0.14.7](https://github.com/blueraai/bluera-knowledge/compare/v0.14.6...v0.14.7) (2026-01-16)


### Bug Fixes

* **serve:** remove process.exit to prevent lancedb mutex crash ([dd5b991](https://github.com/blueraai/bluera-knowledge/commit/dd5b9911797c2b8165d91f629314f41a0f2204cf))

## [0.14.3](https://github.com/blueraai/bluera-knowledge/compare/v0.14.1...v0.14.3) (2026-01-16)


### Bug Fixes

* **crawl:** avoid lancedb fork-safety crash in intelligent mode ([3608be2](https://github.com/blueraai/bluera-knowledge/commit/3608be28cc09c0b291dde8e2e74c552e857956ab))
* **crawl:** detect Claude CLI at ~/.claude/local/claude ([cf490e2](https://github.com/blueraai/bluera-knowledge/commit/cf490e2af2524352b108aa19c313faecf0abafac))

## [0.14.2](https://github.com/blueraai/bluera-knowledge/compare/v0.14.1...v0.14.2) (2026-01-16)


### Bug Fixes

* **crawl:** detect Claude CLI at ~/.claude/local/claude ([cf490e2](https://github.com/blueraai/bluera-knowledge/commit/cf490e2af2524352b108aa19c313faecf0abafac))

## [0.14.1](https://github.com/blueraai/bluera-knowledge/compare/v0.14.0...v0.14.1) (2026-01-16)


### Bug Fixes

* **npm:** add files field to prevent 389MB package bloat ([fa55313](https://github.com/blueraai/bluera-knowledge/commit/fa55313050381b8f2c51cb89d42f66c30adfe58c))

## [0.14.0](https://github.com/blueraai/bluera-knowledge/compare/v0.13.3...v0.14.0) (2026-01-16)


### Features

* add uninstall command and use venv for Python dependencies ([e632618](https://github.com/blueraai/bluera-knowledge/commit/e632618cc1b0925dbdc90a2eabb0863ae3e939fa))

## [0.13.3](https://github.com/blueraai/bluera-knowledge/compare/v0.13.2...v0.13.3) (2026-01-16)


### Bug Fixes

* **crawl:** use absolute path for Python worker in PythonBridge ([f9a45cd](https://github.com/blueraai/bluera-knowledge/commit/f9a45cdcdcee3be1090843fcb17ed3251b5c5a4a))

## [0.13.2](https://github.com/blueraai/bluera-knowledge/compare/v0.13.1...v0.13.2) (2026-01-16)


### Bug Fixes

* **mcp:** move config to .mcp.json to fix fresh install failures ([b4bbfbb](https://github.com/blueraai/bluera-knowledge/commit/b4bbfbb327f1448aa7595c59c737f2e4496cae1a)), closes [#16143](https://github.com/blueraai/bluera-knowledge/issues/16143)

## [0.13.0](https://github.com/blueraai/bluera-knowledge/compare/v0.12.11...v0.13.0) (2026-01-15)

## [0.12.10](https://github.com/blueraai/bluera-knowledge/compare/v0.11.21...v0.12.10) (2026-01-15)


### Features

* **hooks:** add PreToolUse hooks for BK suggestions ([23d3fa4](https://github.com/blueraai/bluera-knowledge/commit/23d3fa493dd16427d6bda3ea80064622c6244bba))
* **hooks:** add skill auto-activation system ([2b4e96b](https://github.com/blueraai/bluera-knowledge/commit/2b4e96bd29f28df63377cdaacab922d4f4321a8f))
* **hooks:** improve skill activation with forced evaluation pattern ([f044077](https://github.com/blueraai/bluera-knowledge/commit/f044077d260b78b55a00ebf735b68a2d933f34a7)), closes [#15345](https://github.com/blueraai/bluera-knowledge/issues/15345)
* **test-plugin:** add hook tests to plugin test suite ([475a776](https://github.com/blueraai/bluera-knowledge/commit/475a7766fea47767a2dfb8148f7e74581de2c2ee))
* **types:** add Zod validation for JSON parsing ([41348eb](https://github.com/blueraai/bluera-knowledge/commit/41348eb337c33d52174c22097e6788948ad605f8))


### Bug Fixes

* **hooks:** use JSON output for PreToolUse hook context injection ([a73977e](https://github.com/blueraai/bluera-knowledge/commit/a73977e0f8f690d43b9d7c987300522dd501fe38))
* **store:** harden store registry against null entries and invalid types ([c0fedbc](https://github.com/blueraai/bluera-knowledge/commit/c0fedbc5c7f664e46bc8afc7c58bb6d1e1825711))
* **tests:** stabilize watch service tests in coverage mode ([fdf6c3a](https://github.com/blueraai/bluera-knowledge/commit/fdf6c3a478adff9e4746b54a9519184ca280f344))
* **workers:** correct worker path calculation for bundled chunks ([8d692db](https://github.com/blueraai/bluera-knowledge/commit/8d692db3ac9706f5702f64abcff1ce149ec6be27))
* **workers:** harden dataDir handling with explicit checks and add tests ([691cf50](https://github.com/blueraai/bluera-knowledge/commit/691cf50e0531c4083773eae27e26cb46c3d653b6))
* **workers:** resolve ONNX runtime mutex crash on macOS ([77b66c6](https://github.com/blueraai/bluera-knowledge/commit/77b66c69c811d72366d49d13f35ec7625450dc98))

## [0.12.9](https://github.com/blueraai/bluera-knowledge/compare/v0.11.21...v0.12.9) (2026-01-15)


### Features

* **hooks:** add PreToolUse hooks for BK suggestions ([23d3fa4](https://github.com/blueraai/bluera-knowledge/commit/23d3fa493dd16427d6bda3ea80064622c6244bba))
* **hooks:** add skill auto-activation system ([2b4e96b](https://github.com/blueraai/bluera-knowledge/commit/2b4e96bd29f28df63377cdaacab922d4f4321a8f))
* **hooks:** improve skill activation with forced evaluation pattern ([f044077](https://github.com/blueraai/bluera-knowledge/commit/f044077d260b78b55a00ebf735b68a2d933f34a7)), closes [#15345](https://github.com/blueraai/bluera-knowledge/issues/15345)
* **test-plugin:** add hook tests to plugin test suite ([475a776](https://github.com/blueraai/bluera-knowledge/commit/475a7766fea47767a2dfb8148f7e74581de2c2ee))
* **types:** add Zod validation for JSON parsing ([41348eb](https://github.com/blueraai/bluera-knowledge/commit/41348eb337c33d52174c22097e6788948ad605f8))


### Bug Fixes

* **hooks:** use JSON output for PreToolUse hook context injection ([a73977e](https://github.com/blueraai/bluera-knowledge/commit/a73977e0f8f690d43b9d7c987300522dd501fe38))
* **store:** harden store registry against null entries and invalid types ([c0fedbc](https://github.com/blueraai/bluera-knowledge/commit/c0fedbc5c7f664e46bc8afc7c58bb6d1e1825711))
* **tests:** stabilize watch service tests in coverage mode ([fdf6c3a](https://github.com/blueraai/bluera-knowledge/commit/fdf6c3a478adff9e4746b54a9519184ca280f344))
* **workers:** harden dataDir handling with explicit checks and add tests ([691cf50](https://github.com/blueraai/bluera-knowledge/commit/691cf50e0531c4083773eae27e26cb46c3d653b6))
* **workers:** resolve ONNX runtime mutex crash on macOS ([77b66c6](https://github.com/blueraai/bluera-knowledge/commit/77b66c69c811d72366d49d13f35ec7625450dc98))

## [0.12.8](https://github.com/blueraai/bluera-knowledge/compare/v0.11.21...v0.12.8) (2026-01-15)


### Features

* **hooks:** add PreToolUse hooks for BK suggestions ([23d3fa4](https://github.com/blueraai/bluera-knowledge/commit/23d3fa493dd16427d6bda3ea80064622c6244bba))
* **hooks:** add skill auto-activation system ([2b4e96b](https://github.com/blueraai/bluera-knowledge/commit/2b4e96bd29f28df63377cdaacab922d4f4321a8f))
* **hooks:** improve skill activation with forced evaluation pattern ([f044077](https://github.com/blueraai/bluera-knowledge/commit/f044077d260b78b55a00ebf735b68a2d933f34a7)), closes [#15345](https://github.com/blueraai/bluera-knowledge/issues/15345)
* **test-plugin:** add hook tests to plugin test suite ([475a776](https://github.com/blueraai/bluera-knowledge/commit/475a7766fea47767a2dfb8148f7e74581de2c2ee))
* **types:** add Zod validation for JSON parsing ([41348eb](https://github.com/blueraai/bluera-knowledge/commit/41348eb337c33d52174c22097e6788948ad605f8))


### Bug Fixes

* **hooks:** use JSON output for PreToolUse hook context injection ([a73977e](https://github.com/blueraai/bluera-knowledge/commit/a73977e0f8f690d43b9d7c987300522dd501fe38))
* **store:** harden store registry against null entries and invalid types ([c0fedbc](https://github.com/blueraai/bluera-knowledge/commit/c0fedbc5c7f664e46bc8afc7c58bb6d1e1825711))
* **tests:** stabilize watch service tests in coverage mode ([fdf6c3a](https://github.com/blueraai/bluera-knowledge/commit/fdf6c3a478adff9e4746b54a9519184ca280f344))
* **workers:** harden dataDir handling with explicit checks and add tests ([691cf50](https://github.com/blueraai/bluera-knowledge/commit/691cf50e0531c4083773eae27e26cb46c3d653b6))

## [0.12.7](https://github.com/blueraai/bluera-knowledge/compare/v0.11.21...v0.12.7) (2026-01-15)


### Features

* **hooks:** add PreToolUse hooks for BK suggestions ([23d3fa4](https://github.com/blueraai/bluera-knowledge/commit/23d3fa493dd16427d6bda3ea80064622c6244bba))
* **hooks:** add skill auto-activation system ([2b4e96b](https://github.com/blueraai/bluera-knowledge/commit/2b4e96bd29f28df63377cdaacab922d4f4321a8f))
* **hooks:** improve skill activation with forced evaluation pattern ([f044077](https://github.com/blueraai/bluera-knowledge/commit/f044077d260b78b55a00ebf735b68a2d933f34a7)), closes [#15345](https://github.com/blueraai/bluera-knowledge/issues/15345)
* **test-plugin:** add hook tests to plugin test suite ([475a776](https://github.com/blueraai/bluera-knowledge/commit/475a7766fea47767a2dfb8148f7e74581de2c2ee))


### Bug Fixes

* **hooks:** use JSON output for PreToolUse hook context injection ([a73977e](https://github.com/blueraai/bluera-knowledge/commit/a73977e0f8f690d43b9d7c987300522dd501fe38))
* **tests:** stabilize watch service tests in coverage mode ([fdf6c3a](https://github.com/blueraai/bluera-knowledge/commit/fdf6c3a478adff9e4746b54a9519184ca280f344))
* **workers:** harden dataDir handling with explicit checks and add tests ([691cf50](https://github.com/blueraai/bluera-knowledge/commit/691cf50e0531c4083773eae27e26cb46c3d653b6))

## [0.12.6](https://github.com/blueraai/bluera-knowledge/compare/v0.11.21...v0.12.6) (2026-01-15)


### Features

* **hooks:** add PreToolUse hooks for BK suggestions ([23d3fa4](https://github.com/blueraai/bluera-knowledge/commit/23d3fa493dd16427d6bda3ea80064622c6244bba))
* **hooks:** add skill auto-activation system ([2b4e96b](https://github.com/blueraai/bluera-knowledge/commit/2b4e96bd29f28df63377cdaacab922d4f4321a8f))
* **hooks:** improve skill activation with forced evaluation pattern ([f044077](https://github.com/blueraai/bluera-knowledge/commit/f044077d260b78b55a00ebf735b68a2d933f34a7)), closes [#15345](https://github.com/blueraai/bluera-knowledge/issues/15345)


### Bug Fixes

* **hooks:** use JSON output for PreToolUse hook context injection ([a73977e](https://github.com/blueraai/bluera-knowledge/commit/a73977e0f8f690d43b9d7c987300522dd501fe38))
* **tests:** stabilize watch service tests in coverage mode ([fdf6c3a](https://github.com/blueraai/bluera-knowledge/commit/fdf6c3a478adff9e4746b54a9519184ca280f344))

## [0.12.5](https://github.com/blueraai/bluera-knowledge/compare/v0.11.21...v0.12.5) (2026-01-15)


### Features

* **hooks:** add PreToolUse hooks for BK suggestions ([23d3fa4](https://github.com/blueraai/bluera-knowledge/commit/23d3fa493dd16427d6bda3ea80064622c6244bba))
* **hooks:** add skill auto-activation system ([2b4e96b](https://github.com/blueraai/bluera-knowledge/commit/2b4e96bd29f28df63377cdaacab922d4f4321a8f))
* **hooks:** improve skill activation with forced evaluation pattern ([f044077](https://github.com/blueraai/bluera-knowledge/commit/f044077d260b78b55a00ebf735b68a2d933f34a7)), closes [#15345](https://github.com/blueraai/bluera-knowledge/issues/15345)


### Bug Fixes

* **hooks:** use JSON output for PreToolUse hook context injection ([a73977e](https://github.com/blueraai/bluera-knowledge/commit/a73977e0f8f690d43b9d7c987300522dd501fe38))
* **tests:** stabilize watch service tests in coverage mode ([fdf6c3a](https://github.com/blueraai/bluera-knowledge/commit/fdf6c3a478adff9e4746b54a9519184ca280f344))

## [0.12.4](https://github.com/blueraai/bluera-knowledge/compare/v0.11.21...v0.12.4) (2026-01-15)


### Features

* **hooks:** add PreToolUse hooks for BK suggestions ([23d3fa4](https://github.com/blueraai/bluera-knowledge/commit/23d3fa493dd16427d6bda3ea80064622c6244bba))
* **hooks:** add skill auto-activation system ([2b4e96b](https://github.com/blueraai/bluera-knowledge/commit/2b4e96bd29f28df63377cdaacab922d4f4321a8f))
* **hooks:** improve skill activation with forced evaluation pattern ([f044077](https://github.com/blueraai/bluera-knowledge/commit/f044077d260b78b55a00ebf735b68a2d933f34a7)), closes [#15345](https://github.com/blueraai/bluera-knowledge/issues/15345)


### Bug Fixes

* **hooks:** use JSON output for PreToolUse hook context injection ([a73977e](https://github.com/blueraai/bluera-knowledge/commit/a73977e0f8f690d43b9d7c987300522dd501fe38))
* **tests:** stabilize watch service tests in coverage mode ([fdf6c3a](https://github.com/blueraai/bluera-knowledge/commit/fdf6c3a478adff9e4746b54a9519184ca280f344))

## [0.12.3](https://github.com/blueraai/bluera-knowledge/compare/v0.11.21...v0.12.3) (2026-01-15)


### Features

* **hooks:** add PreToolUse hooks for BK suggestions ([23d3fa4](https://github.com/blueraai/bluera-knowledge/commit/23d3fa493dd16427d6bda3ea80064622c6244bba))
* **hooks:** add skill auto-activation system ([2b4e96b](https://github.com/blueraai/bluera-knowledge/commit/2b4e96bd29f28df63377cdaacab922d4f4321a8f))


### Bug Fixes

* **hooks:** use JSON output for PreToolUse hook context injection ([a73977e](https://github.com/blueraai/bluera-knowledge/commit/a73977e0f8f690d43b9d7c987300522dd501fe38))
* **tests:** stabilize watch service tests in coverage mode ([fdf6c3a](https://github.com/blueraai/bluera-knowledge/commit/fdf6c3a478adff9e4746b54a9519184ca280f344))

## [0.12.2](https://github.com/blueraai/bluera-knowledge/compare/v0.11.21...v0.12.2) (2026-01-15)


### Features

* **hooks:** add PreToolUse hooks for BK suggestions ([23d3fa4](https://github.com/blueraai/bluera-knowledge/commit/23d3fa493dd16427d6bda3ea80064622c6244bba))
* **hooks:** add skill auto-activation system ([2b4e96b](https://github.com/blueraai/bluera-knowledge/commit/2b4e96bd29f28df63377cdaacab922d4f4321a8f))


### Bug Fixes

* **tests:** stabilize watch service tests in coverage mode ([fdf6c3a](https://github.com/blueraai/bluera-knowledge/commit/fdf6c3a478adff9e4746b54a9519184ca280f344))

## [0.12.1](https://github.com/blueraai/bluera-knowledge/compare/v0.11.21...v0.12.1) (2026-01-14)


### Features

* **hooks:** add PreToolUse hooks for BK suggestions ([23d3fa4](https://github.com/blueraai/bluera-knowledge/commit/23d3fa493dd16427d6bda3ea80064622c6244bba))
* **hooks:** add skill auto-activation system ([2b4e96b](https://github.com/blueraai/bluera-knowledge/commit/2b4e96bd29f28df63377cdaacab922d4f4321a8f))

## [0.12.0](https://github.com/blueraai/bluera-knowledge/compare/v0.11.21...v0.12.0) (2026-01-14)


### Features

* **hooks:** add skill auto-activation system ([2b4e96b](https://github.com/blueraai/bluera-knowledge/commit/2b4e96bd29f28df63377cdaacab922d4f4321a8f))

## [0.11.21](https://github.com/blueraai/bluera-knowledge/compare/v0.11.20...v0.11.21) (2026-01-10)


### Features

* **cli:** add --branch option to store create command ([8b3209f](https://github.com/blueraai/bluera-knowledge/commit/8b3209f34e22f78df54fc6a64cf1d8b91833dabc))
* **mcp:** add mode and threshold params to search tool ([18acdb5](https://github.com/blueraai/bluera-knowledge/commit/18acdb590944b9e1ebf1851d0eab32f746ac1758))
* **sync:** add --reindex flag to sync command ([1344d98](https://github.com/blueraai/bluera-knowledge/commit/1344d984fdc5a75b25687d55ad186416d14203a9))


### Bug Fixes

* **code-graph:** preserve confidence in serialized edges ([d88c342](https://github.com/blueraai/bluera-knowledge/commit/d88c342e4225f984db02691437ab1c54d29ad07d))
* **job-service:** throw on missing HOME/USERPROFILE env vars ([b0a79fb](https://github.com/blueraai/bluera-knowledge/commit/b0a79fbe996c5e4e333ce4ad7a338cdda4af2d70))
* **store:** clean up all resources on store deletion ([fbcff02](https://github.com/blueraai/bluera-knowledge/commit/fbcff02f304e8b330c1656db32f6b237a63f3295))

## [0.11.20](https://github.com/blueraai/bluera-knowledge/compare/v0.11.6...v0.11.20) (2026-01-10)


### Features

* **code-unit:** add interface and type extraction support ([190dded](https://github.com/blueraai/bluera-knowledge/commit/190dded78be68985c3f94c0da6ebed03659da313))
* **commands:** add test-plugin command for comprehensive plugin testing ([c6eb5e7](https://github.com/blueraai/bluera-knowledge/commit/c6eb5e7762376810a9ff3e79f794f05ff0c77b97))
* **scripts:** add post-release npm validation script ([e4c29a0](https://github.com/blueraai/bluera-knowledge/commit/e4c29a0c83907de4bc293a69a58412629457fb22))
* **scripts:** add suggest, sync, serve, mcp tests to npm validation ([49d85da](https://github.com/blueraai/bluera-knowledge/commit/49d85dad1a89691060c12f152d644844baf6e6e6))
* **scripts:** log expected vs installed version in validation script ([c77d039](https://github.com/blueraai/bluera-knowledge/commit/c77d039b27a3ccf54d50006af161ac4dcfea7b21))


### Bug Fixes

* address code review issues - resource leak and error handling ([c14e9b2](https://github.com/blueraai/bluera-knowledge/commit/c14e9b22782f0d62c04fb312a70345d7f4248ed4))
* **bridge:** close readline interfaces on stop to prevent resource leak ([e970bf9](https://github.com/blueraai/bluera-knowledge/commit/e970bf94f74bdba24803eed8714d47ed8e874117))
* **cli:** plugin-api commands now respect global options ([d3cca02](https://github.com/blueraai/bluera-knowledge/commit/d3cca02ffc679ffc187b76c7682f3cc177eabdea))
* **commands:** fix test-plugin reliability issues ([2841e9a](https://github.com/blueraai/bluera-knowledge/commit/2841e9aa6438f9fd60c70ab921575088b2921810))
* **commands:** move test-plugin to commands/ for plugin distribution ([0a3ff5f](https://github.com/blueraai/bluera-knowledge/commit/0a3ff5f91666db7efa213d5abd4c447fb07749fc))
* **crawl:** throw errors instead of fallback/graceful degradation ([19962c2](https://github.com/blueraai/bluera-knowledge/commit/19962c2114406f2fea22e5973e242f190ab65fb7))
* **git-clone:** add error handler for spawn failures ([4bf50e2](https://github.com/blueraai/bluera-knowledge/commit/4bf50e2348505dccdc94522cf42f1d4d3471480c))
* improve error handling and type safety from code review ([61710aa](https://github.com/blueraai/bluera-knowledge/commit/61710aaed48c87c457628b75e3968686377a6c92))
* **plugin:** properly close services after command execution ([eeaf743](https://github.com/blueraai/bluera-knowledge/commit/eeaf743750be73fd9c7a9e72440b2fd0fb5a53fa))
* **scripts:** show real-time output in validation script ([8a4bdec](https://github.com/blueraai/bluera-knowledge/commit/8a4bdec8b63c504d34ba35bfe19da795f7f7fd07))
* **scripts:** use mktemp for temp directories in validation script ([3107861](https://github.com/blueraai/bluera-knowledge/commit/3107861bd7a966016fde2a121469dd84756f39be))
* **search:** add defaults for env vars so CLI works standalone ([b2d2ce5](https://github.com/blueraai/bluera-knowledge/commit/b2d2ce534e8cd2ba0fc0abdac505c912a1a76035))
* **services:** throw errors instead of graceful degradation ([ca992b5](https://github.com/blueraai/bluera-knowledge/commit/ca992b5cfa4d9ebad62ee82231cfdd2d3d64012e))

## [0.11.19](https://github.com/blueraai/bluera-knowledge/compare/v0.11.6...v0.11.19) (2026-01-10)


### Features

* **code-unit:** add interface and type extraction support ([190dded](https://github.com/blueraai/bluera-knowledge/commit/190dded78be68985c3f94c0da6ebed03659da313))
* **commands:** add test-plugin command for comprehensive plugin testing ([c6eb5e7](https://github.com/blueraai/bluera-knowledge/commit/c6eb5e7762376810a9ff3e79f794f05ff0c77b97))
* **scripts:** add post-release npm validation script ([e4c29a0](https://github.com/blueraai/bluera-knowledge/commit/e4c29a0c83907de4bc293a69a58412629457fb22))
* **scripts:** add suggest, sync, serve, mcp tests to npm validation ([49d85da](https://github.com/blueraai/bluera-knowledge/commit/49d85dad1a89691060c12f152d644844baf6e6e6))
* **scripts:** log expected vs installed version in validation script ([c77d039](https://github.com/blueraai/bluera-knowledge/commit/c77d039b27a3ccf54d50006af161ac4dcfea7b21))


### Bug Fixes

* **bridge:** close readline interfaces on stop to prevent resource leak ([e970bf9](https://github.com/blueraai/bluera-knowledge/commit/e970bf94f74bdba24803eed8714d47ed8e874117))
* **cli:** plugin-api commands now respect global options ([d3cca02](https://github.com/blueraai/bluera-knowledge/commit/d3cca02ffc679ffc187b76c7682f3cc177eabdea))
* **commands:** fix test-plugin reliability issues ([2841e9a](https://github.com/blueraai/bluera-knowledge/commit/2841e9aa6438f9fd60c70ab921575088b2921810))
* **commands:** move test-plugin to commands/ for plugin distribution ([0a3ff5f](https://github.com/blueraai/bluera-knowledge/commit/0a3ff5f91666db7efa213d5abd4c447fb07749fc))
* **crawl:** throw errors instead of fallback/graceful degradation ([19962c2](https://github.com/blueraai/bluera-knowledge/commit/19962c2114406f2fea22e5973e242f190ab65fb7))
* **git-clone:** add error handler for spawn failures ([4bf50e2](https://github.com/blueraai/bluera-knowledge/commit/4bf50e2348505dccdc94522cf42f1d4d3471480c))
* improve error handling and type safety from code review ([61710aa](https://github.com/blueraai/bluera-knowledge/commit/61710aaed48c87c457628b75e3968686377a6c92))
* **plugin:** properly close services after command execution ([eeaf743](https://github.com/blueraai/bluera-knowledge/commit/eeaf743750be73fd9c7a9e72440b2fd0fb5a53fa))
* **scripts:** show real-time output in validation script ([8a4bdec](https://github.com/blueraai/bluera-knowledge/commit/8a4bdec8b63c504d34ba35bfe19da795f7f7fd07))
* **scripts:** use mktemp for temp directories in validation script ([3107861](https://github.com/blueraai/bluera-knowledge/commit/3107861bd7a966016fde2a121469dd84756f39be))
* **search:** add defaults for env vars so CLI works standalone ([b2d2ce5](https://github.com/blueraai/bluera-knowledge/commit/b2d2ce534e8cd2ba0fc0abdac505c912a1a76035))
* **services:** throw errors instead of graceful degradation ([ca992b5](https://github.com/blueraai/bluera-knowledge/commit/ca992b5cfa4d9ebad62ee82231cfdd2d3d64012e))

## [0.11.18](https://github.com/blueraai/bluera-knowledge/compare/v0.11.6...v0.11.18) (2026-01-10)


### Features

* **commands:** add test-plugin command for comprehensive plugin testing ([c6eb5e7](https://github.com/blueraai/bluera-knowledge/commit/c6eb5e7762376810a9ff3e79f794f05ff0c77b97))
* **scripts:** add post-release npm validation script ([e4c29a0](https://github.com/blueraai/bluera-knowledge/commit/e4c29a0c83907de4bc293a69a58412629457fb22))
* **scripts:** add suggest, sync, serve, mcp tests to npm validation ([49d85da](https://github.com/blueraai/bluera-knowledge/commit/49d85dad1a89691060c12f152d644844baf6e6e6))
* **scripts:** log expected vs installed version in validation script ([c77d039](https://github.com/blueraai/bluera-knowledge/commit/c77d039b27a3ccf54d50006af161ac4dcfea7b21))


### Bug Fixes

* **cli:** plugin-api commands now respect global options ([d3cca02](https://github.com/blueraai/bluera-knowledge/commit/d3cca02ffc679ffc187b76c7682f3cc177eabdea))
* **commands:** fix test-plugin reliability issues ([2841e9a](https://github.com/blueraai/bluera-knowledge/commit/2841e9aa6438f9fd60c70ab921575088b2921810))
* **commands:** move test-plugin to commands/ for plugin distribution ([0a3ff5f](https://github.com/blueraai/bluera-knowledge/commit/0a3ff5f91666db7efa213d5abd4c447fb07749fc))
* **plugin:** properly close services after command execution ([eeaf743](https://github.com/blueraai/bluera-knowledge/commit/eeaf743750be73fd9c7a9e72440b2fd0fb5a53fa))
* **scripts:** show real-time output in validation script ([8a4bdec](https://github.com/blueraai/bluera-knowledge/commit/8a4bdec8b63c504d34ba35bfe19da795f7f7fd07))
* **scripts:** use mktemp for temp directories in validation script ([3107861](https://github.com/blueraai/bluera-knowledge/commit/3107861bd7a966016fde2a121469dd84756f39be))
* **search:** add defaults for env vars so CLI works standalone ([b2d2ce5](https://github.com/blueraai/bluera-knowledge/commit/b2d2ce534e8cd2ba0fc0abdac505c912a1a76035))

## [0.11.17](https://github.com/blueraai/bluera-knowledge/compare/v0.11.6...v0.11.17) (2026-01-10)


### Features

* **commands:** add test-plugin command for comprehensive plugin testing ([c6eb5e7](https://github.com/blueraai/bluera-knowledge/commit/c6eb5e7762376810a9ff3e79f794f05ff0c77b97))
* **scripts:** add post-release npm validation script ([e4c29a0](https://github.com/blueraai/bluera-knowledge/commit/e4c29a0c83907de4bc293a69a58412629457fb22))
* **scripts:** add suggest, sync, serve, mcp tests to npm validation ([49d85da](https://github.com/blueraai/bluera-knowledge/commit/49d85dad1a89691060c12f152d644844baf6e6e6))
* **scripts:** log expected vs installed version in validation script ([c77d039](https://github.com/blueraai/bluera-knowledge/commit/c77d039b27a3ccf54d50006af161ac4dcfea7b21))


### Bug Fixes

* **cli:** plugin-api commands now respect global options ([d3cca02](https://github.com/blueraai/bluera-knowledge/commit/d3cca02ffc679ffc187b76c7682f3cc177eabdea))
* **commands:** fix test-plugin reliability issues ([2841e9a](https://github.com/blueraai/bluera-knowledge/commit/2841e9aa6438f9fd60c70ab921575088b2921810))
* **commands:** move test-plugin to commands/ for plugin distribution ([0a3ff5f](https://github.com/blueraai/bluera-knowledge/commit/0a3ff5f91666db7efa213d5abd4c447fb07749fc))
* **plugin:** properly close services after command execution ([eeaf743](https://github.com/blueraai/bluera-knowledge/commit/eeaf743750be73fd9c7a9e72440b2fd0fb5a53fa))
* **scripts:** show real-time output in validation script ([8a4bdec](https://github.com/blueraai/bluera-knowledge/commit/8a4bdec8b63c504d34ba35bfe19da795f7f7fd07))
* **scripts:** use mktemp for temp directories in validation script ([3107861](https://github.com/blueraai/bluera-knowledge/commit/3107861bd7a966016fde2a121469dd84756f39be))
* **search:** add defaults for env vars so CLI works standalone ([b2d2ce5](https://github.com/blueraai/bluera-knowledge/commit/b2d2ce534e8cd2ba0fc0abdac505c912a1a76035))

## [0.11.16](https://github.com/blueraai/bluera-knowledge/compare/v0.11.6...v0.11.16) (2026-01-10)


### Features

* **commands:** add test-plugin command for comprehensive plugin testing ([c6eb5e7](https://github.com/blueraai/bluera-knowledge/commit/c6eb5e7762376810a9ff3e79f794f05ff0c77b97))
* **scripts:** add post-release npm validation script ([e4c29a0](https://github.com/blueraai/bluera-knowledge/commit/e4c29a0c83907de4bc293a69a58412629457fb22))
* **scripts:** add suggest, sync, serve, mcp tests to npm validation ([49d85da](https://github.com/blueraai/bluera-knowledge/commit/49d85dad1a89691060c12f152d644844baf6e6e6))
* **scripts:** log expected vs installed version in validation script ([c77d039](https://github.com/blueraai/bluera-knowledge/commit/c77d039b27a3ccf54d50006af161ac4dcfea7b21))


### Bug Fixes

* **cli:** plugin-api commands now respect global options ([d3cca02](https://github.com/blueraai/bluera-knowledge/commit/d3cca02ffc679ffc187b76c7682f3cc177eabdea))
* **commands:** move test-plugin to commands/ for plugin distribution ([0a3ff5f](https://github.com/blueraai/bluera-knowledge/commit/0a3ff5f91666db7efa213d5abd4c447fb07749fc))
* **plugin:** properly close services after command execution ([eeaf743](https://github.com/blueraai/bluera-knowledge/commit/eeaf743750be73fd9c7a9e72440b2fd0fb5a53fa))
* **scripts:** show real-time output in validation script ([8a4bdec](https://github.com/blueraai/bluera-knowledge/commit/8a4bdec8b63c504d34ba35bfe19da795f7f7fd07))
* **scripts:** use mktemp for temp directories in validation script ([3107861](https://github.com/blueraai/bluera-knowledge/commit/3107861bd7a966016fde2a121469dd84756f39be))
* **search:** add defaults for env vars so CLI works standalone ([b2d2ce5](https://github.com/blueraai/bluera-knowledge/commit/b2d2ce534e8cd2ba0fc0abdac505c912a1a76035))

## [0.11.15](https://github.com/blueraai/bluera-knowledge/compare/v0.11.6...v0.11.15) (2026-01-10)


### Features

* **commands:** add test-plugin command for comprehensive plugin testing ([f50c47f](https://github.com/blueraai/bluera-knowledge/commit/f50c47fee74df8c1efbe23481f05dfa33c62911f))
* **scripts:** add post-release npm validation script ([e4c29a0](https://github.com/blueraai/bluera-knowledge/commit/e4c29a0c83907de4bc293a69a58412629457fb22))
* **scripts:** add suggest, sync, serve, mcp tests to npm validation ([49d85da](https://github.com/blueraai/bluera-knowledge/commit/49d85dad1a89691060c12f152d644844baf6e6e6))
* **scripts:** log expected vs installed version in validation script ([c77d039](https://github.com/blueraai/bluera-knowledge/commit/c77d039b27a3ccf54d50006af161ac4dcfea7b21))


### Bug Fixes

* **cli:** plugin-api commands now respect global options ([d3cca02](https://github.com/blueraai/bluera-knowledge/commit/d3cca02ffc679ffc187b76c7682f3cc177eabdea))
* **plugin:** properly close services after command execution ([eeaf743](https://github.com/blueraai/bluera-knowledge/commit/eeaf743750be73fd9c7a9e72440b2fd0fb5a53fa))
* **scripts:** show real-time output in validation script ([8a4bdec](https://github.com/blueraai/bluera-knowledge/commit/8a4bdec8b63c504d34ba35bfe19da795f7f7fd07))
* **scripts:** use mktemp for temp directories in validation script ([3107861](https://github.com/blueraai/bluera-knowledge/commit/3107861bd7a966016fde2a121469dd84756f39be))
* **search:** add defaults for env vars so CLI works standalone ([b2d2ce5](https://github.com/blueraai/bluera-knowledge/commit/b2d2ce534e8cd2ba0fc0abdac505c912a1a76035))

## [0.11.14](https://github.com/blueraai/bluera-knowledge/compare/v0.11.6...v0.11.14) (2026-01-10)


### Features

* **scripts:** add post-release npm validation script ([e4c29a0](https://github.com/blueraai/bluera-knowledge/commit/e4c29a0c83907de4bc293a69a58412629457fb22))
* **scripts:** add suggest, sync, serve, mcp tests to npm validation ([49d85da](https://github.com/blueraai/bluera-knowledge/commit/49d85dad1a89691060c12f152d644844baf6e6e6))
* **scripts:** log expected vs installed version in validation script ([c77d039](https://github.com/blueraai/bluera-knowledge/commit/c77d039b27a3ccf54d50006af161ac4dcfea7b21))


### Bug Fixes

* **cli:** plugin-api commands now respect global options ([d3cca02](https://github.com/blueraai/bluera-knowledge/commit/d3cca02ffc679ffc187b76c7682f3cc177eabdea))
* **plugin:** properly close services after command execution ([eeaf743](https://github.com/blueraai/bluera-knowledge/commit/eeaf743750be73fd9c7a9e72440b2fd0fb5a53fa))
* **scripts:** show real-time output in validation script ([8a4bdec](https://github.com/blueraai/bluera-knowledge/commit/8a4bdec8b63c504d34ba35bfe19da795f7f7fd07))
* **scripts:** use mktemp for temp directories in validation script ([3107861](https://github.com/blueraai/bluera-knowledge/commit/3107861bd7a966016fde2a121469dd84756f39be))
* **search:** add defaults for env vars so CLI works standalone ([b2d2ce5](https://github.com/blueraai/bluera-knowledge/commit/b2d2ce534e8cd2ba0fc0abdac505c912a1a76035))

## [0.11.13](https://github.com/blueraai/bluera-knowledge/compare/v0.11.6...v0.11.13) (2026-01-10)


### Features

* **scripts:** add post-release npm validation script ([e4c29a0](https://github.com/blueraai/bluera-knowledge/commit/e4c29a0c83907de4bc293a69a58412629457fb22))
* **scripts:** add suggest, sync, serve, mcp tests to npm validation ([49d85da](https://github.com/blueraai/bluera-knowledge/commit/49d85dad1a89691060c12f152d644844baf6e6e6))
* **scripts:** log expected vs installed version in validation script ([c77d039](https://github.com/blueraai/bluera-knowledge/commit/c77d039b27a3ccf54d50006af161ac4dcfea7b21))


### Bug Fixes

* **cli:** plugin-api commands now respect global options ([d3cca02](https://github.com/blueraai/bluera-knowledge/commit/d3cca02ffc679ffc187b76c7682f3cc177eabdea))
* **plugin:** properly close services after command execution ([eeaf743](https://github.com/blueraai/bluera-knowledge/commit/eeaf743750be73fd9c7a9e72440b2fd0fb5a53fa))
* **scripts:** show real-time output in validation script ([8a4bdec](https://github.com/blueraai/bluera-knowledge/commit/8a4bdec8b63c504d34ba35bfe19da795f7f7fd07))
* **scripts:** use mktemp for temp directories in validation script ([3107861](https://github.com/blueraai/bluera-knowledge/commit/3107861bd7a966016fde2a121469dd84756f39be))
* **search:** add defaults for env vars so CLI works standalone ([b2d2ce5](https://github.com/blueraai/bluera-knowledge/commit/b2d2ce534e8cd2ba0fc0abdac505c912a1a76035))

## [0.11.12](https://github.com/blueraai/bluera-knowledge/compare/v0.11.6...v0.11.12) (2026-01-10)


### Features

* **scripts:** add post-release npm validation script ([e4c29a0](https://github.com/blueraai/bluera-knowledge/commit/e4c29a0c83907de4bc293a69a58412629457fb22))
* **scripts:** add suggest, sync, serve, mcp tests to npm validation ([49d85da](https://github.com/blueraai/bluera-knowledge/commit/49d85dad1a89691060c12f152d644844baf6e6e6))
* **scripts:** log expected vs installed version in validation script ([c77d039](https://github.com/blueraai/bluera-knowledge/commit/c77d039b27a3ccf54d50006af161ac4dcfea7b21))


### Bug Fixes

* **cli:** plugin-api commands now respect global options ([d3cca02](https://github.com/blueraai/bluera-knowledge/commit/d3cca02ffc679ffc187b76c7682f3cc177eabdea))
* **plugin:** properly close services after command execution ([eeaf743](https://github.com/blueraai/bluera-knowledge/commit/eeaf743750be73fd9c7a9e72440b2fd0fb5a53fa))
* **scripts:** show real-time output in validation script ([8a4bdec](https://github.com/blueraai/bluera-knowledge/commit/8a4bdec8b63c504d34ba35bfe19da795f7f7fd07))
* **scripts:** use mktemp for temp directories in validation script ([3107861](https://github.com/blueraai/bluera-knowledge/commit/3107861bd7a966016fde2a121469dd84756f39be))
* **search:** add defaults for env vars so CLI works standalone ([b2d2ce5](https://github.com/blueraai/bluera-knowledge/commit/b2d2ce534e8cd2ba0fc0abdac505c912a1a76035))

## [0.11.11](https://github.com/blueraai/bluera-knowledge/compare/v0.11.6...v0.11.11) (2026-01-10)


### Features

* **scripts:** add post-release npm validation script ([e4c29a0](https://github.com/blueraai/bluera-knowledge/commit/e4c29a0c83907de4bc293a69a58412629457fb22))
* **scripts:** log expected vs installed version in validation script ([c77d039](https://github.com/blueraai/bluera-knowledge/commit/c77d039b27a3ccf54d50006af161ac4dcfea7b21))


### Bug Fixes

* **cli:** plugin-api commands now respect global options ([d3cca02](https://github.com/blueraai/bluera-knowledge/commit/d3cca02ffc679ffc187b76c7682f3cc177eabdea))
* **plugin:** properly close services after command execution ([eeaf743](https://github.com/blueraai/bluera-knowledge/commit/eeaf743750be73fd9c7a9e72440b2fd0fb5a53fa))
* **scripts:** show real-time output in validation script ([8a4bdec](https://github.com/blueraai/bluera-knowledge/commit/8a4bdec8b63c504d34ba35bfe19da795f7f7fd07))
* **scripts:** use mktemp for temp directories in validation script ([3107861](https://github.com/blueraai/bluera-knowledge/commit/3107861bd7a966016fde2a121469dd84756f39be))
* **search:** add defaults for env vars so CLI works standalone ([b2d2ce5](https://github.com/blueraai/bluera-knowledge/commit/b2d2ce534e8cd2ba0fc0abdac505c912a1a76035))

## [0.11.10](https://github.com/blueraai/bluera-knowledge/compare/v0.11.6...v0.11.10) (2026-01-10)


### Features

* **scripts:** add post-release npm validation script ([e4c29a0](https://github.com/blueraai/bluera-knowledge/commit/e4c29a0c83907de4bc293a69a58412629457fb22))


### Bug Fixes

* **cli:** plugin-api commands now respect global options ([d3cca02](https://github.com/blueraai/bluera-knowledge/commit/d3cca02ffc679ffc187b76c7682f3cc177eabdea))
* **plugin:** properly close services after command execution ([eeaf743](https://github.com/blueraai/bluera-knowledge/commit/eeaf743750be73fd9c7a9e72440b2fd0fb5a53fa))
* **scripts:** show real-time output in validation script ([8a4bdec](https://github.com/blueraai/bluera-knowledge/commit/8a4bdec8b63c504d34ba35bfe19da795f7f7fd07))
* **scripts:** use mktemp for temp directories in validation script ([3107861](https://github.com/blueraai/bluera-knowledge/commit/3107861bd7a966016fde2a121469dd84756f39be))

## [0.11.9](https://github.com/blueraai/bluera-knowledge/compare/v0.11.6...v0.11.9) (2026-01-10)


### Features

* **scripts:** add post-release npm validation script ([e4c29a0](https://github.com/blueraai/bluera-knowledge/commit/e4c29a0c83907de4bc293a69a58412629457fb22))


### Bug Fixes

* **cli:** plugin-api commands now respect global options ([d3cca02](https://github.com/blueraai/bluera-knowledge/commit/d3cca02ffc679ffc187b76c7682f3cc177eabdea))
* **scripts:** show real-time output in validation script ([8a4bdec](https://github.com/blueraai/bluera-knowledge/commit/8a4bdec8b63c504d34ba35bfe19da795f7f7fd07))
* **scripts:** use mktemp for temp directories in validation script ([3107861](https://github.com/blueraai/bluera-knowledge/commit/3107861bd7a966016fde2a121469dd84756f39be))

## [0.11.8](https://github.com/blueraai/bluera-knowledge/compare/v0.11.6...v0.11.8) (2026-01-10)


### Features

* **scripts:** add post-release npm validation script ([e4c29a0](https://github.com/blueraai/bluera-knowledge/commit/e4c29a0c83907de4bc293a69a58412629457fb22))


### Bug Fixes

* **cli:** plugin-api commands now respect global options ([d3cca02](https://github.com/blueraai/bluera-knowledge/commit/d3cca02ffc679ffc187b76c7682f3cc177eabdea))
* **scripts:** show real-time output in validation script ([8a4bdec](https://github.com/blueraai/bluera-knowledge/commit/8a4bdec8b63c504d34ba35bfe19da795f7f7fd07))
* **scripts:** use mktemp for temp directories in validation script ([3107861](https://github.com/blueraai/bluera-knowledge/commit/3107861bd7a966016fde2a121469dd84756f39be))

## [0.11.7](https://github.com/blueraai/bluera-knowledge/compare/v0.11.6...v0.11.7) (2026-01-10)


### Features

* **scripts:** add post-release npm validation script ([e4c29a0](https://github.com/blueraai/bluera-knowledge/commit/e4c29a0c83907de4bc293a69a58412629457fb22))


### Bug Fixes

* **cli:** plugin-api commands now respect global options ([d3cca02](https://github.com/blueraai/bluera-knowledge/commit/d3cca02ffc679ffc187b76c7682f3cc177eabdea))
* **scripts:** use mktemp for temp directories in validation script ([3107861](https://github.com/blueraai/bluera-knowledge/commit/3107861bd7a966016fde2a121469dd84756f39be))

## [0.11.6](https://github.com/blueraai/bluera-knowledge/compare/v0.10.0...v0.11.6) (2026-01-10)


### Features

* add file logging to background worker for visibility ([6d7a751](https://github.com/blueraai/bluera-knowledge/commit/6d7a751de59a566c34b03b434c772ecde3770b2c))
* **analysis:** add custom language extensibility framework with ZIL adapter ([c4dc526](https://github.com/blueraai/bluera-knowledge/commit/c4dc526467c70dbc3fb28e7e5d7620a90cc3bf95))
* require env vars with no defaults (fail fast) ([b404cd6](https://github.com/blueraai/bluera-knowledge/commit/b404cd60374e0a7c5ace89f1ef0235bfc5c799fa))
* **sync:** add git-committable store definitions with sync command ([5cfa925](https://github.com/blueraai/bluera-knowledge/commit/5cfa92580397f193fda75ea61197fb4c9d9d4b0a))


### Bug Fixes

* **crawl:** handle Claude CLI structured_output wrapper in intelligent crawl ([54ea74b](https://github.com/blueraai/bluera-knowledge/commit/54ea74bca6d4b7263ef11a8290416e0d66b8d37f))
* **test:** add timeout to flaky search test ([5848b76](https://github.com/blueraai/bluera-knowledge/commit/5848b7648a547510fc2333f283ae835a6ca9efef))
* use relative path in .mcp.json for project-level MCP config ([6d7a55e](https://github.com/blueraai/bluera-knowledge/commit/6d7a55ef86dd5ac5d568feafa3ab207faa843d46))

## [0.11.5](https://github.com/blueraai/bluera-knowledge/compare/v0.10.0...v0.11.5) (2026-01-10)


### Features

* add file logging to background worker for visibility ([6d7a751](https://github.com/blueraai/bluera-knowledge/commit/6d7a751de59a566c34b03b434c772ecde3770b2c))
* **analysis:** add custom language extensibility framework with ZIL adapter ([c4dc526](https://github.com/blueraai/bluera-knowledge/commit/c4dc526467c70dbc3fb28e7e5d7620a90cc3bf95))
* require env vars with no defaults (fail fast) ([b404cd6](https://github.com/blueraai/bluera-knowledge/commit/b404cd60374e0a7c5ace89f1ef0235bfc5c799fa))
* **sync:** add git-committable store definitions with sync command ([5cfa925](https://github.com/blueraai/bluera-knowledge/commit/5cfa92580397f193fda75ea61197fb4c9d9d4b0a))


### Bug Fixes

* **crawl:** handle Claude CLI structured_output wrapper in intelligent crawl ([54ea74b](https://github.com/blueraai/bluera-knowledge/commit/54ea74bca6d4b7263ef11a8290416e0d66b8d37f))
* **test:** add timeout to flaky search test ([5848b76](https://github.com/blueraai/bluera-knowledge/commit/5848b7648a547510fc2333f283ae835a6ca9efef))

## [0.11.4](https://github.com/blueraai/bluera-knowledge/compare/v0.10.0...v0.11.4) (2026-01-10)


### Features

* add file logging to background worker for visibility ([6d7a751](https://github.com/blueraai/bluera-knowledge/commit/6d7a751de59a566c34b03b434c772ecde3770b2c))
* **analysis:** add custom language extensibility framework with ZIL adapter ([c4dc526](https://github.com/blueraai/bluera-knowledge/commit/c4dc526467c70dbc3fb28e7e5d7620a90cc3bf95))
* require env vars with no defaults (fail fast) ([b404cd6](https://github.com/blueraai/bluera-knowledge/commit/b404cd60374e0a7c5ace89f1ef0235bfc5c799fa))
* **sync:** add git-committable store definitions with sync command ([5cfa925](https://github.com/blueraai/bluera-knowledge/commit/5cfa92580397f193fda75ea61197fb4c9d9d4b0a))


### Bug Fixes

* **crawl:** handle Claude CLI structured_output wrapper in intelligent crawl ([54ea74b](https://github.com/blueraai/bluera-knowledge/commit/54ea74bca6d4b7263ef11a8290416e0d66b8d37f))
* **test:** add timeout to flaky search test ([5848b76](https://github.com/blueraai/bluera-knowledge/commit/5848b7648a547510fc2333f283ae835a6ca9efef))

## [0.11.3](https://github.com/blueraai/bluera-knowledge/compare/v0.10.0...v0.11.3) (2026-01-10)


### Features

* **analysis:** add custom language extensibility framework with ZIL adapter ([c4dc526](https://github.com/blueraai/bluera-knowledge/commit/c4dc526467c70dbc3fb28e7e5d7620a90cc3bf95))
* require env vars with no defaults (fail fast) ([b404cd6](https://github.com/blueraai/bluera-knowledge/commit/b404cd60374e0a7c5ace89f1ef0235bfc5c799fa))
* **sync:** add git-committable store definitions with sync command ([5cfa925](https://github.com/blueraai/bluera-knowledge/commit/5cfa92580397f193fda75ea61197fb4c9d9d4b0a))


### Bug Fixes

* **crawl:** handle Claude CLI structured_output wrapper in intelligent crawl ([54ea74b](https://github.com/blueraai/bluera-knowledge/commit/54ea74bca6d4b7263ef11a8290416e0d66b8d37f))
* **test:** add timeout to flaky search test ([5848b76](https://github.com/blueraai/bluera-knowledge/commit/5848b7648a547510fc2333f283ae835a6ca9efef))

## [0.11.2](https://github.com/blueraai/bluera-knowledge/compare/v0.10.0...v0.11.2) (2026-01-10)


### Features

* **analysis:** add custom language extensibility framework with ZIL adapter ([c4dc526](https://github.com/blueraai/bluera-knowledge/commit/c4dc526467c70dbc3fb28e7e5d7620a90cc3bf95))
* **sync:** add git-committable store definitions with sync command ([5cfa925](https://github.com/blueraai/bluera-knowledge/commit/5cfa92580397f193fda75ea61197fb4c9d9d4b0a))


### Bug Fixes

* **crawl:** handle Claude CLI structured_output wrapper in intelligent crawl ([54ea74b](https://github.com/blueraai/bluera-knowledge/commit/54ea74bca6d4b7263ef11a8290416e0d66b8d37f))
* **test:** add timeout to flaky search test ([5848b76](https://github.com/blueraai/bluera-knowledge/commit/5848b7648a547510fc2333f283ae835a6ca9efef))

## [0.11.1](https://github.com/blueraai/bluera-knowledge/compare/v0.10.0...v0.11.1) (2026-01-09)


### Features

* **analysis:** add custom language extensibility framework with ZIL adapter ([c4dc526](https://github.com/blueraai/bluera-knowledge/commit/c4dc526467c70dbc3fb28e7e5d7620a90cc3bf95))
* **sync:** add git-committable store definitions with sync command ([5cfa925](https://github.com/blueraai/bluera-knowledge/commit/5cfa92580397f193fda75ea61197fb4c9d9d4b0a))


### Bug Fixes

* **crawl:** handle Claude CLI structured_output wrapper in intelligent crawl ([54ea74b](https://github.com/blueraai/bluera-knowledge/commit/54ea74bca6d4b7263ef11a8290416e0d66b8d37f))

## [0.11.0](https://github.com/blueraai/bluera-knowledge/compare/v0.10.0...v0.11.0) (2026-01-09)


### Features

* **analysis:** add custom language extensibility framework with ZIL adapter ([c4dc526](https://github.com/blueraai/bluera-knowledge/commit/c4dc526467c70dbc3fb28e7e5d7620a90cc3bf95))
* **sync:** add git-committable store definitions with sync command ([5cfa925](https://github.com/blueraai/bluera-knowledge/commit/5cfa92580397f193fda75ea61197fb4c9d9d4b0a))


### Bug Fixes

* **crawl:** handle Claude CLI structured_output wrapper in intelligent crawl ([54ea74b](https://github.com/blueraai/bluera-knowledge/commit/54ea74bca6d4b7263ef11a8290416e0d66b8d37f))

## [0.10.1](https://github.com/blueraai/bluera-knowledge/compare/v0.10.0...v0.10.1) (2026-01-09)


### Features

* **sync:** add git-committable store definitions with sync command ([5cfa925](https://github.com/blueraai/bluera-knowledge/commit/5cfa92580397f193fda75ea61197fb4c9d9d4b0a))


### Bug Fixes

* **crawl:** handle Claude CLI structured_output wrapper in intelligent crawl ([54ea74b](https://github.com/blueraai/bluera-knowledge/commit/54ea74bca6d4b7263ef11a8290416e0d66b8d37f))

## [0.10.0](https://github.com/blueraai/bluera-knowledge/compare/v0.9.32...v0.10.0) (2026-01-09)


### Features

* **search:** add contextual/full detail display and use process.exitCode ([3205859](https://github.com/blueraai/bluera-knowledge/commit/32058590f6375b8564a255901333536183aa1bd2))
* **search:** add raw score exposure, confidence levels, and minRelevance filtering ([dc45e4d](https://github.com/blueraai/bluera-knowledge/commit/dc45e4d760c526ae5f0ad7912adea0528a61ff05))


### Bug Fixes

* **bridge:** kill Python process before nullifying to prevent zombie ([393dab3](https://github.com/blueraai/bluera-knowledge/commit/393dab3e45c75fd87c9ecfc1ca92e67b14526e79))
* **bridge:** mock kill() emits exit event & attach rejection handlers before stop ([d73c6ca](https://github.com/blueraai/bluera-knowledge/commit/d73c6ca6d640c3d15bd82756cabcda832f9ae245))
* **bridge:** stop() now waits for process to actually exit ([a92de41](https://github.com/blueraai/bluera-knowledge/commit/a92de41c89318fc106f996568ed88505352d5159))
* **cli:** ensure destroyServices runs before process.exit ([22e4267](https://github.com/blueraai/bluera-knowledge/commit/22e4267b7b9f698de3985a89b9c2b10759cfd49c))
* **code-unit:** brace counting now handles strings and comments ([1e857bb](https://github.com/blueraai/bluera-knowledge/commit/1e857bb297f357b97a6c067950e62495b3c8fc99))
* **code-unit:** support complex return types in signature extraction ([3bd2467](https://github.com/blueraai/bluera-knowledge/commit/3bd24675a67e73cc74a0c718f4b5a9e86cd826fb))
* **crawl:** improve link discovery for modern documentation sites ([78e1c22](https://github.com/blueraai/bluera-knowledge/commit/78e1c22f9de59131b0ec880f1b5e50b13129d6c0))
* increase native cleanup delays to prevent mutex crashes ([43566ed](https://github.com/blueraai/bluera-knowledge/commit/43566edc301a5093b9bc2000293c7dc0c538b0f0))
* **job:** validate PID before process.kill to prevent process group kill ([67c540f](https://github.com/blueraai/bluera-knowledge/commit/67c540fef6f2c55c5dca2c824104a91fe19aeff1))
* **plugin:** remove redundant hooks reference ([58ee578](https://github.com/blueraai/bluera-knowledge/commit/58ee578a54ae246db68187c4dc06e0a6d2b6c843))
* **plugin:** use .mcp.json instead of inline mcpServers ([ae2e844](https://github.com/blueraai/bluera-knowledge/commit/ae2e844371e1387bc124f1d0f9aa295f70f23440))
* **scripts:** preserve test exit codes in piped commands ([865f491](https://github.com/blueraai/bluera-knowledge/commit/865f491858ef518fb74f3d7dfed269109cd62c72))
* **search:** apply threshold filtering after score normalization ([1ebc78e](https://github.com/blueraai/bluera-knowledge/commit/1ebc78e0e688ffde0fdbaf049f17a35d129ef055))
* **search:** enable FTS-only search mode ([4a0f371](https://github.com/blueraai/bluera-knowledge/commit/4a0f371f0c42f80bf87e28ae0e609ac95986964d))
* **services:** fail fast on corrupted config/registry files ([030f63c](https://github.com/blueraai/bluera-knowledge/commit/030f63c10b0a30bddcd8e9b27b291ab0f53263f1))
* **tests:** increase timeout for exit code test in CI ([a362dcd](https://github.com/blueraai/bluera-knowledge/commit/a362dcdae32b0c19e757270e5009b0c1c5ead4e4))
* **tests:** increase timeout for flaky store delete test ([738fb49](https://github.com/blueraai/bluera-knowledge/commit/738fb4975653703d800dee802730dedfdf9e85ba))
* **watch:** clear pending timeouts on unwatch to prevent timer leak ([4dcafc1](https://github.com/blueraai/bluera-knowledge/commit/4dcafc14417442f6eeed0257cf185e04ae9de12b))
* **worker:** fail fast on PID file write error ([d92ce42](https://github.com/blueraai/bluera-knowledge/commit/d92ce42eff63cee3c97056ef019f5a52ef699edd))
* **worker:** prevent division by zero and improve cancellation handling ([b7b40ab](https://github.com/blueraai/bluera-knowledge/commit/b7b40ab950b7ad0fbbe84af243be3138b1072a72))

## [0.9.44](https://github.com/blueraai/bluera-knowledge/compare/v0.9.32...v0.9.44) (2026-01-09)


### Features

* **search:** add contextual/full detail display and use process.exitCode ([3205859](https://github.com/blueraai/bluera-knowledge/commit/32058590f6375b8564a255901333536183aa1bd2))
* **search:** add raw score exposure, confidence levels, and minRelevance filtering ([dc45e4d](https://github.com/blueraai/bluera-knowledge/commit/dc45e4d760c526ae5f0ad7912adea0528a61ff05))


### Bug Fixes

* **bridge:** kill Python process before nullifying to prevent zombie ([393dab3](https://github.com/blueraai/bluera-knowledge/commit/393dab3e45c75fd87c9ecfc1ca92e67b14526e79))
* **bridge:** mock kill() emits exit event & attach rejection handlers before stop ([d73c6ca](https://github.com/blueraai/bluera-knowledge/commit/d73c6ca6d640c3d15bd82756cabcda832f9ae245))
* **bridge:** stop() now waits for process to actually exit ([a92de41](https://github.com/blueraai/bluera-knowledge/commit/a92de41c89318fc106f996568ed88505352d5159))
* **cli:** ensure destroyServices runs before process.exit ([22e4267](https://github.com/blueraai/bluera-knowledge/commit/22e4267b7b9f698de3985a89b9c2b10759cfd49c))
* **code-unit:** brace counting now handles strings and comments ([1e857bb](https://github.com/blueraai/bluera-knowledge/commit/1e857bb297f357b97a6c067950e62495b3c8fc99))
* **code-unit:** support complex return types in signature extraction ([3bd2467](https://github.com/blueraai/bluera-knowledge/commit/3bd24675a67e73cc74a0c718f4b5a9e86cd826fb))
* increase native cleanup delays to prevent mutex crashes ([43566ed](https://github.com/blueraai/bluera-knowledge/commit/43566edc301a5093b9bc2000293c7dc0c538b0f0))
* **job:** validate PID before process.kill to prevent process group kill ([67c540f](https://github.com/blueraai/bluera-knowledge/commit/67c540fef6f2c55c5dca2c824104a91fe19aeff1))
* **plugin:** remove redundant hooks reference ([58ee578](https://github.com/blueraai/bluera-knowledge/commit/58ee578a54ae246db68187c4dc06e0a6d2b6c843))
* **plugin:** use .mcp.json instead of inline mcpServers ([ae2e844](https://github.com/blueraai/bluera-knowledge/commit/ae2e844371e1387bc124f1d0f9aa295f70f23440))
* **scripts:** preserve test exit codes in piped commands ([865f491](https://github.com/blueraai/bluera-knowledge/commit/865f491858ef518fb74f3d7dfed269109cd62c72))
* **search:** apply threshold filtering after score normalization ([1ebc78e](https://github.com/blueraai/bluera-knowledge/commit/1ebc78e0e688ffde0fdbaf049f17a35d129ef055))
* **search:** enable FTS-only search mode ([4a0f371](https://github.com/blueraai/bluera-knowledge/commit/4a0f371f0c42f80bf87e28ae0e609ac95986964d))
* **services:** fail fast on corrupted config/registry files ([030f63c](https://github.com/blueraai/bluera-knowledge/commit/030f63c10b0a30bddcd8e9b27b291ab0f53263f1))
* **tests:** increase timeout for exit code test in CI ([a362dcd](https://github.com/blueraai/bluera-knowledge/commit/a362dcdae32b0c19e757270e5009b0c1c5ead4e4))
* **tests:** increase timeout for flaky store delete test ([738fb49](https://github.com/blueraai/bluera-knowledge/commit/738fb4975653703d800dee802730dedfdf9e85ba))
* **watch:** clear pending timeouts on unwatch to prevent timer leak ([4dcafc1](https://github.com/blueraai/bluera-knowledge/commit/4dcafc14417442f6eeed0257cf185e04ae9de12b))
* **worker:** fail fast on PID file write error ([d92ce42](https://github.com/blueraai/bluera-knowledge/commit/d92ce42eff63cee3c97056ef019f5a52ef699edd))
* **worker:** prevent division by zero and improve cancellation handling ([b7b40ab](https://github.com/blueraai/bluera-knowledge/commit/b7b40ab950b7ad0fbbe84af243be3138b1072a72))

## [0.9.43](https://github.com/blueraai/bluera-knowledge/compare/v0.9.32...v0.9.43) (2026-01-09)


### Features

* **search:** add contextual/full detail display and use process.exitCode ([3205859](https://github.com/blueraai/bluera-knowledge/commit/32058590f6375b8564a255901333536183aa1bd2))
* **search:** add raw score exposure, confidence levels, and minRelevance filtering ([dc45e4d](https://github.com/blueraai/bluera-knowledge/commit/dc45e4d760c526ae5f0ad7912adea0528a61ff05))


### Bug Fixes

* **bridge:** kill Python process before nullifying to prevent zombie ([393dab3](https://github.com/blueraai/bluera-knowledge/commit/393dab3e45c75fd87c9ecfc1ca92e67b14526e79))
* **bridge:** mock kill() emits exit event & attach rejection handlers before stop ([d73c6ca](https://github.com/blueraai/bluera-knowledge/commit/d73c6ca6d640c3d15bd82756cabcda832f9ae245))
* **bridge:** stop() now waits for process to actually exit ([a92de41](https://github.com/blueraai/bluera-knowledge/commit/a92de41c89318fc106f996568ed88505352d5159))
* **cli:** ensure destroyServices runs before process.exit ([22e4267](https://github.com/blueraai/bluera-knowledge/commit/22e4267b7b9f698de3985a89b9c2b10759cfd49c))
* **code-unit:** brace counting now handles strings and comments ([1e857bb](https://github.com/blueraai/bluera-knowledge/commit/1e857bb297f357b97a6c067950e62495b3c8fc99))
* **code-unit:** support complex return types in signature extraction ([3bd2467](https://github.com/blueraai/bluera-knowledge/commit/3bd24675a67e73cc74a0c718f4b5a9e86cd826fb))
* increase native cleanup delays to prevent mutex crashes ([43566ed](https://github.com/blueraai/bluera-knowledge/commit/43566edc301a5093b9bc2000293c7dc0c538b0f0))
* **job:** validate PID before process.kill to prevent process group kill ([67c540f](https://github.com/blueraai/bluera-knowledge/commit/67c540fef6f2c55c5dca2c824104a91fe19aeff1))
* **plugin:** remove redundant hooks reference ([58ee578](https://github.com/blueraai/bluera-knowledge/commit/58ee578a54ae246db68187c4dc06e0a6d2b6c843))
* **scripts:** preserve test exit codes in piped commands ([865f491](https://github.com/blueraai/bluera-knowledge/commit/865f491858ef518fb74f3d7dfed269109cd62c72))
* **search:** apply threshold filtering after score normalization ([1ebc78e](https://github.com/blueraai/bluera-knowledge/commit/1ebc78e0e688ffde0fdbaf049f17a35d129ef055))
* **search:** enable FTS-only search mode ([4a0f371](https://github.com/blueraai/bluera-knowledge/commit/4a0f371f0c42f80bf87e28ae0e609ac95986964d))
* **services:** fail fast on corrupted config/registry files ([030f63c](https://github.com/blueraai/bluera-knowledge/commit/030f63c10b0a30bddcd8e9b27b291ab0f53263f1))
* **tests:** increase timeout for exit code test in CI ([a362dcd](https://github.com/blueraai/bluera-knowledge/commit/a362dcdae32b0c19e757270e5009b0c1c5ead4e4))
* **tests:** increase timeout for flaky store delete test ([738fb49](https://github.com/blueraai/bluera-knowledge/commit/738fb4975653703d800dee802730dedfdf9e85ba))
* **watch:** clear pending timeouts on unwatch to prevent timer leak ([4dcafc1](https://github.com/blueraai/bluera-knowledge/commit/4dcafc14417442f6eeed0257cf185e04ae9de12b))
* **worker:** fail fast on PID file write error ([d92ce42](https://github.com/blueraai/bluera-knowledge/commit/d92ce42eff63cee3c97056ef019f5a52ef699edd))
* **worker:** prevent division by zero and improve cancellation handling ([b7b40ab](https://github.com/blueraai/bluera-knowledge/commit/b7b40ab950b7ad0fbbe84af243be3138b1072a72))

## [0.9.42](https://github.com/blueraai/bluera-knowledge/compare/v0.9.32...v0.9.42) (2026-01-09)


### Features

* **search:** add contextual/full detail display and use process.exitCode ([3205859](https://github.com/blueraai/bluera-knowledge/commit/32058590f6375b8564a255901333536183aa1bd2))
* **search:** add raw score exposure, confidence levels, and minRelevance filtering ([dc45e4d](https://github.com/blueraai/bluera-knowledge/commit/dc45e4d760c526ae5f0ad7912adea0528a61ff05))


### Bug Fixes

* **bridge:** kill Python process before nullifying to prevent zombie ([393dab3](https://github.com/blueraai/bluera-knowledge/commit/393dab3e45c75fd87c9ecfc1ca92e67b14526e79))
* **bridge:** mock kill() emits exit event & attach rejection handlers before stop ([d73c6ca](https://github.com/blueraai/bluera-knowledge/commit/d73c6ca6d640c3d15bd82756cabcda832f9ae245))
* **bridge:** stop() now waits for process to actually exit ([a92de41](https://github.com/blueraai/bluera-knowledge/commit/a92de41c89318fc106f996568ed88505352d5159))
* **cli:** ensure destroyServices runs before process.exit ([22e4267](https://github.com/blueraai/bluera-knowledge/commit/22e4267b7b9f698de3985a89b9c2b10759cfd49c))
* **code-unit:** brace counting now handles strings and comments ([1e857bb](https://github.com/blueraai/bluera-knowledge/commit/1e857bb297f357b97a6c067950e62495b3c8fc99))
* **code-unit:** support complex return types in signature extraction ([3bd2467](https://github.com/blueraai/bluera-knowledge/commit/3bd24675a67e73cc74a0c718f4b5a9e86cd826fb))
* increase native cleanup delays to prevent mutex crashes ([43566ed](https://github.com/blueraai/bluera-knowledge/commit/43566edc301a5093b9bc2000293c7dc0c538b0f0))
* **job:** validate PID before process.kill to prevent process group kill ([67c540f](https://github.com/blueraai/bluera-knowledge/commit/67c540fef6f2c55c5dca2c824104a91fe19aeff1))
* **scripts:** preserve test exit codes in piped commands ([865f491](https://github.com/blueraai/bluera-knowledge/commit/865f491858ef518fb74f3d7dfed269109cd62c72))
* **search:** apply threshold filtering after score normalization ([1ebc78e](https://github.com/blueraai/bluera-knowledge/commit/1ebc78e0e688ffde0fdbaf049f17a35d129ef055))
* **search:** enable FTS-only search mode ([4a0f371](https://github.com/blueraai/bluera-knowledge/commit/4a0f371f0c42f80bf87e28ae0e609ac95986964d))
* **services:** fail fast on corrupted config/registry files ([030f63c](https://github.com/blueraai/bluera-knowledge/commit/030f63c10b0a30bddcd8e9b27b291ab0f53263f1))
* **tests:** increase timeout for exit code test in CI ([a362dcd](https://github.com/blueraai/bluera-knowledge/commit/a362dcdae32b0c19e757270e5009b0c1c5ead4e4))
* **tests:** increase timeout for flaky store delete test ([738fb49](https://github.com/blueraai/bluera-knowledge/commit/738fb4975653703d800dee802730dedfdf9e85ba))
* **watch:** clear pending timeouts on unwatch to prevent timer leak ([4dcafc1](https://github.com/blueraai/bluera-knowledge/commit/4dcafc14417442f6eeed0257cf185e04ae9de12b))
* **worker:** fail fast on PID file write error ([d92ce42](https://github.com/blueraai/bluera-knowledge/commit/d92ce42eff63cee3c97056ef019f5a52ef699edd))
* **worker:** prevent division by zero and improve cancellation handling ([b7b40ab](https://github.com/blueraai/bluera-knowledge/commit/b7b40ab950b7ad0fbbe84af243be3138b1072a72))

## [0.9.41](https://github.com/blueraai/bluera-knowledge/compare/v0.9.32...v0.9.41) (2026-01-09)


### Features

* **search:** add contextual/full detail display and use process.exitCode ([3205859](https://github.com/blueraai/bluera-knowledge/commit/32058590f6375b8564a255901333536183aa1bd2))
* **search:** add raw score exposure, confidence levels, and minRelevance filtering ([dc45e4d](https://github.com/blueraai/bluera-knowledge/commit/dc45e4d760c526ae5f0ad7912adea0528a61ff05))


### Bug Fixes

* **bridge:** kill Python process before nullifying to prevent zombie ([393dab3](https://github.com/blueraai/bluera-knowledge/commit/393dab3e45c75fd87c9ecfc1ca92e67b14526e79))
* **bridge:** mock kill() emits exit event & attach rejection handlers before stop ([d73c6ca](https://github.com/blueraai/bluera-knowledge/commit/d73c6ca6d640c3d15bd82756cabcda832f9ae245))
* **bridge:** stop() now waits for process to actually exit ([a92de41](https://github.com/blueraai/bluera-knowledge/commit/a92de41c89318fc106f996568ed88505352d5159))
* **cli:** ensure destroyServices runs before process.exit ([22e4267](https://github.com/blueraai/bluera-knowledge/commit/22e4267b7b9f698de3985a89b9c2b10759cfd49c))
* **code-unit:** brace counting now handles strings and comments ([1e857bb](https://github.com/blueraai/bluera-knowledge/commit/1e857bb297f357b97a6c067950e62495b3c8fc99))
* **code-unit:** support complex return types in signature extraction ([3bd2467](https://github.com/blueraai/bluera-knowledge/commit/3bd24675a67e73cc74a0c718f4b5a9e86cd826fb))
* increase native cleanup delays to prevent mutex crashes ([43566ed](https://github.com/blueraai/bluera-knowledge/commit/43566edc301a5093b9bc2000293c7dc0c538b0f0))
* **job:** validate PID before process.kill to prevent process group kill ([67c540f](https://github.com/blueraai/bluera-knowledge/commit/67c540fef6f2c55c5dca2c824104a91fe19aeff1))
* **scripts:** preserve test exit codes in piped commands ([865f491](https://github.com/blueraai/bluera-knowledge/commit/865f491858ef518fb74f3d7dfed269109cd62c72))
* **search:** apply threshold filtering after score normalization ([1ebc78e](https://github.com/blueraai/bluera-knowledge/commit/1ebc78e0e688ffde0fdbaf049f17a35d129ef055))
* **search:** enable FTS-only search mode ([4a0f371](https://github.com/blueraai/bluera-knowledge/commit/4a0f371f0c42f80bf87e28ae0e609ac95986964d))
* **services:** fail fast on corrupted config/registry files ([030f63c](https://github.com/blueraai/bluera-knowledge/commit/030f63c10b0a30bddcd8e9b27b291ab0f53263f1))
* **tests:** increase timeout for exit code test in CI ([a362dcd](https://github.com/blueraai/bluera-knowledge/commit/a362dcdae32b0c19e757270e5009b0c1c5ead4e4))
* **tests:** increase timeout for flaky store delete test ([738fb49](https://github.com/blueraai/bluera-knowledge/commit/738fb4975653703d800dee802730dedfdf9e85ba))
* **watch:** clear pending timeouts on unwatch to prevent timer leak ([4dcafc1](https://github.com/blueraai/bluera-knowledge/commit/4dcafc14417442f6eeed0257cf185e04ae9de12b))
* **worker:** fail fast on PID file write error ([d92ce42](https://github.com/blueraai/bluera-knowledge/commit/d92ce42eff63cee3c97056ef019f5a52ef699edd))
* **worker:** prevent division by zero and improve cancellation handling ([b7b40ab](https://github.com/blueraai/bluera-knowledge/commit/b7b40ab950b7ad0fbbe84af243be3138b1072a72))

## [0.9.40](https://github.com/blueraai/bluera-knowledge/compare/v0.9.32...v0.9.40) (2026-01-08)


### Features

* **search:** add raw score exposure, confidence levels, and minRelevance filtering ([dc45e4d](https://github.com/blueraai/bluera-knowledge/commit/dc45e4d760c526ae5f0ad7912adea0528a61ff05))


### Bug Fixes

* **bridge:** kill Python process before nullifying to prevent zombie ([393dab3](https://github.com/blueraai/bluera-knowledge/commit/393dab3e45c75fd87c9ecfc1ca92e67b14526e79))
* **bridge:** mock kill() emits exit event & attach rejection handlers before stop ([d73c6ca](https://github.com/blueraai/bluera-knowledge/commit/d73c6ca6d640c3d15bd82756cabcda832f9ae245))
* **bridge:** stop() now waits for process to actually exit ([a92de41](https://github.com/blueraai/bluera-knowledge/commit/a92de41c89318fc106f996568ed88505352d5159))
* **cli:** ensure destroyServices runs before process.exit ([22e4267](https://github.com/blueraai/bluera-knowledge/commit/22e4267b7b9f698de3985a89b9c2b10759cfd49c))
* **code-unit:** brace counting now handles strings and comments ([1e857bb](https://github.com/blueraai/bluera-knowledge/commit/1e857bb297f357b97a6c067950e62495b3c8fc99))
* **code-unit:** support complex return types in signature extraction ([3bd2467](https://github.com/blueraai/bluera-knowledge/commit/3bd24675a67e73cc74a0c718f4b5a9e86cd826fb))
* **job:** validate PID before process.kill to prevent process group kill ([67c540f](https://github.com/blueraai/bluera-knowledge/commit/67c540fef6f2c55c5dca2c824104a91fe19aeff1))
* **scripts:** preserve test exit codes in piped commands ([865f491](https://github.com/blueraai/bluera-knowledge/commit/865f491858ef518fb74f3d7dfed269109cd62c72))
* **search:** apply threshold filtering after score normalization ([1ebc78e](https://github.com/blueraai/bluera-knowledge/commit/1ebc78e0e688ffde0fdbaf049f17a35d129ef055))
* **search:** enable FTS-only search mode ([4a0f371](https://github.com/blueraai/bluera-knowledge/commit/4a0f371f0c42f80bf87e28ae0e609ac95986964d))
* **services:** fail fast on corrupted config/registry files ([030f63c](https://github.com/blueraai/bluera-knowledge/commit/030f63c10b0a30bddcd8e9b27b291ab0f53263f1))
* **tests:** increase timeout for exit code test in CI ([a362dcd](https://github.com/blueraai/bluera-knowledge/commit/a362dcdae32b0c19e757270e5009b0c1c5ead4e4))
* **tests:** increase timeout for flaky store delete test ([738fb49](https://github.com/blueraai/bluera-knowledge/commit/738fb4975653703d800dee802730dedfdf9e85ba))
* **watch:** clear pending timeouts on unwatch to prevent timer leak ([4dcafc1](https://github.com/blueraai/bluera-knowledge/commit/4dcafc14417442f6eeed0257cf185e04ae9de12b))
* **worker:** fail fast on PID file write error ([d92ce42](https://github.com/blueraai/bluera-knowledge/commit/d92ce42eff63cee3c97056ef019f5a52ef699edd))
* **worker:** prevent division by zero and improve cancellation handling ([b7b40ab](https://github.com/blueraai/bluera-knowledge/commit/b7b40ab950b7ad0fbbe84af243be3138b1072a72))

## [0.9.39](https://github.com/blueraai/bluera-knowledge/compare/v0.9.32...v0.9.39) (2026-01-08)


### Features

* **search:** add raw score exposure, confidence levels, and minRelevance filtering ([dc45e4d](https://github.com/blueraai/bluera-knowledge/commit/dc45e4d760c526ae5f0ad7912adea0528a61ff05))


### Bug Fixes

* **bridge:** kill Python process before nullifying to prevent zombie ([393dab3](https://github.com/blueraai/bluera-knowledge/commit/393dab3e45c75fd87c9ecfc1ca92e67b14526e79))
* **bridge:** mock kill() emits exit event & attach rejection handlers before stop ([d73c6ca](https://github.com/blueraai/bluera-knowledge/commit/d73c6ca6d640c3d15bd82756cabcda832f9ae245))
* **bridge:** stop() now waits for process to actually exit ([a92de41](https://github.com/blueraai/bluera-knowledge/commit/a92de41c89318fc106f996568ed88505352d5159))
* **cli:** ensure destroyServices runs before process.exit ([22e4267](https://github.com/blueraai/bluera-knowledge/commit/22e4267b7b9f698de3985a89b9c2b10759cfd49c))
* **code-unit:** brace counting now handles strings and comments ([1e857bb](https://github.com/blueraai/bluera-knowledge/commit/1e857bb297f357b97a6c067950e62495b3c8fc99))
* **code-unit:** support complex return types in signature extraction ([3bd2467](https://github.com/blueraai/bluera-knowledge/commit/3bd24675a67e73cc74a0c718f4b5a9e86cd826fb))
* **job:** validate PID before process.kill to prevent process group kill ([67c540f](https://github.com/blueraai/bluera-knowledge/commit/67c540fef6f2c55c5dca2c824104a91fe19aeff1))
* **search:** apply threshold filtering after score normalization ([1ebc78e](https://github.com/blueraai/bluera-knowledge/commit/1ebc78e0e688ffde0fdbaf049f17a35d129ef055))
* **search:** enable FTS-only search mode ([4a0f371](https://github.com/blueraai/bluera-knowledge/commit/4a0f371f0c42f80bf87e28ae0e609ac95986964d))
* **services:** fail fast on corrupted config/registry files ([030f63c](https://github.com/blueraai/bluera-knowledge/commit/030f63c10b0a30bddcd8e9b27b291ab0f53263f1))
* **tests:** increase timeout for exit code test in CI ([a362dcd](https://github.com/blueraai/bluera-knowledge/commit/a362dcdae32b0c19e757270e5009b0c1c5ead4e4))
* **tests:** increase timeout for flaky store delete test ([738fb49](https://github.com/blueraai/bluera-knowledge/commit/738fb4975653703d800dee802730dedfdf9e85ba))
* **watch:** clear pending timeouts on unwatch to prevent timer leak ([4dcafc1](https://github.com/blueraai/bluera-knowledge/commit/4dcafc14417442f6eeed0257cf185e04ae9de12b))
* **worker:** fail fast on PID file write error ([d92ce42](https://github.com/blueraai/bluera-knowledge/commit/d92ce42eff63cee3c97056ef019f5a52ef699edd))
* **worker:** prevent division by zero and improve cancellation handling ([b7b40ab](https://github.com/blueraai/bluera-knowledge/commit/b7b40ab950b7ad0fbbe84af243be3138b1072a72))

## [0.9.38](https://github.com/blueraai/bluera-knowledge/compare/v0.9.32...v0.9.38) (2026-01-08)


### Bug Fixes

* **bridge:** kill Python process before nullifying to prevent zombie ([393dab3](https://github.com/blueraai/bluera-knowledge/commit/393dab3e45c75fd87c9ecfc1ca92e67b14526e79))
* **bridge:** mock kill() emits exit event & attach rejection handlers before stop ([d73c6ca](https://github.com/blueraai/bluera-knowledge/commit/d73c6ca6d640c3d15bd82756cabcda832f9ae245))
* **bridge:** stop() now waits for process to actually exit ([a92de41](https://github.com/blueraai/bluera-knowledge/commit/a92de41c89318fc106f996568ed88505352d5159))
* **cli:** ensure destroyServices runs before process.exit ([22e4267](https://github.com/blueraai/bluera-knowledge/commit/22e4267b7b9f698de3985a89b9c2b10759cfd49c))
* **code-unit:** brace counting now handles strings and comments ([1e857bb](https://github.com/blueraai/bluera-knowledge/commit/1e857bb297f357b97a6c067950e62495b3c8fc99))
* **code-unit:** support complex return types in signature extraction ([3bd2467](https://github.com/blueraai/bluera-knowledge/commit/3bd24675a67e73cc74a0c718f4b5a9e86cd826fb))
* **job:** validate PID before process.kill to prevent process group kill ([67c540f](https://github.com/blueraai/bluera-knowledge/commit/67c540fef6f2c55c5dca2c824104a91fe19aeff1))
* **search:** apply threshold filtering after score normalization ([1ebc78e](https://github.com/blueraai/bluera-knowledge/commit/1ebc78e0e688ffde0fdbaf049f17a35d129ef055))
* **search:** enable FTS-only search mode ([4a0f371](https://github.com/blueraai/bluera-knowledge/commit/4a0f371f0c42f80bf87e28ae0e609ac95986964d))
* **services:** fail fast on corrupted config/registry files ([030f63c](https://github.com/blueraai/bluera-knowledge/commit/030f63c10b0a30bddcd8e9b27b291ab0f53263f1))
* **tests:** increase timeout for exit code test in CI ([a362dcd](https://github.com/blueraai/bluera-knowledge/commit/a362dcdae32b0c19e757270e5009b0c1c5ead4e4))
* **tests:** increase timeout for flaky store delete test ([738fb49](https://github.com/blueraai/bluera-knowledge/commit/738fb4975653703d800dee802730dedfdf9e85ba))
* **watch:** clear pending timeouts on unwatch to prevent timer leak ([4dcafc1](https://github.com/blueraai/bluera-knowledge/commit/4dcafc14417442f6eeed0257cf185e04ae9de12b))
* **worker:** fail fast on PID file write error ([d92ce42](https://github.com/blueraai/bluera-knowledge/commit/d92ce42eff63cee3c97056ef019f5a52ef699edd))
* **worker:** prevent division by zero and improve cancellation handling ([b7b40ab](https://github.com/blueraai/bluera-knowledge/commit/b7b40ab950b7ad0fbbe84af243be3138b1072a72))

## [0.9.37](https://github.com/blueraai/bluera-knowledge/compare/v0.9.32...v0.9.37) (2026-01-08)


### Bug Fixes

* **bridge:** kill Python process before nullifying to prevent zombie ([393dab3](https://github.com/blueraai/bluera-knowledge/commit/393dab3e45c75fd87c9ecfc1ca92e67b14526e79))
* **bridge:** mock kill() emits exit event & attach rejection handlers before stop ([d73c6ca](https://github.com/blueraai/bluera-knowledge/commit/d73c6ca6d640c3d15bd82756cabcda832f9ae245))
* **bridge:** stop() now waits for process to actually exit ([a92de41](https://github.com/blueraai/bluera-knowledge/commit/a92de41c89318fc106f996568ed88505352d5159))
* **cli:** ensure destroyServices runs before process.exit ([22e4267](https://github.com/blueraai/bluera-knowledge/commit/22e4267b7b9f698de3985a89b9c2b10759cfd49c))
* **code-unit:** brace counting now handles strings and comments ([1e857bb](https://github.com/blueraai/bluera-knowledge/commit/1e857bb297f357b97a6c067950e62495b3c8fc99))
* **code-unit:** support complex return types in signature extraction ([3bd2467](https://github.com/blueraai/bluera-knowledge/commit/3bd24675a67e73cc74a0c718f4b5a9e86cd826fb))
* **job:** validate PID before process.kill to prevent process group kill ([67c540f](https://github.com/blueraai/bluera-knowledge/commit/67c540fef6f2c55c5dca2c824104a91fe19aeff1))
* **search:** apply threshold filtering after score normalization ([1ebc78e](https://github.com/blueraai/bluera-knowledge/commit/1ebc78e0e688ffde0fdbaf049f17a35d129ef055))
* **services:** fail fast on corrupted config/registry files ([030f63c](https://github.com/blueraai/bluera-knowledge/commit/030f63c10b0a30bddcd8e9b27b291ab0f53263f1))
* **tests:** increase timeout for exit code test in CI ([a362dcd](https://github.com/blueraai/bluera-knowledge/commit/a362dcdae32b0c19e757270e5009b0c1c5ead4e4))
* **tests:** increase timeout for flaky store delete test ([738fb49](https://github.com/blueraai/bluera-knowledge/commit/738fb4975653703d800dee802730dedfdf9e85ba))
* **watch:** clear pending timeouts on unwatch to prevent timer leak ([4dcafc1](https://github.com/blueraai/bluera-knowledge/commit/4dcafc14417442f6eeed0257cf185e04ae9de12b))
* **worker:** fail fast on PID file write error ([d92ce42](https://github.com/blueraai/bluera-knowledge/commit/d92ce42eff63cee3c97056ef019f5a52ef699edd))
* **worker:** prevent division by zero and improve cancellation handling ([b7b40ab](https://github.com/blueraai/bluera-knowledge/commit/b7b40ab950b7ad0fbbe84af243be3138b1072a72))

## [0.9.36](https://github.com/blueraai/bluera-knowledge/compare/v0.9.32...v0.9.36) (2026-01-08)


### Bug Fixes

* **bridge:** kill Python process before nullifying to prevent zombie ([393dab3](https://github.com/blueraai/bluera-knowledge/commit/393dab3e45c75fd87c9ecfc1ca92e67b14526e79))
* **bridge:** mock kill() emits exit event & attach rejection handlers before stop ([d73c6ca](https://github.com/blueraai/bluera-knowledge/commit/d73c6ca6d640c3d15bd82756cabcda832f9ae245))
* **bridge:** stop() now waits for process to actually exit ([a92de41](https://github.com/blueraai/bluera-knowledge/commit/a92de41c89318fc106f996568ed88505352d5159))
* **cli:** ensure destroyServices runs before process.exit ([22e4267](https://github.com/blueraai/bluera-knowledge/commit/22e4267b7b9f698de3985a89b9c2b10759cfd49c))
* **code-unit:** brace counting now handles strings and comments ([1e857bb](https://github.com/blueraai/bluera-knowledge/commit/1e857bb297f357b97a6c067950e62495b3c8fc99))
* **code-unit:** support complex return types in signature extraction ([3bd2467](https://github.com/blueraai/bluera-knowledge/commit/3bd24675a67e73cc74a0c718f4b5a9e86cd826fb))
* **job:** validate PID before process.kill to prevent process group kill ([67c540f](https://github.com/blueraai/bluera-knowledge/commit/67c540fef6f2c55c5dca2c824104a91fe19aeff1))
* **services:** fail fast on corrupted config/registry files ([030f63c](https://github.com/blueraai/bluera-knowledge/commit/030f63c10b0a30bddcd8e9b27b291ab0f53263f1))
* **tests:** increase timeout for exit code test in CI ([a362dcd](https://github.com/blueraai/bluera-knowledge/commit/a362dcdae32b0c19e757270e5009b0c1c5ead4e4))
* **tests:** increase timeout for flaky store delete test ([738fb49](https://github.com/blueraai/bluera-knowledge/commit/738fb4975653703d800dee802730dedfdf9e85ba))
* **watch:** clear pending timeouts on unwatch to prevent timer leak ([4dcafc1](https://github.com/blueraai/bluera-knowledge/commit/4dcafc14417442f6eeed0257cf185e04ae9de12b))
* **worker:** fail fast on PID file write error ([d92ce42](https://github.com/blueraai/bluera-knowledge/commit/d92ce42eff63cee3c97056ef019f5a52ef699edd))
* **worker:** prevent division by zero and improve cancellation handling ([b7b40ab](https://github.com/blueraai/bluera-knowledge/commit/b7b40ab950b7ad0fbbe84af243be3138b1072a72))

## [0.9.35](https://github.com/blueraai/bluera-knowledge/compare/v0.9.32...v0.9.35) (2026-01-08)


### Bug Fixes

* **bridge:** kill Python process before nullifying to prevent zombie ([393dab3](https://github.com/blueraai/bluera-knowledge/commit/393dab3e45c75fd87c9ecfc1ca92e67b14526e79))
* **bridge:** mock kill() emits exit event & attach rejection handlers before stop ([d73c6ca](https://github.com/blueraai/bluera-knowledge/commit/d73c6ca6d640c3d15bd82756cabcda832f9ae245))
* **bridge:** stop() now waits for process to actually exit ([a92de41](https://github.com/blueraai/bluera-knowledge/commit/a92de41c89318fc106f996568ed88505352d5159))
* **cli:** ensure destroyServices runs before process.exit ([22e4267](https://github.com/blueraai/bluera-knowledge/commit/22e4267b7b9f698de3985a89b9c2b10759cfd49c))
* **code-unit:** brace counting now handles strings and comments ([1e857bb](https://github.com/blueraai/bluera-knowledge/commit/1e857bb297f357b97a6c067950e62495b3c8fc99))
* **code-unit:** support complex return types in signature extraction ([3bd2467](https://github.com/blueraai/bluera-knowledge/commit/3bd24675a67e73cc74a0c718f4b5a9e86cd826fb))
* **job:** validate PID before process.kill to prevent process group kill ([67c540f](https://github.com/blueraai/bluera-knowledge/commit/67c540fef6f2c55c5dca2c824104a91fe19aeff1))
* **services:** fail fast on corrupted config/registry files ([030f63c](https://github.com/blueraai/bluera-knowledge/commit/030f63c10b0a30bddcd8e9b27b291ab0f53263f1))
* **tests:** increase timeout for flaky store delete test ([738fb49](https://github.com/blueraai/bluera-knowledge/commit/738fb4975653703d800dee802730dedfdf9e85ba))
* **watch:** clear pending timeouts on unwatch to prevent timer leak ([4dcafc1](https://github.com/blueraai/bluera-knowledge/commit/4dcafc14417442f6eeed0257cf185e04ae9de12b))
* **worker:** fail fast on PID file write error ([d92ce42](https://github.com/blueraai/bluera-knowledge/commit/d92ce42eff63cee3c97056ef019f5a52ef699edd))
* **worker:** prevent division by zero and improve cancellation handling ([b7b40ab](https://github.com/blueraai/bluera-knowledge/commit/b7b40ab950b7ad0fbbe84af243be3138b1072a72))

## [0.9.34](https://github.com/blueraai/bluera-knowledge/compare/v0.9.32...v0.9.34) (2026-01-08)


### Bug Fixes

* **bridge:** kill Python process before nullifying to prevent zombie ([393dab3](https://github.com/blueraai/bluera-knowledge/commit/393dab3e45c75fd87c9ecfc1ca92e67b14526e79))
* **bridge:** mock kill() emits exit event & attach rejection handlers before stop ([d73c6ca](https://github.com/blueraai/bluera-knowledge/commit/d73c6ca6d640c3d15bd82756cabcda832f9ae245))
* **bridge:** stop() now waits for process to actually exit ([a92de41](https://github.com/blueraai/bluera-knowledge/commit/a92de41c89318fc106f996568ed88505352d5159))
* **cli:** ensure destroyServices runs before process.exit ([22e4267](https://github.com/blueraai/bluera-knowledge/commit/22e4267b7b9f698de3985a89b9c2b10759cfd49c))
* **code-unit:** brace counting now handles strings and comments ([1e857bb](https://github.com/blueraai/bluera-knowledge/commit/1e857bb297f357b97a6c067950e62495b3c8fc99))
* **code-unit:** support complex return types in signature extraction ([3bd2467](https://github.com/blueraai/bluera-knowledge/commit/3bd24675a67e73cc74a0c718f4b5a9e86cd826fb))
* **job:** validate PID before process.kill to prevent process group kill ([67c540f](https://github.com/blueraai/bluera-knowledge/commit/67c540fef6f2c55c5dca2c824104a91fe19aeff1))
* **services:** fail fast on corrupted config/registry files ([030f63c](https://github.com/blueraai/bluera-knowledge/commit/030f63c10b0a30bddcd8e9b27b291ab0f53263f1))
* **tests:** increase timeout for flaky store delete test ([738fb49](https://github.com/blueraai/bluera-knowledge/commit/738fb4975653703d800dee802730dedfdf9e85ba))
* **watch:** clear pending timeouts on unwatch to prevent timer leak ([4dcafc1](https://github.com/blueraai/bluera-knowledge/commit/4dcafc14417442f6eeed0257cf185e04ae9de12b))
* **worker:** prevent division by zero and improve cancellation handling ([b7b40ab](https://github.com/blueraai/bluera-knowledge/commit/b7b40ab950b7ad0fbbe84af243be3138b1072a72))

## [0.9.33](https://github.com/blueraai/bluera-knowledge/compare/v0.9.32...v0.9.33) (2026-01-08)


### Bug Fixes

* **bridge:** kill Python process before nullifying to prevent zombie ([393dab3](https://github.com/blueraai/bluera-knowledge/commit/393dab3e45c75fd87c9ecfc1ca92e67b14526e79))
* **bridge:** mock kill() emits exit event & attach rejection handlers before stop ([d73c6ca](https://github.com/blueraai/bluera-knowledge/commit/d73c6ca6d640c3d15bd82756cabcda832f9ae245))
* **bridge:** stop() now waits for process to actually exit ([a92de41](https://github.com/blueraai/bluera-knowledge/commit/a92de41c89318fc106f996568ed88505352d5159))
* **cli:** ensure destroyServices runs before process.exit ([22e4267](https://github.com/blueraai/bluera-knowledge/commit/22e4267b7b9f698de3985a89b9c2b10759cfd49c))
* **code-unit:** brace counting now handles strings and comments ([1e857bb](https://github.com/blueraai/bluera-knowledge/commit/1e857bb297f357b97a6c067950e62495b3c8fc99))
* **code-unit:** support complex return types in signature extraction ([3bd2467](https://github.com/blueraai/bluera-knowledge/commit/3bd24675a67e73cc74a0c718f4b5a9e86cd826fb))
* **job:** validate PID before process.kill to prevent process group kill ([67c540f](https://github.com/blueraai/bluera-knowledge/commit/67c540fef6f2c55c5dca2c824104a91fe19aeff1))
* **services:** fail fast on corrupted config/registry files ([030f63c](https://github.com/blueraai/bluera-knowledge/commit/030f63c10b0a30bddcd8e9b27b291ab0f53263f1))
* **watch:** clear pending timeouts on unwatch to prevent timer leak ([4dcafc1](https://github.com/blueraai/bluera-knowledge/commit/4dcafc14417442f6eeed0257cf185e04ae9de12b))
* **worker:** prevent division by zero and improve cancellation handling ([b7b40ab](https://github.com/blueraai/bluera-knowledge/commit/b7b40ab950b7ad0fbbe84af243be3138b1072a72))

## [0.9.32](https://github.com/blueraai/bluera-knowledge/compare/v0.9.31...v0.9.32) (2026-01-06)

## [0.9.31](https://github.com/blueraai/bluera-knowledge/compare/v0.9.30...v0.9.31) (2026-01-06)


### Bug Fixes

* address three bugs found during API testing ([862b7e6](https://github.com/blueraai/bluera-knowledge/commit/862b7e67c057c004ae788d9205c147b422339c67)), closes [#1](https://github.com/blueraai/bluera-knowledge/issues/1) [#2](https://github.com/blueraai/bluera-knowledge/issues/2) [#3](https://github.com/blueraai/bluera-knowledge/issues/3)

## [0.9.30](https://github.com/blueraai/bluera-knowledge/compare/v0.9.26...v0.9.30) (2026-01-06)


### Features

* **crawl:** auto-create web store if it doesn't exist ([98face4](https://github.com/blueraai/bluera-knowledge/commit/98face486df69f6d27be9ccca84ce83cbc788de7))
* **logging:** add comprehensive pino-based file logging with auto-rotation ([1f8bc84](https://github.com/blueraai/bluera-knowledge/commit/1f8bc84493b1237d11597aa23312f52d632dcfac))
* **search:** add path keyword boosting for file/folder search ([8771a19](https://github.com/blueraai/bluera-knowledge/commit/8771a19f42c469f7728118deda58de12a0b80db6))
* **search:** add URL keyword matching for improved web search ranking ([17f2e5e](https://github.com/blueraai/bluera-knowledge/commit/17f2e5e55f7d7ce79ac43ad06664cd5056468938))
* **search:** improve search quality for web content ([d2093af](https://github.com/blueraai/bluera-knowledge/commit/d2093af9d36089e3c5ea562be346bc9871477689))
* **search:** increase path/URL keyword boost for better source file ranking ([7f557d3](https://github.com/blueraai/bluera-knowledge/commit/7f557d3973db451b751caf925ad6dd306feed486)), closes [#2](https://github.com/blueraai/bluera-knowledge/issues/2) [#1](https://github.com/blueraai/bluera-knowledge/issues/1)
* **search:** show token usage in MCP search responses ([b4fce10](https://github.com/blueraai/bluera-knowledge/commit/b4fce10c6fce30c493a03da6ff36dd235ae6543d))


### Bug Fixes

* **commands:** resolve skill/command naming collision for /commit ([3b8f854](https://github.com/blueraai/bluera-knowledge/commit/3b8f854caaab9b3390dd66a5e88870ebbd770146))
* **hooks:** capture coverage exit code before filtering output ([e6c72ed](https://github.com/blueraai/bluera-knowledge/commit/e6c72ed9bd149c3291e50b4a4b6eef16e817cad7))
* **hooks:** exit 2 on lint/type errors to block and show to Claude ([8782e8e](https://github.com/blueraai/bluera-knowledge/commit/8782e8ed584298d8f96e08571fbaa1bb9a45c6d7))
* **hooks:** use npx tsc for PATH compatibility ([873b500](https://github.com/blueraai/bluera-knowledge/commit/873b5001e8e27ea676e0124fb1ec6570cef744b1))
* **skills:** add required YAML frontmatter to commit skill ([dbba76d](https://github.com/blueraai/bluera-knowledge/commit/dbba76d5ae01c9d9de2b15c75bfd2756071fb2cd))

## [0.9.29](https://github.com/blueraai/bluera-knowledge/compare/v0.9.26...v0.9.29) (2026-01-06)


### Features

* **crawl:** auto-create web store if it doesn't exist ([98face4](https://github.com/blueraai/bluera-knowledge/commit/98face486df69f6d27be9ccca84ce83cbc788de7))
* **logging:** add comprehensive pino-based file logging with auto-rotation ([1f8bc84](https://github.com/blueraai/bluera-knowledge/commit/1f8bc84493b1237d11597aa23312f52d632dcfac))
* **search:** add path keyword boosting for file/folder search ([8771a19](https://github.com/blueraai/bluera-knowledge/commit/8771a19f42c469f7728118deda58de12a0b80db6))
* **search:** add URL keyword matching for improved web search ranking ([17f2e5e](https://github.com/blueraai/bluera-knowledge/commit/17f2e5e55f7d7ce79ac43ad06664cd5056468938))
* **search:** improve search quality for web content ([d2093af](https://github.com/blueraai/bluera-knowledge/commit/d2093af9d36089e3c5ea562be346bc9871477689))
* **search:** increase path/URL keyword boost for better source file ranking ([7f557d3](https://github.com/blueraai/bluera-knowledge/commit/7f557d3973db451b751caf925ad6dd306feed486)), closes [#2](https://github.com/blueraai/bluera-knowledge/issues/2) [#1](https://github.com/blueraai/bluera-knowledge/issues/1)
* **search:** show token usage in MCP search responses ([b4fce10](https://github.com/blueraai/bluera-knowledge/commit/b4fce10c6fce30c493a03da6ff36dd235ae6543d))


### Bug Fixes

* **hooks:** exit 2 on lint/type errors to block and show to Claude ([8782e8e](https://github.com/blueraai/bluera-knowledge/commit/8782e8ed584298d8f96e08571fbaa1bb9a45c6d7))
* **hooks:** use npx tsc for PATH compatibility ([873b500](https://github.com/blueraai/bluera-knowledge/commit/873b5001e8e27ea676e0124fb1ec6570cef744b1))
* **skills:** add required YAML frontmatter to commit skill ([dbba76d](https://github.com/blueraai/bluera-knowledge/commit/dbba76d5ae01c9d9de2b15c75bfd2756071fb2cd))

## [0.9.28](https://github.com/blueraai/bluera-knowledge/compare/v0.9.26...v0.9.28) (2026-01-06)


### Features

* **logging:** add comprehensive pino-based file logging with auto-rotation ([1f8bc84](https://github.com/blueraai/bluera-knowledge/commit/1f8bc84493b1237d11597aa23312f52d632dcfac))
* **search:** add URL keyword matching for improved web search ranking ([17f2e5e](https://github.com/blueraai/bluera-knowledge/commit/17f2e5e55f7d7ce79ac43ad06664cd5056468938))
* **search:** improve search quality for web content ([d2093af](https://github.com/blueraai/bluera-knowledge/commit/d2093af9d36089e3c5ea562be346bc9871477689))


### Bug Fixes

* **skills:** add required YAML frontmatter to commit skill ([dbba76d](https://github.com/blueraai/bluera-knowledge/commit/dbba76d5ae01c9d9de2b15c75bfd2756071fb2cd))

## [0.9.27](https://github.com/blueraai/bluera-knowledge/compare/v0.9.26...v0.9.27) (2026-01-06)


### Features

* **logging:** add comprehensive pino-based file logging with auto-rotation ([1f8bc84](https://github.com/blueraai/bluera-knowledge/commit/1f8bc84493b1237d11597aa23312f52d632dcfac))
* **search:** improve search quality for web content ([d2093af](https://github.com/blueraai/bluera-knowledge/commit/d2093af9d36089e3c5ea562be346bc9871477689))


### Bug Fixes

* **skills:** add required YAML frontmatter to commit skill ([dbba76d](https://github.com/blueraai/bluera-knowledge/commit/dbba76d5ae01c9d9de2b15c75bfd2756071fb2cd))

## [0.9.26](https://github.com/blueraai/bluera-knowledge/compare/v0.9.25...v0.9.26) (2026-01-06)


### Bug Fixes

* **tests:** make spawn-worker tests more robust ([05e3127](https://github.com/blueraai/bluera-knowledge/commit/05e312748d250592df1ce23395006954907f5387))

## [0.9.25](https://github.com/blueraai/bluera-knowledge/compare/v0.9.23...v0.9.25) (2026-01-06)


### Features

* **ci:** switch to npm trusted publishing (OIDC) ([269c48d](https://github.com/blueraai/bluera-knowledge/commit/269c48d6b04c9e6ebc3c3d77bfe1543f6519c68e))


### Bug Fixes

* **ci:** upgrade npm for trusted publishing support ([9a4a8e0](https://github.com/blueraai/bluera-knowledge/commit/9a4a8e041eb90d549fa5474368c60261e5ed0005))

## [0.9.24](https://github.com/blueraai/bluera-knowledge/compare/v0.9.23...v0.9.24) (2026-01-06)


### Features

* **ci:** switch to npm trusted publishing (OIDC) ([269c48d](https://github.com/blueraai/bluera-knowledge/commit/269c48d6b04c9e6ebc3c3d77bfe1543f6519c68e))

## [0.9.23](https://github.com/blueraai/bluera-knowledge/compare/v0.9.22...v0.9.23) (2026-01-06)

## [0.9.22](https://github.com/blueraai/bluera-knowledge/compare/v0.9.20...v0.9.22) (2026-01-06)

## [0.9.21](https://github.com/blueraai/bluera-knowledge/compare/v0.9.20...v0.9.21) (2026-01-06)

## [0.9.20](https://github.com/blueraai/bluera-knowledge/compare/v0.9.16...v0.9.20) (2026-01-06)


### Features

* **commands:** add CLAUDE.md awareness to commit command ([7c13ac8](https://github.com/blueraai/bluera-knowledge/commit/7c13ac8279db934009eba41705b035c709881fa3))
* **mcp:** consolidate 10 tools into 3 via execute meta-tool ([d59923a](https://github.com/blueraai/bluera-knowledge/commit/d59923ab6a5f29ea5c3f2371e485a12151f9460c))


### Bug Fixes

* **commands:** add explicit README check criteria to commit command ([fb7bd7b](https://github.com/blueraai/bluera-knowledge/commit/fb7bd7bb745b0e92199274185ec6ac8267613c9a))
* **hooks:** make precommit scripts properly fail on errors ([d21c39e](https://github.com/blueraai/bluera-knowledge/commit/d21c39e33c51710107414772a8a9e57a9a386fb1))

## [0.9.19](https://github.com/blueraai/bluera-knowledge/compare/v0.9.16...v0.9.19) (2026-01-06)


### Features

* **commands:** add CLAUDE.md awareness to commit command ([7c13ac8](https://github.com/blueraai/bluera-knowledge/commit/7c13ac8279db934009eba41705b035c709881fa3))
* **mcp:** consolidate 10 tools into 3 via execute meta-tool ([d59923a](https://github.com/blueraai/bluera-knowledge/commit/d59923ab6a5f29ea5c3f2371e485a12151f9460c))


### Bug Fixes

* **commands:** add explicit README check criteria to commit command ([fb7bd7b](https://github.com/blueraai/bluera-knowledge/commit/fb7bd7bb745b0e92199274185ec6ac8267613c9a))
* **hooks:** make precommit scripts properly fail on errors ([d21c39e](https://github.com/blueraai/bluera-knowledge/commit/d21c39e33c51710107414772a8a9e57a9a386fb1))

## [0.9.18](https://github.com/blueraai/bluera-knowledge/compare/v0.9.16...v0.9.18) (2026-01-06)


### Features

* **commands:** add CLAUDE.md awareness to commit command ([7c13ac8](https://github.com/blueraai/bluera-knowledge/commit/7c13ac8279db934009eba41705b035c709881fa3))
* **mcp:** consolidate 10 tools into 3 via execute meta-tool ([d59923a](https://github.com/blueraai/bluera-knowledge/commit/d59923ab6a5f29ea5c3f2371e485a12151f9460c))


### Bug Fixes

* **commands:** add explicit README check criteria to commit command ([fb7bd7b](https://github.com/blueraai/bluera-knowledge/commit/fb7bd7bb745b0e92199274185ec6ac8267613c9a))
* **hooks:** make precommit scripts properly fail on errors ([d21c39e](https://github.com/blueraai/bluera-knowledge/commit/d21c39e33c51710107414772a8a9e57a9a386fb1))

## [0.9.17](https://github.com/blueraai/bluera-knowledge/compare/v0.9.16...v0.9.17) (2026-01-06)


### Features

* **mcp:** consolidate 10 tools into 3 via execute meta-tool ([d59923a](https://github.com/blueraai/bluera-knowledge/commit/d59923ab6a5f29ea5c3f2371e485a12151f9460c))


### Bug Fixes

* **commands:** add explicit README check criteria to commit command ([fb7bd7b](https://github.com/blueraai/bluera-knowledge/commit/fb7bd7bb745b0e92199274185ec6ac8267613c9a))
* **hooks:** make precommit scripts properly fail on errors ([d21c39e](https://github.com/blueraai/bluera-knowledge/commit/d21c39e33c51710107414772a8a9e57a9a386fb1))

## [0.9.16](https://github.com/blueraai/bluera-knowledge/compare/v0.9.14...v0.9.16) (2026-01-06)


### Features

* **ci:** add workflow_dispatch to auto-release for manual triggering ([4835c9c](https://github.com/blueraai/bluera-knowledge/commit/4835c9c698766999154ff217475b3f38718289d6))
* **crawl:** add Claude CLI availability detection for npm package mode ([9afaae5](https://github.com/blueraai/bluera-knowledge/commit/9afaae5b4b4da98ce787d966c9910004401756dd))
* **release:** add automatic changelog generation with commit-and-tag-version ([177c6a3](https://github.com/blueraai/bluera-knowledge/commit/177c6a35f0a965b701940b2f8fc72fe2e4645647))
* rename to @blueraai/bluera-knowledge and add npm publishing ([51a86cb](https://github.com/blueraai/bluera-knowledge/commit/51a86cb574fb9752224e724c1047a5000f4e898b))
* **skills:** add hybrid MCP + Skills enhancement ([9fbee1d](https://github.com/blueraai/bluera-knowledge/commit/9fbee1d90d02663dbda9646e244423c7840330a6))


### Bug Fixes

* **ci:** add model warm-up step to prevent race conditions ([4f5cc6a](https://github.com/blueraai/bluera-knowledge/commit/4f5cc6a6a33f4ab28e8daa2ee6a02e1cc81bf59b))
* **ci:** correct model cache location and test timeouts ([8ae7d9d](https://github.com/blueraai/bluera-knowledge/commit/8ae7d9dcd38ac7ccea3a5bae83ef07449adb693f))
* **ci:** use bun in release workflow and add concurrency controls ([659c4f8](https://github.com/blueraai/bluera-knowledge/commit/659c4f83c7d4f093a5d626c9e460db92e82e3c9c))
* **ci:** use check-regexp in update-marketplace and improve tag extraction ([a009d5f](https://github.com/blueraai/bluera-knowledge/commit/a009d5f90c6f5ddd3244a9f15fa228630dbd509d))
* **ci:** use check-regexp to wait for CI jobs that exist immediately ([34a4be2](https://github.com/blueraai/bluera-knowledge/commit/34a4be2fa4a64221efc84b66b16491bb0624701f))
* **cli:** resolve hanging subprocess by adding destroyServices cleanup ([36acc15](https://github.com/blueraai/bluera-knowledge/commit/36acc1560ed6ea999781e63614de701c7277c8d5))
* **docs:** remove nested code blocks breaking GitHub rendering ([11aef7a](https://github.com/blueraai/bluera-knowledge/commit/11aef7a433623c8831e235714a7c1382b146504d))
* **hooks:** make npm precommit script use smart git hook ([4a9f6b0](https://github.com/blueraai/bluera-knowledge/commit/4a9f6b0bddfd3d1d310b8dba40093c36cc3fa163))
* **package:** correct npm org from [@blueraai](https://github.com/blueraai) to [@bluera](https://github.com/bluera) ([7366ebd](https://github.com/blueraai/bluera-knowledge/commit/7366ebd14a406c36a3675bb8d64d57bf3732b2f1))
* **security:** address vulnerabilities from security audit ([4de8b46](https://github.com/blueraai/bluera-knowledge/commit/4de8b461268484dadccee86da42f96c6917e262d))
* **test:** remove flaky performance assertions from stress tests ([69a480b](https://github.com/blueraai/bluera-knowledge/commit/69a480ba00b6e4b5aace4ea1b732c0246552dc40))

## [0.9.15](https://github.com/blueraai/bluera-knowledge/compare/v0.9.14...v0.9.15) (2026-01-06)


### Features

* **crawl:** add Claude CLI availability detection for npm package mode ([9afaae5](https://github.com/blueraai/bluera-knowledge/commit/9afaae5b4b4da98ce787d966c9910004401756dd))
* **release:** add automatic changelog generation with commit-and-tag-version ([177c6a3](https://github.com/blueraai/bluera-knowledge/commit/177c6a35f0a965b701940b2f8fc72fe2e4645647))
* rename to @bluera/bluera-knowledge and add npm publishing ([51a86cb](https://github.com/blueraai/bluera-knowledge/commit/51a86cb574fb9752224e724c1047a5000f4e898b))
* **skills:** add hybrid MCP + Skills enhancement ([9fbee1d](https://github.com/blueraai/bluera-knowledge/commit/9fbee1d90d02663dbda9646e244423c7840330a6))


### Bug Fixes

* **ci:** add model warm-up step to prevent race conditions ([4f5cc6a](https://github.com/blueraai/bluera-knowledge/commit/4f5cc6a6a33f4ab28e8daa2ee6a02e1cc81bf59b))
* **ci:** correct model cache location and test timeouts ([8ae7d9d](https://github.com/blueraai/bluera-knowledge/commit/8ae7d9dcd38ac7ccea3a5bae83ef07449adb693f))
* **cli:** resolve hanging subprocess by adding destroyServices cleanup ([36acc15](https://github.com/blueraai/bluera-knowledge/commit/36acc1560ed6ea999781e63614de701c7277c8d5))
* **docs:** remove nested code blocks breaking GitHub rendering ([11aef7a](https://github.com/blueraai/bluera-knowledge/commit/11aef7a433623c8831e235714a7c1382b146504d))
* **hooks:** make npm precommit script use smart git hook ([4a9f6b0](https://github.com/blueraai/bluera-knowledge/commit/4a9f6b0bddfd3d1d310b8dba40093c36cc3fa163))
* **security:** address vulnerabilities from security audit ([4de8b46](https://github.com/blueraai/bluera-knowledge/commit/4de8b461268484dadccee86da42f96c6917e262d))
* **test:** remove flaky performance assertions from stress tests ([69a480b](https://github.com/blueraai/bluera-knowledge/commit/69a480ba00b6e4b5aace4ea1b732c0246552dc40))

## [0.9.11] - 2026-01-04

### Fixed
- CI automation: Use `workflow_run` trigger for marketplace updates (GitHub security prevents `GITHUB_TOKEN` workflows from triggering other workflows)

## [0.9.10] - 2026-01-04

### Added
- Automated marketplace updates via GitHub Actions workflow
- Update Marketplace workflow waits for CI to pass before updating `blueraai/bluera-marketplace`

### Changed
- Release workflow now automatically triggers marketplace update (no manual steps required)

## [0.9.9] - 2026-01-04

### Fixed
- MCP server auto-discovery: moved `.mcp.json` to plugin root (was incorrectly in `.claude-plugin/`)

## [0.9.8] - 2026-01-04

### Fixed
- Plugin installation failures caused by root `.mcp.json` conflicting with plugin structure

## [0.9.7] - 2026-01-03

### Added
- Claude Code perspective documentation explaining how to use bluera-knowledge effectively

### Changed
- Enhanced README with blockquote formatting, tables, and improved section organization
- Added table of contents for better navigation

## [0.9.6] - 2026-01-03

### Changed
- Clarified MCP configuration for local development vs distribution
- Documentation improvements for job status and search capabilities

## [0.9.5] - 2026-01-03

### Fixed
- SessionStart hook now installs node_modules on first session

### Added
- Marketplace update reminder in release workflow
- Version script improvements

## [0.9.4] - 2026-01-02

### Added
- MCP symlink setup documentation for local development
- `.mcp.json` in `.claude-plugin/` for marketplace installs
- `release:current` script for tagging existing versions

### Changed
- Improved CLAUDE.md with npm scripts reference

## [0.9.3] - 2026-01-02

### Added
- Multi-language support for dependency detection (Python, Go, Rust, Java)
- crates.io and Go module registry support for URL resolution

### Changed
- Expanded crawl command examples with natural language options
- Streamlined installation section in README

## [0.9.0-0.9.2] - 2026-01-02

### Added
- Automatic GitHub release workflow on tag push
- Release scripts (`npm run release:patch/minor/major`)

### Changed
- Plugin restructured for correct Claude Code plugin layout
- Repository moved to blueraai organization

### Fixed
- IndexService tests skipped in CI environment (coverage threshold adjusted)

## [0.7.0-0.8.0] - 2026-01-01

### Added
- LICENSE, NOTICE, and acknowledgments
- Plugin UI documentation for browsing/installing

### Changed
- Marketplace moved to dedicated repository
- Installation section moved to top of README

## [0.6.0] - 2026-01-01

### Added
- Headless browser support via crawl4ai for JavaScript-rendered sites (Next.js, React, Vue, etc.)
- `--headless` flag for crawl command to enable Playwright browser automation
- Python bridge method `fetchHeadless()` using crawl4ai's AsyncWebCrawler
- Automatic fallback to axios if headless fetch fails
- Mermaid sequence diagrams in README.md showing crawler architecture for both modes
- Comprehensive documentation for headless crawling in commands/crawl.md

### Changed
- `fetchHtml()` now accepts optional `useHeadless` parameter for browser automation
- `CrawlOptions` interface includes `useHeadless` field
- Updated Dependencies section in README with playwright installation instructions
- Extended `crawl` command with `--headless` option and updated TypeScript types

### Improved
- Crawler now handles JavaScript-rendered sites that require client-side rendering
- Preserves intelligent crawling with natural language instructions in both standard and headless modes

## [0.5.3] - 2026-01-01

### Changed
- Move Store to its own line for better vertical scannability

## [0.5.2] - 2026-01-01

### Changed
- Add text labels before all badges in search results (File:, Purpose:, Top Terms:, Imports:)

## [0.5.1] - 2026-01-01

### Changed
- Replace emoji badges with text labels for search methods: [Vector+FTS], [Vector], [Keyword]
- Add "Store:" prefix to search results for better clarity

## [0.5.0] - 2026-01-01

### Added
- Ranking attribution badges showing search method for each result (🎯 both, 🔍 vector, 📝 FTS)
- Search mode display in results header (vector/fts/hybrid)
- Performance metrics in search results footer (time in milliseconds)
- Ranking metadata preserved in search results (vectorRank, ftsRank, RRF scores, boost factors)

### Changed
- Renamed "Keywords" to "Top Terms (in this chunk)" for clarity about scope and methodology
- Updated "Imports" to "Imports (in this chunk)" to clarify chunk-level analysis
- Search results now show which ranking method(s) contributed to each result

### Improved
- Search result transparency - users can now see how each result was found
- Label clarity - all labels now explicitly state they analyze chunk content, not whole files

## [0.4.22] - 2026-01-01

### Changed
- Renamed "Related" to "Keywords" for clarity - these are the most frequent meaningful terms extracted from the code
- Restored default search limit from 5 to 10 results (user preference)
- Updated README with new search output format and current version badge

### Fixed
- Search result labels now accurately describe what they show (Keywords are top 5 frequent words, not related concepts)

## [0.4.21] - 2026-01-01

### Added
- Display related concepts and key imports in search results (from contextual detail)
- Actionable "Next Steps" footer with examples using actual result IDs and paths
- Richer context to help users decide which results to explore

### Changed
- Reduced default limit from 10 to 5 results (quality over quantity)
- Enhanced result format shows Related concepts (🔗) and Imports (📦)

## [0.4.20] - 2026-01-01

### Fixed
- Search results now display directly in conversation (not in verbose mode)
- Abandoned table formatting approach - Bash output is collapsed by default

### Changed
- Switched to clean list format with emoji icons for better readability
- Results display immediately without requiring ctrl+o to expand

## [0.4.19] - 2026-01-01

### Fixed
- Search command now uses Python formatter via Bash for deterministic table output
- Fixed broken table alignment in terminal (columns now properly aligned with fixed widths)

### Changed
- Updated search.md to pipe MCP results through format-search-results.py
- Command instructs Claude to execute Python formatter for proper table rendering

## [0.4.18] - 2026-01-01

### Fixed
- Search command now displays results correctly in conversation transcript
- Removed PostToolUse hook approach (output only visible in verbose mode)
- Claude now formats results directly with simpler markdown table syntax

### Changed
- Simplified search result formatting - removed fixed-width column requirements
- Updated command to use standard markdown tables instead of hook-based formatting

### Removed
- PostToolUse hook for search formatting (`format-search-results.py` retained for reference)

## [0.4.17] - 2026-01-01

### Fixed
- Fixed duplicate search output by instructing Claude not to generate tables
- PostToolUse hook now solely responsible for displaying formatted results

## [0.4.16] - 2026-01-01

### Changed
- Replaced prompt-based table formatting with deterministic PostToolUse hook
- Search results now formatted by Python script with precise column widths
- Simplified search.md command - formatting handled by hook

### Added
- `hooks/format-search-results.py` - deterministic table formatter for search output

## [0.4.15] - 2026-01-01

### Fixed
- Fixed search command table alignment by enforcing fixed-width columns with proper padding
- Separator row now uses exact cell widths (7/14/47/50 chars) for proper vertical alignment
- All column borders now align perfectly in terminal output

## [0.4.14] - 2026-01-01

### Fixed
- Enforced strict column width limits in search command output to prevent table formatting issues
- Added explicit truncation rules (Store: 12 chars, File: 45 chars, Purpose: 48 chars)
- Improved command documentation with clear examples of text truncation

## [0.4.13] - 2026-01-01

### Fixed
- Fixed table separator alignment in search output
- Better visual formatting for search results

## [0.4.11-0.4.12] - 2026-01-01

### Changed
- Changed search output to table format
- Added store names to search results for clarity

## [0.4.10] - 2026-01-01

### Added
- Added store names to search results

### Removed
- Removed flaky stress tests

## [0.4.4] - 2025-12-31

### Changed
- Table formatting refinements (clean IDs, ~ for home paths)
- Improved readability of stores command output

## [0.4.3] - 2025-12-31

### Changed
- Store list outputs in beautiful table format
- Enhanced command output presentation

## [0.4.2] - 2025-12-30

### Changed
- Commands converted to use MCP tools instead of bash execution
- Improved architecture for command handling
- Better integration with Claude Code's tool system

## [0.4.1] - 2025-12-29

### Added
- Auto-install Python dependencies via SessionStart hook
- Seamless setup experience for web crawling features
- PEP 668 compliance for modern Python environments

## [0.3.0] - 2025-12-28

### Added
- Web crawling with crawl4ai integration
- Create and index web stores from documentation sites
- Markdown conversion of web content

## [0.2.0] - 2025-12-27

### Added
- Smart usage-based dependency suggestions
- Automatic repository URL resolution via package registries

### Changed
- Improved analysis performance

### Fixed
- Fixed command prefix inconsistencies

## [0.1.x] - 2025-12-26

### Added
- Initial release
- Repository cloning and indexing
- Local folder indexing
- Semantic vector search with embeddings
- MCP server integration
