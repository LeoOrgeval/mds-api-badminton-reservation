'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Terrains', [
      {
        name: 'A',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'B',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'C',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'D',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Terrains', null, {});
  }
};
