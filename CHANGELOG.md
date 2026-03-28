# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Infrastructure

- **Quality toolchain** — ESLint 10, Prettier, Husky pre-commit hooks, commitlint (Conventional Commits)
- **CI workflow** — GitHub Actions quality checks (lint, format, build) na PR a push do main
- **Deploy závisí na CI** — deploy na GitHub Pages se spustí až po úspěšném CI (workflow_run)
- **Renovate** — automatické dependency updates s patch automerge a Monday schedule
- **Repo settings** — squash merge only, auto-delete branches, main branch protection ruleset
- **Editor config** — .editorconfig, VS Code settings/extensions pro konzistentní DX

### Fixed

- **Number filter "between"** — neúplný rozsah (chybějící valueTo) vrací pass-through místo tichého collapse na equality
- **Filter badge count** — zobrazuje skutečný počet vybraných hodnot (enum/FK), nerendruje se při 0
- **Storage prefix validace** — `setStoragePrefix("")` tiše ignorováno místo nastavení prázdného prefixu
- **ESLint no-case-declarations** — přidány blokové závorky v switch/case v `table-filters.ts`

## [0.1.0] - 2026-03-28

### Added

- Initial DataTable component registry (41 souborů)
- GitHub Actions deploy pipeline na GitHub Pages
- CLAUDE.md s project instructions
