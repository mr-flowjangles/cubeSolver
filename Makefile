# cubesolver — dev convenience targets.
#
# Run `make` with no args (or `make help`) to list everything.
# Targets that produce no files are .PHONY so make doesn't try to track them.

.DEFAULT_GOAL := help
.PHONY: help setup dev build test lint format ci image smoke clean catalog site standalone version version-minor version-major

# Mission Control's port, from app-catalog's port registry (web band).
SITE_PORT ?= 4025

# ---------------------------------------------------------------------------
# Help
# ---------------------------------------------------------------------------
help: ## Show this help (default target)
	@echo "cubesolver — make targets:"
	@echo ""
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z][a-zA-Z0-9_-]*:.*?## / { printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)
	@echo ""
	@echo "Versioning (also see CLAUDE.md → Versioning):"
	@echo "  \033[36mversion-M<n>\033[0m   Start the next minor version for milestone M<n> (e.g. make version-M1)."
	@echo "                 Title auto-resolved from docs/07-build-plan.md."
	@echo "  \033[36mversion-minor\033[0m  Start a minor version with a custom title (DESC=\"...\" required)"
	@echo "  \033[36mversion-major\033[0m  Start a major version with a custom title (DESC=\"...\" required)"
	@echo "  \033[36mversion\033[0m        Start a patch version. Pass DESC=\"...\" or the script will prompt."
	@echo ""

# ---------------------------------------------------------------------------
# Local dev environment
# ---------------------------------------------------------------------------
# App dev server port, from app-catalog's port registry (web band).
DEV_PORT ?= 4026

setup: ## Install dependencies
	npm install

dev: ## Run the app dev server on localhost:DEV_PORT
	npm run dev

build: ## Build the PWA into dist/
	npm run build

# ---------------------------------------------------------------------------
# Quality
# ---------------------------------------------------------------------------
test: ## Run tests
	npm test

lint: ## Type-check and check formatting
	npm run lint

format: ## Apply formatter
	npm run format

ci: lint test ## Lint + test, suitable for CI gating

# ---------------------------------------------------------------------------
# Docker image
# ---------------------------------------------------------------------------
image: ## Build the runtime Docker image
	docker build -t eha/cubesolver:dev .

smoke: ## Smoke-test the built image (override CMD as appropriate for your tool)
	docker run --rm eha/cubesolver:dev --help

# ---------------------------------------------------------------------------
# Mission Control (see CLAUDE.md → Mission Control)
#
# One static page, site/index.html, reading site/catalog.json. Part of that
# file is made from the docs by `make catalog`; the rest is written by hand.
# Plain system python3, standard library only — nothing to install.
# ---------------------------------------------------------------------------
catalog: ## Regenerate site/catalog.json from docs/ and CLAUDE.md
	python3 scripts/sync-catalog.py

site: catalog ## Serve Mission Control on localhost:SITE_PORT and open it
	@echo "→ http://localhost:$(SITE_PORT)"
	@(sleep 1 && open "http://localhost:$(SITE_PORT)" 2>/dev/null || true) &
	@python3 scripts/serve-site.py $(SITE_PORT)

standalone: catalog ## Write a one-file Mission Control snapshot to build/
	python3 scripts/build-standalone.py

# ---------------------------------------------------------------------------
# Cleanup
# ---------------------------------------------------------------------------
clean: ## Remove caches and build artifacts (extend per language)
	rm -rf .pytest_cache .ruff_cache .mypy_cache build dist node_modules/.cache .next
	find . -type d -name __pycache__ -prune -exec rm -rf {} + 2>/dev/null || true
	@echo "Cleaned."

# ---------------------------------------------------------------------------
# Versioning (see CLAUDE.md → Versioning + scripts/new-version.sh)
#
# Branch + Versions/v<M>/v<M>.<m>.<p>/release-notes.md ceremony.
# Refuses to run if the working tree is dirty.
# ---------------------------------------------------------------------------

# DRYRUN=1 forwards --dry-run to the script — preview without side effects.
DRYRUN_FLAG := $(if $(DRYRUN),--dry-run,)

# Milestone shortcut: minor bump, title auto-resolved from docs/07-build-plan.md.
# Usage:    make version-M1
# Preview:  make version-M1 DRYRUN=1
version-M%:
	@m="M$*"; \
	desc=$$(awk -v m="$$m" '$$0 ~ "^## "m" — " { sub("^## "m" — ", ""); print; exit }' docs/07-build-plan.md); \
	if [ -z "$$desc" ]; then \
	  echo "Milestone $$m not found as a heading in docs/07-build-plan.md"; \
	  exit 1; \
	fi; \
	echo "Resolved $$m → $$desc"; \
	./scripts/new-version.sh $(DRYRUN_FLAG) --minor "$$desc"

# Generic minor bump with custom title.
version-minor:
	@if [ -z "$(DESC)" ]; then \
	  echo "Usage: make version-minor DESC=\"Short Description\" [DRYRUN=1]"; exit 1; \
	fi
	./scripts/new-version.sh $(DRYRUN_FLAG) --minor "$(DESC)"

# Generic major bump with custom title. Reserved for v1.0.0 etc.
version-major:
	@if [ -z "$(DESC)" ]; then \
	  echo "Usage: make version-major DESC=\"Short Description\" [DRYRUN=1]"; exit 1; \
	fi
	./scripts/new-version.sh $(DRYRUN_FLAG) --major "$(DESC)"

# Patch bump. Pass DESC=... or let the script prompt interactively.
version:
	@if [ -n "$(DESC)" ]; then \
	  ./scripts/new-version.sh $(DRYRUN_FLAG) "$(DESC)"; \
	else \
	  ./scripts/new-version.sh $(DRYRUN_FLAG); \
	fi
