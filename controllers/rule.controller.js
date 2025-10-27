
// const authenticate = (req, res, next) => {
//     req.user = { email: 'user@example.com' }; // Mock user object
//     next();
//   };

import { PrismaClient } from "@prisma/client"; // Make sure you have @prisma/client installed
import vm from "vm";
const prisma = new PrismaClient();
import fs from "fs";
import path from "path";
import FormData from "form-data";
import Groq from "groq-sdk";
import axios from "axios";
import {
  connectToExternalDB,
  generateComplianceResponse,
} from "../utils/rules.util.js";
import AWS from "aws-sdk";
import {
  TextractClient,
  AnalyzeDocumentCommand,
} from "@aws-sdk/client-textract";
import { Readable } from "stream";
import pkg from "pg";
const { Pool } = pkg;
import {
  sendBulkEmails,
  sendSingleEmailNotification,
} from "../utils/email.util.js";
import { log } from "console";

// Error handling
class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

class ApiResponse {
  constructor(status, data, message) {
    this.status = status;
    this.data = data;
    this.message = message;
  }
}

function asyncHandler(fn) {
  return function (req, res, next) {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// In-memory data for demo purposes
// const data = [];

// export const getAllRuleByOrgId = asyncHandler(async (req, res) => {
//   const orgId = req.params.orgId;

//   if (!orgId) {
//     throw new ApiError(400, "Organization ID is required");
//   }

//   const rules = data.filter(rule => rule.OrganizationId === orgId);

//   const categories = ["hr", "logistics", "security", "finance", "operations"];
//   const categoryCounts = categories.reduce((acc, category) => {
//     acc[category] = 0;
//     return acc;
//   }, {});

//   rules.forEach(rule => {
//     if (categories.includes(rule.category)) {
//       categoryCounts[rule.category]++;
//     }
//   });

//   const totalRules = rules.length;

//   res.status(200).json(new ApiResponse(200, { rules, categoryCounts, totalRules }, "Rules fetched successfully"));
// });

// export const createRuleByOrgId = asyncHandler(async (req, res) => {
//   const orgId = req.params.orgId;
//   const rule = req.body;

//   if (!rule.name || !rule.description || !rule.data || !rule.category || !rule.ruleType) {
//     throw new ApiError(400, "Please provide all required fields");
//   }

//   const validCategories = ["hr", "logistics", "security", "finance", "operations"];
//   const validRuleTypes = ["SHORT_RULE", "LONG_RULE"];

//   if (!validCategories.includes(rule.category)) {
//     throw new ApiError(400, "Invalid category provided");
//   }

//   if (!validRuleTypes.includes(rule.ruleType)) {
//     throw new ApiError(400, "Invalid ruleType provided");
//   }

//   const newRule = {
//     id: Math.random().toString(36).substring(2, 15),
//     name: rule.name,
//     description: rule.description,
//     email: req.user.email || null,
//     data: rule.data,
//     flowInput: rule.flowInput || null,
//     secret: Math.random().toString(36).substring(2, 15),
//     status: "ACTIVE",
//     ruleType: rule.ruleType,
//     activationDate: new Date().toISOString(),
//     category: rule.category,
//     versions: rule.versions || "1.0",
//     OrganizationId: orgId,
//   };

//   const existingRule = data.find(r => r.name === newRule.name && r.OrganizationId === orgId);
//   if (existingRule) {
//     throw new ApiError(400, "Rule with this name already exists for this organization");
//   }

//   data.push(newRule);

//   res.status(201).json(new ApiResponse(201, newRule, "Rule created successfully"));
// });

// export const editRuleById = asyncHandler(async (req, res) => {
//   const { orgId, id } = req.params;
//   const updatedRuleData = req.body;

//   const ruleIndex = data.findIndex(r => r.id === id && r.OrganizationId === orgId);
//   if (ruleIndex === -1) {
//     throw new ApiError(404, "Rule not found");
//   }

//   const validCategories = ["hr", "logistics", "security", "finance", "operations"];
//   const validRuleTypes = ["SHORT_RULE", "LONG_RULE"];
//   const validStatuses = ["ACTIVE", "INACTIVE"];

//   if (updatedRuleData.category && !validCategories.includes(updatedRuleData.category)) {
//     throw new ApiError(400, "Invalid category provided");
//   }

//   if (updatedRuleData.ruleType && !validRuleTypes.includes(updatedRuleData.ruleType)) {
//     throw new ApiError(400, "Invalid ruleType provided");
//   }

//   if (updatedRuleData.status && !validStatuses.includes(updatedRuleData.status)) {
//     throw new ApiError(400, "Invalid status provided");
//   }

//   const updatedRule = {
//     ...data[ruleIndex],
//     ...updatedRuleData,
//     updatedDate: new Date().toISOString(),
//   };

//   data[ruleIndex] = updatedRule;

//   res.status(200).json(new ApiResponse(200, updatedRule, "Rule updated successfully"));
// });

// export const deleteRuleById = asyncHandler(async (req, res) => {
//   const { orgId, id } = req.params;

//   const ruleIndex = data.findIndex(r => r.id === id && r.OrganizationId === orgId);
//   if (ruleIndex === -1) {
//     throw new ApiError(404, "Rule not found");
//   }

//   data.splice(ruleIndex, 1);

//   res.status(200).json(new ApiResponse(200, {}, "Rule deleted successfully"));
// });

// export const saveRuleById = asyncHandler(async (req, res) => {
//   const { id, rule } = req.body;

//   if (!id || !rule.flowData || !rule.flowInputField) {
//     throw new ApiError(400, "Please provide valid ID, flowData, and flowInputField");
//   }

//   const existingRule = data.find(r => r.id === id);
//   if (!existingRule) {
//     throw new ApiError(404, "Rule not found");
//   }

//   existingRule.data = rule.flowData;
//   existingRule.flowInput = rule.flowInputField;

//   res.status(200).json(new ApiResponse(200, existingRule, "Rule updated successfully"));
// });

// export const getRuleById = asyncHandler(async (req, res) => {
//   const { id } = req.params;

//   const rule = data.find(r => r.id === id);
//   if (!rule) {
//     throw new ApiError(404, "Rule not found");
//   }

//   res.status(200).json(new ApiResponse(200, rule, "Rule retrieved successfully"));
// });

export const getAllRuleByOrgId = asyncHandler(async (req, res) => {
  const orgId = req.params.orgId;
  console.log("Getting rules for orgId: ", orgId);
  if (!orgId) {
    throw new ApiError(400, "Organization ID is required");
  }

  // Fetch rules from the database for the given organization
  const rules = await prisma.rule.findMany({
    where: {
      OrganizationId: parseInt(orgId),
    },
  });

  const categories = ["hr", "logistics", "security", "finance", "operations"];
  const categoryCounts = categories.reduce((acc, category) => {
    acc[category] = 0;
    return acc;
  }, {});

  rules.forEach((rule) => {
    if (categories.includes(rule.category)) {
      categoryCounts[rule.category]++;
    }
  });

  const totalRules = rules.length;

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { rules, categoryCounts, totalRules },
        "Rules fetched successfully"
      )
    );
});

