import * as React from "react";
import Select from "react-select";

export const InlineSelect = ({ width, ...props }) => {
  return (
    <div className="d-inline-block mx-1" style={{ width }}>
      <Select {...props} />
    </div>
  );
};

export const Filters = ({
  title,
  repos,
  authors,
  reviewers,
  changeRepo,
  changeAuthor,
  changeReviewer
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
          placeholder={"by Repo"}
          isClearable={true}
          onChange={changeRepo}
          options={repos}
        />
        <InlineSelect
          width={200}
          placeholder={"by Author"}
          isClearable={true}
          onChange={changeAuthor}
          options={authors}
        />
        <InlineSelect
          width={200}
          placeholder={"by Reviewer"}
          isClearable={true}
          onChange={changeReviewer}
          options={reviewers}
        />
      </div>
    </div>
  );
};
