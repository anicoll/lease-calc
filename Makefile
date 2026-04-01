.PHONY: test test-ci

test:
	npm test

test-ci:
	act pull_request \
		-W .github/workflows/test.yml \
		--container-architecture linux/amd64 \
		-P ubuntu-latest=catthehacker/ubuntu:act-latest
