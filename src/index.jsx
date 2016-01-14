import React from "react";
import { renderToString } from "react-dom/server";
import { match, RoutingContext } from "react-router";
import { Resolver } from "react-resolver";

class HeaderContextWrapper extends React.Component {
  getChildContext() {
    return {
      requestHeaders: this.props.requestHeaders
    };
  }

  render() {
    return this.props.children
  }
}

HeaderContextWrapper.childContextTypes = {
  requestHeaders: React.PropTypes.object
};

export default (routes) => {
  return (req) => {
    return new Promise((resolve, reject) => {
      try {
        match({ routes, location: req.url.path }, (error, redirectLocation, renderProps) => {
          if (error) {
            resolve({
              status: 500,
              message: error.message
            });
          } else if (redirectLocation) {
            resolve({
              status: 302,
              path: redirectLocation.pathname + redirectLocation.search
            });
          } else if (renderProps) {
            Resolver
              .resolve(() => {
                return (
                  <HeaderContextWrapper requestHeaders={req.headers}>
                    <RoutingContext {...renderProps} />
                  </HeaderContextWrapper>
                );
              })
              .then(({ Resolved, data }) => {
                resolve({
                  status: 200,
                  html: renderToString(<Resolved />),
                  prefetch: `window.__REACT_RESOLVER_PAYLOAD__ = ${JSON.stringify(data)};`
                });
              })
              .catch((error) => {
                resolve({
                  status: 500,
                  message: error.toString()
                });
              })
          } else {
            resolve({
              status: 404,
              message: "Not found"
            });
          }
        });
      } catch(error) {
        resolve({
          status: 500,
          message: error.toString()
        });
      }
    });
  };
};
