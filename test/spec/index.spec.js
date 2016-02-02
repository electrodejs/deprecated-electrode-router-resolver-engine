"use strict";

require("babel-core/register");

const routerResolver = require("../../src/index.jsx").default;
const routes = require("../routes.jsx").default;
const badRoutes = require("../bad-routes.jsx").default;

describe("RouterResolver", function () {
  it("should return 404 for unknown index route", () => {
    const resolver = routerResolver(routes);
    return resolver({url: {path: "/"}}).then((result) => {
      expect(result.status).to.equal(404);
    });
  });

  it("should resolve index route", () => {
    const resolver = routerResolver(routes);
    return resolver({url: {path: "/test"}}).then((result) => {
      expect(result.status).to.equal(200);
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
    });
  });


});
