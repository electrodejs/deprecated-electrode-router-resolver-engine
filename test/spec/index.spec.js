"use strict";

const Promise = require("bluebird");
const routerResolver = require("../../lib/index");

require("babel-register");

const createStore = require("redux").createStore;

const routes = require("../routes.jsx").default;
const badRoutes = require("../bad-routes.jsx").default;
const errorRoutes = require("../error-routes.jsx").default;
const getIndexRoutes = require("../get-index-routes.jsx").default;
const ErrorRoute = require("../get-index-routes.jsx").ErrorRoute;

describe("RouterResolver", function () {
  it("should return 404 for unknown index route", () => {
    const resolver = routerResolver(routes);
    return resolver({url: {path: "/test/blah"}}).then((result) => {
      expect(result.status).to.equal(404);
    });
  });

  it("should return string error", () => {
    const resolver = routerResolver(getIndexRoutes);
    return resolver({url: {path: "/test"}}).then((result) => {
      expect(result.status).to.equal(500);
      expect(result._err.message).to.equal("failed");
    });
  });

  it("should return Error error", () => {
    const resolver = routerResolver(ErrorRoute);
    return resolver({url: {path: "/test"}}).then((result) => {
      expect(result.status).to.equal(500);
      expect(result._err.message).to.equal("failed error");
    });
  });

  it("should resolve index route", () => {
    const resolver = routerResolver(routes);
    return resolver({url: {path: "/test"}}).then((result) => {
      expect(result.status).to.equal(200);
    });
  });

  it("should bootstrap a redux store if redux option is passed in", () => {
    const resolver = routerResolver(routes, {
      redux: {
        storeInitializer: () => createStore((state) => state, ["Use Redux"])
      }
    });

    return resolver({url: {path: "/test"}}).then((result) => {
      console.log(result.prefetch);
      expect(result.prefetch).to.contain(`window.__WML_REDUX_INITIAL_STATE__ = ["Use Redux"];`);
    });
  });

  it("should bootstrap a redux store if redux option is passed in as a promise", () => {
    const resolver = routerResolver(routes, {
      redux: {
        storeInitializer: () => Promise.resolve(createStore((state) => state, ["Use Redux from Promise"]))
      }
    });

    return resolver({url: {path: "/test"}}).then((result) => {
      console.log(result.prefetch);
      expect(result.prefetch).to.contain(`window.__WML_REDUX_INITIAL_STATE__ = ["Use Redux from Promise"];`);
    });
  });

  it("should encode script tags in the redux store when encodePreloadedData is true", () => {
    const resolver = routerResolver(routes, {
      redux: {
        storeInitializer: () => Promise.resolve(createStore((state) => state, ["<script>Use Redux</script><script></script>"]))
      },
      encodePreloadedData: true
    });

    return resolver({url: {path: "/test"}}).then((result) => {
      expect(result.prefetch).to.contain(`window.__WML_REDUX_INITIAL_STATE__ = ["%3Cscript>Use Redux%3C%2Fscript%3E%3Cscript>%3C%2Fscript%3E"];`);
      expect(decodeURIComponent(result.prefetch)).to.contain(`window.__WML_REDUX_INITIAL_STATE__ = ["<script>Use Redux</script><script></script>"]`);
    });
  });

  it("should redirect redirect route", () => {
    const resolver = routerResolver(routes);
    return resolver({url: {path: "/test/source"}}).then((result) => {
      expect(result.status).to.equal(302);
      expect(result.path).to.equal("/test/target");
    });
  });

  it("should return 500 for invalid component", () => {
    const resolver = routerResolver(badRoutes);
    return resolver({url: {path: "/test"}}).then((result) => {
      expect(result.status).to.equal(500);
      expect(result._err).to.be.ok;
    });
  });

  it("should return 404 if component throws 404", () => {
    const resolver = routerResolver(errorRoutes);
    return resolver({url: {path: "/"}}).then((result) => {
      expect(result.status).to.equal(404);
      expect(result._err).to.be.ok;
    });
  });

});
