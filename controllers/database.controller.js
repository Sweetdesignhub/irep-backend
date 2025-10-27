
import pkg from "pg";
const { Pool } = pkg;

async function fetchDatabaseDetails(pool) {
  console.log("Inside the fetch Database Details", pool);

  try {
    const client = await pool.connect();
    // Get list of tables
    const tablesRes = await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
      `);

    const tables = tablesRes.rows.map((row) => row.table_name);
    const columns = {};

    // Get columns for each table
    for (const table of tables) {
      const columnsRes = await client.query(
        `
          SELECT column_name, is_nullable, data_type
          FROM information_schema.columns
          WHERE table_name = $1
        `,
        [table]
      );

      columns[table] = columnsRes.rows.map((row) => ({
        column_name: row.column_name,
        is_nullable: row.is_nullable === "YES",
        data_type: row.data_type,
      }));
    }

    client.release();
    return { tables, columns };
  } catch (error) {
    console.error("Error fetching database details:", error);
    throw new Error("Failed to fetch database details");
 // } finally {
 //   pool.end();
  }
}
// async function fetchDatabaseDetails(pool) {
//   console.log("Inside fetchDatabaseDetails", pool);
//   try {
//     const client = await pool.connect();

//     const tablesRes = await client.query(`
//         SELECT table_name
//         FROM information_schema.tables
//         WHERE table_schema = 'public'
//     `);

//     const tables = tablesRes.rows.map((row) => row.table_name);
//     const columns = {};

//     for (const table of tables) {
//       const columnsRes = await client.query(
//         `
//           SELECT column_name, is_nullable, data_type
//           FROM information_schema.columns
//           WHERE table_name = $1
//         `,
//         [table]
//       );

//       columns[table] = columnsRes.rows.map((row) => ({
//         column_name: row.column_name,
//         is_nullable: row.is_nullable === "YES",
//         data_type: row.data_type,
//       }));
//     }

//     client.release(); // Release client, but don't close pool
//     return { tables, columns };
//   } catch (error) {
//     console.error("Error fetching database details:", error);
//     throw new Error("Failed to fetch database details");
//   }
// }

// Function to fetch table data
async function getTableData(req, res) {
  const { dbConfig, table, columns, conditions, limit } = req.body;

  const { username, host, database, password, port } = dbConfig;

  // const poolConfig = {
  //   user: username,
  //   host,
  //   database,
  //   password,
  //   port,
  // };

  // // For production, enable SSL
  // if (process.env.NODE_ENV === "production") {
  //   poolConfig.ssl = {
  //     rejectUnauthorized: false, // Use this in non-production environments
  //   };
  // }

  // const pool = new Pool(poolConfig);

  const pool = new Pool({
    user: username,
    host: host,
    database: database,
    password: password,
    port: port,
    ssl: { rejectUnauthorized: false }, // Fix SSL issue
  });

  try {
    // Prepare columns
    const cols = columns && columns.length ? columns.join(", ") : "*";

    // Start building the query
    let query = `SELECT ${cols} FROM ${table}`;

    // Map condition types to SQL operators
    const conditionTypeMapping = {
      equals: "=",
      notEquals: "!=",
      greaterThan: ">",
      lessThan: "<",
      like: "LIKE",
      // Add more mappings as necessary
    };

    // Add conditions to the query if provided
    if (conditions && conditions.length > 0) {
      const conditionStrings = conditions
        .map((condition) => {
          // Validate and map condition type to SQL operator
          if (
            condition.conditionColumn &&
            condition.conditionType &&
            condition.conditionValue
          ) {
            const operator = conditionTypeMapping[condition.conditionType];
            if (operator) {
              // Prepare value based on whether it's numeric or string
              const isNumeric = (value) => !isNaN(value) && value.trim() !== "";
              const value = isNumeric(condition.conditionValue)
                ? condition.conditionValue // For numbers, no quotes
                : `'${condition.conditionValue}'`; // For strings, wrap in quotes

              return `${condition.conditionColumn} ${operator} ${value}`;
            }
          }
          return null; // Invalid condition
        })
        .filter(Boolean); // Filter out any invalid conditions (those that return null)

      if (conditionStrings.length > 0) {
        query += " WHERE " + conditionStrings.join(" AND ");
      }
    }

    // Add limit to the query if provided and valid
    if (limit && !isNaN(limit) && parseInt(limit) > 0) {
      query += ` LIMIT ${parseInt(limit)}`;
    }

    console.log("Query to execute:", query);

    // Execute the query using parameterized queries
    const result = await pool.query(query);

    // Send the results as a response
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error retrieving data:", error);
    // Sending a more informative error message with a status code
    res
      .status(500)
      .json({ error: "Internal Server Error", message: error.message });
  } finally {
    await pool.end(); // Ensure connections are closed
  }
}

async function getDatabaseDetails(req, res) {
  const { host, port, database, username, password } = req.body;

  const pool = new Pool({
    user: username,
    host: host,
    database: database,
    password: password,
    port: port,
    ssl: { rejectUnauthorized: false }, // ✅ Always use SSL
  });

  try {
    const details = await fetchDatabaseDetails(pool);
    res.status(200).json(details);
  } catch (error) {
    res.status(500).json({ message: error.message });
  } finally {
    pool.end().catch(console.error); // Close pool safely
  }
}

// // Function to get database details
// async function getDatabaseDetails(req, res) {
//   const { host, port, database, username, password } = req.body;

//   //   console.log("--> ",req.body);
//   const poolConfig = {
//     user: username,
//     host: host,
//     database: database,
//     password: password,
//     port: port,
//     ssl: {
//       rejectUnauthorized: false, // For development, set to true for production
//     },
//   };

//   // For production, enable SSL
//   if (process.env.NODE_ENV === "production") {
//     poolConfig.ssl = {
//       rejectUnauthorized: false, // Use this in non-production environments
//     };
//   }
//   const pool = new Pool(poolConfig);

//   try {
//     const details = await fetchDatabaseDetails(pool);
//     res.status(200).json(details);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// }

// Function to insert data into a table
// async function insertTableData(req, res) {
//   const { dbConfig, table, columnData } = req.body;
//   const { username, host, database, password, port } = dbConfig;

//   //   console.log("--> ",req.body);
//   const poolConfig = {
//     user: username,
//     host,
//     database,
//     password,
//     port,
//   };

//   // For production, enable SSL
//   if (process.env.NODE_ENV === "production") {
//     poolConfig.ssl = {
//       rejectUnauthorized: false, // Use this in non-production environments
//     };
//   }
//   const pool = new Pool(poolConfig);

//   try {
//     const cols = Object.keys(columnData).join(", ");
//     const values = Object.values(columnData);
//     const query = `INSERT INTO ${table} (${cols}) VALUES (${values
//       .map((_, i) => `$${i + 1}`)
//       .join(", ")}) RETURNING *;`;
//     const result = await pool.query(query, values);
//     res.status(201).json(result.rows[0]);
//   } catch (error) {
//     console.error("Error inserting data:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   } finally {
//     await pool.end();
//   }
// }

// Function to handle JOIN queries
async function joinTableData(req, res) {
  const { dbConfig, data } = req.body;
  const { joinType, primaryTable, tables, primaryColumn, columns } = data;
  const { username, host, database, password, port } = dbConfig;

  //   console.log("--> ",req.body);
  const poolConfig = {
    user: username,
    host,
    database,
    password,
    port,
  };

  // For production, enable SSL
  if (process.env.NODE_ENV === "production") {
    poolConfig.ssl = {
      rejectUnauthorized: false, // Use this in non-production environments
    };
  }
  const pool = new Pool(poolConfig);

  try {
    const secondaryTable = tables.find((table) => table !== primaryTable);
    const table1Cols =
      columns[primaryTable].map((col) => `t1.${col}`).join(", ") || "*";
    const table2Cols =
      columns[secondaryTable].map((col) => `t2.${col}`).join(", ") || "*";

    const query = `
      SELECT ${table1Cols}, ${table2Cols}
      FROM ${primaryTable} AS t1
      ${joinType.toUpperCase()} JOIN ${secondaryTable} AS t2
      ON t1.${primaryColumn[primaryTable]} = t2.${
        primaryColumn[secondaryTable]
      };
    `;

    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error executing join query:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await pool.end();
  }
}

async function queryData(req, res) {
  const { dbConfig, query } = req.body;

  const queryType = query.trim().split(/\s+/)[0].toUpperCase();
  const isDML = ["select", "insert", "update", "delete", "merge"].includes(
    queryType.toLowerCase()
  );

  if (!isDML) {
    return res.status(400).json({ error: "Query is not a DML operation." });
  }

  const poolConfig = {
    user: dbConfig.username,
    host: dbConfig.host,
    database: dbConfig.database,
    password: dbConfig.password,
    port: dbConfig.port,
  };

  if (process.env.NODE_ENV === "production") {
    poolConfig.ssl = { rejectUnauthorized: false };
  }

  const pool = new Pool(poolConfig);

  try {
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error executing query:", error.code);
    res.status(500).json({
      error:
        error?.code === "42P01"
          ? error.message || "Table not found"
          : "Failed to execute query",
    });
  } finally {
    await pool.end();
  }
}

async function updateTableData(req, res) {
  const { dbConfig, table, columnsToUpdate, conditions } = req.body;

  const { username, host, database, password, port } = dbConfig;

  const poolConfig = {
    user: username,
    host,
    database,
    password,
    port,
  };

  if (process.env.NODE_ENV === "production") {
    poolConfig.ssl = {
      rejectUnauthorized: false,
    };
  }

  const pool = new Pool(poolConfig);

  try {
    // Condition type mapping
    const conditionMapping = {
      equals: "=",
      notEquals: "!=",
      greaterThan: ">",
      lessThan: "<",
      greaterThanOrEquals: ">=",
      lessThanOrEquals: "<=",
      in: "IN",
      notIn: "NOT IN",
      like: "LIKE",
      caseInsensitiveLike: "ILIKE",
      similarTo: "SIMILAR TO",
      contains: "@>",
      isContainedBy: "<@",
      overlaps: "&&",
    };

    // Validate table name (use a whitelist in production)
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) {
      return res.status(400).json({ error: "Invalid table name." });
    }

    // Build SET clause dynamically
    const setClauses = [];
    const values = [];

    columnsToUpdate.forEach((columnObj, index) => {
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(columnObj.column)) {
        throw new Error("Invalid column name.");
      }
      setClauses.push(`${columnObj.column} = $${index + 1}`);
      values.push(columnObj.newValue);
    });

    const setClause = setClauses.join(", ");

    // Build WHERE clause dynamically
    const whereClauses = [];
    conditions.forEach((condition, index) => {
      const { conditionColumn, conditionType, conditionValue } = condition;

      if (!conditionMapping[conditionType]) {
        throw new Error("Invalid condition type.");
      }

      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(conditionColumn)) {
        throw new Error("Invalid condition column name.");
      }

      if (conditionType === "in" || conditionType === "notIn") {
        if (!Array.isArray(conditionValue)) {
          throw new Error("conditionValue must be an array for IN/NOT IN.");
        }

        const placeholders = conditionValue
          .map((_, i) => `$${values.length + i + 1}`)
          .join(", ");

        whereClauses.push(
          `${conditionColumn} ${conditionMapping[conditionType]} (${placeholders})`
        );
        values.push(...conditionValue);
      } else {
        whereClauses.push(
          `${conditionColumn} ${conditionMapping[conditionType]} $${values.length + 1}`
        );
        values.push(conditionValue);
      }
    });

    const whereClause = whereClauses.join(" AND ");

    // Final query
    const query = `UPDATE ${table} SET ${setClause} WHERE ${whereClause} RETURNING *;`;

    const result = await pool.query(query, values);

    res.status(200).json({
      message: "Data updated successfully",
      updatedRows: result.rows,
    });
  } catch (error) {
    console.error("Error updating data:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  } finally {
    pool.end();
  }
}

