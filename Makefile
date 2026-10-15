# QUANTUM / ViralBox local command surface (Section 59.2 equivalents)
.PHONY: help bootstrap lint typecheck test test-quantum evaluate-seo build-links render-qa build package ledger-validate ci-seo human-review-queue human-review-export lift-minor publish-batch publish-export lifecycle-export lifecycle-scan

help:
	@echo "bootstrap            - install node deps"
	@echo "lint                 - eslint if configured"
	@echo "typecheck            - tsc --noEmit"
	@echo "test                 - quantum unit tests"
	@echo "test-quantum         - same as test"
	@echo "build-links          - rebuild internal link graph (P11)"
	@echo "render-qa            - file-level render/a11y QA (P12)"
	@echo "evaluate-seo         - run QUANTUM gates on 112 SEO package pages"
	@echo "ci-seo               - CI gate: evaluate + render-qa hard fails"
	@echo "lift-minor           - inject signature protocols for minor pages"
	@echo "human-review-queue   - P13 build queue from last evaluation"
	@echo "human-review-export  - P13 export queue snapshot JSON"
	@echo "publish-batch        - P14 publish approved pages to mock CMS"
	@echo "publish-export       - P14 export publish snapshot"
	@echo "lifecycle-scan       - P15 seed lifecycle decisions from evaluation"
	@echo "lifecycle-export     - P15 export lifecycle + experiment snapshots"
	@echo "ledger-validate      - validate .agent ledgers"
	@echo "build                - next build"
	@echo "package              - alias for build"

bootstrap:
	npm install

lint:
	-npx eslint . --max-warnings 0

typecheck:
	npx tsc --noEmit

test test-quantum:
	python -m unittest discover -s tests/quantum -v

build-links:
	python tools/quantum/build_internal_link_graph.py

render-qa:
	python tools/quantum/render_qa_seo_package.py

evaluate-seo:
	python tools/quantum/evaluate_seo_package.py

ci-seo:
	python tools/quantum/ci_seo_gates.py

lift-minor:
	python tools/quantum/lift_minor_pages.py

human-review-queue:
	python tools/quantum/human_review_cli.py build-queue
	python tools/quantum/human_review_cli.py list

human-review-export:
	python tools/quantum/human_review_cli.py export

# Default publishes 5 approved pages to mock CMS. All: python tools/quantum/publish_cli.py batch-approved --limit 0
publish-batch:
	python tools/quantum/publish_cli.py batch-approved --limit 5

publish-export:
	python tools/quantum/publish_cli.py export

lifecycle-scan:
	python tools/quantum/lifecycle_cli.py scan-eval --limit 20

lifecycle-export:
	python tools/quantum/lifecycle_cli.py export

ledger-validate:
	python tools/quantum/validate_agent_ledgers.py --requirements .agent/REQUIREMENTS.json --tasks .agent/TASKS.json --candidates .agent/REQUIREMENT_CANDIDATES.json

build package:
	npm run build
