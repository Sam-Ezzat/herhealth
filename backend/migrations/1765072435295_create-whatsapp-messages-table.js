/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  pgm.createTable('whatsapp_messages', {
    id: 'id',
    patient_id: {
      type: 'integer',
      notNull: true,
      references: '"patients"',
      onDelete: 'CASCADE'
    },
    phone_number: {
      type: 'varchar(20)',
      notNull: true
    },
    message: {
      type: 'text',
      notNull: true
    },
    template_id: {
      type: 'integer',
      references: '"whatsapp_templates"',
      onDelete: 'SET NULL'
    },
    message_type: {
      type: 'varchar(50)',
      notNull: true,
      default: 'custom'
    },
    status: {
      type: 'varchar(20)',
      notNull: true,
      default: 'pending'
    },
    whatsapp_message_id: {
      type: 'varchar(255)'
    },
    sent_at: {
      type: 'timestamp'
    },
    delivered_at: {
      type: 'timestamp'
    },
    read_at: {
      type: 'timestamp'
    },
    error_message: {
      type: 'text'
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp')
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp')
    }
  });

  pgm.createIndex('whatsapp_messages', 'patient_id');
  pgm.createIndex('whatsapp_messages', 'status');
  pgm.createIndex('whatsapp_messages', 'created_at');
};

exports.down = pgm => {
  pgm.dropTable('whatsapp_messages');
};
