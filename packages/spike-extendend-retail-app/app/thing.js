import React from "react";
import { BrandLogo } from "retail-react-app/app/components/icons";

const Thing = () => <div>
  <p>Scenario: This file exists <em>outside</em> the overrides directory. It uses a standard node import.</p>
  <p>
    Expectation: The import tree resolves entirely to files in <code>retail-react-app</code>.
    The brand logo should be the salesforce cloud.
  </p>
  <p>This is the brand logo: <BrandLogo></BrandLogo></p>
</div>
export default Thing