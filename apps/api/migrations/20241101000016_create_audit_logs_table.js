/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function (knex) {
  await knex.schema.createTable('audit_logs', (table) => {
    table.string('id', 36).primary();
    table.string('user_id', 36).references('id').inTable('users').onDelete('SET NULL');
    table.string('action', 100).notNullable();
    table.string('resource_type', 100);
    table.string('resource_id', 36);
    table.text('old_values'); // JSON
    table.text('new_values'); // JSON
    table.string('ip_address', 45);
    table.string('user_agent', 500);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    // No updated_at — append only
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('audit_logs');
};
