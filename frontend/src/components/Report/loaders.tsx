import * as React from "react";
import ContentLoader from "react-content-loader";

export const TitleLoader = props => (
  <ContentLoader
    height={25}
    width={400}
    speed={2}
    primaryColor="#f3f3f3"
    secondaryColor="#e0e0e0"
    {...props}
  >
    <rect x="0" y="0" rx="3" ry="3" width="70" height="25" />
    <rect x="80" y="0" rx="3" ry="3" width="150" height="25" />
    <rect x="240" y="0" rx="3" ry="3" width="40" height="25" />
  </ContentLoader>
);

export const BodyLoader = props => (
  <ContentLoader
    height={75}
    width={400}
    speed={2}
    primaryColor="#f3f3f3"
    secondaryColor="#ecebeb"
    preserveAspectRatio="none"
    {...props}
  >
    <rect x="0" y="0" rx="3" ry="3" width="250" height="10" />
    <rect x="20" y="20" rx="3" ry="3" width="220" height="10" />
    <rect x="20" y="40" rx="3" ry="3" width="170" height="10" />
  </ContentLoader>
);
