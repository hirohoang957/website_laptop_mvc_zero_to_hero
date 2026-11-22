/*
  Warnings:

  - You are about to drop the column `roldId` on the `users` table. All the data in the column will be lost.
  - Added the required column `roleId` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `users` DROP FOREIGN KEY `users_roldId_fkey`;

-- DropIndex
DROP INDEX `users_roldId_fkey` ON `users`;

-- AlterTable
ALTER TABLE `users` DROP COLUMN `roldId`,
    ADD COLUMN `roleId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
