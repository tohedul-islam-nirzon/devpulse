import type { Request, Response } from "express";
import { issueService } from "./issue.service";

const createIssue = async (req: Request, res: Response) => {
  try {
    const { title, description, type } = req.body;

    // validation
    if (!title || title.length > 150) {
      return res.status(400).json({
        success: false,
        message: "Title is required and must be under 150 characters!",
      });
    }

    if (!description || description.length < 20) {
      return res.status(400).json({
        success: false,
        message: "Description must be at least 20 characters!",
      });
    }

    if (type !== "bug" && type !== "feature_request") {
      return res.status(400).json({
        success: false,
        message: "Type must be bug or feature_request!",
      });
    }

    const reporter_id = req.user!.id;
    const result = await issueService.createIssueIntoDB(req.body, reporter_id);

    res.status(201).json({
      success: true,
      message: "Issue created successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
      errors: error,
    });
  }
};

const getAllIssues = async (req: Request, res: Response) => {
  try {
    const { sort, type, status } = req.query;

    // validate sort
    if (sort && sort !== "newest" && sort !== "oldest") {
      return res.status(400).json({
        success: false,
        message: "Sort must be newest or oldest!",
      });
    }

    if (type && type !== "bug" && type !== "feature_request") {
      return res.status(400).json({
        success: false,
        message: "Type filter must be bug or feature_request!",
      });
    }

    if (
      status &&
      status !== "open" &&
      status !== "in_progress" &&
      status !== "resolved"
    ) {
      return res.status(400).json({
        success: false,
        message: "Status filter must be open, in_progress or resolved!",
      });
    }

    const result = await issueService.getAllIssuesFromDB({
      sort: sort as string,
      type: type as string,
      status: status as string,
    });

    res.status(200).json({
      success: true,
      message: "Issues retrieved successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
      errors: error,
    });
  }
};

const getSingleIssue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await issueService.getSingleIssueFromDB(id as string);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Issue not found!",
      });
    }

    res.status(200).json({
      success: true,
      message: "Issue retrieved successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
      errors: error,
    });
  }
};

const updateIssue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const result = await issueService.updateIssueFromDB(
      req.body,
      id as string,
      { id: user.id, role: user.role },
    );

    if (result.notFound) {
      return res.status(404).json({
        success: false,
        message: "Issue not found!",
      });
    }

    if (result.forbidden) {
      return res.status(403).json({
        success: false,
        message: result.forbidden,
      });
    }

    res.status(200).json({
      success: true,
      message: "Issue updated successfully",
      data: result.data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
      errors: error,
    });
  }
};

const deleteIssue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await issueService.deleteIssueFromDB(id as string);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Issue not found!",
      });
    }

    res.status(200).json({
      success: true,
      message: "Issue deleted successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
      errors: error,
    });
  }
};

export const issueController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue,
};
