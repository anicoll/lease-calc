.PHONY: test test-e2e update-snapshots update-snapshots-docker test-ci

test:
	npm test

test-e2e:
	npx playwright test

# Regenerate golden snapshots inside the same Docker image used by CI.
# Use this when snapshots diverge between local and CI due to font differences.
update-snapshots-docker:
	docker run --rm \
		-v "$(PWD):/work" \
		-w /work \
		mcr.microsoft.com/playwright:v1.59.0-noble \
		bash -c "npm ci && npx playwright test --update-snapshots"

test-ci:
	act pull_request \
		-W .github/workflows/test.yml \
		--container-architecture linux/amd64 \
		-P ubuntu-latest=catthehacker/ubuntu:act-latest
