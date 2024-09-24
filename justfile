default:
  @just list

build:
  docker buildx build -t manifoldlabs/hub-tx-monitor --platform linux/amd64 -f Dockerfile .

run: build
  docker run -t -d --env-file .env manifoldlabs/hub-tx-monitor

push: build
  docker push manifoldlabs/hub-tx-monitor
