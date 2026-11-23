/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function (knex) {
  await knex.schema.createTable('medication_doses', (table) => {
    table.string('id', 36).primary();
    table.string('medication_id', 36).notNullable().references('id').inTable('medications').onDelete('CASCADE');
    table.string('patient_id', 36).notNullable().references('id').inTable('patients').onDelete('CASCADE');
    table.timestamp('scheduled_time').notNullable();
    table
      .enum('status', ['TAKEN', 'MISSED', 'SKIPPED', 'PENDING'])
      .notNullable()
      .defaultTo('PENDING');
    table.timestamp('taken_at');
    table.text('skipped_reason');
    table.text('notes');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('medication_doses');
};
