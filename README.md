# node-data-types

Binary Data Parsers

## Installation

```bash
$ npm install @athombv/data-types
```

## Changelog

v2.0.0 - Breaking

- `DataType` now requires a `defaultValue` as constructor parameter before `args`. The `defaultValue` used to be determined by a calculation but a static definition suffices as well and makes it TypeScript compatbile.
