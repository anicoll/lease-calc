.PHONY: test test-e2e update-snapshots test-ci

test:
	npm test

test-e2e:
	npx playwright test

update-snapshots:
	npx playwright test --update-snapshots

test-ci:
	act pull_request \
		-W .github/workflows/test.yml \
		--container-architecture linux/amd64 \
		-P ubuntu-latest=catthehacker/ubuntu:act-latest
