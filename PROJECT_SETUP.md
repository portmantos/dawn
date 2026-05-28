# Project Setup

This project uses Shopify's free Dawn theme as its base.

## Prerequisites

- A Shopify store, development store, or partner sandbox.
- Shopify CLI installed and authenticated.
- GitHub CLI or the GitHub website if you want to create a remote repository.

Install Shopify CLI if it is not already available:

```sh
npm install -g @shopify/cli@latest
```

## Local Development

From this folder:

```sh
shopify theme dev --store your-store.myshopify.com
```

Or, if Shopify CLI is available on your PATH:

```sh
npm run dev -- --store your-store.myshopify.com
```

Useful commands:

```sh
npm run check
npm run pull
npm run push
npm run package
```

## GitHub Setup

Create a new GitHub repository, then connect this local project:

```sh
git remote add origin https://github.com/YOUR-USER/YOUR-REPO.git
git push -u origin main
```

The original Dawn repository is configured as `upstream` so you can pull future Dawn updates:

```sh
git fetch upstream
git merge upstream/main
```

## Shopify GitHub Integration

In Shopify admin, go to **Online Store > Themes**, then connect the GitHub repository to a theme. This lets Shopify deploy theme changes from your selected branch.

Keep `.shopify` out of Git; it is already ignored because it contains local Shopify CLI state.
