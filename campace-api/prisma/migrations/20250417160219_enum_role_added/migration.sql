-- AlterTable
ALTER TABLE `user` ADD COLUMN `role` ENUM('USER', 'OWNER') NOT NULL DEFAULT 'USER';
