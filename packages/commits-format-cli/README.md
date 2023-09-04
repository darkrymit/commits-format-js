# Commits Format CLI

This CLI tool enables you to quickly start using commits format in your repository.

It helps you to create config file and generate commit messages that follow format.

## Under Development

Currently under early development stage therefore any api can and will change.

Some features may not work as expected or not work at all.

## Getting started

### Install Globally (recommended)

Choose one of the following options according to your package manager:

```bash
npm install -g @darkrymit/commits-format-cli
```

```bash
yarn global add @darkrymit/commits-format-cli
```

```bash
pnpm install -g @darkrymit/commits-format-cli
```

### Create commits format config file (optional) (not implemented yet)

If you don't have config file in your repository you can create it using this command:

```bash
commits-format-cli init
```

### Create commit message that follow format

To create commit message that follow format you can use this command:

```bash
commits-format-cli format
```

You can also pass format name to use by using `--format` or `-f` option:

```bash
commits-format-cli format --format=angular
```

```bash
commits-format-cli format -f angular
```

To see all available options you can use `--help` or `-h` option:

```bash
commits-format-cli format --help
```

```bash
commits-format-cli format -h
```

### All commands

To see all available commands you can use `--help` or `-h` option:

```bash
commits-format-cli --help
```

```bash
commits-format-cli -h
```







