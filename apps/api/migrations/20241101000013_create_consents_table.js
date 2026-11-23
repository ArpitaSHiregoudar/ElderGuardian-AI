/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function (knex) {
  await knex.schema.createTable('consents', (table) => {
    table.string('id', 36).primary();
    table.string('patient_id', 36).notNullable().references('id').inTable('patients').onDelete('CASCADE');
    table.string('granted_to_user_id', 36).notNullable().references('id').inTable('users').onDelete('CASCADE');
    table
      .enum('consent_type', [
        'VIEW_HEALTH_DATA',
        'MANAGE_APPOINTMENTS',
        'VIEW_PRESCRIPTIONS',
        'APPROVE_REFILLS',
        'ML_DATA_USAGE',
      ])
      .notNullable();
    table.enum('status', ['ACTIVE', 'REVOKED', 'EXPIRED']).notNullable().defaultTo('ACTIVE');
    table.timestamp('granted_at').defaultTo(knex.fn.now());
    table.timestamp('revoked_at');
    table.timestamp('expires_at');
    table.string('ip_address', 45);
    table.string('user_agent', 500);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('consents');
};
