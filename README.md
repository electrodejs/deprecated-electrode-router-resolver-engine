# Electrode Router Resolver Engine

[![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url]

A server side routing engine that uses `react-router` and `react-resolver` for SSR and pre-fetch data.

Example:

```
import resolverEngine from "electrode-router-resolver-engine";
import routes from "../../client/routes";

...

export default {
  pageTitle: "Getting Started",
  devServer: {
    port: "2992"
  },
  plugins: [
  ],
  applicationPaths: {
    "/{args*}": {
      view: "index",
      content: resolverEngine(routes)
    }
  }
};
```

Built with :heart: by [Team Electrode](https://github.com/orgs/electrode-io/people) @WalmartLabs.

[npm-image]: https://badge.fury.io/js/electrode-router-resolver-engine.svg
[npm-url]: https://npmjs.org/package/electrode-router-resolver-engine
[travis-image]: https://travis-ci.org/electrode-io/electrode-router-resolver-engine.svg?branch=master
[travis-url]: https://travis-ci.org/electrode-io/electrode-router-resolver-engine
[daviddm-image]: https://david-dm.org/electrode-io/electrode-router-resolver-engine.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/electrode-io/electrode-router-resolver-engine
