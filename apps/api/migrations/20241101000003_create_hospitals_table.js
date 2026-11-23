/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function (knex) {
  await knex.schema.createTable('hospitals', (table) => {
    table.string('id', 36).primary();
    table.string('name', 255).notNullable();
    table.string('registration_number', 100).notNullable().unique();
    table.enum('type', ['GOVERNMENT', 'PRIVATE', 'TRUST']).notNullable();
    table.text('address');
    table.string('city', 100);
    table.string('state', 100);
    table.string('pincode', 10);
    table.string('phone', 20);
    table.string('email', 255);
    table.string('website', 500);
    table.string('logo_url', 500);
    table.text('description');
    table.text('facilities'); // JSON string
    table.decimal('rating', 3, 2);
    table.boolean('is_active').defaultTo(true);
    table
      .enum('subscription_status', ['TRIAL', 'ACTIVE', 'EXPIRED', 'SUSPENDED'])
      .defaultTo('TRIAL');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at');
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('hospitals');
};
