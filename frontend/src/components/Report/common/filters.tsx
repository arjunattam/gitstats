import * as React from "react";
import Select from "react-select";

const InlineSelect = ({ width, ...props }) => {
  return (
    <div className="d-inline-block mx-1" style={{ width }}>
      <Select {...props} />
    </div>
  );
};

export const Filters = ({
  title,
  repos,
  members,
  changeRepo,
  changeMember
}) => {
  return (
    <div className="d-flex justify-content-between align-items-center flex-wrap my-2">
      <div className="small text-muted text-uppercase">
        <strong>{title}</strong> this week
      </div>
      <div>
        <span className="small text-muted text-uppercase">Filters</span>
        <InlineSelect
          width={200}
          placeholder={"Repos..."}
          isClearable={true}
          onChange={changeRepo}
          options={repos}
        />
        <InlineSelect
          width={200}
          placeholder={"Members..."}
          isClearable={true}
          onChange={changeMember}
          options={members}
        />
      </div>
    </div>
  );
};
