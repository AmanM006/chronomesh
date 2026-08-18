const dbClient = require('../db/client');

async function cleanQuarantine() {
  console.log('Resetting memory_quarantine table in CockroachDB...');
  await dbClient.query('DELETE FROM memory_quarantine;');
  
  await dbClient.query(`
    INSERT INTO memory_quarantine (quarantine_id, proposing_agent, candidate_content, verifier_verdict, verifier_reason, confidence_score)
    VALUES 
    (gen_random_uuid(), 'AGENT_ORCHESTRATOR', 'Unverified payment gateway bypass patch for staging testing.', 'QUARANTINED', 'Semantic contradiction detected against policy runbook. Held for compliance review.', 0.42),
    (gen_random_uuid(), 'AGENT_SRE_FORENSICS', 'Arbitrary heap allocation override without resource quotas.', 'REJECTED', 'Adversarial verifier flagged hazardous OOM configuration on production shard.', 0.25);
  `);
  
  const res = await dbClient.query('SELECT count(*) FROM memory_quarantine;');
  console.log('✅ Success! Pristine entries remaining in CockroachDB memory_quarantine:', res.rows[0].count);
  process.exit(0);
}

cleanQuarantine().catch(err => {
  console.error(err);
  process.exit(1);
});
