/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function (knex) {
  await knex.schema.createTable('family_links', (table) => {
    table.string('id', 36).primary();
    table.string('patient_id', 36).notNullable().references('id').inTable('patients').onDelete('CASCADE');
    table.string('family_member_id', 36).notNullable().references('id').inTable('users').onDelete('CASCADE');
    table
      .enum('relationship', ['SON', 'DAUGHTER', 'SPOUSE', 'SIBLING', 'PARENT', 'CAREGIVER', 'OTHER'])
      .notNullable();
    table.boolean('is_primary_caregiver').defaultTo(false);
    table.boolean('can_view_health').defaultTo(true);
    table.boolean('can_manage_appointments').defaultTo(true);
    table.boolean('can_approve_refills').defaultTo(false);
    table
      .enum('consent_status', ['PENDING', 'APPROVED', 'REVOKED'])
      .notNullable()
      .defaultTo('PENDING');
    table.timestamp('consent_given_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('family_links');
};
