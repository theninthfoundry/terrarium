.PHONY: install dev test lint demo run graph
install:
	python -m pip install -e '.[dev,gemma]'
dev:
	uvicorn terrarium.api:app --reload --host 127.0.0.1 --port 8000
test:
	python -m pytest -q
lint:
	ruff check terrarium tests

demo:
	terrarium analyze sample_repo --changed src/pricing.py --max-mutations 6 --json .terrarium/demo-report.json
run:
	uvicorn terrarium.api:app --host 0.0.0.0 --port 8000
graph:
	uv tool install graphifyy
	graphify --version
	@echo 'Then run /graphify . in your coding assistant from this repository.'
