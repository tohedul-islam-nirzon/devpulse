import { pool } from "../../db";
import type { IIssue } from "./issue.interface";

const createIssueIntoDB = async (payload: IIssue, reporter_id: number) => {
  const { title, description, type } = payload;

  const result = await pool.query(
    `
    INSERT INTO issues(title, description, type, reporter_id)
    VALUES($1, $2, $3, $4)
    RETURNING *
    `,
    [title, description, type, reporter_id],
  );

  return result.rows[0];
};

const getAllIssuesFromDB = async (filters: {
  sort?: string;
  type?: string;
  status?: string;
}) => {
  const { sort, type, status } = filters;

  // build the where clause
  const conditions: string[] = [];
  const values: any[] = [];

  if (type) {
    values.push(type);
    conditions.push(`type=$${values.length}`);
  }

  if (status) {
    values.push(status);
    conditions.push(`status=$${values.length}`);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";
  const order = sort === "oldest" ? "ASC" : "DESC";

  const issues = await pool.query(
    `
    SELECT * FROM issues ${whereClause}
    ORDER BY created_at ${order}
    `,
    values,
  );

  // fetch reporters separately (no JOIN)
  const reporterIds = issues.rows.map((issue) => issue.reporter_id);

  let reportersMap: Record<number, any> = {};

  if (reporterIds.length > 0) {
    const reporters = await pool.query(
      `
      SELECT id, name, role FROM users WHERE id = ANY($1::int[])
      `,
      [reporterIds],
    );

    reporters.rows.forEach((user) => {
      reportersMap[user.id] = user;
    });
  }

  // attach reporter to each issue
  const result = issues.rows.map((issue) => {
    const { reporter_id, ...rest } = issue;
    return {
      ...rest,
      reporter: reportersMap[reporter_id] || null,
    };
  });

  return result;
};

const getSingleIssueFromDB = async (id: string) => {
  const issueData = await pool.query(
    `
    SELECT * FROM issues WHERE id=$1
    `,
    [id],
  );

  if (issueData.rows.length === 0) {
    return null;
  }

  const issue = issueData.rows[0];

  // fetch reporter separately
  const reporterData = await pool.query(
    `
    SELECT id, name, role FROM users WHERE id=$1
    `,
    [issue.reporter_id],
  );

  const { reporter_id, ...rest } = issue;

  return {
    ...rest,
    reporter: reporterData.rows[0] || null,
  };
};

const updateIssueFromDB = async (
  payload: Partial<IIssue>,
  id: string,
  user: { id: number; role: string },
) => {
  // 1. Check if the issue exists
  const existing = await pool.query(
    `
    SELECT * FROM issues WHERE id=$1
    `,
    [id],
  );

  if (existing.rows.length === 0) {
    return { notFound: true };
  }

  const issue = existing.rows[0];

  // 2. Check permissions
  // Maintainer: can update anything
  // Contributor: can update own issue only if status is open, and cannot change status
  if (user.role !== "maintainer") {
    if (issue.reporter_id !== user.id) {
      return { forbidden: "You can only update your own issues!" };
    }

    if (issue.status !== "open") {
      return {
        forbidden: "Cannot update an issue that is not in open status!",
      };
    }

    if (payload.status) {
      return { forbidden: "Only maintainers can change issue status!" };
    }
  }

  const { title, description, type, status } = payload;

  const result = await pool.query(
    `
    UPDATE issues
    SET
      title=COALESCE($1, title),
      description=COALESCE($2, description),
      type=COALESCE($3, type),
      status=COALESCE($4, status),
      updated_at=NOW()
    WHERE id=$5
    RETURNING *
    `,
    [title, description, type, status, id],
  );

  return { data: result.rows[0] };
};

const deleteIssueFromDB = async (id: string) => {
  const result = await pool.query(
    `
    DELETE FROM issues WHERE id=$1
    `,
    [id],
  );

  return result;
};

export const issueService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateIssueFromDB,
  deleteIssueFromDB,
};
