# marvinthang's blog

Personal technical blog for notes, course reviews, and learning write-ups, published at [marvinthang.github.io](https://marvinthang.github.io).

The site is built with [Jekyll](https://jekyllrb.com/) and the [Chirpy](https://github.com/cotes2020/jekyll-theme-chirpy) theme. Current posts focus on C++, systems/programming notes, and NUS course reviews.

## Local Development

Install Ruby dependencies:

```sh
bundle install
```

Run the site locally:

```sh
bash tools/run.sh
```

Or run Jekyll directly with live reload:

```sh
bundle exec jekyll serve --livereload
```

By default, the site is served at `http://127.0.0.1:4000`.

Useful options:

```sh
bash tools/run.sh --host 0.0.0.0
bash tools/run.sh --production
```

## Writing Posts

Posts live in `_posts/` and follow Jekyll's filename format:

```text
YYYY-MM-DD-post-slug.md
```

Each post starts with front matter. A typical post looks like this:

```yaml
---
title: Post Title
date: 2026-05-14 00:00:00 +0800
categories: [cpp]
tags: [cpp, concurrency]
description: Short summary for previews and SEO.
math: true
---
```

Common fields:

- `title`: Display title for the post.
- `date`: Publication date and timezone.
- `categories`: Broad grouping used by the archive pages.
- `tags`: Searchable topic labels.
- `description`: Short preview text.
- `math`: Enables math rendering when needed.
- `toc`: Controls the table of contents for the post.

## Project Structure

```text
.
|-- _config.yml       # Site and Chirpy configuration
|-- _data/            # Contact, authors, sharing, and locale data
|-- _includes/        # Local template overrides
|-- _plugins/         # Local Jekyll plugins
|-- _posts/           # Blog posts
|-- _tabs/            # Top-level pages such as About, Tags, Archives
|-- assets/           # CSS, images, favicons, and other static assets
|-- tools/run.sh      # Local development server helper
`-- tools/test.sh     # Production build and HTML checks
```

## Build And Test

Build the production site and run HTML checks:

```sh
bash tools/test.sh
```

The test script builds into `_site/` with `JEKYLL_ENV=production`, then runs `htmlproofer` with external link checks disabled.

## Configuration

Main site settings are in `_config.yml`, including:

- Site title, tagline, URL, and timezone.
- Social links and contact metadata.
- Theme mode, avatar, pagination, table of contents, comments, and PWA settings.
- Post and tab permalink defaults.

## License

This repository uses the MIT License. See [LICENSE](LICENSE).
