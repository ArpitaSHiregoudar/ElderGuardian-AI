/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function (knex) {
  await knex.schema.createTable('health_readings', (table) => {
    table.string('id', 36).primary();
    table.string('patient_id', 36).notNullable().references('id').inTable('patients').onDelete('CASCADE');
    table
      .enum('type', [
        'BLOOD_PRESSURE',
        'BLOOD_GLUCOSE',
        'HEART_RATE',
        'TEMPERATURE',
        'WEIGHT',
        'OXYGEN_SATURATION',
        'SLEEP',
      ])
      .notNullable();
    table.text('value').notNullable(); // JSON
    table.string('unit', 30);
    table.timestamp('measured_at').notNullable();
    table.enum('source', ['MANUAL', 'DEVICE', 'WEARABLE']).defaultTo('MANUAL');
    table.text('notes');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('health_readings');
};
