import * as React from "react";
import { DropdownWithoutValues } from "../../Charts/utils";

export const ALL_REPOS = "All repos";
export const ALL_MEMBERS = "All members";

export const Filters = ({
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
    <div className="d-flex justify-content-end align-items-center my-2">
      <div className="small text-muted text-uppercase">Filters</div>
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
  );
};
