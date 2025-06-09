/*
  Warnings:

  - You are about to drop the column `securityAnswer` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `securityQuestion` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `user` DROP COLUMN `securityAnswer`,
    DROP COLUMN `securityQuestion`,
    ADD COLUMN `security_answer` VARCHAR(191) NULL,
    ADD COLUMN `security_question` VARCHAR(191) NULL;
