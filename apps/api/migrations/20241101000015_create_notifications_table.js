/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function (knex) {
  await knex.schema.createTable('notifications', (table) => {
    table.string('id', 36).primary();
    table.string('user_id', 36).notNullable().references('id').inTable('users').onDelete('CASCADE');
    table
      .enum('type', [
        'APPOINTMENT_REMINDER',
        'MEDICATION_REMINDER',
        'REFILL_ALERT',
        'FAMILY_ALERT',
        'SYSTEM',
        'EMERGENCY',
      ])
      .notNullable();
    table.string('title', 255).notNullable();
    table.text('message');
    table.text('data'); // JSON
    table.boolean('is_read').defaultTo(false);
    table.timestamp('read_at');
    table.enum('priority', ['LOW', 'MEDIUM', 'HIGH', 'URGENT']).defaultTo('MEDIUM');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('notifications');
};
