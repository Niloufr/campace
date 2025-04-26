/*
  Warnings:

  - Added the required column `owner_id` to the `Location` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `location` ADD COLUMN `owner_id` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `Location` ADD CONSTRAINT `Location_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;
