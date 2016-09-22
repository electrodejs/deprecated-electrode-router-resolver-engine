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

const THOUSAND = 1000.0;
const MILLION = 1000000.0;

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

const replacers = {
  "<script": encodeURIComponent("<script"),
  "</script>": encodeURIComponent("</script>")
};

const encodeString = (str) => {
  const rg = new RegExp("<script|</script>", "g");
  return str.replace(rg, (m) => replacers[m]);
};

const stringifyReduxInitialState = (store, options) => {
  const filterState = options.filterState;
  let storeState = JSON.stringify(filterState ? filterState(store.getState()) : store.getState());

  if (options.encodePreloadedData) {
    storeState = encodeString(storeState);
  }

  return `window.__WML_REDUX_INITIAL_STATE__ = ${storeState};`;
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

        let startTime;

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

            startTime = options.logSsrTime && process.hrtime();

            const HeaderContextProps = Object.assign({
              requestHeaders: req.headers,
              requestUrl: req.url,
              requestPathParams: renderProps.params,
              requestQryParams: req.query
            }, options.additionalHeaderContextProps && options.additionalHeaderContextProps(req) || {}); 

            return ReactResolver.Resolver.resolve(() => (
                React.createElement(
                  HeaderContextWrapper,
                  HeaderContextProps,
                  store ?
                    React.createElement(
                      Provider,
                      {store: store},
                      React.createElement(ReactRouter.RouterContext, renderProps)
                    )
                    :
                    React.createElement(ReactRouter.RouterContext, renderProps)
                )
              ))
              .then((_ref) => {

                if (options.logSsrTime) {
                  const endTime = process.hrtime(startTime);
                  const ssrTime = endTime[0] * THOUSAND + endTime[1] / MILLION;
                  req.log(["info", "logmon", "splunk", "perf"], {url: req.url.path, ssrtime: ssrTime});
                }

                let prefetch = `window.__REACT_RESOLVER_PAYLOAD__ = ${JSON.stringify(_ref.data)};`;
                const disableSSR = req.app && req.app.disableSSR;

                const renderMethod = options.renderWithIds ?
                  ReactDomServer.renderToString :
                  ReactDomServer.renderToStaticMarkup;

                const result = {
                  status: 200,
                  html: disableSSR ? "" : renderMethod(React.createElement(_ref.Resolved))
                };

                if (!store) {
                  result.prefetch = prefetch;
                  return result;
                }

                if (store.getState) {
                  prefetch += stringifyReduxInitialState(store, options);
                  result.prefetch = prefetch;
                  return result;
                }

                if (store.then) {
                  return store.then((store) => {
                    prefetch += stringifyReduxInitialState(store, options);
                    result.prefetch = prefetch;
                    return result;
                  });
                } else {
                  return result;
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
          path: error.path,
          _err: error
        };
      });

  };
};
