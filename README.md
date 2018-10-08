# babel-plugin-ts-definitions-to-proptypes

[![Build Status](https://travis-ci.org/ruslankhh/babel-plugin-ts-definitions-to-proptypes.svg?branch=master)](https://travis-ci.org/ruslankhh/babel-plugin-ts-definitions-to-proptypes)

A Babel plugin to generate React PropTypes from TypeScript definitinos.

## Examples

```js
// Example.d.ts
// Before
import React from 'react';

export interface Props {
  name?: string;
}

// After
import React from 'react';
import PropTypes from 'prop-types';

export const Props = {
  name: PropTypes.string
};
```

```js
// Example.js
import React from 'react';
import Props from './Example.d.ts';

export class Example extends React.Component {
  static propTypes = Props;

  render() {
    return <div />;
  }
}
```

## Requirements

- Babel 7+
- TypeScript 2+

## Installation

```js
npm i -D babel-plugin-ts-definitions-to-proptypes
```

## Usage

Add the plugin to your Babel config. It's preferred to enable this plugin for development only, or
when building a library.

```js
// babel.config.js
const plugins = [];

if (process.env.NODE_ENV !== 'production') {
  plugins.push('babel-plugin-ts-definitions-to-proptypes');
}

module.exports = {
  // Required
  presets: ['@babel/preset-typescript', '@babel/preset-react']
  plugins,
};
```

When transpiling down to ES5 or lower, the `@babel/plugin-proposal-class-properties` plugin is
required.

### Options

- `customPropTypeSuffixes` (string[]) - Reference custom types directly when they match one of the
  provided suffixes. This option requires the type to be within the file itself, as imported types
  would be automatically removed by Babel. Defaults to `[]`.

```js
module.exports = {
  plugins: [['babel-plugin-ts-definitions-to-proptypes', { customPropTypeSuffixes: ['Shape'] }]],
};
```

```js
// Before
import React from 'react';
import PropTypes from 'prop-types';

const NameShape = PropTypes.string;

interface Props {
  name?: NameShape;
}

class Example extends React.Component<Props> {
  render() {
    return <div />;
  }
}

// After
import React from 'react';
import PropTypes from 'prop-types';

const NameShape = PropTypes.string;

class Example extends React.Component {
  static propTypes = {
    name: NameShape,
  };

  render() {
    return <div />;
  }
}
```