export const createRuleByOrgId = asyncHandler(async (req, res) => {
  const orgId = parseInt(req.params.orgId);
  const rule = req.body;

  console.log("check the rule.data", rule);

  // Check if the Organization exists
  const organization = await prisma.organization.findUnique({
    where: { id: orgId },
  });

  if (!organization) {
    throw new ApiError(400, "Organization not found");
  }

  // Validate required fields
  if (
    !rule.name ||
    !rule.description ||
    !rule.data ||
    !rule.category ||
    !rule.ruleType
  ) {
    throw new ApiError(400, "Please provide all required fields");
  }

  // Valid categories and rule types
  const validCategories = [
    "hr",
    "logistics",
    "security",
    "finance",
    "operations",
  ];
  const validRuleTypes = ["SHORT_RULE", "LONG_RULE"];

  if (!validCategories.includes(rule.category)) {
    throw new ApiError(400, "Invalid category provided");
  }

  if (!validRuleTypes.includes(rule.ruleType)) {
    throw new ApiError(400, "Invalid ruleType provided");
  }

  // Check if rule already exists for this organization
  const existingRule = await prisma.rule.findFirst({
    where: {
      name: rule.name,
      OrganizationId: orgId,
    },
  });

  if (existingRule) {
    throw new ApiError(
      400,
      "Rule with this name already exists for this organization"
    );
  }

  // Create the new rule
  const newRule = await prisma.rule.create({
    data: {
      name: rule.name,
      description: rule.description,
      data: rule.data,
      flowInput: rule.flowInputField || null,
      secret: Math.random().toString(36).substring(2, 15),
      status: "ACTIVE",
      ruleType: rule.ruleType,
      activationDate: new Date(),
      category: rule.category,
      OrganizationId: orgId,
    },
  });

  res
    .status(201)
    .json(new ApiResponse(201, newRule, "Rule created successfully"));
});

export const editRuleById = asyncHandler(async (req, res) => {
  const { orgId, id } = req.params;
  const updatedRuleData = req.body;

  // Fetch the existing rule from the database
  const existingRule = await prisma.rule.findFirst({
    where: {
      id: parseInt(id),
      OrganizationId: parseInt(orgId),
    },
  });

  if (!existingRule) {
    throw new ApiError(404, "Rule not found");
  }

  const validCategories = [
    "hr",
    "logistics",
    "security",
    "finance",
    "operations",
  ];
  const validRuleTypes = ["SHORT_RULE", "LONG_RULE"];
  const validStatuses = ["ACTIVE", "INACTIVE"];

  if (
    updatedRuleData.category &&
    !validCategories.includes(updatedRuleData.category)
  ) {
    throw new ApiError(400, "Invalid category provided");
  }

  if (
    updatedRuleData.ruleType &&
    !validRuleTypes.includes(updatedRuleData.ruleType)
  ) {
    throw new ApiError(400, "Invalid ruleType provided");
  }

  if (
    updatedRuleData.status &&
    !validStatuses.includes(updatedRuleData.status)
  ) {
    throw new ApiError(400, "Invalid status provided");
  }

  // Update the rule in the database
  const updatedRule = await prisma.rule.update({
    where: {
      id: parseInt(id),
    },
    data: {
      ...updatedRuleData,
      updatedAt: new Date(),
    },
  });

  res
    .status(200)
    .json(new ApiResponse(200, updatedRule, "Rule updated successfully"));
});

export const deleteRuleById = asyncHandler(async (req, res) => {
  const { orgId, id } = req.params;

  // Fetch the existing rule from the database, including its versions
  const existingRule = await prisma.rule.findFirst({
    where: {
      id: parseInt(id),
      OrganizationId: parseInt(orgId),
    },
    include: {
      versions: true, // Include the versions
    },
  });

  if (!existingRule) {
    throw new ApiError(404, "Rule not found");
  }

  // Delete all versions associated with the rule
  if (existingRule.versions && existingRule.versions.length > 0) {
    await prisma.version.deleteMany({
      where: {
        ruleId: parseInt(id), // Delete versions associated with this rule
      },
    });
  }

  // Delete the rule after its versions have been removed
  await prisma.rule.delete({
    where: {
      id: parseInt(id),
    },
  });

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "Rule and associated versions deleted successfully"
      )
    );
});

export const saveRuleById = asyncHandler(async (req, res) => {
  const { id, rule } = req.body;

  if (!id || !rule.flowData || !rule.flowInputField) {
    throw new ApiError(
      400,
      "Please provide valid ID, flowData, and flowInputField"
    );
  }

  // Fetch the existing rule from the database
  const existingRule = await prisma.rule.findFirst({
    where: {
      id: parseInt(id),
    },
  });

  if (!existingRule) {
    throw new ApiError(404, "Rule not found");
  }

  // Update rule's flow data and flow input
  const updatedRule = await prisma.rule.update({
    where: {
      id: parseInt(id),
    },
    data: {
      data: rule.flowData,
      flowInput: rule.flowInputField,
    },
  });

  res
    .status(200)
    .json(new ApiResponse(200, updatedRule, "Rule updated successfully"));
});

export const getRuleById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Fetch the rule by ID from the database
  const rule = await prisma.rule.findUnique({
    where: {
      id: parseInt(id),
    },
  });

  if (!rule) {
    throw new ApiError(404, "Rule not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, rule, "Rule retrieved successfully"));
});

//Version

export const createVersionByRuleId = asyncHandler(async (req, res) => {
  const ruleId = parseInt(req.params.ruleId);
  console.log("-->", ruleId);
  const { versionName, updatedRule } = req.body;

  // Validate rule existence
  const existingRule = await prisma.rule.findUnique({
    where: { id: ruleId },
  });

  if (!existingRule) {
    throw new ApiError(400, "Rule not found");
  }

  // Validate request body
  if (!versionName || !updatedRule) {
    throw new ApiError(400, "Please provide both version name and data");
  }

  // Check if version already exists for this rule
  const existingVersion = await prisma.version.findFirst({
    where: {
      ruleId: ruleId,
      versionName: versionName,
    },
  });

  if (existingVersion) {
    throw new ApiError(
      400,
      "Version with this name already exists for this rule"
    );
  }

  if (!updatedRule.flowData) {
    throw new ApiError(400, "Please provide all required fields");
  }

  await prisma.rule.update({
    where: {
      id: ruleId,
    },
    data: {
      data: updatedRule.flowData,
      flowInput: updatedRule.flowInput || null,
    },
  });

  // Create new version
  const newVersion = await prisma.version.create({
    data: {
      versionName: versionName,
      data: updatedRule.flowData,
      flowInput: updatedRule.flowInputField || null,
      rule: { connect: { id: ruleId } },
    },
  });

  res
    .status(201)
    .json(new ApiResponse(201, newVersion, "Version created successfully"));
});

