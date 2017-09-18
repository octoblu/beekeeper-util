# beekeeper-util

[![Dependency status](http://img.shields.io/david/octoblu/beekeeper-util.svg?style=flat)](https://david-dm.org/octoblu/beekeeper-util)
[![devDependency Status](http://img.shields.io/david/dev/octoblu/beekeeper-util.svg?style=flat)](https://david-dm.org/octoblu/beekeeper-util)
[![Build Status](http://img.shields.io/travis/octoblu/beekeeper-util.svg?style=flat)](https://travis-ci.org/octoblu/beekeeper-util)

[![NPM](https://nodei.co/npm/beekeeper-util.svg?style=flat)](https://npmjs.org/package/beekeeper-util)

## Introduction

The utility for the [beekeeper-service](https://github.com/octoblu/beekeeper-service) and other deployment related services. Beekeeper Util can be controlled through a number of flags and/or environment variables.

## Installing

```bash
npm install --global beekeeper-util
```

or

```bash
yarn global add beekeeper-util
```

## Setting Defaults

By default all services are enabled on configure/release. If you would like to prevent certain integrations from being automatically set up, you can disable them by creating a `.beekeeper.env` file in the root of your project. The env file is parsed and will be applied as if they were set in your environment. *DO NOT* place secrets or other confidential information in this file.

#### Example .beekeeper.env
```
BEEKEEPER_ENABLED=false
BEEKEEPER_GITHUB_RELEASE_ENABLED=false
```

## Travis Environment variables

Beekeeper Util allows you to set up default travis environment variables for your project. It also allows you to remap environment variables set in your environment into differently named environment variables in Travis (e.g. `BEEKEEPER_NPM_TOKEN` => `NPM_TOKEN`). Create a .beekeeper-travis.json file in the root of your project to enable this feature. Whenever `beekeeper-configure` is called, these environment variables will be added to your travis configuration. You can then reference them in your travis.yml without needing to encrypt them first. All environment variables are encrypted by travis.

There are two types of variables, static values (using the `value` key in your json object), or environment variables (using the `env` key in your json object). The `env` option will take the current value in the environment, encrypt and assign that variable to your travis configuration.

#### Example .beekeeper-travis.json
```json
{
  "env": [
    {
      "name": "DEBUG",
      "value": "meshblu-connector-*,octodash"
    },
    {
      "name": "MESHBLU_CONNECTOR_GPG_KEY_ID",
      "env": "BEEKEEPER_MESHBLU_CONNECTOR_GPG_KEY_ID"
    }
  ]
}
```

## Commands

### beekeeper-configure (alias `bkc`)

Configure your project.

### beekeeper-release (alias `bkr`)

Create a release and (optionally) trigger an automatic deployment using semver to create a proper version number and tag. Uses `--patch` by default.

### beekeeper-tag (alias `bkt`)

Mark a deployment with a "tag"

### beekeeper-status (alias `bks`)

Get status of the a deployment

### beekeeper-webhook (no alias)

Mark a deployment with CI passing or build passsing

### beekeeper-update (no alias)

Update a deployment with a docker url

### beekeeper-delete (no alias)

Delete a deployment

## License

The MIT License (MIT)

Copyright 2016 Octoblu

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
