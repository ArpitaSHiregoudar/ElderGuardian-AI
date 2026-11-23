/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function (knex) {
  await knex.schema.createTable('specializations', (table) => {
    table.string('id', 36).primary();
    table.string('name', 100).notNullable().unique();
    table.text('description');
    table.string('icon_name', 50);
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('specializations');
};