export const updateVersionByVersionId = asyncHandler(async (req, res) => {
  const versionId = parseInt(req.params.versionId);
  const { updatedRule } = req.body;

  // Find the existing version
  const existingVersion = await prisma.version.findUnique({
    where: { id: versionId },
    include: { rule: true }, // Include related rule data
  });

  if (!existingVersion) {
    throw new ApiError(404, "Version not found");
  }

  console.log("existingVersion : ", existingVersion.data);

  // Find the latest version for the rule
  const latestVersion = await prisma.version.findFirst({
    where: { ruleId: existingVersion.ruleId },
    orderBy: { createdAt: "desc" }, // Get the latest version by createdAt
  });

  // Update the version
  const updatedVersion = await prisma.version.update({
    where: { id: versionId },
    data: {
      versionName: existingVersion.versionName,
      data: updatedRule.flowData,
      flowInput: updatedRule.flowInputField,
    },
  });

  // If the current version is the latest, update the associated rule
  if (latestVersion.id === versionId) {
    console.log("Editing the Latest version");
    await prisma.rule.update({
      where: { id: existingVersion.ruleId },
      data: {
        data: updatedRule.flowData,
        flowInput: updatedVersion.flowInputField,
      },
    });
  }

  res
    .status(200)
    .json(new ApiResponse(200, updatedVersion, "Version updated successfully"));
});

export const getAllVersionByRuleId = asyncHandler(async (req, res) => {
  const ruleId = parseInt(req.params.ruleId);

  // Validate rule existence
  const existingRule = await prisma.rule.findUnique({
    where: { id: ruleId },
  });

  if (!existingRule) {
    throw new ApiError(404, "Rule not found");
  }

  // Fetch all versions for the rule
  const versions = await prisma.version.findMany({
    where: { ruleId: ruleId },
  });

  res
    .status(200)
    .json(new ApiResponse(200, versions, "Versions retrieved successfully"));
});

export const deleteVersionById = asyncHandler(async (req, res) => {
  const versionId = parseInt(req.params.id);

  // Validate input
  if (isNaN(versionId)) {
    throw new ApiError(400, "Invalid version ID");
  }

  // Find the version to ensure it exists
  const existingVersion = await prisma.version.findUnique({
    where: { id: versionId },
  });

  if (!existingVersion) {
    throw new ApiError(404, "Version not found");
  }

  // Delete the version
  await prisma.version.delete({
    where: { id: versionId },
  });

  res
    .status(200)
    .json(new ApiResponse(200, null, "Version deleted successfully"));
});

