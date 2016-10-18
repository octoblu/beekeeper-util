# beekeeper-util

[![Dependency status](http://img.shields.io/david/octoblu/beekeeper-util.svg?style=flat)](https://david-dm.org/octoblu/beekeeper-util)
[![devDependency Status](http://img.shields.io/david/dev/octoblu/beekeeper-util.svg?style=flat)](https://david-dm.org/octoblu/beekeeper-util)
[![Build Status](http://img.shields.io/travis/octoblu/beekeeper-util.svg?style=flat)](https://travis-ci.org/octoblu/beekeeper-util)

[![NPM](https://nodei.co/npm/beekeeper-util.svg?style=flat)](https://npmjs.org/package/beekeeper-util)

## Introduction

The utility for the [beekeeper-service](https://github.com/octoblu/beekeeper-service) and other deployment related services.

## Installing

```bash
npm install --global beekeeper-util
```

**For the octoblu team:** Make sure you have the latest dotfiles.

## Commands

### configure

```bash
beekeeper configure
```

Configures a project to work with the beekeeper service.


### hub

```bash
beekeeper hub
```

Configures a project to work with docker hub. No webhooks are configured.

### project

```bash
beekeeper project <hostname>
```

Configures a check in pingdom.

### get

```bash
beekeeper get
```

Get the latest deployment.

## Example Configuration

**Location:** `~/.octoblu/beekeeper.json`

```json
{
  "beekeeper": {
    "hostname": "beekeeper.octoblu.com",
    "username": "...",
    "password": "..."
  }
}
```

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
