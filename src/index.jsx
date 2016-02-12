import React from "react";
import { renderToString } from "react-dom/server";
import { match, RoutingContext } from "react-router";
import { Resolver } from "react-resolver";
import Promise from "bluebird";

class HeaderContextWrapper extends React.Component {
  getChildContext() {
    return {
      requestHeaders: this.props.requestHeaders,
      requestUrl: this.props.requestUrl
    };
  }

  render() {
    return this.props.children;
  }
}

HeaderContextWrapper.childContextTypes = {
  requestHeaders: React.PropTypes.object,
  requestUrl: React.PropTypes.object
};

export default (routes) => {
  return (req) => {

    const matchRoute = (resolve, reject) => {
      const location = req.url.path;

      match({routes, location}, (error, redirectLocation, renderProps) => {

        if (error) {
          return reject(error);
        }

        const response = () => {
          if (redirectLocation) {

            return {
              status: 302,
              path: `${redirectLocation.pathname}${redirectLocation.search}`
            };

          } else if (renderProps) {

            return Resolver.resolve(() => (
                <HeaderContextWrapper requestHeaders={req.headers} requestUrl={req.url}>
                  <RoutingContext {...renderProps} />
                </HeaderContextWrapper>
              ))
              .then(({ Resolved, data }) => ({
                status: 200,
                html: renderToString(<Resolved />),
                prefetch: `window.__REACT_RESOLVER_PAYLOAD__ = ${JSON.stringify(data)};`
              }));

          }

          return {
            status: 404,
            message: `router-resolver: Path ${location} not found`
          };
        };

        resolve(response());

      });
    };

    return new Promise(matchRoute)
      .catch((error) => {
        return {
          status: 500,
          message: error.message
        };
      });

  };
};
