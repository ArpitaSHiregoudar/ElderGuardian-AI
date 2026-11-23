/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function (knex) {
  await knex.schema.createTable('doctors', (table) => {
    table.string('id', 36).primary();
    table.string('user_id', 36).notNullable().unique().references('id').inTable('users').onDelete('CASCADE');
    table.string('specialization_id', 36).references('id').inTable('specializations').onDelete('SET NULL');
    table.string('license_number', 50).notNullable().unique();
    table.string('qualification', 255);
    table.integer('experience_years');
    table.decimal('consultation_fee', 10, 2);
    table.text('bio');
    table.text('languages'); // JSON string
    table.boolean('is_available').defaultTo(true);
    table.decimal('rating', 3, 2);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at');
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('doctors');
};
