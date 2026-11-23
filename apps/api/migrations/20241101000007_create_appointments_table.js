/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function (knex) {
  await knex.schema.createTable('appointments', (table) => {
    table.string('id', 36).primary();
    table.string('patient_id', 36).notNullable().references('id').inTable('patients').onDelete('CASCADE');
    table.string('doctor_id', 36).notNullable().references('id').inTable('doctors').onDelete('CASCADE');
    table.string('hospital_id', 36).notNullable().references('id').inTable('hospitals').onDelete('CASCADE');
    table.date('appointment_date').notNullable();
    table.string('start_time', 10).notNullable(); // HH:mm
    table.string('end_time', 10).notNullable();
    table.enum('type', ['IN_PERSON', 'TELEHEALTH']).notNullable().defaultTo('IN_PERSON');
    table
      .enum('status', ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW', 'RESCHEDULED'])
      .notNullable()
      .defaultTo('PENDING');
    table.text('reason');
    table.text('notes');
    table.text('cancellation_reason');
    table.string('rescheduled_from_id', 36).references('id').inTable('appointments').onDelete('SET NULL');
    table.boolean('reminder_sent').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('appointments');
};
