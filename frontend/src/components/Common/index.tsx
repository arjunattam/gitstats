import * as React from "react";

const getTeamLink = (login, service) => {
  switch (service) {
    case "github":
      return `https://github.com/${login}`;
    case "bitbucket":
      return `https://bitbucket.org/${login}`;
    default:
      return ``;
  }
};

const ServiceLink = ({ login, service }) => {
  let text;

  switch (service) {
    case "github":
      text = "GitHub";
      break;
    case "bitbucket":
      text = "Bitbucket";
      break;
    default:
      text = "";
  }

  return (
    <a href={getTeamLink(login, service)} target="_blank">
      <span className="text-muted">{text}</span>
    </a>
  );
};

export const TeamName = ({ name, avatar, login, service }) => {
  return (
    <div className="d-flex align-items-center">
      <img src={avatar} style={{ width: 35, borderRadius: 3 }} alt={name} />
      <span>
        <span className="h3 px-2 my-0">{name}</span>
        <ServiceLink login={login} service={service} />
      </span>
    </div>
  );
};

export const MemberName = ({ name, login, avatar }) => {
  return (
    <div style={{ display: "inline-block" }}>
      <img src={avatar} style={{ width: 25, borderRadius: 2 }} alt={login} />
      <span className="mx-2">{name}</span>
    </div>
  );
};