export const createNodesAndEdges = async (req, res) => {
  const { ruleId, nodes, edges } = req.body;

  if (!ruleId || !nodes || !edges) {
    return res
      .status(400)
      .json({ message: "ruleId, nodes, and edges are required" });
  }

  try {
    // First, check if the rule exists
    const rule = await prisma.rule.findUnique({
      where: { id: ruleId },
    });

    if (!rule) {
      return res.status(404).json({ message: "Rule not found" });
    }
    // Process nodes
    const nodePromises = nodes.map((nodeData) => {
      const { id, data, type, measured, position } = nodeData;
      return prisma.node.upsert({
        where: { id },
        update: {
          type,
          positionX: position.x,
          positionY: position.y,
          width: measured.width,
          height: measured.height,
          data,
        },
        create: {
          id,
          type,
          positionX: position.x,
          positionY: position.y,
          width: measured.width,
          height: measured.height,
          data,
          ruleId,
        },
      });
    });

    const nodesResult = await Promise.all(nodePromises);

    // Update or create edges for this rule
    const edgePromises = edges.map(({ type, ...edgeData }) =>
      prisma.edge.upsert({
        where: { id: edgeData.id },
        update: {
          source: edgeData.source,
          target: edgeData.target,
          animated: true,
          label: edgeData.label,
        },
        create: {
          ...edgeData,
          ruleId: rule.id,
          animated: true,
        },
      })
    );

    const edgesResult = await Promise.all(edgePromises);

    return res.status(201).json({
      message: "Nodes and edges created/updated successfully",
      nodes: nodesResult,
      edges: edgesResult,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal server error", err: error });
  }
};

// GET route to fetch nodes and edges by ruleId
export const fetchNodesAndEdges = async (req, res) => {
  const { ruleId } = req.params;

  if (!ruleId) {
    return res.status(400).json({ message: "ruleId is required" });
  }

  try {
    // Fetch the rule to ensure it exists
    const rule = await prisma.rule.findUnique({
      where: { id: parseInt(ruleId) },
      include: {
        nodes: true,
        edges: true,
      },
    });

    if (!rule) {
      return res.status(404).json({ message: "Rule not found" });
    }

    // Return the nodes and edges associated with the rule
    const nodesAndEdges = {
      nodes: rule.nodes,
      edges: rule.edges,
    };

    return res.status(200).json(nodesAndEdges);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getNodesAndEdgesByRule = async (req, res) => {
  const { ruleId } = req.params;

  if (!ruleId) {
    return res.status(400).json({ message: "ruleId is required" });
  }

  try {
    // Fetch the rule with associated nodes and edges
    const rule = await prisma.rule.findUnique({
      where: { id: parseInt(ruleId, 10) },
      include: {
        nodes: true, // Include associated nodes
        edges: true, // Include associated edges
      },
    });

    if (!rule) {
      return res.status(404).json({ message: "Rule not found" });
    }

    // Return the nodes and edges
    return res.status(200).json({
      message: "Nodes and edges fetched successfully",
      nodes: rule.nodes,
      edges: rule.edges,
    });
  } catch (error) {
    console.error("Error fetching nodes and edges:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Save or update flow file
export const saveFlowFile = async (req, res) => {
  const { ruleId } = req.params;
  const { name, content } = req.body;

  if (!ruleId || !name || !content) {
    return res
      .status(400)
      .json({ error: "Rule ID, name, and content are required" });
  }

  console.log("Contents: ", content);
  try {
    // Upsert the flow file
    const flowFile = await prisma.flowFile.upsert({
      where: { ruleId },
      update: {
        name,
        content,
      },
      create: {
        ruleId,
        name,
        content,
      },
    });

    res
      .status(200)
      .json({ message: "Flow file saved or updated successfully", flowFile });
  } catch (error) {
    console.error("Error saving flow file:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get flow files by ruleId
export const getFlowFile = async (req, res) => {
  const { ruleId } = req.params;

  if (!ruleId) {
    return res.status(400).json({ error: "Rule ID is required" });
  }

  try {
    const flowFile = await prisma.flowFile.findUnique({
      where: { ruleId },
    });

    if (!flowFile) {
      return res.status(404).json({ error: "Flow file not found" });
    }

    res.status(200).json(flowFile);
  } catch (error) {
    console.error("Error fetching flow file:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// // Exposing Endpoint
// export const copyEndpoint = async (req, res) => {

//   const { id } = req.params;
//   const { ...choices } = req.body;  // Spread to allow dynamic keys for choices

//   console.log("Inside CopyEndpoint: ", id);
//   if (Object.keys(choices).length === 0) {
//     return res.status(400).json({ error: 'At least one choice is required.' });
//   }

//   try {
//     const rule = await prisma.flowFile.findUnique({ where: { ruleId: id } });

//     // Function to extract the flow JSON from the JavaScript content
//     const extractFlowJSON = (content) => {
//       try {
//         const cleanedContent = content.trim();
//         const match = cleanedContent.match(/export const flow = ({.*?});/s);

//         if (match && match[1]) {
//           const jsonString = match[1];
//           return JSON.parse(jsonString); // Return parsed JSON object
//         } else {
//           throw new Error("Flow JSON object not found.");
//         }
//       } catch (err) {
//         console.error("Error parsing flow content:", err);
//         return null;
//       }
//     };

//     const jsContent = extractFlowJSON(rule.content);
//     console.log("Rule is: ", rule.content);
//     console.log("js Content is: ", jsContent);

//     if (!rule) return res.status(404).json({ error: 'Rule Not Found' });

//     // Helper function to navigate through the flow based on the choices
//     const navigateFlow = (node, choices) => {
//       let currentNode = node;

//       // Iterate over all the choices provided in req.body
//       for (const [key, value] of Object.entries(choices)) {
//         const option = currentNode.options.find(opt => opt.label === value);
//         if (!option) {
//           throw new Error(`Option "${value}" not found in node: ${currentNode.question}`);
//         }
//         currentNode = option.next; // Move to the next node
//       }

//       return currentNode;
//     };

//     // Start from the first node and navigate based on the choices
//     let currentNode = jsContent;
//     try {
//       currentNode = navigateFlow(currentNode, choices); // Use the provided choices to navigate the flow
//     } catch (err) {
//       return res.status(400).json({ error: err.message });
//     }

//     // If the node type is OUTPUT_NODE, return the final output
//     if (currentNode.type === "OUTPUT_NODE") {
//       return res.status(200).json({ output: currentNode.question });
//     }

//     // If no output node is reached
//     return res.status(400).json({ error: 'No output node reached.' });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Error processing the rule' });
//   }
// };
export const copyEndpoint = async (req, res) => {
  console.log("inside the copy endpoint");
  // res.status(200).json({ message: "Rule processed successfully" });

  const { id } = req.params;
  const { ...choices } = req.body; // Spread to allow dynamic keys for choices

  // Store all question-answer pairs for potential use in EVENT_NODE
  const questionAnswerHistory = {};

  console.log("Inside CopyEndpoint: ", req.body);
  if (Object.keys(choices).length === 0) {
    return res.status(400).json({ error: "At least one choice is required." });
  }

  try {
    // Fetching the rule from database
    const rule = await prisma.flowFile.findUnique({ where: { ruleId: id } });

    if (!rule) return res.status(404).json({ error: "Rule Not Found" });

    // Function to extract the flow JSON from the JavaScript content
    const extractFlowJSON = (content) => {
      try {
        const cleanedContent = content.trim();
        const match = cleanedContent.match(/export const flow = ({.*?});/s);

        if (match && match[1]) {
          const jsonString = match[1];
          return JSON.parse(jsonString); // Return parsed JSON object
        } else {
          throw new Error("Flow JSON object not found.");
        }
      } catch (err) {
        console.error("Error parsing flow content:", err);
        return null;
      }
    };

    const flowJSON = extractFlowJSON(rule.content);

    if (!flowJSON) {
      return res.status(400).json({ error: "Invalid flow format" });
    }

    const streamToBuffer = async (stream) => {
      const chunks = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    };
    const bufferToStream = (buffer) => {
      const stream = new Readable();
      stream.push(buffer);
      stream.push(null); // Signal the end of the stream
      return stream;
    };
    const extractAwsSecrets = (secrets) => {
      const requiredKeys = ["region", "accessKeyId", "secretAccessKey"];
      return secrets.reduce((acc, secret) => {
        if (requiredKeys.includes(secret.key)) {
          acc[secret.key] = secret.value;
        }
        return acc;
      }, {});
    };

    const processTheDocWithTextract = async (
      file,
      awsTextractDetails,
      queryDetails
    ) => {
      console.log("inside process with textract: ", file);

      // const { region, accessKeyId, secretAccessKey } = data.data.awsTextractDetails;
      const { region, accessKeyId, secretAccessKey } = awsTextractDetails;

      const textractClient = new TextractClient({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });

      console.log("Textract Client initialized");

      console.log({
        type: typeof file,
        constructor: file?.constructor?.name,
        isBuffer: Buffer.isBuffer(file),
        isStream: file instanceof Readable,
        contentPreview: file?.slice?.(0, 20),
      });

      const fileBuffer = await streamToBuffer(file);

      const fileBytes = new Uint8Array(fileBuffer);

      // const queryDetails = data.queryDetails
      if (!queryDetails || queryDetails.length === 0) {
        throw new Error("Query details are missing.");
      }

      // Prepare query list for Textract
      const queries = queryDetails.split(",").map((query) => ({
        Text: query.trim(),
      }));

      console.log("Query is: ", queries);

      const params = {
        Document: {
          Bytes: fileBytes,
        },
        FeatureTypes: ["QUERIES"], // Only include 'QUERIES', remove other types
        QueriesConfig: {
          Queries: queries,
        },
      };

      try {
        const command = new AnalyzeDocumentCommand(params);
        console.log("Textract Command: ", command);

        const response = await textractClient.send(command);
        console.log("Textract Response: ", response);

        return response;
      } catch (error) {
        console.error("Textract Processing Error: ", error);
        throw new Error(`Textract processing failed: ${error.message}`);
      }
    };
    const processQueryResults = (textractResponse) => {
      console.log(
        "Textract Response: ",
        JSON.stringify(textractResponse, null, 2)
      );

      // Find the QUERY_RESULT block
      const queryResults = textractResponse.Blocks?.filter(
        (block) => block.BlockType === "QUERY_RESULT"
      );

      if (!queryResults || queryResults.length === 0) {
        console.log("No query results found for the provided queries.");
        return "No relevant outcome found"; // Handle case where no results are found
      }

      // Extract the Text value from the QUERY_RESULT block
      // const queryResultText = queryResults.map((block) => block.Text).join(", ") // In case there are multiple results
      const queryResultText = queryResults
        .map((block) => block.Text ?? "")
        .join(", ");

      console.log("Query Result Text: ", queryResultText);

      return queryResultText || "No relevant outcome found"; // Return the extracted text or default message if empty
    };

    // Helper function that calls AWS Textract using the provided credentials and file buffer
    const processTextract = async (
      awsTextractDetails,
      fileBuffer,
      queryDetails
    ) => {
      console.log("djhvcsd", queryDetails);
      const secrets = await prisma.secretKey.findMany({
        include: {
          user: true, // Include user details (optional)
        },
      });
      const awsCredentials = extractAwsSecrets(secrets);

      console.log("inside the process text", { awsCredentials, fileBuffer });
      // const { region, accessKeyId, secretAccessKey } = awsCredentials;
      const fileStream = bufferToStream(fileBuffer);
      const textractResponse = await processTheDocWithTextract(
        fileStream,
        awsCredentials,
        queryDetails
      );
      console.log("The textract Response is: ", textractResponse);
      // const textractResponse = await processTheDocWithTextract(fileStream, awsCredentials, queryDetails)
      const parsedOutcome = processQueryResults(textractResponse);
      console.log("Parsed Outcome: ", parsedOutcome);
      return parsedOutcome;
    };

    // // Helper function to process AWS Textract for UPLOAD_FILE nodes
    // const processTextract = async (node, uploadedFileBuffer) => {
    //   try {
    //     const { region, accessKeyId, secretAccessKey } = node.data.awsTextractDetails;
    //     const textractClient = new AWS.Textract({
    //       region,
    //       credentials: {
    //         accessKeyId,
    //         secretAccessKey
    //       }
    //     });

    //     // Process the file with Textract
    //     const params = {
    //       Document: {
    //         Bytes: uploadedFileBuffer
    //       }
    //     };

    //     // const queryDetails = node.data.queryDetails
    //     // if (!queryDetails || queryDetails.length === 0) {
    //     //   throw new Error("Query details are missing.")
    //     // }

    //     // // Prepare query list for Textract
    //     // const queries = queryDetails.split(",").map((query) => ({
    //     //   Text: query.trim(),
    //     // }))

    //     // console.log("Query is: ", queries)

    //     // const params = {
    //     //   Document: {
    //     //     Bytes: fileBytes,
    //     //   },
    //     //   FeatureTypes: ["QUERIES"], // Only include 'QUERIES', remove other types
    //     //   QueriesConfig: {
    //     //     Queries: queries,
    //     //   },
    //     // }

    //     const textractResponse = await textractClient.detectDocumentText(params).promise();

    //     // Extract text from the Textract response
    //     let extractedText = '';
    //     if (textractResponse.Blocks) {
    //       textractResponse.Blocks.forEach(block => {
    //         if (block.BlockType === 'LINE') {
    //           extractedText += block.Text + ' ';
    //         }
    //       });
    //     }

    //     // Store the question and answer in history
    //     questionAnswerHistory[node.data.queryDetails] = extractedText.trim();

    //     // Find matching option based on extracted text
    //     const matchingOption = node.options.find(opt =>
    //       extractedText.includes(opt.label) ||
    //       opt.label.includes(extractedText)
    //     );

    //     if (!matchingOption) {
    //       throw new Error(`No matching option found for extracted text: ${extractedText}`);
    //     }

    //     return matchingOption.next;
    //   } catch (err) {
    //     console.error("Error processing Textract:", err);
    //     throw new Error(`Textract processing failed: ${err.message}`);
    //   }
    // };

    // Helper function to process AI predictions
    const processPrediction = async (node, input) => {
      const datasetTitle = node.data.dataset;
      console.log("Input is: ", input);
      try {
        // Get the dataset file
        const datasetResponse = await prisma.dataset.findUnique({
          where: {
            title: datasetTitle,
          },
        });

        if (!datasetResponse) {
          return res.status(404).json({ error: "Dataset not found" });
        }

        // console.log("Inside AI Prediction", datasetResponse);
        const fileUrl = datasetResponse.fileUrl;
        // console.log(file);
        if (!fileUrl) {
          throw new Error("File URL not found for the dataset");
        }

        // Fetch the file
        const filePath = path.join(
          process.cwd(),
          "uploads",
          fileUrl.split("/").pop()
        );
        const fileBuffer = fs.readFileSync(filePath);
        const fileName = fileUrl.split("/").pop();

        // Prepare FormData for the request
        const formData = new FormData();
        // Prepare FormData
        formData.append("file", fileBuffer, {
          filename: fileName,
          contentType: "text/csv",
        });
        // formData.append("file", fileBuffer, fileUrl.split("/").pop());
        formData.append("dependent_variable", node.data.dependent);
        formData.append("target_variable", node.data.target);
        formData.append("forecast_periods", input); // Default to 5 periods or configure as needed

        // Make API call to forecast endpoint
        console.log("Form Data: ", formData.dependent_variable);
        const forecastResponse = await axios.post(
          `${process.env.PYTHON_HOST}`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        // Store the prediction results
        const forecastResult = forecastResponse.data.forecast;
        console.log("Forecast is:", forecastResult);
        // Return the prediction data for inclusion in the response
        return {
          type: "PREDICTION_RESULT",
          model: node.data.model,
          dataset: node.data.dataset,
          target: node.data.target,
          dependent: node.data.dependent,
          forecast: forecastResult,
        };
      } catch (err) {
        console.error("Error processing prediction:", err);
        throw new Error(`Prediction processing failed: ${err.message}`);
      }
    };

    // Main function to navigate through the flow based on the choices
    const navigateFlow = async (startNode, choices) => {
      let currentNode = startNode;
      let results = {};

      // Process each node based on its type
      while (currentNode) {
        console.log("Processing node type:", currentNode.type);

        // Store question in history
        if (currentNode.question) {
          questionAnswerHistory[currentNode.question] = null; // Will be filled based on node type
        }

        switch (currentNode.type) {
          case "DROP_DOWN":
            // Find the choice for this question
            const dropdownChoice = choices[currentNode.question];
            // console.log();
            // console.log("Drop Down Choice: ", dropdownChoice);
            if (!dropdownChoice) {
              throw new Error(
                `No choice provided for dropdown question: ${currentNode.question}`
              );
            }

            // Store the answer in history
            questionAnswerHistory[currentNode.question] = dropdownChoice;

            // Find the matching option
            const option = currentNode.options.find(
              (opt) => opt.label === dropdownChoice
            );
            if (!option) {
              throw new Error(
                `Option "${dropdownChoice}" not found in node: ${currentNode.question}`
              );
            }

            // Move to the next node
            currentNode = option.next;
            // console.log("Next is: ", currentNode);
            break;

          case "UPLOAD_FILE":
            console.log("inside the Upload File", currentNode.question);

            // Check if any files were uploaded
            if (req.files && req.files.length > 0) {
              // Find the PDF file whose fieldname matches the current node’s question and has a PDF mimetype
              const associatedFile = req.files.find(
                (file) =>
                  file.fieldname === currentNode.question &&
                  file.mimetype === "application/pdf"
              );

              if (associatedFile) {
                try {
                  console.log(
                    "PDF file found for question:",
                    currentNode.data.queryDetails
                  );

                  // Process the PDF file using AWS Textract and the secret keys from currentNode.data.awsTextractDetails
                  const extractedText = await processTextract(
                    currentNode.data.awsTextractDetails,
                    associatedFile.buffer,
                    currentNode.data.queryDetails
                  );
                  // Store the result in the questionAnswerHistory using the question as the key
                  questionAnswerHistory[currentNode.question] = extractedText;
                  console.log("the final outcome: ", extractedText);
                  // Find the matching option
                  const option = currentNode.options.find(
                    (opt) => opt.label === extractedText
                  );
                  console.log("Next Node Options: ", currentNode.options);

                  if (!option) {
                    throw new Error(
                      `Option "${extractedText}" not found in node: ${currentNode.question}`
                    );
                  }

                  // Move to the next node
                  currentNode = option.next;
                  // const AWSquery = currentNode.question;
                  // results.AWSqueryOutputs = currentNode.question
                  console.log("Next Node is: ", currentNode);
                  break;
                } catch (error) {
                  console.error(
                    `Error processing PDF for question ${currentNode.question}:`,
                    error
                  );
                  questionAnswerHistory[currentNode.question] =
                    `Error: ${error.message}`;
                }
              } else {
                console.log(
                  `No PDF file uploaded for question ${currentNode.question}`
                );
              }
            }

            // currentNode = await processTextract(currentNode, fileBuffer);

            // For now, move to the next node based on the provided choice
            // currentNode = uploadOption.next;
            break;

          case "EVENT_NODE":
            if (results.eventNodeResult) {
              console.log("Skipping redundant API call for event node.");
              break;
            }
            // Process the EVENT_NODE using Groq AI with the question-answer history
            try {
              console.log("inside the event node: ", currentNode);
              console.log("History is: ", questionAnswerHistory);

              const generateComplianceResponses =
                await generateComplianceResponse(questionAnswerHistory);
              results.eventNodeResult = generateComplianceResponses; // Placeholder
              results.history = questionAnswerHistory; // Placeholder

              return results;
              // break;

              // currentNode = await processEventNode(currentNode);
            } catch (error) {
              return { error: error.message };
            }
            break;

          case "Prediction Card":
            // Process the prediction card
            try {
              console.log("The question is: ", currentNode.data.title);
              results.predictionResult = await processPrediction(
                currentNode,
                choices[currentNode.data.title]
              );

              // Prediction cards don't have next nodes in your structure
              currentNode = null;
            } catch (error) {
              return { error: error.message };
            }
            break;

          case "Code Expression Card":
            // Use the existing executeCode controller
            try {
              // Get user input if provided
              console.log("Current Node is:", currentNode);
              console.log(choices["codeInput"]);
              const userInput = choices["codeInput"] || "";

              // Create a mock request and response objects to use with executeCode
              const mockReq = {
                body: {
                  code: currentNode.data.code,
                  input: userInput,
                },
              };

              let codeResult = null;
              const mockRes = {
                status: (statusCode) => {
                  return {
                    json: (data) => {
                      codeResult = { statusCode, ...data };
                      return mockRes;
                    },
                  };
                },
              };

              // Call the existing executeCode function
              await executeCode(mockReq, mockRes);

              // Store the result
              results.codeResult = codeResult;

              // Code cards don't have next nodes in your structure
              currentNode = null;
            } catch (error) {
              return { error: error.message };
            }
            break;

          case "OUTPUT_NODE":
            // We've reached the end of the flow
            results.output = currentNode.data?.label || "Flow completed";
            results.history = questionAnswerHistory;
            return results;

          default:
            throw new Error(`Unsupported node type: ${currentNode.type}`);
        }
      }

      // If we exit the loop without reaching an OUTPUT_NODE
      return {
        message: "Flow processing completed, but no output node was reached.",
        results,
        history: questionAnswerHistory,
      };
    };

    // Start the flow navigation from the root node
    const results = await navigateFlow(flowJSON, choices);

    // Return the results
    return res.status(200).json(results);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Error processing the rule: " + err.message });
  }
};

export const executeCode = (req, res) => {
  const { code, input } = req.body;

  console.log("Req. body is: ", req.body);

  if (!code || typeof code !== "string") {
    return res.status(400).json({ message: "Invalid or missing code." });
  }

  try {
    // Create a sandbox environment to isolate the code execution
    const sandbox = {
      userInput: input,
      output: null,
      console: {
        log: (...args) => {
          sandbox.output = args.join(" "); // Capture console.log output
        },
      },
    };

    // Create a script for running the user-provided code
    const script = new vm.Script(`
         ${code} 
    `);

    // Define options for the sandbox and script execution
    const options = {
      timeout: 5000, // Timeout after 5 seconds
      memoryLimit: 50 * 1024 * 1024, // Limit memory usage to 50MB
    };

    // Set up a context for the execution with strict sandboxing
    const context = new vm.createContext(sandbox);

    // Run the script in the sandboxed context with timeout handling
    const timeout = setTimeout(() => {
      throw new Error("Execution timed out");
    }, options.timeout);

    script.runInContext(context);

    clearTimeout(timeout); // Clear timeout after successful execution

    // Return the output of the executed code
    return res.status(200).json({ output: sandbox.output });
  } catch (error) {
    console.error("Code execution error:", error.message);
    return res
      .status(500)
      .json({ message: "Error executing code.", details: error.message });
  }
};

export const createUpdateSecretKeys = async (req, res) => {
  const { userId, key, value, type } = req.body;

  if (!userId || !key || !value || !type) {
    return res
      .status(400)
      .json({ error: "User ID, key, value, and type are required" });
  }

  try {
    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if a secret key with the same key and type exists for this user
    const existingSecretKey = await prisma.secretKey.findFirst({
      where: { userId, key, type },
    });

    if (existingSecretKey) {
      // Update the existing secret key
      const updatedSecretKey = await prisma.secretKey.update({
        where: { id: existingSecretKey.id },
        data: { value },
      });

      return res
        .status(200)
        .json({ message: "Secret key updated successfully", updatedSecretKey });
    }

    // Create a new secret key for the user
    const newSecretKey = await prisma.secretKey.create({
      data: { userId, key, value, type },
    });

    return res
      .status(201)
      .json({ message: "Secret key created successfully", newSecretKey });
  } catch (error) {
    console.error("Error storing secret key:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Route to fetch secret keys for a user
export const getSecretKeysWithUserId = async (req, res) => {
  const { userId } = req.params;

  try {
    const secretKeys = await prisma.secretKey.findMany({
      where: { userId: parseInt(userId) },
    });

    if (secretKeys.length === 0) {
      return res
        .status(404)
        .json({ error: "No secret keys found for this user" });
    }

    return res.status(200).json({ secretKeys });
  } catch (error) {
    console.error("Error fetching secret keys:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Get secrets by type for a specific user
export const getSecretsByType = async (req, res) => {
  const { userId } = req.params;
  const { type } = req.query;
  console.log("Type is: ", type);
  if (!userId || !type) {
    return res.status(400).json({ error: "User ID and type are required" });
  }

  try {
    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get all secrets for the user with the specified type
    const secrets = await prisma.secretKey.findMany({
      where: {
        userId: parseInt(userId),
        type: type,
      },
    });

    return res.status(200).json({ secretKeys: secrets });
  } catch (error) {
    console.error("Error retrieving secrets:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getAllSecrets = async (req, res) => {
  try {
    // console.log("inside get all secrets");
    const secrets = await prisma.secretKey.findMany({
      include: {
        user: true, // Include user details (optional)
      },
    });
    // console.log(secrets);

    res.status(200).json({ success: true, secrets });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

export const updateSecretKeys = async (req, res) => {
  const { id } = req.params;
  const { key, value } = req.body;

  if (!key || !value) {
    return res.status(400).json({ error: "Key and value are required" });
  }

  try {
    // Check if the secret key exists
    const secretKey = await prisma.secretKey.findUnique({
      where: { id: parseInt(id) },
    });

    if (!secretKey) {
      return res.status(404).json({ error: "Secret key not found" });
    }

    // Update the secret key
    const updatedSecretKey = await prisma.secretKey.update({
      where: { id: parseInt(id) },
      data: { key, value },
    });

    return res
      .status(200)
      .json({ message: "Secret key updated successfully", updatedSecretKey });
  } catch (error) {
    console.error("Error updating secret key:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteSecretKeys = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if the secret key exists
    const secretKey = await prisma.secretKey.findUnique({
      where: { id: parseInt(id) },
    });

    if (!secretKey) {
      return res.status(404).json({ error: "Secret key not found" });
    }

    // Delete the secret key
    await prisma.secretKey.delete({
      where: { id: parseInt(id) },
    });

    return res.status(200).json({ message: "Secret key deleted successfully" });
  } catch (error) {
    console.error("Error deleting secret key:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// DATASET CONTROLLERS

// Upload a new dataset
export const uploadDataset = async (req, res) => {
  const { title } = req.body;
  const file = req.file;

  if (!title || (!file && !req.body.fileUrl)) {
    return res
      .status(400)
      .json({ error: "Title and file or file URL are required" });
  }

  try {
    // Check for duplicate title
    const existingDataset = await prisma.dataset.findUnique({
      where: { title },
    });
    if (existingDataset) {
      return res
        .status(400)
        .json({ error: "Dataset with this title already exists." });
    }

    const fileUrl = file
      ? path.join("uploads", file.filename)
      : req.body.fileUrl;

    // Save dataset in the database
    const dataset = await prisma.dataset.create({
      data: { title, fileUrl },
    });

    return res
      .status(201)
      .json({ message: "Dataset uploaded successfully", dataset });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to upload dataset" });
  }
};

// Get all datasets
export const getDatasets = async (req, res) => {
  try {
    const datasets = await prisma.dataset.findMany({
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json(datasets);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch datasets" });
  }
};

// Delete a dataset
export const deleteDataset = async (req, res) => {
  const { id } = req.params;

  try {
    const dataset = await prisma.dataset.findUnique({
      where: { id: parseInt(id) },
    });

    if (!dataset) {
      return res.status(404).json({ error: "Dataset not found" });
    }

    // Delete the dataset file from the server (if applicable)
    if (fs.existsSync(dataset.fileUrl)) {
      fs.unlinkSync(dataset.fileUrl);
    }

    // Delete from the database
    await prisma.dataset.delete({ where: { id: parseInt(id) } });

    return res.status(200).json({ message: "Dataset deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to delete dataset" });
  }
};

// Update or re-upload a dataset
export const updateDataset = async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;
  const file = req.file;

  try {
    const dataset = await prisma.dataset.findUnique({
      where: { id: parseInt(id) },
    });

    if (!dataset) {
      return res.status(404).json({ error: "Dataset not found" });
    }

    const updatedData = { title };

    if (file) {
      // Delete the old file if it exists
      if (fs.existsSync(dataset.fileUrl)) {
        fs.unlinkSync(dataset.fileUrl);
      }

      // Update the file URL
      updatedData.fileUrl = path.join("uploads", file.filename);
    }

    const updatedDataset = await prisma.dataset.update({
      where: { id: parseInt(id) },
      data: updatedData,
    });

    return res
      .status(200)
      .json({ message: "Dataset updated successfully", updatedDataset });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to update dataset" });
  }
};

// Retrieve a dataset by title
export const getDatasetByTitle = async (req, res) => {
  const { title } = req.params;

  try {
    const dataset = await prisma.dataset.findUnique({
      where: {
        title,
      },
    });

    if (!dataset) {
      return res.status(404).json({ error: "Dataset not found" });
    }

    res.status(200).json(dataset);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to retrieve dataset" });
  }
};

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY, // Store your API key in environment variables
});

export const getGrokResponse = async (req, res) => {
  try {
    const { generateDetails } = req.body;

    // const userPrompt = `
    //   Given the following structured data:

    //   ${JSON.stringify(generateDetails, null, 2)}

    //   Analyze the provided details and determine the necessary regulatory compliance steps.

    //   Return the following structured response like:

    //   // Static data for Trigger, Validation, and Actions

    //   const trigger = [{ label: "TRIGGER_1", type: "trigger" }];
    //   const validation = [
    //       { label: "VALIDATION_1", type: "validation" },
    //       { label: "VALIDATION_2", type: "validation" },
    //   ];
    //   const actions = [
    //       { label: "ACTIONS_1", type: "action" },
    //       { label: "ACTIONS_2", type: "action" },
    //       { label: "ACTIONS_3", type: "action" },
    //       { label: "ACTIONS_4", type: "action" },
    //   ];

    //   Ensure the response is **only** in JavaScript code format.
    // `;
    // const userPrompt = `You are an advanced regulatory and compliance analysis engine. Your task is to analyze the provided structured data, which consists of **questions and answers** describing a real-world scenario.

    // ${JSON.stringify(generateDetails, null, 2)}

    // **Instructions:**
    // 1. **Identify the domain** in which the question is asked.
    // 2. **Determine the key compliance aspects** that need attention based on the context.
    // 3. **Analyze and derive a structured response** that includes:
    //    - **Triggers**: Conditions or events that initiate regulatory actions.
    //    - **Validations**: Key checks and compliance verifications required.
    //    - **Actions**: The necessary steps to ensure compliance.
    // 4. **Ensure the response is strictly in JavaScript code format** and follows the structure below:

    // javascript:
    // const trigger = [{ label: "TRIGGER_1", type: "trigger" }];
    // const validation = [
    //   { label: "VALIDATION_1", type: "validation" },
    //   { label: "VALIDATION_2", type: "validation" },
    // ];
    // const actions = [
    //   { label: "ACTIONS_1", type: "action" },
    //   { label: "ACTIONS_2", type: "action" },
    //   { label: "ACTIONS_3", type: "action" },
    //   { label: "ACTIONS_4", type: "action" },
    // ];
    // `

    const userPrompt = `You are an advanced regulatory and compliance rule engine. Your task is to analyze the provided structured data, which includes both *workflow components* and *user responses*, and generate a structured compliance flow.  
 
      Input Format:  
      You will receive a JSON object with the following structure:  
      
      \\\`json
      {
      "components": [
        { "id": 1, "label": "User Submission", "type": "trigger", "conditions": ["Form Submitted"] },
        { "id": 2, "label": "Data Validation", "type": "validation", "checks": ["Required Fields", "Format Validation"] },
        { "id": 3, "label": "Approval Process", "type": "action", "steps": ["Manager Approval", "Compliance Review"] }
      ],
      "responses": {
        "What is the Device?": "Medical Device",
        "Which Regulation are you looking for?": ["EU", "GS1"],
        "What attributes are being modified?": "Trade Name",
        "What type of change are you making to the Brand name ?": "Updating the existing name",
        "Upload Specification File": "Jackson Memorial Hospital"
      },
      "possibleOptions": {
        "What is the Device?": ["Medical Device", "Pharmaceutical", "Health Supplement", "Others"],
        "Which Regulation are you looking for?": ["EU", "GS1", "FDA", "Others"],
        "What attributes are being modified?": ["Trade Name", "Packaging Dimensions", "Critical Warnings", "Others(Custom)"],
        "What type of change are you making to the Brand name ?": ["Updating the existing name", "Adding a new brand name", "Removing an existing name"],
        "Upload Specification File": "Jackson Memorial Hospital"
      }
      }
      \\\`
      
      Instructions:  
      1. *Identify the domain* based on the "responses" section (e.g., "Medical Device").  
      2. *Determine relevant compliance aspects* using the "components" section and the selected "regulations" in responses.  
      3. *Generate a structured compliance flow* that includes:  
        - *Triggers*: Events that initiate regulatory actions.  
        - *Validations*: Compliance checks required based on inputs.  
        - *Actions*: Necessary steps to ensure compliance.  
      
      Output Format:  
      Your response **must be a valid JSON object**, strictly following this structure:      
      \\\`javascript
      {
        "triggers": [{ "label": "User Submission", "type": "trigger" }],
        "validations": [{ "label": "Data Validation", "type": "validation" }],
        "actions": [{ "label": "Approval Process", "type": "action" }]
      }
      \\\`
      
      **Important:** Return only the JSON object and nothing else. No explanations, headers, or additional text.`;

    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
    });
    // console.log("Response is: ", response);
    const rawText = response.choices[0]?.message?.content || "{}";
    console.log("Raw Text: ", rawText);
    // Use regex to extract the JSON part from the response
    const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/);
    const extractedJson = jsonMatch ? jsonMatch[1].trim() : rawText.trim();

    console.log("\n\nExtracted JSON:\n", extractedJson);

    let extractedData = {};
    try {
      extractedData = JSON.parse(extractedJson);
    } catch (error) {
      console.error("Error parsing JSON response:", error);
    }

    // Ensure extracted data contains expected fields
    const finalData = {
      triggers: extractedData.triggers || [],
      validations: extractedData.validations || [],
      actions: extractedData.actions || [],
    };
    console.log("\n\nFinal Extracted Data:\n", finalData);

    res.status(200).json(finalData);
  } catch (error) {
    console.error("Error fetching response from Groq API:", error);
    res.status(500).json({ error: "Failed to generate response" });
  }
};

// Employee Appraisal Calculation APIs
export const insertValuesForEmployee = async (req, res) => {
  const {
    name,
    email,
    department,
    job_role,
    self_score,
    manager_score,
    goal_score,
    employeeSalary,
  } = req.body;

  try {
    const newEmployee = await prisma.employeeAppraisal.create({
      data: {
        name,
        email,
        department,
        job_role,
        self_score,
        manager_score,
        goal_score,
        employeeSalary,
      },
    });
    res.json(newEmployee);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error inserting employee", details: error.message });
  }
};
export const fetchTableSchema = async (req, res) => {
  const { host, port, username, password, database, tableName } = req.body;

  if (!host || !port || !username || !password || !database || !tableName) {
    return res
      .status(400)
      .json({ error: "Missing required fields in request body" });
  }

  const pool = new Pool({
    user: username,
    host: host,
    database: database,
    password: password,
    port: port,
    ssl: { rejectUnauthorized: false },
  });

  const client = await pool.connect();
  try {
    // Query to get column names and their data types from information_schema
    const result = await client.query(
      `
      SELECT 
        column_name, 
        data_type,
        character_maximum_length,
        is_nullable,
        column_default
      FROM 
        information_schema.columns 
      WHERE 
        table_name = $1
      ORDER BY 
        ordinal_position
    `,
      [tableName]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Table not found or has no columns" });
    }

    // Format the response to include more detailed type information
    const columns = result.rows.map((row) => ({
      name: row.column_name,
      type: row.data_type,
      maxLength: row.character_maximum_length,
      nullable: row.is_nullable === "YES",
      defaultValue: row.column_default,
    }));

    res.json({
      table: tableName,
      columns: columns,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error fetching table schema",
      details: error.message,
    });
  } finally {
    client.release();
  }
};

export const fetchColumnsFromTable = async (req, res) => {
  const { host, port, username, password, database, tableName, columns } =
    req.body;
  console.log(req.body);

  // Validate required parameters
  if (
    !host ||
    !port ||
    !username ||
    !password ||
    !database ||
    !tableName ||
    !columns ||
    !Array.isArray(columns)
  ) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields or invalid columns array",
    });
  }

  // Validate at least one column is specified
  if (columns.length === 0) {
    return res.status(400).json({
      success: false,
      error: "At least one column must be specified",
    });
  }

  const pool = new Pool({
    user: username,
    host: host,
    database: database,
    password: password,
    port: port,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const client = await pool.connect();

    try {
      // Safely construct column list (escape identifiers to prevent SQL injection)
      const columnList = columns.map((col) => `"${col}"`).join(", ");

      // Execute query with LIMIT for safety (adjust as needed)
      const query = `SELECT ${columnList} FROM "${tableName}" LIMIT 1000`;
      const result = await client.query(query);

      // Return structured response
      res.json({
        success: true,
        data: {
          columns: columns, // Return the requested column names
          rows: result.rows, // Array of objects with column:value pairs
          count: result.rowCount,
          sample: result.rows.slice(0, 5), // First 5 rows for preview
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({
      success: false,
      error: "Database operation failed",
      details: error.message,
      suggestion: "Verify table and column names exist",
    });
  } finally {
    await pool.end();
  }
};
// export const fetchColumnsFromTable = async (req, res) => {
//   const { host, port, username, password, database, tableName, columns } =
//     req.body;
//   console.log("Req: ", req.body);
//   if (
//     !host ||
//     !port ||
//     !username ||
//     !password ||
//     !database ||
//     !tableName ||
//     !columns
//   ) {
//     return res
//       .status(400)
//       .json({ error: "Missing required fields in request body" });
//   }
//   const pool = new Pool({
//     user: username,
//     host: host,
//     database: database,
//     password: password,
//     port: port,
//     ssl: { rejectUnauthorized: false }, // ✅ Always use SSL
//   });
//   console.log("Connnection");
//   const client = await pool.connect(); // ✅ Get a client
//   try {
//     const result = await client.query(
//       `SELECT "${columns[0]}" FROM "${tableName}"`
//     );
//     console.log("Result is: ", result);
//     res.json(result.rows);
//   } catch (error) {
//     res.status(500).json({
//       error: "Error fetching column values",
//       details: error.message,
//     });
//   } finally {
//     client.release();
//   }
// };

// ✅ Add a new column to a table
export const addColumnsToTable = async (req, res) => {
  const {
    host,
    port,
    username,
    password,
    database,
    tableName,
    columnName,
    columnType,
    defaultValue,
  } = req.body;

  if (
    !host ||
    !port ||
    !username ||
    !password ||
    !database ||
    !tableName ||
    !columnName ||
    !columnType
  ) {
    return res
      .status(400)
      .json({ error: "Missing required fields in request body" });
  }

  const pool = new Pool({
    user: username,
    host: host,
    database: database,
    password: password,
    port: port,
    ssl: { rejectUnauthorized: false }, // ✅ Always use SSL
  });

  const client = await pool.connect(); // ✅ Get a client

  try {
    const query = `ALTER TABLE "${tableName}" ADD COLUMN "${columnName}" ${columnType} ${defaultValue ? `DEFAULT '${defaultValue}'` : ""}`;
    await client.query(query);

    res.json({
      message: `Column '${columnName}' added successfully to '${tableName}'.`,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error adding column", details: error.message });
  } finally {
    client.release();
    // pool.end().catch(console.error); // Close connection pool
  }
};

export const sendAppraisalEmails = async (req, res) => {
  try {
    console.log("Req Body:", req.body);
    const { recipientEmail, emailSubject, emailBody, variables } = req.body;

    if (!recipientEmail || !emailSubject || !emailBody || !variables) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: recipie, subject, template, or variables",
      });
    }
    const results = await sendSingleEmailNotification(req.body);
    // const results = await sendSingleEmailNotification(
    //   recipientEmail,
    //   emailSubject,
    //   emailBody,
    //   variables
    // );

    res.status(200).json({
      success: true,
      message: `Successfully sent ${results.length} emails`,
      results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to send appraisal emails",
      error: error.message,
    });
  }
};

/**
 * Send single email
 */
export const sendSingleEmail = async (req, res) => {
  try {
    const result = await sendSingleEmailNotification(req.body);

    res.status(200).json({
      success: true,
      message: "Email sent successfully",
      result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to send email",
      error: error.message,
    });
  }
};
