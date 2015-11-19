import { renderToString } from "react-dom/server";
import { match, RoutingContext } from "react-router";
import { Resolver } from "react-resolver";

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
              .resolve(() => <RoutingContext {...renderProps} />)
              .then(({ Resolved, data }) => {
                resolve({
                  status: 200,
                  html: renderToString(<Resolved />),
                  prefetch: `window.__REACT_RESOLVER_PAYLOAD__ = ${JSON.stringify(data)};`
                });
              })
              .catch((error) => {
                console.log(error);
              })
          } else {
            resolve({
              status: 404,
              message: "Not found"
            });
          }
        });
      } catch(e) {
        console.log(e);
        console.log(e.stack);
      }
    });
  };
};
