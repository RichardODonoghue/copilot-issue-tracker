# License Compatibility Report

**Project licence:** GNU General Public License v2.0 (GPL-2.0-only)

## Summary

All **runtime** dependencies are MIT-licensed, which is fully compatible with
GPL-2.0. The only Apache-2.0 licensed package (`typescript`) is a **dev-only**
build tool whose compiled output is not distributed, so it does not affect the
outbound licence of the application.

**Verdict: ✅ GPL-2.0 compliant.**

---

## Runtime Dependencies (shipped in the app bundle)

| Package | Version | Licence | Compatible with GPL-2.0? |
|---|---|---|---|
| `electrobun` | 1.16.0 | MIT | ✅ Yes |
| `react` | ^18.3.1 | MIT | ✅ Yes |
| `react-dom` | ^18.3.1 | MIT | ✅ Yes |

Bun's built-in `bun:sqlite` is part of the Bun runtime (MIT). It is not a
separate package and does not alter the outbound licence.

---

## Dev Dependencies (build/test tools — NOT distributed)

| Package | Version | Licence | Notes |
|---|---|---|---|
| `typescript` | ^5.7.2 | Apache-2.0 | Compiler only; output JS is not a derivative work |
| `vite` | ^6.0.3 | MIT | Bundler; not shipped |
| `@vitejs/plugin-react` | ^4.3.4 | MIT | Bundler plugin; not shipped |
| `vitest` | ^2.1.8 | MIT | Test runner |
| `@testing-library/react` | ^16.1.0 | MIT | Test utility |
| `@testing-library/jest-dom` | ^6.6.3 | MIT | Test utility |
| `@testing-library/user-event` | ^14.5.2 | MIT | Test utility |
| `eslint` | ^9.17.0 | MIT | Linter |
| `@typescript-eslint/eslint-plugin` | ^8.18.0 | MIT | Linter plugin |
| `@typescript-eslint/parser` | ^8.18.0 | MIT | Linter plugin |
| `eslint-plugin-react` | ^7.37.3 | MIT | Linter plugin |
| `eslint-plugin-react-hooks` | ^5.1.0 | MIT | Linter plugin |
| `eslint-config-prettier` | ^9.1.0 | MIT | Linter config |
| `eslint-plugin-prettier` | ^5.2.1 | MIT | Linter plugin |
| `prettier` | ^3.4.2 | MIT | Formatter |
| `globals` | ^15.14.0 | MIT | ESLint helper |
| `husky` | ^9.1.7 | MIT | Git hook runner |
| `lint-staged` | ^15.3.0 | MIT | Pre-commit filter |
| `concurrently` | ^9.1.0 | MIT | Dev script runner |
| `jsdom` | ^25.0.1 | MIT | Vitest environment |
| `@types/bun` | latest | MIT | Type declarations |
| `@types/react` | ^18.3.12 | MIT | Type declarations |
| `@types/react-dom` | ^18.3.1 | MIT | Type declarations |
| `postcss` | ^8.4.49 | MIT | CSS tooling; not shipped |
| `tailwindcss` | ^3.4.16 | MIT | CSS tooling; not shipped |
| `autoprefixer` | ^10.4.20 | MIT | CSS tooling; not shipped |

---

## Notes

- **Apache-2.0 and GPL-2.0**: Apache 2.0 is *not* compatible with GPL-2.0 when
  the Apache-licensed code is *combined* into the distributed binary. However,
  `typescript` is used solely as a compilation tool and its source is not
  included in the distributed bundle, so GPL-2.0 compliance is maintained.
- **Bun runtime**: Electrobun packages the Bun runtime (MIT). End-users receive
  the MIT-licensed runtime alongside the GPL-2.0 application. MIT is compatible
  with GPL-2.0 in this direction.
- **Future dependencies**: Before adding any new dependency, verify its licence
  is MIT, BSD-2-Clause, BSD-3-Clause, ISC, or another GPL-2.0-compatible
  permissive licence. Avoid Apache-2.0 for runtime deps. Avoid LGPL unless you
  are linking dynamically.

---

*Report generated: 2026-04-03*
