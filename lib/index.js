"use strict";

/*
 * NOTE: This file uses node 4 features not babel.
 *
 * For converting JSX to js code during development use:
 * https://babeljs.io/repl/
 *
 */
const React = require("react");
const ReactDomServer = require("react-dom/server");
const ReactRouter = require("react-router");
const ReactResolver = require("react-resolver");
const Provider = require("react-redux").Provider;
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

module.exports = (routes, options) => {
  options = options || {};

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
            let store;

            if (options.redux && options.redux.storeInitializer) {
              store = options.redux.storeInitializer(req);
            }

            return ReactResolver.Resolver.resolve(() => (
                React.createElement(
                  HeaderContextWrapper,
                  {
                    requestHeaders: req.headers,
                    requestUrl: req.url,
                    requestPathParams: renderProps.params,
                    requestQryParams: req.query
                  },
                  store ?
                    React.createElement(
                      Provider,
                      {store: store},
                      React.createElement(ReactRouter.RoutingContext, renderProps)
                    )
                    :
                    React.createElement(ReactRouter.RoutingContext, renderProps)
                )
              ))
              .then((_ref) => {
                let prefetch = `window.__REACT_RESOLVER_PAYLOAD__ = ${JSON.stringify(_ref.data)};`;

                if (store && store.getState) {
                  const storeState = store.getState();

                  prefetch += `window.__WML_REDUX_INITIAL_STATE__ = ${JSON.stringify(storeState)};`;
                }

                return {
                  status: 200,
                  html: ReactDomServer.renderToString(React.createElement(_ref.Resolved)),
                  prefetch: prefetch
                }
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
          status: error.status || 500,
          message: error.message,
          _err: error
        };
      });

  };
};
