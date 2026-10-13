// The site's entry: one page, the catalog of every model the factory builds.

import { render } from "solid-js/web";
import { App } from "./App";
import "./factory.css";

const root = document.getElementById("root");
if (root) render(() => <App />, root);
