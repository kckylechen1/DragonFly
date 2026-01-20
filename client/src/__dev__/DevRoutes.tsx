import { Route } from "wouter";
import ComponentShowcase from "./ComponentShowcase";

export default function DevRoutes() {
  if (import.meta.env.PROD) return null;

  return <Route path="/dev/showcase" component={ComponentShowcase} />;
}
