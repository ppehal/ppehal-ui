# CLAUDE.md — ppehal-ui

shadcn/ui custom registry pro sdílení DataTable systému mezi projekty.

## Quick Reference

```bash
pnpm run build          # shadcn build → public/r/*.json
pnpm run serve          # lokální server na http://localhost:5555
```

**Registry URL**: `https://ppehal.github.io/ppehal-ui/r/data-table.json`

**Consumer install**: `npx shadcn add https://ppehal.github.io/ppehal-ui/r/data-table.json`

## Architecture

### Jak registry funguje

1. Source soubory v `registry/default/` s transformovanými importy (`@/registry/default/ui/*`)
2. `shadcn build` čte `registry.json`, balí source do JSON v `public/r/`
3. GitHub Actions deployuje `public/` na GitHub Pages
4. Consumer spustí `npx shadcn add <url>` → CLI transformuje importy zpět a kopíruje soubory do `src/`

### Adresářová struktura (Structure B)

```
registry/default/
  components/data-table/*.tsx  → consumer: src/components/data-table/
  hooks/*.ts                   → consumer: src/hooks/
  lib/*.ts                     → consumer: src/lib/
  ui/null-value.tsx            → consumer: src/components/ui/
```

**Proč Structure B**: `resolveNestedFilePath` stripne `registry/{style}/` a pak type-matching prefix. Soubory musí být pod `registry/default/{type}/...` (ne `registry/default/{item}/{type}/...`), jinak se ztratí subpath.

### Import konvence v source souborech

| Import v source                                  | Transformace na consumer straně                       |
| ------------------------------------------------ | ----------------------------------------------------- |
| `@/registry/default/ui/button`                   | `@/components/ui/button`                              |
| `@/registry/default/hooks/use-table-preferences` | `@/hooks/use-table-preferences`                       |
| `@/registry/default/lib/table-filters`           | `@/lib/table-filters`                                 |
| `@/lib/utils`                                    | `@/lib/utils` (special handling, beze změny)          |
| `@/lib/constants/color-schemes`                  | `@/lib/constants/color-schemes` (consumer dependency) |
| `./pagination`                                   | `./pagination` (relativní, beze změny)                |

### Kam NEPATŘÍ typy

shadcn CLI nemá `types` alias → `@/types/*` importy se špatně transformují (fallback na `ui` alias). Types jsou proto v `lib/table-types.ts` a `lib/filter-types.ts`.

## Gotchas

### 1. `@/types/*` importy = broken

```typescript
// ❌ WRONG — CLI transformuje na @/components/ui/table
import { ColumnDataType } from "@/types/table"

// ✅ CORRECT — types v lib/
import { ColumnDataType } from "@/registry/default/lib/table-types"
```

### 2. Consumer musí mít `color-schemes.ts`

`editable-date-cell.tsx` importuje `BASE_COLORS` z `@/lib/constants/color-schemes`. Registry tento soubor NEPOSKYTUJE (je domain-specific). Consumer ho musí mít sám.

### 3. `filterFn: "smart"` ne `"auto"`

TanStack Table `"auto"` = built-in. DataTable systém používá vlastní `"smart"` filterFn.

### 4. Entity-chip je vyloučen

`entity-chip.tsx` není v registry — je domain-specific (hardcoded entity types). Consumer si definuje vlastní.

### 5. Build output je gitignored

`public/r/` je v `.gitignore`. GitHub Actions buildí a deployuje při každém push na `main`.

## Přidání nového souboru do registry

1. Vytvořit soubor v `registry/default/{type}/...`
2. Transformovat `@/` importy na `@/registry/default/` (kromě `@/lib/utils` a consumer deps)
3. Přidat do `registry.json` → `items[0].files[]` s correct `type` (`registry:component`, `registry:hook`, `registry:lib`, `registry:ui`)
4. Aktualizovat `dependencies` / `registryDependencies` pokud potřeba
5. `pnpm run build` → ověřit output
6. Push na `main` → automatický deploy

## Consumer prerequisites

- `shadcn init` (musí existovat `components.json`)
- `src/lib/utils.ts` s `cn()` (clsx + tailwind-merge)
- `src/lib/constants/color-schemes.ts` s `BASE_COLORS` exportem
