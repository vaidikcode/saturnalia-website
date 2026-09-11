# Convex backend

This folder is the shared Saturnalia backend (website + future Expo app).

## Local

```bash
bunx convex dev
```

You must log into the Saturnalia Convex team (not a personal Mirelo account). See `docs/dashboard-setup.md`.

## Codegen

`convex/_generated/` is checked in so CI typechecks without a deploy key. After `convex dev`, it is regenerated automatically.

## Mobile consumers

From a linked deployment:

```bash
bun run export:api
```

Commit `contracts/convex-api.ts` for [stktyagi/Sat-app-26](https://github.com/stktyagi/Sat-app-26).
