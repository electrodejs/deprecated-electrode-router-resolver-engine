"use strict";

const React = require("react");
const ReactDomServer = require("react-dom/server");
const ReactRouter = require("react-router");
const ReactResolver = require("react-resolver");
const Promise = require("bluebird");

class HeaderContextWrapper extends React.Component {
  getChildContext() {
    return {
      requestHeaders: this.props.requestHeaders,
      requestUrl: this.props.requestUrl,
      requestPathParams: this.props.requestPathParams,
      requestQryParams: this.props.requestQryParams
    };
  }

  render() {
    return this.props.children;
  }
}

HeaderContextWrapper.childContextTypes = {
  requestHeaders: React.PropTypes.object,
  requestUrl: React.PropTypes.object,
  requestPathParams: React.PropTypes.object,
  requestQryParams: React.PropTypes.object
};

module.exports = (routes) => {
  return (req) => {

    const matchRoute = (resolve, reject) => {
      const location = req.url.path;

      ReactRouter.match({routes, location}, (error, redirectLocation, renderProps) => {

        if (error) {
          return reject(error instanceof Error ? error : new Error(error));
        }

        const response = () => {
          if (redirectLocation) {

            return {
              status: 302,
              path: `${redirectLocation.pathname}${redirectLocation.search}`
            };

          } else if (renderProps) {

            return ReactResolver.Resolver.resolve(() => (
                React.createElement(
                  HeaderContextWrapper,
                  {
                    requestHeaders: req.headers,
                    requestUrl: req.url,
                    requestPathParams: renderProps.params,
                    requestQryParams: req.query
                  },
                  React.createElement(ReactRouter.RoutingContext, renderProps)
                )
              ))
              .then((_ref) => {
                const Resolved = _ref.Resolved;
                const data = _ref.data;
                return {
                  status: 200,
                  html: ReactDomServer.renderToString(React.createElement(Resolved)),
                  prefetch: `window.__REACT_RESOLVER_PAYLOAD__ = ${JSON.stringify(data)};`
                };
              });

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
          message: error.message,
          _err: error
        };
      });

  };
};
