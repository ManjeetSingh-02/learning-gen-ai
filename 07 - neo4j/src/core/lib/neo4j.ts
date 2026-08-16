// external-imports
import neo4j from 'neo4j-driver';

// initialize the neo4j driver
const neo4jDriver = neo4j.driver(
  process.env.NEO4J_URI!,
  neo4j.auth.basic(process.env.NEO4J_USERNAME!, process.env.NEO4J_PASSWORD!)
);

// function to execute a cypher query in neo4j
export async function executeQuery(query: string) {
  return await neo4jDriver.executeQuery(query);
}
