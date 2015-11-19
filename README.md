Router Resolver Engine
======================

A server side routing engine that uses `react-router` and `react-resolver` for SSR and pre-fetch data.

Example:

```
import resolverEngine from "@walmart/router-resolver-engine";
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
