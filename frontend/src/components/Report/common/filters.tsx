import * as React from "react";
import { DropdownWithoutValues } from "../../Charts/utils";

export const ALL_REPOS = "All repos";
export const ALL_MEMBERS = "All members";

export const Filters = ({
  title,
  selectedRepo,
  selectedMember,
  repos,
  members,
  changeRepo,
  showAllRepos,
  changeMember,
  showAllMembers
}) => {
  return (
    <div className="d-flex justify-content-between align-items-center flex-wrap my-2">
      <div className="small text-muted text-uppercase">
        <strong>{title}</strong> this week
      </div>
      <div>
        <span className="small text-muted text-uppercase">Filters</span>
        <DropdownWithoutValues
          selected={selectedRepo}
          items={repos}
          allText={ALL_REPOS}
          onSelect={changeRepo}
          onSelectAll={showAllRepos}
        />
        <DropdownWithoutValues
          selected={selectedMember}
          items={members}
          allText={ALL_MEMBERS}
          onSelect={changeMember}
          onSelectAll={showAllMembers}
        />
      </div>
    </div>
  );
};
