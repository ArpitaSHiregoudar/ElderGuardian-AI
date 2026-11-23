/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function (knex) {
  await knex.schema.createTable('medications', (table) => {
    table.string('id', 36).primary();
    table.string('patient_id', 36).notNullable().references('id').inTable('patients').onDelete('CASCADE');
    table.string('prescription_item_id', 36).references('id').inTable('prescription_items').onDelete('SET NULL');
    table.string('medicine_name', 255).notNullable();
    table.string('dosage', 100);
    table.string('frequency', 100);
    table.text('schedule_times'); // JSON array e.g. ["08:00","20:00"]
    table.date('start_date');
    table.date('end_date');
    table.boolean('is_active').defaultTo(true);
    table.integer('total_quantity');
    table.integer('remaining_quantity');
    table.integer('refill_reminder_days').defaultTo(7);
    table.text('notes');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('medications');
};