// Function to delete data from the specified table based on a condition
async function deleteTableData(req, res) {
  const { dbConfig, table, conditionColumn, conditionValue } = req.body;

  const { username, host, database, password, port } = dbConfig;

  // Configuring the PostgreSQL pool
  const poolConfig = {
    user: username,
    host,
    database,
    password,
    port,
  };

  // For production, enable SSL
  if (process.env.NODE_ENV === "production") {
    poolConfig.ssl = {
      rejectUnauthorized: false, // Use this only in production with trusted servers
    };
  }

  const pool = new Pool(poolConfig);

  try {
    if (!table || !conditionColumn || !conditionValue) {
      return res.status(400).json({
        error:
          "Table name, condition column, and condition value are required.",
      });
    }

    // Constructing the WHERE clause for the delete query
    const whereClause = `${conditionColumn} = $1`;

    // SQL DELETE query
    const query = `DELETE FROM ${table} WHERE ${whereClause} RETURNING *;`;

    console.log("Executing Query: ", query);

    // Execute the query with the condition value
    const result = await pool.query(query, [conditionValue]);

    console.log("Query Result: ", result);

    // Send the response with a success message and the deleted rows (optional)
    if (result.rowCount > 0) {
      res.status(200).json({
        message: "Data deleted successfully",
        deletedRows: result.rows,
      });
    } else {
      res
        .status(500)
        .json({ message: "No data found matching the condition." });
    }
  } catch (error) {
    console.error("Error deleting data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await pool.end(); // Close the database connection
  }
}

async function insertTableData(req, res) {
  const { dbConfig, table, columns } = req.body;

  const { username, host, database, password, port } = dbConfig;

  // Configuring the PostgreSQL pool
  const poolConfig = {
    user: username,
    host,
    database,
    password,
    port,
  };

  // For production, enable SSL
  if (process.env.NODE_ENV === "production") {
    poolConfig.ssl = {
      rejectUnauthorized: false, // Use this only in production with trusted servers
    };
  }

  const pool = new Pool(poolConfig);

  try {
    // Validate the input
    if (!table || !columns || Object.keys(columns).length === 0) {
      return res
        .status(400)
        .json({ error: "Table name and columns data are required." });
    }

    // Dynamically construct the INSERT query
    const columnNames = Object.keys(columns).join(", ");
    const placeholders = Object.keys(columns)
      .map((_, index) => `$${index + 1}`)
      .join(", ");
    const values = Object.values(columns);

    const query = `INSERT INTO ${table} (${columnNames}) VALUES (${placeholders}) RETURNING *;`;

    console.log("Executing Query: ", query);

    // Execute the query with the column values
    const result = await pool.query(query, values);

    console.log("Query Result: ", result);

    // Send the response with a success message and the inserted row(s)
    res.status(200).json({
      message: "Data inserted successfully",
      insertedRow: result.rows[0], // Assuming only one row is inserted at a time
    });
  } catch (error) {
    console.error("Error inserting data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await pool.end(); // Close the database connection
  }
}

async function transformTableData(req, res) {
  const { dbConfig, tableName, aggregationType, operation, columnName } =
    req.body;

  const { username, host, database, password, port } = dbConfig;

  // Configuring the PostgreSQL pool
  const poolConfig = {
    user: username,
    host,
    database,
    password,
    port,
  };

  // For production, enable SSL
  if (process.env.NODE_ENV === "production") {
    poolConfig.ssl = {
      rejectUnauthorized: false, // Use this only in production with trusted servers
    };
  }

  const pool = new Pool(poolConfig);

  try {
    // Validate the input
    if (!tableName || !aggregationType || !operation || !columnName) {
      return res.status(400).json({
        error:
          "Table name, aggregation type, operation, and column name are required.",
      });
    }

    // Construct the transformation query
    let query;

    switch (aggregationType) {
      case "aggregate":
        query = `SELECT ${operation}(${columnName}) AS result FROM ${tableName};`;
        break;
      default:
        return res.status(400).json({ error: "Invalid aggregation type." });
    }

    console.log("Executing Query: ", query);

    // Execute the query
    const result = await pool.query(query);

    console.log("Query Result: ", result);

    // Send the response with the transformation result
    res.status(200).json({
      message: "Data transformed successfully",
      result: result.rows[0], // Assuming a single result is returned
    });
  } catch (error) {
    console.error("Error transforming data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await pool.end(); // Close the database connection
  }
}

// Export all controller functions
export {
  transformTableData,
  deleteTableData,
  getTableData,
  getDatabaseDetails,
  insertTableData,
  joinTableData,
  queryData,
  updateTableData,
};
