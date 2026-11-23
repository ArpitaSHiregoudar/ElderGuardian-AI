/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function (knex) {
  await knex.schema.createTable('hospital_doctors', (table) => {
    table.string('id', 36).primary();
    table.string('hospital_id', 36).notNullable().references('id').inTable('hospitals').onDelete('CASCADE');
    table.string('doctor_id', 36).notNullable().references('id').inTable('doctors').onDelete('CASCADE');
    table.string('department', 100);
    table.boolean('is_primary').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.unique(['hospital_id', 'doctor_id']);
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('hospital_doctors');
};
