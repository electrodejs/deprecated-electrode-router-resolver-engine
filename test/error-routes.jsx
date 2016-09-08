import React from "react";
import { Route } from "react-router";

class Error extends React.Component {
  render () {
    throw {
      status: 404
    };
  }
}

export default (
  <Route path="/" component={Error} />
);
