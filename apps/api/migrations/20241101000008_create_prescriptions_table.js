/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function (knex) {
  await knex.schema.createTable('prescriptions', (table) => {
    table.string('id', 36).primary();
    table.string('patient_id', 36).notNullable().references('id').inTable('patients').onDelete('CASCADE');
    table.string('doctor_id', 36).notNullable().references('id').inTable('doctors').onDelete('CASCADE');
    table.string('hospital_id', 36).notNullable().references('id').inTable('hospitals').onDelete('CASCADE');
    table.string('appointment_id', 36).references('id').inTable('appointments').onDelete('SET NULL');
    table.text('diagnosis');
    table.text('notes');
    table.date('prescription_date').notNullable();
    table.date('valid_until');
    table.string('image_url', 500);
    table
      .enum('status', ['ACTIVE', 'EXPIRED', 'SUPERSEDED', 'CANCELLED'])
      .notNullable()
      .defaultTo('ACTIVE');
    table.integer('version').notNullable().defaultTo(1);
    table.string('parent_prescription_id', 36).references('id').inTable('prescriptions').onDelete('SET NULL');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('prescriptions');
};
