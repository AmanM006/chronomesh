import { NextResponse } from 'next/server';
const dbClient = require('../../../../db/client');

export async function POST(request) {
  try {
    const { queryType } = await request.json();
    
    let sqlQuery = '';
    if (queryType === 'vector_search') {
      sqlQuery = `EXPLAIN (VERBOSE) SELECT memory_id, agent_id, domain, content FROM episodic_vectors WHERE domain = 'INFRASTRUCTURE_INCIDENT' LIMIT 5;`;
    } else if (queryType === 'row_lease_mutex') {
      sqlQuery = `EXPLAIN (VERBOSE) SELECT lease_id, resource_key, agent_id FROM memory_leases WHERE resource_key = 'cluster.lock' FOR UPDATE;`;
    } else if (queryType === 'time_travel') {
      sqlQuery = `EXPLAIN (VERBOSE) SELECT task_id, cognitive_state FROM state_frames AS OF SYSTEM TIME clock_timestamp() LIMIT 5;`;
    } else {
      sqlQuery = `EXPLAIN (VERBOSE) SELECT * FROM working_scratchpad LIMIT 5;`;
    }

    let planLines = [];
    if (dbClient.isLive) {
      try {
        const res = await dbClient.query(sqlQuery);
        planLines = res.rows.map(r => r.info || Object.values(r)[0]);
      } catch (e) {
        planLines = [
          `• distributed execution on cluster [sage-manatee]`,
          `• vectorized engine: vectorized execution active`,
          `• scan table: ${queryType}`,
          `• error running live explain: ${e.message}`
        ];
      }
    } else {
      planLines = [
        `• engine: Vectorized Execution Engine (CockroachDB v26.2)`,
        `• scan: TableScan episodic_vectors (index = primary)`,
        `• vector distance operator: embedding <=> $1::VECTOR(1536)`,
        `• filter: domain = 'INFRASTRUCTURE_INCIDENT'`,
        `• limit: 5 rows`,
        `• isolation: SERIALIZABLE`
      ];
    }

    return NextResponse.json({
      success: true,
      queryType,
      sql: sqlQuery,
      plan: planLines,
      isLiveDb: dbClient.isLive
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
