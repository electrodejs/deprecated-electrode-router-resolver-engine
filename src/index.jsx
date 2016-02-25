/*
 *
 * This file is no longer used for generating the compiled code.
 *
 * The actual code is now written directly as lib/index.js and this file is kept
 * as a reference.
 *
 */

import React from "react";
import { renderToString } from "react-dom/server";
import { match, RoutingContext } from "react-router";
import { Resolver } from "react-resolver";
import { Provider } from 'react-redux'
import Promise from "bluebird";


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

export default (routes, options) => {
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
            let store;

            return Resolver.resolve(() => {
              if (options.redux && options.redux.storeInitializer) {
                store = options.redux.storeInitializer(req);
              };

              return (
                <HeaderContextWrapper
                  requestHeaders={req.headers}
                  requestUrl={req.url}
                  requestPathParams={renderProps.params}
                  requestQryParams={req.query}
                >
                  {store ?
                    <Provider store={store}>
                      <RoutingContext {...renderProps} />
                    </Provider>
                  :
                    <RoutingContext {...renderProps} />
                  }
                </HeaderContextWrapper>
              );
            })
            .then(({ Resolved, data }) => {
              let prefetch = `window.__REACT_RESOLVER_PAYLOAD__ = ${JSON.stringify(data)};`;

              if (store && store.getState) {
                const storeState = store.getState();

                prefetch += `window.__WML_REDUX_INITIAL_STATE__ = ${JSON.stringify(storeState)};`;
              }

              return {
                status: 200,
                html: renderToString(<Resolved />),
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
          status: 500,
          message: error.message
        };
      });

  };
};
