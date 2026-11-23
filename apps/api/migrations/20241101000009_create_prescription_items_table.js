/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function (knex) {
  await knex.schema.createTable('prescription_items', (table) => {
    table.string('id', 36).primary();
    table.string('prescription_id', 36).notNullable().references('id').inTable('prescriptions').onDelete('CASCADE');
    table.string('medicine_name', 255).notNullable();
    table.string('generic_name', 255);
    table.string('dosage', 100);
    table.string('frequency', 100);
    table.string('duration', 100);
    table.integer('quantity');
    table.string('timing', 100);
    table.text('instructions');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('prescription_items');
};
