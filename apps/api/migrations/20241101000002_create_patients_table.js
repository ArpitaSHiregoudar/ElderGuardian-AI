/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function (knex) {
  await knex.schema.createTable('patients', (table) => {
    table.string('id', 36).primary();
    table.string('user_id', 36).notNullable().unique().references('id').inTable('users').onDelete('CASCADE');
    table.date('date_of_birth');
    table.enum('gender', ['MALE', 'FEMALE', 'OTHER']);
    table.string('blood_group', 10);
    table.decimal('height_cm', 5, 1);
    table.decimal('weight_kg', 5, 1);
    table.string('emergency_contact_name', 150);
    table.string('emergency_contact_phone', 20);
    table.text('medical_conditions'); // JSON string
    table.text('allergies'); // JSON string
    table.text('address');
    table.string('city', 100);
    table.string('state', 100);
    table.string('pincode', 10);
    table.string('abha_id', 50);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at');
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('patients');
};
