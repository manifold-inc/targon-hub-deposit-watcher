default:
  @just --list

build:
  docker compose build

up: build
  docker compose up -d
